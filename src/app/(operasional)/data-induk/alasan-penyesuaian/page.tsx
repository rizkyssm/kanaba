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
import { FileWarning, Plus } from 'lucide-react';

export default async function AlasanPenyesuaianPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('alasan_penyesuaian')
    .select('id, kode, nama, aktif')
    .eq('organisasi_id', ctx.organisasiId)
    .order('kode');

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Alasan Penyesuaian' }]} />
      <PageHeader
        title="Alasan Penyesuaian"
        subtitle="Alasan yang dapat dipilih saat menemukan selisih pada pemeriksaan fisik."
        actions={bolehKelola && (
          <Link href="/data-induk/alasan-penyesuaian/baru">
            <Button variant="primary"><Plus size={14} /> Alasan Baru</Button>
          </Link>
        )}
      />

      {(!data || data.length === 0) ? (
        <Card>
          <EmptyState
            icon={<FileWarning size={20} />}
            title="Belum ada alasan"
            description="Tambahkan alasan penyesuaian seperti rusak, hilang, atau salah hitung."
            action={bolehKelola ? (
              <Link href="/data-induk/alasan-penyesuaian/baru">
                <Button variant="primary"><Plus size={14} /> Alasan Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {data.map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">{r.kode}</TD>
                <TD className="font-medium">{r.nama}</TD>
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