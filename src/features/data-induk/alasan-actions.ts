'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1, 'Kode wajib').max(40),
  nama: z.string().min(2, 'Nama wajib').max(100),
});

export async function buatAlasanPenyesuaianAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('alasan_penyesuaian').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode.toLowerCase().replace(/\s+/g, '_'),
    nama: parsed.data.nama,
  }).select('id').single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'alasan_penyesuaian.buat',
    entitas: 'alasan_penyesuaian',
    entitasId: data.id,
    sesudah: { kode: parsed.data.kode, nama: parsed.data.nama },
  });

  revalidatePath('/data-induk');
  revalidatePath('/data-induk/alasan-penyesuaian');
  redirect('/data-induk/alasan-penyesuaian');
}

export async function nonaktifkanAlasanAction(id: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  await supabase.from('alasan_penyesuaian')
    .update({ aktif: false })
    .eq('id', id).eq('organisasi_id', ctx.organisasiId);
  revalidatePath('/data-induk/alasan-penyesuaian');
  revalidatePath('/data-induk');
  return { sukses: true };
}