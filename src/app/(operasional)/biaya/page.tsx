import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Wallet, Plus, TrendingUp, Receipt } from 'lucide-react';
import { rupiah } from '@/lib/utils';

export default async function BiayaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const bolehRingkas = punya(ctx, 'biaya.lihat_ringkasan');
  const bolehRinci = punya(ctx, 'biaya.lihat_rinci');
  const bolehKelola = punya(ctx, 'biaya.kelola');

  if (!bolehRingkas && !bolehRinci) {
    return (
      <div className="space-y-6">
        <PageHeader title="Biaya" />
        <Card>
          <EmptyState
            title="Akses terbatas"
            description="Anda tidak memiliki hak melihat data biaya."
          />
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const bulanIni = new Date();
  const awalBulan = new Date(bulanIni.getFullYear(), bulanIni.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [
    { data: semuaPengeluaran },
    { data: perBulanIni },
    { data: perHasil },
  ] = await Promise.all([
    supabase
      .from('pengeluaran')
      .select('jenis, klasifikasi, nilai, status')
      .eq('organisasi_id', ctx.organisasiId)
      .in('status', ['disetujui', 'dibayar', 'dibukukan']),
    supabase
      .from('pengeluaran')
      .select('nilai')
      .eq('organisasi_id', ctx.organisasiId)
      .gte('tanggal', awalBulan)
      .in('status', ['disetujui', 'dibayar', 'dibukukan']),
    supabase
      .from('v_biaya_per_hasil')
      .select(
        'kegiatan_id, nomor, nama, basis_hasil, satuan_hasil, ' +
          'aktual_bcm, aktual_lubang, total_lox_kg, ' +
          'total_biaya, biaya_per_unit, lox_per_unit'
      )
      .eq('organisasi_id', ctx.organisasiId)
      .order('biaya_per_unit', { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  const sum = (arr: any[], key: string) =>
    arr.reduce((s, r) => s + Number(r[key] || 0), 0);

  const totalAll = sum(semuaPengeluaran ?? [], 'nilai');
  const totalOpex = sum(
    (semuaPengeluaran ?? []).filter((r: any) => r.klasifikasi === 'opex'),
    'nilai'
  );
  const totalCapex = sum(
    (semuaPengeluaran ?? []).filter((r: any) => r.klasifikasi === 'capex'),
    'nilai'
  );
  const totalLangsung = sum(
    (semuaPengeluaran ?? []).filter((r: any) => r.jenis === 'langsung'),
    'nilai'
  );
  const totalTidakLangsung = sum(
    (semuaPengeluaran ?? []).filter((r: any) => r.jenis === 'tidak_langsung'),
    'nilai'
  );
  const totalBulanIni = sum(perBulanIni ?? [], 'nilai');

  // Agregat per basis (dari top 20 saja sebagai indikator cepat)
  const byBasis = (perHasil ?? []).reduce(
    (acc: Record<string, { count: number; total: number }>, r: any) => {
      const key = r.basis_hasil ?? 'lainnya';
      if (!acc[key]) acc[key] = { count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += Number(r.total_biaya || 0);
      return acc;
    },
    {}
  );

  const BASIS_LABEL: Record<string, string> = {
    per_bcm: 'Per BCM',
    per_lubang: 'Per Lubang',
    per_kegiatan: 'Per Kegiatan',
    per_jam: 'Per Jam',
  };

  const BASIS_TONE: Record<string, 'blue' | 'orange' | 'purple' | 'gray'> = {
    per_bcm: 'blue',
    per_lubang: 'orange',
    per_kegiatan: 'purple',
    per_jam: 'gray',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya"
        subtitle="Ringkasan pengeluaran dan biaya per satuan hasil (BCM / lubang / kegiatan)."
        actions={
          <>
            <Link href="/biaya/pengeluaran">
              <Button variant="secondary">
                <Receipt size={14} /> Pengeluaran
              </Button>
            </Link>
            {bolehKelola && (
              <Link href="/biaya/pengeluaran/baru">
                <Button variant="primary">
                  <Plus size={14} /> Pengeluaran Baru
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Baris KPI 1 — total */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Bulan Ini"       value={rupiah(totalBulanIni)} tone="blue" />
        <KPICard label="Total Disetujui" value={rupiah(totalAll)} />
        <KPICard label="OPEX"            value={rupiah(totalOpex)} tone="orange" />
        <KPICard label="CAPEX"           value={rupiah(totalCapex)} tone="purple" />
      </div>

      {/* Baris KPI 2 — jenis biaya & basis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Biaya Langsung"
          value={rupiah(totalLangsung)}
          tone="blue"
          sub="Dapat dikaitkan ke kegiatan"
        />
        <KPICard
          label="Biaya Tidak Langsung"
          value={rupiah(totalTidakLangsung)}
          tone="orange"
          sub="Dialokasikan ke kegiatan"
        />
        <KPICard
          label="Kegiatan per Lubang"
          value={byBasis.per_lubang?.count ?? 0}
          tone="orange"
          sub="Blasting LOX"
        />
        <KPICard
          label="Kegiatan per BCM"
          value={byBasis.per_bcm?.count ?? 0}
          tone="blue"
          sub="Volume galian"
        />
      </div>

      {/* Distribusi basis */}
      {Object.keys(byBasis).length > 0 && (
        <Section
          title="Distribusi Basis Kontrak"
          subtitle="Dari 20 kegiatan dengan biaya tertinggi."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['per_bcm', 'per_lubang', 'per_kegiatan', 'per_jam'] as const).map((b) => {
              const d = byBasis[b];
              if (!d) return null;
              return (
                <Card key={b}>
                  <div className="px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-medium text-[color:var(--text-2)]">
                        {BASIS_LABEL[b]}
                      </div>
                      <Badge tone={BASIS_TONE[b]}>{d.count}</Badge>
                    </div>
                    {bolehRinci && (
                      <div className="mt-2.5 text-[16px] font-semibold tnum">
                        {rupiah(d.total)}
                      </div>
                    )}
                    <div className="text-[11px] text-[color:var(--text-3)] mt-0.5">
                      Kegiatan dengan basis ini
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* Tabel Biaya per Satuan Hasil */}
      <Section
        title="Biaya per Satuan Hasil"
        subtitle={
          bolehRinci
            ? 'Diurutkan dari biaya per satuan hasil tertinggi. Satuan mengikuti basis kontrak kegiatan.'
            : 'Nilai disembunyikan tanpa hak biaya.lihat_rinci.'
        }
        actions={
          <Link href="/biaya/pengeluaran">
            <Button variant="ghost" size="sm">
              <TrendingUp size={13} /> Detail
            </Button>
          </Link>
        }
      >
        {!perHasil || perHasil.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Wallet size={20} />}
              title="Belum ada data biaya kegiatan"
              description="Isi pengeluaran dengan kegiatan untuk melihat analitik biaya per satuan hasil."
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Kegiatan</TH>
              <TH>Basis</TH>
              <TH align="right">Volume</TH>
              <TH align="right">LOX</TH>
              {bolehRinci && <TH align="right">Total Biaya</TH>}
              {bolehRinci && <TH align="right">Biaya / Satuan</TH>}
              {bolehRinci && <TH align="right">LOX / Satuan</TH>}
              <TH align="right">Aksi</TH>
            </THead>
            <TBody>
              {(perHasil ?? []).map((r: any) => {
                const volume =
                  r.basis_hasil === 'per_bcm'
                    ? `${Number(r.aktual_bcm).toLocaleString('id-ID')} BCM`
                    : r.basis_hasil === 'per_lubang'
                    ? `${Number(r.aktual_lubang).toLocaleString('id-ID')} Lubang`
                    : '—';

                return (
                  <TR key={r.kegiatan_id}>
                    <TD>
                      <span className="font-mono text-[12px] text-[color:var(--text-2)]">
                        {r.nomor}
                      </span>
                      <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                      <span className="font-medium">{r.nama}</span>
                    </TD>
                    <TD>
                      <Badge tone={BASIS_TONE[r.basis_hasil] ?? 'gray'}>
                        {r.satuan_hasil ?? BASIS_LABEL[r.basis_hasil] ?? '—'}
                      </Badge>
                    </TD>
                    <TD align="right">{volume}</TD>
                    <TD align="right" className="text-[color:var(--text-2)]">
                      {Number(r.total_lox_kg) > 0
                        ? `${Number(r.total_lox_kg).toLocaleString('id-ID')} kg`
                        : '—'}
                    </TD>
                    {bolehRinci && (
                      <TD align="right">{rupiah(Number(r.total_biaya))}</TD>
                    )}
                    {bolehRinci && (
                      <TD align="right" className="font-medium">
                        {rupiah(Number(r.biaya_per_unit))}
                        <span className="text-[color:var(--text-3)] text-[11px] ml-1">
                          /{r.satuan_hasil}
                        </span>
                      </TD>
                    )}
                    {bolehRinci && (
                      <TD align="right" className="text-[color:var(--text-2)]">
                        {Number(r.lox_per_unit) > 0
                          ? `${Number(r.lox_per_unit).toFixed(3)} kg`
                          : '—'}
                      </TD>
                    )}
                    <TD align="right">
                      <Link
                        href={`/kegiatan/${r.kegiatan_id}`}
                        className="text-blue hover:underline text-[13px]"
                      >
                        Buka
                      </Link>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}