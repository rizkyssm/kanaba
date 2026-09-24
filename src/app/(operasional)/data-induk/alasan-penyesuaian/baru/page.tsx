import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormAlasanPenyesuaian from '@/features/data-induk/FormAlasanPenyesuaian';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function AlasanPenyesuaianBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/alasan-penyesuaian');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Alasan Penyesuaian', href: '/data-induk/alasan-penyesuaian' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Alasan Penyesuaian Baru"
        actions={<Link href="/data-induk/alasan-penyesuaian"><Button variant="secondary">Batal</Button></Link>}
      />
      <Card><CardBody><FormAlasanPenyesuaian /></CardBody></Card>
    </div>
  );
}