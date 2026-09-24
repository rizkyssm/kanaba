import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { StatRow } from '@/components/ui/StatRow';
import { Badge } from '@/components/ui/Badge';

type Params = Promise<{ id: string }>;

export default async function LogDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'log.lihat')) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from('log_aktivitas')
    .select('*, profil:profil_id(nama_lengkap, email)')
    .eq('id', id).eq('organisasi_id', ctx.organisasiId).single();
  if (!row) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Log Aktivitas', href: '/admin/log' },
        { label: `#${row.id}` },
      ]} />
      <PageHeader
        title={`Log #${row.id}`}
        subtitle={new Date(row.created_at).toLocaleString('id-ID')}
      />

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <StatRow label="Pengguna" value={row.profil?.nama_lengkap ?? '—'} />
            <StatRow label="Email" value={row.profil?.email ?? '—'} />
            <StatRow label="Aksi" value={<Badge tone="blue">{row.aksi}</Badge>} />
            <StatRow label="Entitas" value={row.entitas ?? '—'} />
            <StatRow label="Entitas ID" value={
              <span className="font-mono text-[12px]">{row.entitas_id ?? '—'}</span>
            } />
            <StatRow label="IP" value={row.ip ?? '—'} />
          </div>
        </CardBody>
      </Card>

      {row.nilai_sebelum && (
        <Card>
          <div className="px-5 py-4 border-b">
            <div className="text-[13px] font-medium">Nilai Sebelum</div>
          </div>
          <CardBody>
            <pre className="text-[12px] bg-[color:var(--bg-subtle)] p-3 rounded overflow-auto">
              {JSON.stringify(row.nilai_sebelum, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}

      {row.nilai_sesudah && (
        <Card>
          <div className="px-5 py-4 border-b">
            <div className="text-[13px] font-medium">Nilai Sesudah</div>
          </div>
          <CardBody>
            <pre className="text-[12px] bg-[color:var(--bg-subtle)] p-3 rounded overflow-auto">
              {JSON.stringify(row.nilai_sesudah, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}
    </div>
  );
}