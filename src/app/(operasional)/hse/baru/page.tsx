import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormHse from '@/features/hse/FormHse';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function HseBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'kegiatan.kelola')) redirect('/hse');

  const supabase = await createClient();
  const [{ data: kegiatans }, { data: sites }] = await Promise.all([
    supabase.from('kegiatan').select('id, nomor, nama')
      .eq('organisasi_id', ctx.organisasiId).limit(200),
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'HSE', href: '/hse' }, { label: 'Catatan Baru' }]} />
      <PageHeader
        title="Catatan HSE Baru"
        subtitle="Catat pemeriksaan, temuan, insiden, atau tindakan perbaikan."
        actions={
          <Link href="/hse">
            <Button variant="secondary">Batal</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <FormHse kegiatans={(kegiatans ?? []) as any} sites={(sites ?? []) as any} />
        </CardBody>
      </Card>
    </div>
  );
}