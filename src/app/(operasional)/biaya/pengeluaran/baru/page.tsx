import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormPengeluaran from '@/features/biaya/FormPengeluaran';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

export default async function PengeluaranBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'biaya.kelola')) redirect('/biaya');

  const supabase = await createClient();
  const [{ data: sites }, { data: kegiatans }, { data: kategoris }, { data: pusats }, { data: vendors }] = await Promise.all([
    supabase.from('site').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
    supabase.from('kegiatan').select('id, kode:nomor, nama').eq('organisasi_id', ctx.organisasiId).order('tanggal', { ascending: false }).limit(200),
    supabase.from('kategori_biaya').select('id, kode, nama, jenis, klasifikasi').eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('kode'),
    supabase.from('pusat_biaya').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('kode'),
    supabase.from('vendor').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Biaya', href: '/biaya' },
        { label: 'Pengeluaran', href: '/biaya/pengeluaran' },
        { label: 'Baru' },
      ]} />
      <PageHeader title="Pengeluaran Baru" subtitle="Catat pengeluaran biaya operasional."
        actions={<Link href="/biaya/pengeluaran"><Button variant="secondary">Batal</Button></Link>} />
      <FormPengeluaran
        sites={(sites ?? []) as any}
        kegiatans={(kegiatans ?? []) as any}
        kategoris={(kategoris ?? []) as any}
        pusats={(pusats ?? []) as any}
        vendors={(vendors ?? []) as any}
      />
    </div>
  );
}