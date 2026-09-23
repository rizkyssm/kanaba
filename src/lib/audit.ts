import { createClient } from '@/lib/supabase/server';

export async function catatLog(opts: {
  organisasiId: string;
  aksi: string;
  entitas?: string;
  entitasId?: string;
  sebelum?: any;
  sesudah?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('log_aktivitas').insert({
    organisasi_id: opts.organisasiId,
    profil_id: user.id,
    aksi: opts.aksi,
    entitas: opts.entitas ?? null,
    entitas_id: opts.entitasId ?? null,
    nilai_sebelum: opts.sebelum ?? null,
    nilai_sesudah: opts.sesudah ?? null,
  });
}