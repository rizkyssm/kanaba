import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormLox from '@/features/lox/FormLox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Droplet } from 'lucide-react';

const JENIS_TONE: Record<string, 'green' | 'red' | 'orange' | 'blue' | 'gray'> = {
  penerimaan: 'green',
  pengeluaran_site: 'orange',
  pengembalian_site: 'blue',
  pemakaian: 'red',
  penyesuaian_positif: 'green',
  penyesuaian_negatif: 'red',
};

const JENIS_LABEL: Record<string, string> = {
  penerimaan: 'Penerimaan',
  pengeluaran_site: 'Keluar ke Site',
  pengembalian_site: 'Kembali dari Site',
  pemakaian: 'Pemakaian',
  penyesuaian_positif: 'Penyesuaian +',
  penyesuaian_negatif: 'Penyesuaian −',
};

export default async function LoxPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: saldo }, { data: trx }, { data: kegiatans }, { data: sites }] = await Promise.all([
    supabase.from('v_saldo_lox')
      .select('site_id, saldo_kg, site:site_id(kode,nama)')
      .eq('organisasi_id', ctx.organisasiId),
    supabase.from('transaksi_lox')
      .select('id, jenis, arah, jumlah_kg, catatan, created_at, kegiatan:kegiatan_id(id,nomor)')
      .eq('organisasi_id', ctx.organisasiId)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase.from('kegiatan')
      .select('id, nomor, nama')
      .eq('organisasi_id', ctx.organisasiId)
      .in('status', ['direncanakan', 'disetujui', 'persiapan', 'dikirim_ke_site', 'di_site', 'sedang_berjalan'])
      .limit(100),
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  const total = (saldo ?? []).reduce((s: number, r: any) => s + Number(r.saldo_kg || 0), 0);
  const totalMasuk = (trx ?? []).filter((t: any) => t.arah === 'masuk').reduce((s, t: any) => s + Number(t.jumlah_kg), 0);
  const totalKeluar = (trx ?? []).filter((t: any) => t.arah === 'keluar').reduce((s, t: any) => s + Number(t.jumlah_kg), 0);
  const bolehKelola = punya(ctx, 'persediaan.kelola');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquid Oxygen"
        subtitle="Pencatatan LOX masuk, keluar, dan pemakaian per site."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Saldo"  value={`${total.toLocaleString('id-ID')} kg`} tone="blue" />
        <KPICard label="Total Masuk"  value={`${totalMasuk.toLocaleString('id-ID')} kg`} tone="green" />
        <KPICard label="Total Keluar" value={`${totalKeluar.toLocaleString('id-ID')} kg`} tone="orange" />
        <KPICard label="Jumlah Site"  value={saldo?.length ?? 0} />
      </div>

      <Section title="Saldo per Site">
        {(!saldo || saldo.length === 0) ? (
          <Card><CardBody className="text-sm text-[color:var(--text-2)]">Belum ada saldo tercatat.</CardBody></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(saldo ?? []).map((r: any, i: number) => (
              <Card key={i}>
                <CardBody className="py-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)]">
                    {r.site?.kode ?? 'Tanpa Site'}
                  </div>
                  <div className="text-[18px] font-semibold tnum mt-1">
                    {Number(r.saldo_kg).toLocaleString('id-ID')} kg
                  </div>
                  <div className="text-[12px] text-[color:var(--text-2)] mt-0.5">{r.site?.nama ?? '—'}</div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {bolehKelola && (
        <Section title="Catat Transaksi" subtitle="Pilih jenis, jumlah, dan kegiatan terkait bila ada.">
          <Card>
            <CardBody>
              <FormLox kegiatans={(kegiatans ?? []) as any} sites={(sites ?? []) as any} />
            </CardBody>
          </Card>
        </Section>
      )}

      <Section title="80 Transaksi Terakhir" subtitle={`${trx?.length ?? 0} baris`}>
        {(!trx || trx.length === 0) ? (
          <Card>
            <EmptyState
              icon={<Droplet size={20} />}
              title="Belum ada transaksi LOX"
              description="Catat penerimaan atau pengeluaran LOX untuk memulai."
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Waktu</TH>
              <TH>Jenis</TH>
              <TH>Arah</TH>
              <TH align="right">Jumlah (kg)</TH>
              <TH>Kegiatan</TH>
              <TH>Catatan</TH>
            </THead>
            <TBody>
              {(trx ?? []).map((r: any) => (
                <TR key={r.id}>
                  <TD className="text-[12px] text-[color:var(--text-2)]">
                    {new Date(r.created_at).toLocaleString('id-ID')}
                  </TD>
                  <TD>
                    <Badge tone={JENIS_TONE[r.jenis] ?? 'gray'}>
                      {JENIS_LABEL[r.jenis] ?? r.jenis}
                    </Badge>
                  </TD>
                  <TD className="text-[color:var(--text-2)] capitalize">{r.arah}</TD>
                  <TD align="right" className="font-medium">{Number(r.jumlah_kg).toLocaleString('id-ID')}</TD>
                  <TD className="font-mono text-[12px]">{r.kegiatan?.nomor ?? '—'}</TD>
                  <TD className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}