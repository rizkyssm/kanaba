import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormAset from '@/features/aset/FormAset';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function AsetBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/aset');

  const supabase = await createClient();
  const { data: sites } = await supabase
    .from('site').select('id, kode, nama')
    .eq('organisasi_id', ctx.organisasiId).eq('aktif', true);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Aset', href: '/aset' }, { label: 'Aset Baru' }]} />
      <PageHeader
        title="Aset Baru"
        subtitle="Isi data dasar aset. Nilai keuangan akan diisi oleh tim keuangan."
        actions={
          <Link href="/aset">
            <Button variant="secondary">Batal</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <FormAset sites={(sites ?? []) as any} />
        </CardBody>
      </Card>
    </div>
  );
}