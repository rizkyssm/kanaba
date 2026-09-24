import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormVendor from '@/features/biaya/FormVendor';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function VendorBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/vendor');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Vendor', href: '/data-induk/vendor' },
        { label: 'Baru' },
      ]} />
      <PageHeader title="Vendor Baru"
        actions={<Link href="/data-induk/vendor"><Button variant="secondary">Batal</Button></Link>} />
      <Card><CardBody><FormVendor /></CardBody></Card>
    </div>
  );
}