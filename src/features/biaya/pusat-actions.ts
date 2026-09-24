'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1).max(30),
  nama: z.string().min(2).max(100),
  site_id: z.string().uuid().optional().or(z.literal('')),
  deskripsi: z.string().max(300).optional().or(z.literal('')),
});

export async function buatPusatBiayaAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'biaya.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from('pusat_biaya').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    site_id: parsed.data.site_id || null,
    deskripsi: parsed.data.deskripsi || null,
  });
  if (error) return { error: error.message };

  revalidatePath('/data-induk/pusat-biaya');
  revalidatePath('/data-induk');
  redirect('/data-induk/pusat-biaya');
}