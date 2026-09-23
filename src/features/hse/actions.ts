'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const Skema = z.object({
  jenis: z.enum(['pemeriksaan','temuan','insiden','kondisi_tidak_aman','tindakan_perbaikan']),
  judul: z.string().min(3).max(200),
  deskripsi: z.string().max(2000).optional().or(z.literal('')),
  tingkat: z.enum(['rendah','sedang','tinggi','kritis']),
  status: z.enum(['terbuka','ditindaklanjuti','selesai','ditutup']),
  kegiatan_id: z.string().uuid().optional().or(z.literal('')),
  site_id: z.string().uuid().optional().or(z.literal('')),
  tindakan_perbaikan: z.string().max(2000).optional().or(z.literal('')),
});

export async function buatHseAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'kegiatan.kelola')) return { error: 'Tidak berhak.' };
  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.from('catatan_hse').insert({
    organisasi_id: ctx.organisasiId,
    kegiatan_id: parsed.data.kegiatan_id || null,
    site_id: parsed.data.site_id || null,
    jenis: parsed.data.jenis,
    judul: parsed.data.judul,
    deskripsi: parsed.data.deskripsi || null,
    tingkat: parsed.data.tingkat,
    status: parsed.data.status,
    tindakan_perbaikan: parsed.data.tindakan_perbaikan || null,
    penanggung_jawab_id: ctx.userId,
  }).select('id').single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'hse.buat',
    entitas: 'catatan_hse',
    entitasId: data.id,
    sesudah: { jenis: parsed.data.jenis, judul: parsed.data.judul },
  });

  revalidatePath('/hse');
  if (parsed.data.kegiatan_id) revalidatePath(`/kegiatan/${parsed.data.kegiatan_id}`);
  return { sukses: true };
}