'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const STATUS = [
  'draf','direncanakan','menunggu_persetujuan','disetujui','persiapan',
  'dikirim_ke_site','di_site','sedang_berjalan','selesai','rekonsiliasi',
  'ditutup','dibatalkan',
] as const;

const SkemaKegiatan = z.object({
  nama: z.string().min(2, 'Nama wajib').max(200),
  site_id: z.string().uuid('Site wajib dipilih'),
  tanggal: z.string().min(10, 'Tanggal wajib'),
  lokasi: z.string().max(300).optional().or(z.literal('')),
  basis_hasil: z.enum(['per_bcm','per_lubang','per_kegiatan','per_jam']).default('per_bcm'),
  target_bcm: z.coerce.number().min(0).default(0),
  target_lubang: z.coerce.number().min(0).default(0),
  rencana_kanaba: z.coerce.number().int().min(0).default(0),
  rencana_lox_kg: z.coerce.number().min(0).default(0),
  rencana_lox_per_lubang_kg: z.coerce.number().min(0).default(0),
  catatan: z.string().max(1000).optional().or(z.literal('')),
});

export async function buatKegiatanAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'kegiatan.kelola')) return { error: 'Tidak berhak.' };

  const parsed = SkemaKegiatan.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: nomor, error: nomorErr } = await supabase.rpc('gen_nomor_kegiatan', {
    p_org: ctx.organisasiId,
  });
  if (nomorErr || !nomor) return { error: 'Gagal membuat nomor kegiatan.' };

  const { data, error } = await supabase.from('kegiatan').insert({
    organisasi_id: ctx.organisasiId,
    site_id: parsed.data.site_id,
    nomor,
    nama: parsed.data.nama,
    tanggal: parsed.data.tanggal,
    lokasi: parsed.data.lokasi || null,
    basis_hasil: parsed.data.basis_hasil,
    target_bcm: parsed.data.target_bcm,
    target_lubang: parsed.data.target_lubang,
    rencana_kanaba: parsed.data.rencana_kanaba,
    rencana_lox_kg: parsed.data.rencana_lox_kg,
    penanggung_jawab_id: ctx.userId,
    status: 'direncanakan',
    rencana_lox_per_lubang_kg: parsed.data.rencana_lox_per_lubang_kg,
    catatan: parsed.data.catatan || null,
  }).select('id').single();

  if (error) return { error: error.message };

  await supabase.from('riwayat_status_kegiatan').insert({
    kegiatan_id: data.id,
    status_baru: 'direncanakan',
    oleh_id: ctx.userId,
    catatan: 'Kegiatan dibuat',
  });

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'kegiatan.buat',
    entitas: 'kegiatan',
    entitasId: data.id,
    sesudah: { nomor, nama: parsed.data.nama },
  });

  revalidatePath('/kegiatan');
  redirect(`/kegiatan/${data.id}`);
}

export async function ubahStatusKegiatanAction(id: string, statusBaru: string, catatan?: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'kegiatan.kelola')) return { error: 'Tidak berhak.' };
  if (!STATUS.includes(statusBaru as any)) return { error: 'Status tidak valid.' };

  const supabase = await createClient();
  const { data: lama } = await supabase
    .from('kegiatan')
    .select('status')
    .eq('id', id).eq('organisasi_id', ctx.organisasiId)
    .single();
  if (!lama) return { error: 'Kegiatan tidak ditemukan.' };

  const { error } = await supabase.from('kegiatan')
    .update({ status: statusBaru })
    .eq('id', id).eq('organisasi_id', ctx.organisasiId);
  if (error) return { error: error.message };

  await supabase.from('riwayat_status_kegiatan').insert({
    kegiatan_id: id,
    status_lama: lama.status,
    status_baru: statusBaru,
    oleh_id: ctx.userId,
    catatan: catatan ?? null,
  });

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'kegiatan.ubah_status',
    entitas: 'kegiatan',
    entitasId: id,
    sebelum: { status: lama.status },
    sesudah: { status: statusBaru },
  });

  revalidatePath('/kegiatan');
  revalidatePath(`/kegiatan/${id}`);
  return { sukses: true };
}

export async function tambahPersonelKegiatanAction(kegiatanId: string, personelId: string, peran: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'kegiatan.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  const { error } = await supabase.from('personel_kegiatan').insert({
    kegiatan_id: kegiatanId, personel_id: personelId, peran: peran || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/kegiatan/${kegiatanId}`);
  return { sukses: true };
}

export async function hapusPersonelKegiatanAction(id: string, kegiatanId: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'kegiatan.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  await supabase.from('personel_kegiatan').delete().eq('id', id);
  revalidatePath(`/kegiatan/${kegiatanId}`);
  return { sukses: true };
}

export async function tambahPemakaianAsetAction(kegiatanId: string, asetId: string, catatan: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'kegiatan.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  const { error } = await supabase.from('pemakaian_aset').insert({
    kegiatan_id: kegiatanId, aset_id: asetId, catatan: catatan || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/kegiatan/${kegiatanId}`);
  return { sukses: true };
}