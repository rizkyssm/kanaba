'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SkemaHead = z.object({
  produk_id: z.string().uuid('Produk wajib'),
  bom_id: z.string().uuid().optional().or(z.literal('')),
  site_id: z.string().uuid().optional().or(z.literal('')),
  tanggal: z.string().min(10),
  jumlah_produksi: z.coerce.number().positive(),
  hasil_baik: z.coerce.number().min(0),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

const SkemaItem = z.object({
  material_id: z.string().uuid(),
  jumlah: z.coerce.number().positive(),
});

export async function buatProduksiAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'produksi.kelola')) return { error: 'Tidak berhak.' };

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
  const { data: id, error } = await supabase.rpc('buat_produksi', {
    p_organisasi: ctx.organisasiId,
    p_site: head.data.site_id || null,
    p_produk: head.data.produk_id,
    p_bom: head.data.bom_id || null,
    p_tanggal: head.data.tanggal,
    p_jumlah: head.data.jumlah_produksi,
    p_hasil_baik: head.data.hasil_baik,
    p_catatan: head.data.catatan || null,
    p_items: okItems,
    p_user: ctx.userId,
  });
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'produksi.buat',
    entitas: 'produksi',
    entitasId: id,
    sesudah: { produk_id: head.data.produk_id, jumlah: head.data.jumlah_produksi, item: okItems.length },
  });

  revalidatePath('/produksi');
  revalidatePath('/persediaan');
  redirect(`/produksi/${id}`);
}