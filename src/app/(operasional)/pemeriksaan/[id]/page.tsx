import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { StatRow } from '@/components/ui/StatRow';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import ApprovalBar from '@/features/pemeriksaan/ApprovalBar';
import { tanggal } from '@/lib/utils';

type Params = Promise<{ id: string }>;

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'orange' | 'green' | 'red'> = {
  draf: 'gray', diajukan: 'blue', disetujui_supervisor: 'orange',
  disetujui: 'green', ditolak: 'red', dibatalkan: 'gray',
};
const STATUS_LABEL: Record<string, string> = {
  draf: 'Draf', diajukan: 'Diajukan', disetujui_supervisor: 'Disetujui Supervisor',
  disetujui: 'Disetujui', ditolak: 'Ditolak', dibatalkan: 'Dibatalkan',
};

export default async function PemeriksaanDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: pf } = await supabase
    .from('pemeriksaan_fisik')
    .select('*, site:site_id(kode,nama)')
    .eq('id', id).eq('organisasi_id', ctx.organisasiId).single();
  if (!pf) notFound();

  const { data: items } = await supabase
    .from('pemeriksaan_fisik_item')
    .select('id, stok_sistem, jumlah_fisik, selisih, alasan_kode, catatan, material:material_id(kode,nama)')
    .eq('pemeriksaan_id', id)
    .order('created_at');

  const totalItem = items?.length ?? 0;
  const totalSelisih = (items ?? []).filter((it: any) => Number(it.selisih) !== 0).length;
  const totalPlus = (items ?? []).reduce((s: number, it: any) => s + (Number(it.selisih) > 0 ? Number(it.selisih) : 0), 0);
  const totalMinus = (items ?? []).reduce((s: number, it: any) => s + (Number(it.selisih) < 0 ? Math.abs(Number(it.selisih)) : 0), 0);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Persediaan', href: '/persediaan' },
        { label: 'Pemeriksaan Fisik', href: '/persediaan/pemeriksaan' },
        { label: pf.nomor },
      ]} />

      <PageHeader
        title={`Pemeriksaan ${pf.nomor}`}
        subtitle={`${pf.site?.kode} · ${pf.site?.nama} · ${tanggal(pf.tanggal)}`}
        actions={
          <Link href="/persediaan/pemeriksaan">
            <Button variant="secondary">Kembali</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Item" value={totalItem} />
        <KPICard label="Item Berselisih" value={totalSelisih} tone={totalSelisih > 0 ? 'orange' : 'neutral'} />
        <KPICard label="Total Plus" value={`+${totalPlus.toLocaleString('id-ID')}`} tone="green" />
        <KPICard label="Total Minus" value={`−${totalMinus.toLocaleString('id-ID')}`} tone={totalMinus > 0 ? 'red' : 'neutral'} />
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <StatRow label="Status" value={
              <Badge tone={STATUS_TONE[pf.status] ?? 'gray'}>{STATUS_LABEL[pf.status] ?? pf.status}</Badge>
            } />
            <StatRow label="Tanggal" value={tanggal(pf.tanggal)} />
            <StatRow label="Site" value={`${pf.site?.kode} · ${pf.site?.nama}`} />
            <StatRow label="Nomor" value={pf.nomor} />
          </div>
          {pf.catatan && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)] mb-1.5">Catatan</div>
              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{pf.catatan}</p>
            </div>
          )}
          {pf.alasan_penolakan && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--red-fg)] mb-1.5">Alasan Penolakan</div>
              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{pf.alasan_penolakan}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <ApprovalBar
        pemeriksaanId={pf.id}
        status={pf.status}
        bolehApproveSupervisor={punya(ctx, 'persediaan.penyesuaian')}
        bolehApproveFinal={punya(ctx, 'persediaan.kelola')}
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold">Detail Item</h2>
          <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
            {totalItem} item diperiksa · {totalSelisih} memiliki selisih
          </p>
        </div>

        {(!items || items.length === 0) ? (
          <Card><EmptyState title="Tidak ada item" /></Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Material</TH>
              <TH align="right">Stok Sistem</TH>
              <TH align="right">Jumlah Fisik</TH>
              <TH align="right">Selisih</TH>
              <TH>Alasan</TH>
              <TH>Catatan</TH>
            </THead>
            <TBody>
              {(items ?? []).map((it: any) => {
                const s = Number(it.selisih);
                return (
                  <TR key={it.id}>
                    <TD>
                      <span className="font-mono text-[12px] text-[color:var(--text-2)]">{it.material?.kode}</span>
                      <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                      <span className="font-medium">{it.material?.nama}</span>
                    </TD>
                    <TD align="right" className="text-[color:var(--text-2)]">{Number(it.stok_sistem).toLocaleString('id-ID')}</TD>
                    <TD align="right" className="font-medium">{Number(it.jumlah_fisik).toLocaleString('id-ID')}</TD>
                    <TD align="right">
                      <Badge tone={s === 0 ? 'gray' : s > 0 ? 'green' : 'red'}>
                        {s > 0 ? '+' : ''}{s.toLocaleString('id-ID')}
                      </Badge>
                    </TD>
                    <TD className="text-[color:var(--text-2)]">{it.alasan_kode ?? '—'}</TD>
                    <TD className="text-[color:var(--text-2)]">{it.catatan ?? '—'}</TD>
                  </TR>
                );
              })}
            </TBody>
          </TableWrap>
        )}
      </section>
    </div>
  );
}