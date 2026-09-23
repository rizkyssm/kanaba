'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SkemaSite = z.object({
  kode: z.string().min(1, 'Kode wajib').max(20),
  nama: z.string().min(2, 'Nama wajib').max(100),
  alamat: z.string().max(300).optional().or(z.literal('')),
});

export async function buatSiteAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) {
    return { error: 'Anda tidak memiliki hak untuk mengelola data induk.' };
  }
  const parsed = SkemaSite.safeParse({
    kode: formData.get('kode'),
    nama: formData.get('nama'),
    alamat: formData.get('alamat') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from('site').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    alamat: parsed.data.alamat || null,
  });
  if (error) return { error: error.message };

  revalidatePath('/data-induk/site');
  return { sukses: true };
}

export async function nonaktifkanSiteAction(id: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  await supabase.from('site').update({ aktif: false }).eq('id', id).eq('organisasi_id', ctx.organisasiId);
  revalidatePath('/data-induk/site');
}