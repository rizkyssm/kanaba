'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1, 'Kode wajib').max(30),
  nama: z.string().min(2, 'Nama wajib').max(100),
});

export async function buatKategoriMaterialAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('kategori_material').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode.toUpperCase(),
    nama: parsed.data.nama,
  }).select('id').single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'kategori_material.buat',
    entitas: 'kategori_material',
    entitasId: data.id,
    sesudah: { kode: parsed.data.kode, nama: parsed.data.nama },
  });

  revalidatePath('/data-induk');
  revalidatePath('/data-induk/kategori-material');
  redirect('/data-induk/kategori-material');
}

export async function hapusKategoriMaterialAction(id: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  const { error } = await supabase.from('kategori_material')
    .delete().eq('id', id).eq('organisasi_id', ctx.organisasiId);
  if (error) return { error: 'Kategori masih dipakai material atau gagal dihapus.' };
  revalidatePath('/data-induk/kategori-material');
  revalidatePath('/data-induk');
  return { sukses: true };
}