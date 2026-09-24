'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1, 'Kode wajib').max(20),
  nama: z.string().min(2, 'Nama wajib').max(60),
});

export async function buatSatuanAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('satuan').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode.toUpperCase(),
    nama: parsed.data.nama,
  }).select('id').single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'satuan.buat',
    entitas: 'satuan',
    entitasId: data.id,
    sesudah: { kode: parsed.data.kode, nama: parsed.data.nama },
  });

  revalidatePath('/data-induk');
  revalidatePath('/data-induk/satuan');
  redirect('/data-induk/satuan');
}

export async function nonaktifkanSatuanAction(id: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  await supabase.from('satuan').delete()
    .eq('id', id).eq('organisasi_id', ctx.organisasiId);
  revalidatePath('/data-induk/satuan');
  revalidatePath('/data-induk');
  return { sukses: true };
}