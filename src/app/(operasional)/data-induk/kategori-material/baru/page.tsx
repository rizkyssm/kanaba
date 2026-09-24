import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormKategoriMaterial from '@/features/data-induk/FormKategoriMaterial';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function KategoriMaterialBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/kategori-material');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Kategori Material', href: '/data-induk/kategori-material' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Kategori Material Baru"
        actions={<Link href="/data-induk/kategori-material"><Button variant="secondary">Batal</Button></Link>}
      />
      <Card><CardBody><FormKategoriMaterial /></CardBody></Card>
    </div>
  );
}