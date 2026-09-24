import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormLox from '@/features/lox/FormLox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function LoxBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'persediaan.kelola')) redirect('/liquid-oxygen');

  const supabase = await createClient();
  const [{ data: kegiatans }, { data: sites }] = await Promise.all([
    supabase.from('kegiatan')
      .select('id, nomor, nama')
      .eq('organisasi_id', ctx.organisasiId)
      .in('status', ['direncanakan', 'disetujui', 'persiapan', 'dikirim_ke_site', 'di_site', 'sedang_berjalan'])
      .limit(100),
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Liquid Oxygen', href: '/liquid-oxygen' }, { label: 'Transaksi Baru' }]} />
      <PageHeader
        title="Catat Transaksi LOX"
        subtitle="Pilih jenis transaksi, jumlah dalam kilogram, dan kegiatan terkait bila ada."
        actions={
          <Link href="/liquid-oxygen">
            <Button variant="secondary">Batal</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <FormLox kegiatans={(kegiatans ?? []) as any} sites={(sites ?? []) as any} />
        </CardBody>
      </Card>
    </div>
  );
}