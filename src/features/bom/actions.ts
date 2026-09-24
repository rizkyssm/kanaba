'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SkemaHead = z.object({
  kode: z.string().min(1).max(40),
  nama: z.string().min(2).max(200),
  produk_id: z.string().uuid('Produk wajib'),
  versi: z.string().max(20).default('v1'),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

const SkemaItem = z.object({
  material_id: z.string().uuid(),
  jumlah: z.coerce.number().positive(),
  satuan_id: z.string().uuid().optional().nullable(),
  catatan: z.string().max(200).optional().or(z.literal('')),
});

export async function buatBomAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };

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
  const { data: bom, error } = await supabase.from('bom').insert({
    organisasi_id: ctx.organisasiId,
    produk_id: head.data.produk_id,
    kode: head.data.kode,
    nama: head.data.nama,
    versi: head.data.versi || 'v1',
    catatan: head.data.catatan || null,
  }).select('id').single();
  if (error) return { error: error.message };

  const { error: errItems } = await supabase.from('item_bom').insert(
    okItems.map((i: any) => ({
      bom_id: bom.id,
      material_id: i.material_id,
      jumlah: i.jumlah,
      satuan_id: i.satuan_id || null,
      catatan: i.catatan || null,
    }))
  );
  if (errItems) return { error: errItems.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'bom.buat',
    entitas: 'bom',
    entitasId: bom.id,
    sesudah: { kode: head.data.kode, item: okItems.length },
  });

  revalidatePath('/data-induk');
  revalidatePath('/data-induk/bom');
  redirect(`/data-induk/bom/${bom.id}`);
}

export async function tambahItemBomAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };

  const bomId = String(formData.get('bom_id') || '');
  const parsed = SkemaItem.safeParse({
    material_id: formData.get('material_id'),
    jumlah: formData.get('jumlah'),
    satuan_id: formData.get('satuan_id') || null,
    catatan: formData.get('catatan') || '',
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: bom } = await supabase.from('bom')
    .select('id, organisasi_id').eq('id', bomId).eq('organisasi_id', ctx.organisasiId).single();
  if (!bom) return { error: 'BOM tidak ditemukan.' };

  const { error } = await supabase.from('item_bom').insert({
    bom_id: bomId,
    material_id: parsed.data.material_id,
    jumlah: parsed.data.jumlah,
    satuan_id: parsed.data.satuan_id || null,
    catatan: parsed.data.catatan || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/data-induk/bom/${bomId}`);
  return { sukses: true };
}

export async function hapusItemBomAction(itemId: string, bomId: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  await supabase.from('item_bom').delete().eq('id', itemId);
  revalidatePath(`/data-induk/bom/${bomId}`);
  return { sukses: true };
}

export async function hapusBomAction(bomId: string) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'data_induk.kelola')) return { error: 'Tidak berhak.' };
  const supabase = await createClient();
  const { error } = await supabase.from('bom')
    .delete().eq('id', bomId).eq('organisasi_id', ctx.organisasiId);
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'bom.hapus',
    entitas: 'bom',
    entitasId: bomId,
  });

  revalidatePath('/data-induk');
  revalidatePath('/data-induk/bom');
  redirect('/data-induk/bom');
}