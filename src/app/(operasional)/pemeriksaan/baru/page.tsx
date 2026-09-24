import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormPemeriksaan from '@/features/pemeriksaan/FormPemeriksaan';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

export default async function PemeriksaanBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'persediaan.buat_pemeriksaan')) redirect('/persediaan/pemeriksaan');

  const supabase = await createClient();
  const [{ data: sites }, { data: materials }, { data: saldo }, { data: alasans }] = await Promise.all([
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
    supabase.from('material').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
    supabase.from('v_saldo_persediaan')
      .select('site_id, material_id, saldo')
      .eq('organisasi_id', ctx.organisasiId),
    supabase.from('alasan_penyesuaian').select('kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
  ]);

  // Build saldo map: site_id → material_id → saldo
  const saldoBySite: Record<string, Record<string, number>> = {};
  (saldo ?? []).forEach((r: any) => {
    if (!r.site_id) return;
    if (!saldoBySite[r.site_id]) saldoBySite[r.site_id] = {};
    saldoBySite[r.site_id][r.material_id] = Number(r.saldo);
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Persediaan', href: '/persediaan' },
        { label: 'Pemeriksaan Fisik', href: '/persediaan/pemeriksaan' },
        { label: 'Baru' },
      ]} />
      <PageHeader
        title="Pemeriksaan Fisik Baru"
        subtitle="Pilih site, isi jumlah fisik per material, dan ajukan untuk disetujui."
        actions={<Link href="/persediaan/pemeriksaan"><Button variant="secondary">Batal</Button></Link>}
      />
      <FormPemeriksaan
        sites={(sites ?? []) as any}
        materials={(materials ?? []) as any}
        saldoBySite={saldoBySite}
        alasans={(alasans ?? []) as any}
      />
    </div>
  );
}