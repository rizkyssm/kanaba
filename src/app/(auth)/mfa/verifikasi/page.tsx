import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MfaVerify from '@/features/auth/MfaVerify';

export default async function MfaVerifikasiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/masuk');

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Sudah aal2 → langsung beranda
  if (aal?.currentLevel === 'aal2') redirect('/beranda');

  const { data: faktor } = await supabase.auth.mfa.listFactors();
  const aktif = (faktor?.totp ?? []).find((f: any) => f.status === 'verified');
  if (!aktif) redirect('/beranda');

  return <MfaVerify faktorId={aktif.id} />;
}