import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ClipboardCheck, Plus } from 'lucide-react';
import { tanggal } from '@/lib/utils';

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'orange' | 'green' | 'red'> = {
  draf: 'gray',
  diajukan: 'blue',
  disetujui_supervisor: 'orange',
  disetujui: 'green',
  ditolak: 'red',
  dibatalkan: 'gray',
};
const STATUS_LABEL: Record<string, string> = {
  draf: 'Draf',
  diajukan: 'Diajukan',
  disetujui_supervisor: 'Disetujui Supervisor',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

export default async function PemeriksaanListPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: list } = await supabase
    .from('pemeriksaan_fisik')
    .select('id, nomor, tanggal, status, catatan, site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(200);

  const bolehBuat = punya(ctx, 'persediaan.buat_pemeriksaan');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Persediaan', href: '/persediaan' },
        { label: 'Pemeriksaan Fisik' },
      ]} />
      <PageHeader
        title="Pemeriksaan Fisik"
        subtitle="Pencatatan stok fisik di lapangan dengan alur persetujuan."
        actions={bolehBuat && (
          <Link href="/persediaan/pemeriksaan/baru">
            <Button variant="primary"><Plus size={14} /> Pemeriksaan Baru</Button>
          </Link>
        )}
      />

      {(!list || list.length === 0) ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck size={20} />}
            title="Belum ada pemeriksaan"
            description="Buat pemeriksaan fisik untuk memvalidasi stok di lapangan."
            action={bolehBuat ? (
              <Link href="/persediaan/pemeriksaan/baru">
                <Button variant="primary"><Plus size={14} /> Pemeriksaan Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Nomor</TH>
            <TH>Tanggal</TH>
            <TH>Site</TH>
            <TH>Status</TH>
            <TH>Catatan</TH>
          </THead>
          <TBody>
            {(list ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">
                  <Link href={`/persediaan/pemeriksaan/${r.id}`} className="text-blue hover:underline">
                    {r.nomor}
                  </Link>
                </TD>
                <TD className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</TD>
                <TD className="text-[color:var(--text-2)]">{r.site?.kode} · {r.site?.nama}</TD>
                <TD><Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{STATUS_LABEL[r.status] ?? r.status}</Badge></TD>
                <TD className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}