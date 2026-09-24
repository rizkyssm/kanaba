import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormPersonel from '@/features/personel/FormPersonel';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function PersonelBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/personel');

  const bolehGaji = punya(ctx, 'gaji.lihat');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Personel', href: '/data-induk/personel' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Personel Baru"
        subtitle="Tambahkan karyawan, tenaga lepas, atau vendor."
        actions={
          <Link href="/data-induk/personel">
            <Button variant="secondary">Batal</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <FormPersonel bolehGaji={bolehGaji} />
        </CardBody>
      </Card>
    </div>
  );
}