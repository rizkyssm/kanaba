import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormKategoriBiaya from '@/features/biaya/FormKategoriBiaya';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function KategoriBiayaBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'biaya.kelola')) redirect('/data-induk/kategori-biaya');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Kategori Biaya', href: '/data-induk/kategori-biaya' },
        { label: 'Baru' },
      ]} />
      <PageHeader title="Kategori Biaya Baru"
        actions={<Link href="/data-induk/kategori-biaya"><Button variant="secondary">Batal</Button></Link>} />
      <Card><CardBody><FormKategoriBiaya /></CardBody></Card>
    </div>
  );
}