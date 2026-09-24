import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormProduksi from '@/features/produksi/FormProduksi';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

export default async function ProduksiBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'produksi.kelola')) redirect('/produksi');

  const supabase = await createClient();

  const [{ data: produks }, { data: boms }, { data: sites }] = await Promise.all([
    supabase.from('produk').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
    supabase.from('bom')
      .select('id, nama, produk_id, aktif, item:item_bom(material_id, jumlah, material:material_id(kode,nama))')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  // Map produk_id → BOM aktif (ambil yang paling baru)
  const bomsByProduk: Record<string, any> = {};
  (boms ?? []).forEach((b: any) => {
    if (!bomsByProduk[b.produk_id]) {
      bomsByProduk[b.produk_id] = {
        bom_id: b.id,
        nama: b.nama,
        items: (b.item ?? []).map((it: any) => ({
          material_id: it.material_id,
          kode: it.material?.kode ?? '',
          nama: it.material?.nama ?? '',
          jumlah_per_unit: Number(it.jumlah),
        })),
      };
    }
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Produksi', href: '/produksi' }, { label: 'Baru' }]} />
      <PageHeader
        title="Produksi Baru"
        subtitle="Pilih produk dan jumlah — material otomatis dihitung dari BOM."
        actions={<Link href="/produksi"><Button variant="secondary">Batal</Button></Link>}
      />
      <FormProduksi
        produks={(produks ?? []) as any}
        bomsByProduk={bomsByProduk}
        sites={(sites ?? []) as any}
      />
    </div>
  );
}