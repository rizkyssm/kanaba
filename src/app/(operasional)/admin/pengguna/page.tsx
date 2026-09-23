import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Users } from 'lucide-react';

export default async function PenggunaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'pengguna.kelola')) redirect('/beranda');

  const supabase = await createClient();
  const { data: anggota } = await supabase
    .from('anggota_organisasi')
    .select('id, status, profil:profil_id (id, nama_lengkap, email)')
    .eq('organisasi_id', ctx.organisasiId);

  return (
    <div className="space-y-6">
      <PageHeader title="Pengguna" subtitle={`${anggota?.length ?? 0} anggota organisasi.`} />

      {(!anggota || anggota.length === 0) ? (
        <Card>
          <EmptyState icon={<Users size={20} />} title="Belum ada pengguna" />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Nama</TH>
            <TH>Email</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {(anggota ?? []).map((a: any) => (
              <TR key={a.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <Avatar nama={a.profil?.nama_lengkap ?? '?'} size={28} />
                    <span className="font-medium">{a.profil?.nama_lengkap}</span>
                  </div>
                </TD>
                <TD className="text-[color:var(--text-2)]">{a.profil?.email}</TD>
                <TD>
                  {a.status === 'aktif'
                    ? <Badge tone="green">Aktif</Badge>
                    : <Badge tone="gray">{a.status}</Badge>}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}