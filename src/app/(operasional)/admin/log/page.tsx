import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import FilterLog from '@/features/admin/FilterLog';
import { ScrollText } from 'lucide-react';

type Search = Promise<{ aksi?: string; dari?: string; sampai?: string; pengguna?: string }>;

export default async function LogPage({ searchParams }: { searchParams: Search }) {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'log.lihat')) redirect('/beranda');

  const sp = await searchParams;
  const dari = sp.dari ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const sampai = sp.sampai ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  let q = supabase
    .from('log_aktivitas')
    .select('id, aksi, entitas, entitas_id, created_at, profil:profil_id(id,nama_lengkap,email)')
    .eq('organisasi_id', ctx.organisasiId)
    .gte('created_at', dari)
    .lte('created_at', sampai + 'T23:59:59')
    .order('created_at', { ascending: false })
    .limit(300);

  if (sp.aksi) q = q.ilike('aksi', `%${sp.aksi}%`);
  if (sp.pengguna) q = q.eq('profil_id', sp.pengguna);

  const { data } = await q;

  // Ambil daftar pengguna untuk filter dropdown
  const { data: anggota } = await supabase
    .from('anggota_organisasi')
    .select('profil:profil_id(id, nama_lengkap, email)')
    .eq('organisasi_id', ctx.organisasiId);

  const penggunas = (anggota ?? [])
    .map((a: any) => a.profil)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.nama_lengkap ?? '').localeCompare(b.nama_lengkap ?? ''));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Aktivitas"
        subtitle={`${data?.length ?? 0} kejadian · periode ${dari} s/d ${sampai}`}
      />

      <FilterLog
        penggunas={penggunas}
        nilaiAwal={{ aksi: sp.aksi ?? '', dari, sampai, pengguna: sp.pengguna ?? '' }}
      />

      {(!data || data.length === 0) ? (
        <Card>
          <EmptyState
            icon={<ScrollText size={20} />}
            title="Belum ada aktivitas"
            description="Log akan terisi saat pengguna mulai menggunakan sistem."
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Waktu</TH>
            <TH>Pengguna</TH>
            <TH>Aksi</TH>
            <TH>Entitas</TH>
            <TH align="right">Detail</TH>
          </THead>
          <TBody>
            {(data ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="text-[12px] text-[color:var(--text-2)] whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString('id-ID')}
                </TD>
                <TD>
                  <div className="font-medium text-[13px]">{r.profil?.nama_lengkap ?? '—'}</div>
                  <div className="text-[11px] text-[color:var(--text-3)]">{r.profil?.email}</div>
                </TD>
                <TD>
                  <Badge tone="blue">{r.aksi}</Badge>
                </TD>
                <TD className="text-[color:var(--text-2)] text-[12px]">
                  {r.entitas ?? '—'}
                  {r.entitas_id && (
                    <span className="font-mono text-[11px] ml-1.5 text-[color:var(--text-3)]">
                      {String(r.entitas_id).slice(0, 8)}
                    </span>
                  )}
                </TD>
                <TD align="right">
                  <Link
                    href={`/admin/log/${r.id}`}
                    className="text-blue hover:underline text-[12px]"
                  >
                    Buka
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}