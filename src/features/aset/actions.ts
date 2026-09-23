'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1).max(30),
  nama: z.string().min(2).max(200),
  kategori: z.string().max(50).optional().or(z.literal('')),
  nomor_seri: z.string().max(100).optional().or(z.literal('')),
  site_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['aktif','digunakan','tersedia','dalam_perawatan','rusak','tidak_aktif','dihapus']),
});

export async function buatAsetAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('aset').insert({
    organisasi_id: ctx.organisasiId,
    site_id: parsed.data.site_id || null,
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    kategori: parsed.data.kategori || null,
    nomor_seri: parsed.data.nomor_seri || null,
    status: parsed.data.status,
  }).select('id').single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'aset.buat',
    entitas: 'aset',
    entitasId: data.id,
    sesudah: { kode: parsed.data.kode, nama: parsed.data.nama },
  });

  revalidatePath('/aset');
  return { sukses: true };
}