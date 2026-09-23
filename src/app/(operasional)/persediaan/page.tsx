import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Package, Plus, History } from 'lucide-react';

export default async function PersediaanPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: saldo } = await supabase
    .from('v_saldo_persediaan')
    .select('material_id, site_id, saldo, material:material_id(kode,nama), site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('material_id');

  const rows = saldo ?? [];
  const totalBaris = rows.length;
  const totalSaldo = rows.reduce((s: number, r: any) => s + Number(r.saldo || 0), 0);
  const totalNegatif = rows.filter((r: any) => Number(r.saldo) < 0).length;

  const bolehKelola = punya(ctx, 'persediaan.kelola');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persediaan"
        subtitle="Saldo material per lokasi, dihitung dari transaksi."
        actions={
          <>
            <Link href="/persediaan/pengeluaran">
              <Button variant="secondary"><History size={14} /> Riwayat</Button>
            </Link>
            {bolehKelola && (
              <Link href="/persediaan/pengeluaran/baru">
                <Button variant="primary"><Plus size={14} /> Pengeluaran Material</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Baris Saldo"   value={totalBaris} />
        <KPICard label="Total Saldo"   value={totalSaldo.toLocaleString('id-ID')} tone="blue" />
        <KPICard label="Saldo Negatif" value={totalNegatif} tone={totalNegatif > 0 ? 'red' : 'neutral'} sub={totalNegatif > 0 ? 'Perlu diperiksa' : 'Sehat'} />
        <KPICard label="Status"        value="Aktif" tone="green" sub="Ledger berjalan" />
      </div>

      <Section title="Saldo per Material" subtitle={`${rows.length} baris`}>
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Package size={20} />}
              title="Belum ada transaksi persediaan"
              description="Catat pengeluaran material atau penerimaan untuk memulai ledger."
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Material</TH>
              <TH>Site</TH>
              <TH align="right">Saldo</TH>
              <TH align="right">Status</TH>
            </THead>
            <TBody>
              {rows.map((r: any, idx: number) => {
                const saldoNum = Number(r.saldo || 0);
                return (
                  <TR key={idx}>
                    <TD>
                      <span className="font-mono text-[12px] text-[color:var(--text-2)]">{r.material?.kode}</span>
                      <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                      <span className="font-medium">{r.material?.nama}</span>
                    </TD>
                    <TD className="text-[color:var(--text-2)]">{r.site?.kode ?? 'Tanpa Site'}</TD>
                    <TD align="right" className="font-medium">{saldoNum.toLocaleString('id-ID')}</TD>
                    <TD align="right">
                      {saldoNum < 0
                        ? <Badge tone="red">Negatif</Badge>
                        : saldoNum === 0
                        ? <Badge tone="gray">Kosong</Badge>
                        : <Badge tone="green">Tersedia</Badge>}
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