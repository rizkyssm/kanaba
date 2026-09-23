import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormKegiatan from '@/features/kegiatan/FormKegiatan';
import Link from 'next/link';

export default async function KegiatanBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'kegiatan.kelola')) redirect('/kegiatan');

  const supabase = await createClient();
  const { data: sites } = await supabase
    .from('site')
    .select('id, nama, kode')
    .eq('organisasi_id', ctx.organisasiId)
    .eq('aktif', true)
    .order('nama');

  return (
    <div className="space-y-4">
      <div>
        <Link href="/kegiatan" className="text-sm text-[color:var(--text-2)] hover:underline">← Kembali</Link>
        <h1 className="text-xl font-semibold mt-1">Kegiatan Baru</h1>
      </div>
      <FormKegiatan sites={(sites ?? []) as any} />
    </div>
  );
}