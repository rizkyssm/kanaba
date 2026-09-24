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
import { Building2, Plus } from 'lucide-react';

export default async function VendorPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase.from('vendor')
    .select('id, kode, nama, kategori, telepon, email, term_hari, aktif')
    .eq('organisasi_id', ctx.organisasiId).order('nama');

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Vendor' }]} />
      <PageHeader title="Vendor" subtitle="Pemasok material, jasa, rental, dan aset."
        actions={bolehKelola && (
          <Link href="/data-induk/vendor/baru">
            <Button variant="primary"><Plus size={14} /> Vendor Baru</Button>
          </Link>
        )} />

      {(!data || data.length === 0) ? (
        <Card><EmptyState icon={<Building2 size={20} />} title="Belum ada vendor"
          description="Tambahkan vendor untuk memulai pembelian."
          action={bolehKelola ? (
            <Link href="/data-induk/vendor/baru">
              <Button variant="primary"><Plus size={14} /> Vendor Baru</Button>
            </Link>
          ) : undefined} /></Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead><TH>Kode</TH><TH>Nama</TH><TH>Kategori</TH><TH>Telepon</TH><TH>Email</TH><TH align="right">Term</TH><TH>Status</TH></THead>
          <TBody>
            {data.map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">{r.kode}</TD>
                <TD className="font-medium">{r.nama}</TD>
                <TD><Badge tone="blue">{r.kategori}</Badge></TD>
                <TD className="text-[color:var(--text-2)]">{r.telepon ?? '—'}</TD>
                <TD className="text-[color:var(--text-2)]">{r.email ?? '—'}</TD>
                <TD align="right">{r.term_hari} hari</TD>
                <TD>{r.aktif ? <Badge tone="green">Aktif</Badge> : <Badge tone="gray">Nonaktif</Badge>}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}