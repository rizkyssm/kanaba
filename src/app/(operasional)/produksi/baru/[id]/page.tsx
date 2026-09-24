import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardBody } from '@/components/ui/Card';
import { StatRow } from '@/components/ui/StatRow';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tanggal } from '@/lib/utils';

type Params = Promise<{ id: string }>;

export default async function ProduksiDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: p } = await supabase
    .from('produksi')
    .select('*, produk:produk_id(kode,nama), bom:bom_id(kode,nama), site:site_id(kode,nama), penanggung_jawab:penanggung_jawab_id(nama_lengkap)')
    .eq('id', id).eq('organisasi_id', ctx.organisasiId).single();
  if (!p) notFound();

  const { data: items } = await supabase
    .from('pemakaian_material_produksi')
    .select('id, jumlah, catatan, material:material_id(kode,nama)')
    .eq('produksi_id', id).order('created_at');

  const efisiensi = Number(p.jumlah_produksi) > 0
    ? Math.round((Number(p.hasil_baik) / Number(p.jumlah_produksi)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Produksi', href: '/produksi' },
        { label: p.nomor },
      ]} />

      <PageHeader
        title={`Produksi ${p.nomor}`}
        subtitle={`${p.produk?.kode ?? '—'} · ${p.produk?.nama ?? '—'}`}
        actions={
          <Link href="/produksi">
            <Button variant="secondary">Kembali</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Jumlah Produksi" value={Number(p.jumlah_produksi).toLocaleString('id-ID')} />
        <KPICard label="Hasil Baik" value={Number(p.hasil_baik).toLocaleString('id-ID')} tone="green" />
        <KPICard label="Efisiensi" value={`${efisiensi}%`} tone={efisiensi >= 95 ? 'green' : efisiensi >= 85 ? 'blue' : 'orange'} />
        <KPICard
          label="Status"
          value={p.status === 'selesai' ? 'Selesai' : p.status}
          tone={p.status === 'selesai' ? 'green' : 'neutral'}
        />
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <StatRow label="Tanggal" value={tanggal(p.tanggal)} />
            <StatRow label="Site" value={p.site ? `${p.site.kode} · ${p.site.nama}` : '—'} />
            <StatRow label="BOM" value={p.bom ? `${p.bom.kode} · ${p.bom.nama}` : '—'} />
            <StatRow label="Penanggung Jawab" value={p.penanggung_jawab?.nama_lengkap ?? '—'} />
          </div>
          {p.catatan && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)] mb-1.5">Catatan</div>
              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{p.catatan}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold">Material Terpakai</h2>
          <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
            {items?.length ?? 0} material tercatat sebagai pengeluaran dari persediaan.
          </p>
        </div>

        {(!items || items.length === 0) ? (
          <Card>
            <EmptyState title="Tidak ada material tercatat" />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Material</TH>
              <TH align="right">Jumlah</TH>
              <TH>Catatan</TH>
            </THead>
            <TBody>
              {(items ?? []).map((it: any) => (
                <TR key={it.id}>
                  <TD>
                    <span className="font-mono text-[12px] text-[color:var(--text-2)]">{it.material?.kode}</span>
                    <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                    <span className="font-medium">{it.material?.nama}</span>
                  </TD>
                  <TD align="right">{Number(it.jumlah).toLocaleString('id-ID')}</TD>
                  <TD className="text-[color:var(--text-2)]">{it.catatan ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </section>
    </div>
  );
}