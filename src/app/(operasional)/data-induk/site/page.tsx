import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import SiteClient from '@/features/data-induk/SiteClient';

export default async function SitePage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('site')
    .select('id, kode, nama, alamat, aktif, created_at')
    .eq('organisasi_id', ctx.organisasiId)
    .order('created_at', { ascending: false });

  return (
    <SiteClient
      data={data ?? []}
      bisaKelola={punya(ctx, 'data_induk.kelola')}
    />
  );
}