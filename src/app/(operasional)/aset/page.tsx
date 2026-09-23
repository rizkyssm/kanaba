import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormAset from '@/features/aset/FormAset';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Boxes } from 'lucide-react';

const STATUS_TONE: Record<string, 'green' | 'blue' | 'orange' | 'red' | 'gray'> = {
  aktif: 'green',
  digunakan: 'blue',
  tersedia: 'green',
  dalam_perawatan: 'orange',
  rusak: 'red',
  tidak_aktif: 'gray',
  dihapus: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  aktif: 'Aktif',
  digunakan: 'Digunakan',
  tersedia: 'Tersedia',
  dalam_perawatan: 'Dalam Perawatan',
  rusak: 'Rusak',
  tidak_aktif: 'Tidak Aktif',
  dihapus: 'Dihapus',
};

export default async function AsetPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: list }, { data: sites }] = await Promise.all([
    supabase.from('aset')
      .select('id, kode, nama, kategori, status, site:site_id(kode,nama)')
      .eq('organisasi_id', ctx.organisasiId)
      .order('kode'),
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  const total = list?.length ?? 0;
  const aktif = (list ?? []).filter((a: any) => a.status === 'aktif' || a.status === 'tersedia' || a.status === 'digunakan').length;
  const perawatan = (list ?? []).filter((a: any) => a.status === 'dalam_perawatan').length;
  const rusak = (list ?? []).filter((a: any) => a.status === 'rusak').length;

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aset"
        subtitle="Ranger Tank, kendaraan, peralatan, dan mesin."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Aset"       value={total} />
        <KPICard label="Siap Pakai"       value={aktif} tone="green" />
        <KPICard label="Dalam Perawatan"  value={perawatan} tone="orange" />
        <KPICard label="Rusak"            value={rusak} tone={rusak > 0 ? 'red' : 'neutral'} />
      </div>

      {bolehKelola && (
        <Section title="Tambah Aset" subtitle="Isi data dasar aset. Nilai keuangan diisi oleh keuangan.">
          <Card>
            <CardBody>
              <FormAset sites={(sites ?? []) as any} />
            </CardBody>
          </Card>
        </Section>
      )}

      <Section title="Daftar Aset" subtitle={`${list?.length ?? 0} aset`}>
        {(!list || list.length === 0) ? (
          <Card>
            <EmptyState
              icon={<Boxes size={20} />}
              title="Belum ada aset"
              description="Tambahkan Ranger Tank, kendaraan, atau peralatan operasional."
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Kode</TH>
              <TH>Nama</TH>
              <TH>Kategori</TH>
              <TH>Site</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {(list ?? []).map((r: any) => (
                <TR key={r.id}>
                  <TD className="font-mono text-[12px]">{r.kode}</TD>
                  <TD className="font-medium">{r.nama}</TD>
                  <TD className="text-[color:var(--text-2)]">{r.kategori ?? '—'}</TD>
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
      </Section>
    </div>
  );
}