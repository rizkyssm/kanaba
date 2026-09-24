import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormBom from '@/features/bom/FormBom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function BomBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/bom');

  const supabase = await createClient();
  const [{ data: produks }, { data: materials }, { data: satuans }] = await Promise.all([
    supabase.from('produk').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
    supabase.from('material').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
    supabase.from('satuan').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).order('kode'),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'BOM', href: '/data-induk/bom' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="BOM Baru"
        subtitle="Tentukan produk dan material penyusunnya."
        actions={<Link href="/data-induk/bom"><Button variant="secondary">Batal</Button></Link>}
      />
      <Card>
        <CardBody>
          <FormBom
            produks={(produks ?? []) as any}
            materials={(materials ?? []) as any}
            satuans={(satuans ?? []) as any}
          />
        </CardBody>
      </Card>
    </div>
  );
}