import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollText } from 'lucide-react';

export default async function LogPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'log.lihat')) redirect('/beranda');

  const supabase = await createClient();
  const { data } = await supabase
    .from('log_aktivitas')
    .select('id, aksi, entitas, entitas_id, created_at, profil:profil_id(nama_lengkap, email)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('created_at', { ascending: false })
    .limit(300);

  return (
    <div className="space-y-6">
      <PageHeader title="Log Aktivitas" subtitle={`${data?.length ?? 0} kejadian terakhir.`} />

      {(!data || data.length === 0) ? (
        <Card>
          <EmptyState icon={<ScrollText size={20} />} title="Belum ada aktivitas" />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Waktu</TH>
            <TH>Pengguna</TH>
            <TH>Aksi</TH>
            <TH>Entitas</TH>
          </THead>
          <TBody>
            {(data ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="text-[12px] text-[color:var(--text-2)]">
                  {new Date(r.created_at).toLocaleString('id-ID')}
                </TD>
                <TD>
                  <div className="font-medium">{r.profil?.nama_lengkap ?? '—'}</div>
                  <div className="text-[11px] text-[color:var(--text-3)]">{r.profil?.email}</div>
                </TD>
                <TD className="font-mono text-[12px]">{r.aksi}</TD>
                <TD className="text-[color:var(--text-2)]">
                  {r.entitas ?? '—'}
                  {r.entitas_id && (
                    <span className="font-mono text-[11px] ml-1.5 text-[color:var(--text-3)]">
                      {String(r.entitas_id).slice(0, 8)}
                    </span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}