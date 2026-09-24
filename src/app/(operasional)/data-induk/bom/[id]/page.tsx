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
import ItemBomManager from '@/features/bom/ItemBomManager';
import { tanggal } from '@/lib/utils';

type Params = Promise<{ id: string }>;

export default async function BomDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: bom } = await supabase
    .from('bom')
    .select('id, kode, nama, versi, aktif, catatan, created_at, produk:produk_id(id,kode,nama)')
    .eq('id', id).eq('organisasi_id', ctx.organisasiId).single();
  if (!bom) notFound();

  const [{ data: items }, { data: materials }, { data: satuans }] = await Promise.all([
    supabase.from('item_bom')
      .select('id, jumlah, catatan, material:material_id(kode,nama), satuan:satuan_id(kode)')
      .eq('bom_id', id)
      .order('created_at'),
    supabase.from('material').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama'),
    supabase.from('satuan').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).order('kode'),
  ]);

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Data Induk', href: '/data-induk' },
        { label: 'BOM', href: '/data-induk/bom' },
        { label: bom.kode },
      ]} />

      <PageHeader
        title={bom.nama}
        subtitle={`${bom.kode} · ${bom.produk?.kode ?? '—'} · ${bom.produk?.nama ?? '—'}`}
        actions={
          <Link href="/data-induk/bom">
            <Button variant="secondary">Kembali</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Jumlah Material" value={items?.length ?? 0} tone="blue" />
        <KPICard label="Versi" value={bom.versi} />
        <KPICard label="Dibuat" value={tanggal(bom.created_at)} />
        <KPICard
          label="Status"
          value={bom.aktif ? 'Aktif' : 'Nonaktif'}
          tone={bom.aktif ? 'green' : 'neutral'}
        />
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <StatRow label="Kode" value={bom.kode} />
            <StatRow label="Versi" value={bom.versi} />
            <StatRow label="Produk" value={`${bom.produk?.kode ?? '—'} · ${bom.produk?.nama ?? '—'}`} />
            <StatRow label="Status" value={bom.aktif ? 'Aktif' : 'Nonaktif'} />
          </div>
          {bom.catatan && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)] mb-1.5">Catatan</div>
              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{bom.catatan}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Material</h2>
            <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
              Kebutuhan material per satu unit produk.
            </p>
          </div>
        </div>

        {bolehKelola && (
          <ItemBomManager bomId={bom.id} materials={(materials ?? []) as any} satuans={(satuans ?? []) as any} />
        )}

        {(!items || items.length === 0) ? (
          <Card>
            <EmptyState
              title="Belum ada material"
              description="Tambahkan material penyusun produk ini."
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Material</TH>
              <TH align="right">Jumlah</TH>
              <TH>Satuan</TH>
              <TH>Catatan</TH>
              {bolehKelola && <TH align="right">Aksi</TH>}
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
                  <TD className="text-[color:var(--text-2)]">{it.satuan?.kode ?? '—'}</TD>
                  <TD className="text-[color:var(--text-2)]">{it.catatan ?? '—'}</TD>
                  {bolehKelola && (
                    <TD align="right">
                      <form action={async () => {
                        'use server';
                        const { hapusItemBomAction } = await import('@/features/bom/actions');
                        await hapusItemBomAction(it.id, bom.id);
                      }}>
                        <Button type="submit" variant="ghost" size="sm" className="text-red">Hapus</Button>
                      </form>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </section>
    </div>
  );
}