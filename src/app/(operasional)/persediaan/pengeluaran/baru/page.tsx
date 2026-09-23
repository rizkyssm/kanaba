import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import FormTransaksiMaterial from '@/features/persediaan/FormTransaksiMaterial';
import Link from 'next/link';

export default async function PengeluaranBaruPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'persediaan.kelola')) redirect('/persediaan');

  const supabase = await createClient();
  const [{ data: kegiatans }, { data: materials }] = await Promise.all([
    supabase.from('kegiatan').select('id, nomor, nama').eq('organisasi_id', ctx.organisasiId)
      .in('status', ['direncanakan','disetujui','persiapan','dikirim_ke_site','di_site','sedang_berjalan'])
      .order('tanggal', { ascending: false }).limit(100),
    supabase.from('material').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/persediaan" className="text-sm text-[color:var(--text-2)] hover:underline">← Persediaan</Link>
        <h1 className="text-xl font-semibold mt-1">Pengeluaran Material</h1>
      </div>
      <FormTransaksiMaterial mode="pengeluaran" kegiatans={(kegiatans ?? []) as any} materials={(materials ?? []) as any} />
    </div>
  );
}