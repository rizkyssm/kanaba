'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const Skema = z.object({
  kegiatan_id: z.string().uuid().optional().or(z.literal('')),
  site_id: z.string().uuid().optional().or(z.literal('')),
  jenis: z.enum(['penerimaan','pengeluaran_site','pengembalian_site','pemakaian','penyesuaian_positif','penyesuaian_negatif']),
  jumlah_kg: z.coerce.number().positive('Jumlah harus positif'),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

const ARAH: Record<string, 'masuk' | 'keluar'> = {
  penerimaan: 'masuk',
  pengeluaran_site: 'keluar',
  pengembalian_site: 'masuk',
  pemakaian: 'keluar',
  penyesuaian_positif: 'masuk',
  penyesuaian_negatif: 'keluar',
};

export async function catatLoxAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from('transaksi_lox').insert({
    organisasi_id: ctx.organisasiId,
    kegiatan_id: parsed.data.kegiatan_id || null,
    site_id: parsed.data.site_id || null,
    jenis: parsed.data.jenis,
    arah: ARAH[parsed.data.jenis],
    jumlah_kg: parsed.data.jumlah_kg,
    catatan: parsed.data.catatan || null,
    dibuat_oleh: ctx.userId,
  });
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'lox.catat',
    entitas: 'transaksi_lox',
    sesudah: { jenis: parsed.data.jenis, jumlah_kg: parsed.data.jumlah_kg },
  });

  revalidatePath('/liquid-oxygen');
  if (parsed.data.kegiatan_id) revalidatePath(`/kegiatan/${parsed.data.kegiatan_id}`);
  return { sukses: true };
}