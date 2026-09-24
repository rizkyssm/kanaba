import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormPusatBiaya from '@/features/biaya/FormPusatBiaya';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function PusatBiayaBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'biaya.kelola')) redirect('/data-induk/pusat-biaya');

  const supabase = await createClient();
  const { data: sites } = await supabase.from('site')
    .select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Pusat Biaya', href: '/data-induk/pusat-biaya' },
        { label: 'Baru' },
      ]} />
      <PageHeader title="Pusat Biaya Baru"
        actions={<Link href="/data-induk/pusat-biaya"><Button variant="secondary">Batal</Button></Link>} />
      <Card><CardBody><FormPusatBiaya sites={(sites ?? []) as any} /></CardBody></Card>
    </div>
  );
}