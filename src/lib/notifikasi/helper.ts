import { createClient } from '@/lib/supabase/server';

type Kirim = {
  organisasiId: string;
  hak: string;
  tipe: 'info' | 'peringatan' | 'persetujuan' | 'stok' | 'hse' | 'biaya';
  judul: string;
  pesan?: string;
  tautan?: string;
  entitas?: string;
  entitasId?: string;
};

export async function kirimNotifikasiRpc(opts: Kirim) {
  try {
    const supabase = await createClient();
    await supabase.rpc('kirim_notifikasi', {
      p_org: opts.organisasiId,
      p_hak: opts.hak,
      p_tipe: opts.tipe,
      p_judul: opts.judul,
      p_pesan: opts.pesan ?? null,
      p_tautan: opts.tautan ?? null,
      p_entitas: opts.entitas ?? null,
      p_entitas_id: opts.entitasId ?? null,
    });
  } catch {
    // jangan throw — notifikasi tidak boleh mengganggu flow utama
  }
}