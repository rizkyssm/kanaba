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
import { Tag, Plus } from 'lucide-react';

export default async function KategoriBiayaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('kategori_biaya')
    .select('id, kode, nama, jenis, klasifikasi, deskripsi, aktif')
    .eq('organisasi_id', ctx.organisasiId)
    .order('kode');

  const bolehKelola = punya(ctx, 'biaya.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Kategori Biaya' }]} />
      <PageHeader
        title="Kategori Biaya"
        subtitle="Klasifikasi jenis biaya: langsung/tidak langsung, OPEX/CAPEX."
        actions={bolehKelola && (
          <Link href="/data-induk/kategori-biaya/baru">
            <Button variant="primary"><Plus size={14} /> Kategori Baru</Button>
          </Link>
        )}
      />

      {(!data || data.length === 0) ? (
        <Card>
          <EmptyState icon={<Tag size={20} />} title="Belum ada kategori biaya"
            description="Tambahkan kategori untuk mengklasifikasikan pengeluaran."
            action={bolehKelola ? (
              <Link href="/data-induk/kategori-biaya/baru">
                <Button variant="primary"><Plus size={14} /> Kategori Baru</Button>
              </Link>
            ) : undefined} />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Jenis</TH>
            <TH>Klasifikasi</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {data.map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">{r.kode}</TD>
                <TD className="font-medium">{r.nama}</TD>
                <TD>
                  <Badge tone={r.jenis === 'langsung' ? 'blue' : 'gray'}>
                    {r.jenis === 'langsung' ? 'Langsung' : 'Tidak Langsung'}
                  </Badge>
                </TD>
                <TD>
                  <Badge tone={r.klasifikasi === 'capex' ? 'purple' : 'green'}>
                    {r.klasifikasi.toUpperCase()}
                  </Badge>
                </TD>
                <TD>
                  {r.aktif ? <Badge tone="green">Aktif</Badge> : <Badge tone="gray">Nonaktif</Badge>}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}