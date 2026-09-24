import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormProduk from '@/features/produk/FormProduk';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function ProdukBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/produk');

  const supabase = await createClient();
  const { data: satuans } = await supabase
    .from('satuan').select('id, kode, nama')
    .eq('organisasi_id', ctx.organisasiId).order('kode');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Produk', href: '/data-induk/produk' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Produk Baru"
        subtitle="Tambahkan produk jadi."
        actions={<Link href="/data-induk/produk"><Button variant="secondary">Batal</Button></Link>}
      />
      <Card>
        <CardBody>
          <FormProduk satuans={(satuans ?? []) as any} />
        </CardBody>
      </Card>
    </div>
  );
}