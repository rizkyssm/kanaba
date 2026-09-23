import { getKonteks, punya } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';

export default async function BerandaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  const staf = !punya(ctx, 'biaya.lihat_ringkasan') && !punya(ctx, 'biaya.lihat_rinci');

  const supabase = await createClient();
  const [{ data: kegiatanAktif }, { count: jmlKegiatan }] = await Promise.all([
    supabase.from('kegiatan')
      .select('id, nomor, nama, status, tanggal, site:site_id(kode,nama)')
      .eq('organisasi_id', ctx.organisasiId)
      .in('status', ['persiapan','dikirim_ke_site','di_site','sedang_berjalan'])
      .order('tanggal', { ascending: false })
      .limit(6),
    supabase.from('kegiatan')
      .select('id', { count: 'exact', head: true })
      .eq('organisasi_id', ctx.organisasiId)
      .gte('tanggal', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${ctx.namaLengkap.split(' ')[0] || 'Rekan'}`}
        subtitle={ctx.organisasiNama}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="KANABA Tersedia"  value="— pcs" sub="Segera hadir" />
        <KPICard label="Liquid Oxygen"    value="— kg"  sub="Segera hadir" />
        <KPICard label="Kegiatan Aktif"   value={kegiatanAktif?.length ?? 0} tone="blue" />
        <KPICard label="Kegiatan Bulan Ini" value={jmlKegiatan ?? 0} />
      </div>

      {!staf && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Biaya Bulan Ini"  value="Rp 0" />
          <KPICard label="Biaya per BCM"    value="Rp 0" />
          <KPICard label="BCM Bulan Ini"    value="0" />
          <KPICard label="Total Kegiatan"   value={jmlKegiatan ?? 0} />
        </div>
      )}

      <Section title="Kegiatan Aktif" subtitle="Sedang berlangsung saat ini">
        {(!kegiatanAktif || kegiatanAktif.length === 0) ? (
          <Card><CardBody className="text-center py-10 text-sm text-[color:var(--text-2)]">Tidak ada kegiatan aktif.</CardBody></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {kegiatanAktif.map((k: any) => (
              <a key={k.id} href={`/kegiatan/${k.id}`}
                className="block rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)] p-4 hover:border-blue transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-[color:var(--text-3)]">{k.nomor}</div>
                    <div className="text-sm font-medium truncate mt-0.5">{k.nama}</div>
                    <div className="text-[12px] text-[color:var(--text-2)] mt-1">
                      {k.site?.kode} · {k.site?.nama}
                    </div>
                  </div>
                  <Badge tone="blue">Berjalan</Badge>
                </div>
              </a>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}