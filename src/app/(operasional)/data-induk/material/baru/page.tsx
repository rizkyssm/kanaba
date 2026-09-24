import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormMaterial from '@/features/data-induk/FormMaterial';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function MaterialBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'data_induk.kelola')) redirect('/data-induk/material');

  const supabase = await createClient();
  const [{ data: kategoris }, { data: satuans }] = await Promise.all([
    supabase.from('kategori_material').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).order('kode'),
    supabase.from('satuan').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).order('kode'),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'Material', href: '/data-induk/material' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Material Baru"
        subtitle="Tambahkan material atau bahan baku baru."
        actions={<Link href="/data-induk/material"><Button variant="secondary">Batal</Button></Link>}
      />
      <Card><CardBody>
        <FormMaterial kategoris={(kategoris ?? []) as any} satuans={(satuans ?? []) as any} />
      </CardBody></Card>
    </div>
  );
}