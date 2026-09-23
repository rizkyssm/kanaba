import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Truck } from 'lucide-react';
import { tanggal } from '@/lib/utils';

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'green' | 'orange' | 'red'> = {
  draf: 'gray',
  dikirim: 'blue',
  dikembalikan_sebagian: 'orange',
  dikembalikan_penuh: 'green',
  dibatalkan: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  draf: 'Draf',
  dikirim: 'Dikirim',
  dikembalikan_sebagian: 'Kembali Sebagian',
  dikembalikan_penuh: 'Kembali Penuh',
  dibatalkan: 'Dibatalkan',
};

export default async function PengeluaranListPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('pengeluaran_material')
    .select('id, nomor, tanggal, status, kegiatan:kegiatan_id(id,nomor,nama), site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Persediaan', href: '/persediaan' }, { label: 'Pengeluaran' }]} />
      <PageHeader
        title="Riwayat Pengeluaran Material"
        subtitle="Semua dokumen pengeluaran material dari gudang ke kegiatan."
        actions={
          punya(ctx, 'persediaan.kelola') ? (
            <Link href="/persediaan/pengeluaran/baru">
              <Button variant="primary"><Plus size={14} /> Pengeluaran Baru</Button>
            </Link>
          ) : undefined
        }
      />

      {(!data || data.length === 0) ? (
        <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
          <EmptyState
            icon={<Truck size={20} />}
            title="Belum ada pengeluaran"
            description="Catat pengeluaran material untuk memulai."
            action={punya(ctx, 'persediaan.kelola') ? (
              <Link href="/persediaan/pengeluaran/baru"><Button variant="primary">Pengeluaran Baru</Button></Link>
            ) : undefined}
          />
        </div>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Nomor</TH>
            <TH>Tanggal</TH>
            <TH>Kegiatan</TH>
            <TH>Site</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {(data ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">{r.nomor}</TD>
                <TD className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</TD>
                <TD>
                  <Link href={`/kegiatan/${r.kegiatan?.id}?tab=material`} className="text-blue hover:underline font-medium">
                    {r.kegiatan?.nomor}
                  </Link>
                  <span className="text-[color:var(--text-2)] ml-1.5">{r.kegiatan?.nama}</span>
                </TD>
                <TD className="text-[color:var(--text-2)]">{r.site?.kode ?? '—'}</TD>
                <TD>
                  <Badge tone={STATUS_TONE[r.status] ?? 'gray'}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}