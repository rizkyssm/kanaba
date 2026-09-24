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
import { Wallet, Plus } from 'lucide-react';

export default async function PusatBiayaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('pusat_biaya')
    .select('id, kode, nama, deskripsi, aktif, site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('kode');

  const bolehKelola = punya(ctx, 'biaya.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Pusat Biaya' }]} />
      <PageHeader title="Pusat Biaya" subtitle="Unit akuntansi biaya per lokasi atau departemen."
        actions={bolehKelola && (
          <Link href="/data-induk/pusat-biaya/baru">
            <Button variant="primary"><Plus size={14} /> Pusat Biaya Baru</Button>
          </Link>
        )} />

      {(!data || data.length === 0) ? (
        <Card><EmptyState icon={<Wallet size={20} />} title="Belum ada pusat biaya"
          description="Tambahkan pusat biaya untuk mengelompokkan pengeluaran."
          action={bolehKelola ? (
            <Link href="/data-induk/pusat-biaya/baru">
              <Button variant="primary"><Plus size={14} /> Pusat Biaya Baru</Button>
            </Link>
          ) : undefined} /></Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead><TH>Kode</TH><TH>Nama</TH><TH>Site</TH><TH>Deskripsi</TH><TH>Status</TH></THead>
          <TBody>
            {data.map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">{r.kode}</TD>
                <TD className="font-medium">{r.nama}</TD>
                <TD className="text-[color:var(--text-2)]">{r.site?.kode ?? '—'}</TD>
                <TD className="text-[color:var(--text-2)]">{r.deskripsi ?? '—'}</TD>
                <TD>{r.aktif ? <Badge tone="green">Aktif</Badge> : <Badge tone="gray">Nonaktif</Badge>}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}