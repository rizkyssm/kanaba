'use server';
import { createClient } from '@/lib/supabase/server';
import { catatSecurityEvent } from '@/lib/security/event';
import { revalidatePath } from 'next/cache';

export async function enrollMfaAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Belum login.' };

  // Hapus faktor TOTP yang belum terverifikasi (bila ada)
  const { data: existing } = await supabase.auth.mfa.listFactors();
  const belumTerverifikasi = (existing?.totp ?? []).filter((f) => f.status === 'unverified');
  for (const f of belumTerverifikasi) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `KANABA – ${new Date().toLocaleDateString('id-ID')}`,
  });
  if (error || !data) return { error: error?.message ?? 'Gagal menyiapkan MFA.' };

  return {
    sukses: true,
    factorId: data.id,
    qrSvg: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function verifyEnrollMfaAction(factorId: string, code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Belum login.' };

  const ch = await supabase.auth.mfa.challenge({ factorId });
  if (ch.error || !ch.data) return { error: ch.error?.message ?? 'Gagal challenge.' };

  const v = await supabase.auth.mfa.verify({
    factorId,
    challengeId: ch.data.id,
    code: code.replace(/\s+/g, ''),
  });
  if (v.error) {
    await catatSecurityEvent({
      jenis: 'mfa_gagal',
      profilId: user.id,
      detail: { fase: 'enroll', factorId },
    });
    return { error: 'Kode salah atau kedaluwarsa.' };
  }

  await catatSecurityEvent({
    jenis: 'mfa_enrolled',
    profilId: user.id,
    detail: { factorId },
  });

  revalidatePath('/pengaturan/keamanan');
  return { sukses: true };
}

export async function unenrollMfaAction(factorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Belum login.' };

  const { data: profil } = await supabase
    .from('profil').select('mfa_required').eq('id', user.id).maybeSingle();
  if (profil?.mfa_required) {
    return { error: 'MFA wajib untuk akun Anda dan tidak dapat dinonaktifkan.' };
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message };

  await catatSecurityEvent({
    jenis: 'mfa_disabled',
    profilId: user.id,
    detail: { factorId },
  });

  revalidatePath('/pengaturan/keamanan');
  return { sukses: true };
}

export async function verifyLoginMfaAction(factorId: string, code: string) {
  const supabase = await createClient();

  const ch = await supabase.auth.mfa.challenge({ factorId });
  if (ch.error || !ch.data) return { error: ch.error?.message ?? 'Gagal challenge.' };

  const v = await supabase.auth.mfa.verify({
    factorId,
    challengeId: ch.data.id,
    code: code.replace(/\s+/g, ''),
  });
  if (v.error) {
    await catatSecurityEvent({ jenis: 'mfa_gagal', detail: { fase: 'login', factorId } });
    return { error: 'Kode salah atau kedaluwarsa.' };
  }

  await catatSecurityEvent({ jenis: 'mfa_verified', detail: { factorId } });
  return { sukses: true };
}