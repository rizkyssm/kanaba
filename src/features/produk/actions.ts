'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1).max(40),
  nama: z.string().min(2).max(200),
  satuan_id: z.string().uuid().optional().or(z.literal('')),
  deskripsi: z.string().max(500).optional().or(z.literal('')),
});

export async function buatProdukAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('produk').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    satuan_id: parsed.data.satuan_id || null,
    deskripsi: parsed.data.deskripsi || null,
  }).select('id').single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'produk.buat',
    entitas: 'produk',
    entitasId: data.id,
    sesudah: { kode: parsed.data.kode, nama: parsed.data.nama },
  });

  revalidatePath('/data-induk');
  revalidatePath('/data-induk/produk');
  redirect('/data-induk/produk');
}