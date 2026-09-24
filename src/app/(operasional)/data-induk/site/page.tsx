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
import { MapPin, Plus } from 'lucide-react';

export default async function SitePage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('site')
    .select('id, kode, nama, alamat, aktif, created_at')
    .eq('organisasi_id', ctx.organisasiId)
    .order('created_at', { ascending: false });

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Site' }]} />
      <PageHeader
        title="Site"
        subtitle="Daftar lokasi operasional organisasi."
        actions={
          bolehKelola && (
            <Link href="/data-induk/site/baru">
              <Button variant="primary"><Plus size={14} /> Site Baru</Button>
            </Link>
          )
        }
      />

      {(!data || data.length === 0) ? (
        <Card>
          <EmptyState
            icon={<MapPin size={20} />}
            title="Belum ada site"
            description="Tambahkan lokasi operasional untuk memulai kegiatan."
            action={bolehKelola ? (
              <Link href="/data-induk/site/baru">
                <Button variant="primary"><Plus size={14} /> Site Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Alamat</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {(data ?? []).map((s: any) => (
              <TR key={s.id}>
                <TD className="font-mono text-[12px]">{s.kode}</TD>
                <TD className="font-medium">{s.nama}</TD>
                <TD className="text-[color:var(--text-2)]">{s.alamat ?? '—'}</TD>
                <TD>
                  {s.aktif
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