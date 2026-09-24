'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SkemaHead = z.object({
  site_id: z.string().uuid('Site wajib'),
  tanggal: z.string().min(10),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

const SkemaItem = z.object({
  material_id: z.string().uuid(),
  stok_sistem: z.coerce.number(),
  jumlah_fisik: z.coerce.number().min(0),
  alasan_kode: z.string().max(50).optional().or(z.literal('')),
  catatan: z.string().max(200).optional().or(z.literal('')),
});

export async function buatPemeriksaanAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.buat_pemeriksaan')) return { error: 'Tidak berhak.' };

  const head = SkemaHead.safeParse(Object.fromEntries(formData));
  if (!head.success) return { error: head.error.errors[0].message };

  let items: any[] = [];
  try { items = JSON.parse(String(formData.get('items') || '[]')); }
  catch { return { error: 'Daftar material tidak valid.' }; }
  if (!Array.isArray(items) || items.length === 0) return { error: 'Minimal satu material.' };

  const parsedItems = items.map((i) => SkemaItem.safeParse(i));
  if (parsedItems.some((p) => !p.success)) return { error: 'Baris material tidak valid.' };
  const okItems = parsedItems.map((p: any) => p.data);

  const supabase = await createClient();

  const { data: nomor, error: nomorErr } = await supabase.rpc('gen_nomor_dokumen', {
    p_org: ctx.organisasiId, p_prefix: 'PF', p_tabel: 'pemeriksaan_fisik',
  });
  if (nomorErr || !nomor) return { error: 'Gagal membuat nomor.' };

  const { data: head2, error: errHead } = await supabase.from('pemeriksaan_fisik').insert({
    organisasi_id: ctx.organisasiId,
    site_id: head.data.site_id,
    nomor,
    tanggal: head.data.tanggal,
    status: 'diajukan',
    catatan: head.data.catatan || null,
    diajukan_oleh: ctx.userId,
    diajukan_at: new Date().toISOString(),
  }).select('id').single();
  if (errHead) return { error: errHead.message };

  const { error: errItems } = await supabase.from('pemeriksaan_fisik_item').insert(
    okItems.map((it: any) => ({
      pemeriksaan_id: head2.id,
      material_id: it.material_id,
      stok_sistem: it.stok_sistem,
      jumlah_fisik: it.jumlah_fisik,
      selisih: +(it.jumlah_fisik - it.stok_sistem).toFixed(4),
      alasan_kode: it.alasan_kode || null,
      catatan: it.catatan || null,
    }))
  );
  if (errItems) return { error: errItems.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pemeriksaan.buat',
    entitas: 'pemeriksaan_fisik',
    entitasId: head2.id,
    sesudah: { nomor, site_id: head.data.site_id, item: okItems.length },
  });

  revalidatePath('/persediaan/pemeriksaan');
  redirect(`/persediaan/pemeriksaan/${head2.id}`);
}

export async function approveSupervisorAction(pemeriksaanId: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.penyesuaian')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  const { error } = await supabase.from('pemeriksaan_fisik')
    .update({
      status: 'disetujui_supervisor',
      disetujui_supervisor_oleh: ctx.userId,
      disetujui_supervisor_at: new Date().toISOString(),
    })
    .eq('id', pemeriksaanId).eq('organisasi_id', ctx.organisasiId);
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pemeriksaan.approve_supervisor',
    entitas: 'pemeriksaan_fisik',
    entitasId: pemeriksaanId,
  });

  revalidatePath('/persediaan/pemeriksaan');
  revalidatePath(`/persediaan/pemeriksaan/${pemeriksaanId}`);
  return { sukses: true };
}

export async function tolakPemeriksaanAction(pemeriksaanId: string, alasan: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.penyesuaian')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  const { error } = await supabase.from('pemeriksaan_fisik')
    .update({ status: 'ditolak', alasan_penolakan: alasan || 'Ditolak' })
    .eq('id', pemeriksaanId).eq('organisasi_id', ctx.organisasiId);
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pemeriksaan.tolak',
    entitas: 'pemeriksaan_fisik',
    entitasId: pemeriksaanId,
    sesudah: { alasan },
  });

  revalidatePath('/persediaan/pemeriksaan');
  revalidatePath(`/persediaan/pemeriksaan/${pemeriksaanId}`);
  return { sukses: true };
}

export async function setujuiDanSesuaikanAction(pemeriksaanId: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('proses_penyesuaian_pemeriksaan', {
    p_pemeriksaan: pemeriksaanId,
  });
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pemeriksaan.setujui',
    entitas: 'pemeriksaan_fisik',
    entitasId: pemeriksaanId,
    sesudah: { penyesuaian: data },
  });

  revalidatePath('/persediaan');
  revalidatePath('/persediaan/pemeriksaan');
  revalidatePath(`/persediaan/pemeriksaan/${pemeriksaanId}`);
  return { sukses: true, penyesuaian: data as number };
}