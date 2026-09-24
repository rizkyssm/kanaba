import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ClipboardList, Plus } from 'lucide-react';
import { tanggal } from '@/lib/utils';

export default async function BomPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: list } = await supabase
    .from('bom')
    .select('id, kode, nama, versi, aktif, created_at, produk:produk_id(kode,nama), item:item_bom(id)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('created_at', { ascending: false });

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'BOM' }]} />
      <PageHeader
        title="BOM"
        subtitle="Bill of Materials — resep material untuk setiap produk."
        actions={bolehKelola && (
          <Link href="/data-induk/bom/baru">
            <Button variant="primary"><Plus size={14} /> BOM Baru</Button>
          </Link>
        )}
      />

      {(!list || list.length === 0) ? (
        <Card>
          <EmptyState
            icon={<ClipboardList size={20} />}
            title="Belum ada BOM"
            description="BOM mendefinisikan material yang dibutuhkan untuk membuat satu produk."
            action={bolehKelola ? (
              <Link href="/data-induk/bom/baru">
                <Button variant="primary"><Plus size={14} /> BOM Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Produk</TH>
            <TH>Versi</TH>
            <TH align="right">Jml Material</TH>
            <TH>Dibuat</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {(list ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">
                  <Link href={`/data-induk/bom/${r.id}`} className="text-blue hover:underline">
                    {r.kode}
                  </Link>
                </TD>
                <TD className="font-medium">{r.nama}</TD>
                <TD className="text-[color:var(--text-2)]">
                  {r.produk ? `${r.produk.kode} · ${r.produk.nama}` : '—'}
                </TD>
                <TD className="text-[color:var(--text-2)]">{r.versi}</TD>
                <TD align="right">{r.item?.length ?? 0}</TD>
                <TD className="text-[color:var(--text-2)]">{tanggal(r.created_at)}</TD>
                <TD>
                  {r.aktif
                    ? <Badge tone="green">Aktif</Badge>
                    : <Badge tone="gray">Nonaktif</Badge>}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}