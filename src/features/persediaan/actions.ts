'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SkemaItem = z.object({
  material_id: z.string().uuid(),
  jumlah: z.coerce.number().positive(),
});

const SkemaPengeluaran = z.object({
  kegiatan_id: z.string().uuid('Kegiatan wajib'),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

// Form: baris material dinamis dikirim sebagai JSON string di field `items`
export async function buatPengeluaranAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.kelola')) return { error: 'Tidak berhak.' };

  const base = SkemaPengeluaran.safeParse(Object.fromEntries(formData));
  if (!base.success) return { error: base.error.errors[0].message };

  let items: any[] = [];
  try { items = JSON.parse(String(formData.get('items') || '[]')); } catch { return { error: 'Daftar material tidak valid.' }; }
  if (!Array.isArray(items) || items.length === 0) return { error: 'Minimal satu material.' };

  const parsedItems = items.map((i) => SkemaItem.safeParse(i));
  if (parsedItems.some((p) => !p.success)) return { error: 'Baris material tidak valid.' };
  const okItems = parsedItems.map((p: any) => p.data);

  const supabase = await createClient();
  const { data: kegiatan } = await supabase
    .from('kegiatan').select('id, site_id, organisasi_id')
    .eq('id', base.data.kegiatan_id).eq('organisasi_id', ctx.organisasiId).single();
  if (!kegiatan) return { error: 'Kegiatan tidak ditemukan.' };

  const { data: nomor, error: nomorErr } = await supabase.rpc('gen_nomor_dokumen', {
    p_org: ctx.organisasiId, p_prefix: 'PM', p_tabel: 'pengeluaran_material',
  });
  if (nomorErr || !nomor) return { error: 'Gagal membuat nomor.' };

  const { data: head, error: errHead } = await supabase.from('pengeluaran_material').insert({
    organisasi_id: ctx.organisasiId,
    kegiatan_id: kegiatan.id,
    site_id: kegiatan.site_id,
    nomor, status: 'dikirim',
    catatan: base.data.catatan || null,
    dibuat_oleh: ctx.userId,
  }).select('id').single();
  if (errHead) return { error: errHead.message };

  const { error: errItems } = await supabase.from('pengeluaran_material_item').insert(
    okItems.map((i: any) => ({ pengeluaran_id: head.id, material_id: i.material_id, jumlah: i.jumlah }))
  );
  if (errItems) return { error: errItems.message };

  const { error: errLedger } = await supabase.from('transaksi_persediaan').insert(
    okItems.map((i: any) => ({
      organisasi_id: ctx.organisasiId,
      site_id: kegiatan.site_id,
      material_id: i.material_id,
      jenis: 'pengeluaran_site',
      arah: 'keluar',
      jumlah: i.jumlah,
      referensi_tipe: 'pengeluaran_material',
      referensi_id: head.id,
      kegiatan_id: kegiatan.id,
      dibuat_oleh: ctx.userId,
    }))
  );
  if (errLedger) return { error: errLedger.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pengeluaran.buat',
    entitas: 'pengeluaran_material',
    entitasId: head.id,
    sesudah: { nomor, kegiatan_id: kegiatan.id, item: okItems.length },
  });

  revalidatePath('/persediaan');
  revalidatePath(`/kegiatan/${kegiatan.id}`);
  return { sukses: true, id: head.id };
}

export async function buatPengembalianAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'persediaan.kelola')) return { error: 'Tidak berhak.' };

  const base = SkemaPengeluaran.safeParse(Object.fromEntries(formData));
  if (!base.success) return { error: base.error.errors[0].message };

  let items: any[] = [];
  try { items = JSON.parse(String(formData.get('items') || '[]')); } catch { return { error: 'Daftar material tidak valid.' }; }
  if (!Array.isArray(items) || items.length === 0) return { error: 'Minimal satu material.' };
  const okItems = items.map((i) => SkemaItem.parse(i));

  const supabase = await createClient();
  const { data: kegiatan } = await supabase
    .from('kegiatan').select('id, site_id')
    .eq('id', base.data.kegiatan_id).eq('organisasi_id', ctx.organisasiId).single();
  if (!kegiatan) return { error: 'Kegiatan tidak ditemukan.' };

  const { data: nomor } = await supabase.rpc('gen_nomor_dokumen', {
    p_org: ctx.organisasiId, p_prefix: 'PKM', p_tabel: 'pengembalian_material',
  });

  const { data: head, error } = await supabase.from('pengembalian_material').insert({
    organisasi_id: ctx.organisasiId, kegiatan_id: kegiatan.id, site_id: kegiatan.site_id,
    nomor, catatan: base.data.catatan || null, dibuat_oleh: ctx.userId,
  }).select('id').single();
  if (error) return { error: error.message };

  await supabase.from('pengembalian_material_item').insert(
    okItems.map((i) => ({ pengembalian_id: head.id, material_id: i.material_id, jumlah: i.jumlah }))
  );

  await supabase.from('transaksi_persediaan').insert(
    okItems.map((i) => ({
      organisasi_id: ctx.organisasiId,
      site_id: kegiatan.site_id,
      material_id: i.material_id,
      jenis: 'pengembalian_site',
      arah: 'masuk',
      jumlah: i.jumlah,
      referensi_tipe: 'pengembalian_material',
      referensi_id: head.id,
      kegiatan_id: kegiatan.id,
      dibuat_oleh: ctx.userId,
    }))
  );

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pengembalian.buat',
    entitas: 'pengembalian_material',
    entitasId: head.id,
    sesudah: { nomor, kegiatan_id: kegiatan.id, item: okItems.length },
  });

  revalidatePath('/persediaan');
  revalidatePath(`/kegiatan/${kegiatan.id}`);
  return { sukses: true };
}