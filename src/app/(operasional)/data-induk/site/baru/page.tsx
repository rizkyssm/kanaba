import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormSite from '@/features/data-induk/FormSite';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function SiteBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/site');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Site', href: '/data-induk/site' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Site Baru"
        subtitle="Tambahkan lokasi operasional baru."
        actions={
          <Link href="/data-induk/site">
            <Button variant="secondary">Batal</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <FormSite />
        </CardBody>
      </Card>
    </div>
  );
}