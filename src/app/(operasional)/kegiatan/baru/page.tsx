import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormKegiatan from '@/features/kegiatan/FormKegiatan';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default async function KegiatanBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'kegiatan.kelola')) redirect('/kegiatan');

  const supabase = await createClient();
  const { data: sites } = await supabase
    .from('site').select('id, nama, kode')
    .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Kegiatan', href: '/kegiatan' }, { label: 'Baru' }]} />
      <PageHeader title="Kegiatan Baru" subtitle="Isi data dasar kegiatan. Material, LOX, dan personel dapat dilengkapi setelahnya." />
      <FormKegiatan sites={(sites ?? []) as any} />
    </div>
  );
}