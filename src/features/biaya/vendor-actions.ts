'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  kode: z.string().min(1).max(30),
  nama: z.string().min(2).max(200),
  kategori: z.enum(['material','jasa','rental','aset','lainnya']),
  telepon: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  alamat: z.string().max(300).optional().or(z.literal('')),
  npwp: z.string().max(30).optional().or(z.literal('')),
  term_hari: z.coerce.number().int().min(0).default(30),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

export async function buatVendorAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from('vendor').insert({
    organisasi_id: ctx.organisasiId,
    kode: parsed.data.kode,
    nama: parsed.data.nama,
    kategori: parsed.data.kategori,
    telepon: parsed.data.telepon || null,
    email: parsed.data.email || null,
    alamat: parsed.data.alamat || null,
    npwp: parsed.data.npwp || null,
    term_hari: parsed.data.term_hari,
    catatan: parsed.data.catatan || null,
  });
  if (error) return { error: error.message };

  revalidatePath('/data-induk/vendor');
  revalidatePath('/data-induk');
  redirect('/data-induk/vendor');
}