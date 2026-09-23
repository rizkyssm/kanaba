import { createClient } from '@/lib/supabase/server';

export type KonteksPengguna = {
  userId: string;
  email: string;
  namaLengkap: string;
  organisasiId: string;
  organisasiNama: string;
  hak: Set<string>;
};

export async function getKonteks(): Promise<KonteksPengguna | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase
    .from('profil')
    .select('id, email, nama_lengkap')
    .eq('id', user.id)
    .single();

  const { data: anggota } = await supabase
    .from('anggota_organisasi')
    .select('id, organisasi_id, organisasi:organisasi_id (nama)')
    .eq('profil_id', user.id)
    .eq('status', 'aktif')
    .limit(1)
    .maybeSingle();

  if (!anggota) return null;

  const orgNama = (anggota as any).organisasi?.nama ?? '';

  const { data: hakRows } = await supabase
    .from('anggota_peran')
    .select('peran:peran_id (peran_hak_akses (hak_akses_kode))')
    .eq('anggota_id', anggota.id);

  const hak = new Set<string>();
  (hakRows ?? []).forEach((row: any) => {
    row.peran?.peran_hak_akses?.forEach((r: any) => hak.add(r.hak_akses_kode));
  });

  return {
    userId: user.id,
    email: user.email ?? '',
    namaLengkap: profil?.nama_lengkap ?? '',
    organisasiId: anggota.organisasi_id,
    organisasiNama: orgNama,
    hak,
  };
}

export function punya(ctx: KonteksPengguna | null, kode: string) {
  return !!ctx?.hak.has(kode);
}