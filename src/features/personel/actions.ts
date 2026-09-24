'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  tipe: z.enum(['karyawan','tenaga_lepas','vendor']),
  nama: z.string().min(2).max(200),
  telepon: z.string().max(30).optional().or(z.literal('')),
  keahlian: z.string().max(200).optional().or(z.literal('')),
  tarif: z.coerce.number().min(0).optional().nullable(),
  jenis_tarif: z.enum(['per_hari','per_jam','per_kegiatan','per_hasil']).optional().or(z.literal('')),
});

export async function buatPersonelAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('personel').insert({
    organisasi_id: ctx.organisasiId,
    tipe: parsed.data.tipe,
    nama: parsed.data.nama,
    telepon: parsed.data.telepon || null,
    keahlian: parsed.data.keahlian || null,
  }).select('id').single();
  if (error) return { error: error.message };

  if (punya(ctx, 'gaji.kelola') && parsed.data.tarif != null && parsed.data.jenis_tarif) {
    await supabase.from('personel_kompensasi').insert({
      personel_id: data.id,
      tarif: parsed.data.tarif,
      jenis_tarif: parsed.data.jenis_tarif,
    });
  }

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'personel.buat',
    entitas: 'personel',
    entitasId: data.id,
    sesudah: { nama: parsed.data.nama, tipe: parsed.data.tipe },
  });

  revalidatePath('/data-induk/personel');
  redirect('/data-induk/personel');
}