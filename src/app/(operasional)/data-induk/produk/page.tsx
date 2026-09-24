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
import { Boxes, Plus } from 'lucide-react';

export default async function ProdukPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: list } = await supabase
    .from('produk')
    .select('id, kode, nama, deskripsi, aktif, satuan:satuan_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('kode');

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Produk' }]} />
      <PageHeader
        title="Produk"
        subtitle="Produk jadi yang dihasilkan, misalnya KANABA 4M, LOX 2M Sisa."
        actions={bolehKelola && (
          <Link href="/data-induk/produk/baru">
            <Button variant="primary"><Plus size={14} /> Produk Baru</Button>
          </Link>
        )}
      />

      {(!list || list.length === 0) ? (
        <Card>
          <EmptyState
            icon={<Boxes size={20} />}
            title="Belum ada produk"
            description="Tambahkan produk jadi untuk dipakai di BOM dan produksi."
            action={bolehKelola ? (
              <Link href="/data-induk/produk/baru">
                <Button variant="primary"><Plus size={14} /> Produk Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Satuan</TH>
            <TH>Deskripsi</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {(list ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">{r.kode}</TD>
                <TD className="font-medium">{r.nama}</TD>
                <TD className="text-[color:var(--text-2)]">{r.satuan?.kode ?? '—'}</TD>
                <TD className="text-[color:var(--text-2)]">{r.deskripsi ?? '—'}</TD>
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