import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormSatuan from '@/features/data-induk/FormSatuan';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function SatuanBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/satuan');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Satuan', href: '/data-induk/satuan' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Satuan Baru"
        actions={<Link href="/data-induk/satuan"><Button variant="secondary">Batal</Button></Link>}
      />
      <Card><CardBody><FormSatuan /></CardBody></Card>
    </div>
  );
}