import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import ListKegiatanClient from '@/features/kegiatan/ListKegiatanClient';

export default async function KegiatanPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('kegiatan')
    .select('id, nomor, nama, tanggal, status, target_bcm, aktual_bcm, site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kegiatan"
        subtitle="Pusat transaksi operasional dari perencanaan sampai penutupan."
      />
      <ListKegiatanClient data={(data ?? []) as any} bisaKelola={punya(ctx, 'kegiatan.kelola')} />
    </div>
  );
}