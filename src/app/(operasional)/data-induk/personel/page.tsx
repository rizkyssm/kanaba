import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Users, Plus } from 'lucide-react';

const TIPE_LABEL: Record<string, string> = {
  karyawan: 'Karyawan',
  tenaga_lepas: 'Tenaga Lepas',
  vendor: 'Vendor',
};

const TIPE_TONE: Record<string, 'blue' | 'purple' | 'orange'> = {
  karyawan: 'blue',
  tenaga_lepas: 'orange',
  vendor: 'purple',
};

export default async function PersonelPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const bolehGaji = punya(ctx, 'gaji.lihat');
  const bolehKelola = punya(ctx, 'data_induk.kelola');

  const supabase = await createClient();
  const { data: list } = await supabase
    .from('personel')
    .select(`id, nama, tipe, telepon, keahlian, aktif,
      kompensasi:personel_kompensasi(tarif, jenis_tarif)`)
    .eq('organisasi_id', ctx.organisasiId)
    .order('nama');

  const total = list?.length ?? 0;
  const karyawan = (list ?? []).filter((p: any) => p.tipe === 'karyawan').length;
  const lepas = (list ?? []).filter((p: any) => p.tipe === 'tenaga_lepas').length;
  const vendor = (list ?? []).filter((p: any) => p.tipe === 'vendor').length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Personel' }]} />
      <PageHeader
        title="Personel"
        subtitle="Karyawan, tenaga lepas, dan personel vendor."
        actions={
          bolehKelola && (
            <Link href="/data-induk/personel/baru">
              <Button variant="primary"><Plus size={14} /> Personel Baru</Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Personel" value={total} />
        <KPICard label="Karyawan"       value={karyawan} tone="blue" />
        <KPICard label="Tenaga Lepas"   value={lepas} tone="orange" />
        <KPICard label="Vendor"         value={vendor} tone="purple" />
      </div>

      <Section title="Daftar Personel" subtitle={`${total} orang`}>
        {(!list || list.length === 0) ? (
          <Card>
            <EmptyState
              icon={<Users size={20} />}
              title="Belum ada personel"
              description="Tambahkan karyawan, tenaga lepas, atau vendor untuk ditugaskan ke kegiatan."
              action={bolehKelola ? (
                <Link href="/data-induk/personel/baru">
                  <Button variant="primary"><Plus size={14} /> Personel Baru</Button>
                </Link>
              ) : undefined}
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Nama</TH>
              <TH>Tipe</TH>
              <TH>Keahlian</TH>
              <TH>Telepon</TH>
              <TH>Status</TH>
              {bolehGaji && <TH align="right">Tarif</TH>}
            </THead>
            <TBody>
              {(list ?? []).map((r: any) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.nama}</TD>
                  <TD><Badge tone={TIPE_TONE[r.tipe] ?? 'gray'}>{TIPE_LABEL[r.tipe] ?? r.tipe}</Badge></TD>
                  <TD className="text-[color:var(--text-2)]">{r.keahlian ?? '—'}</TD>
                  <TD className="text-[color:var(--text-2)]">{r.telepon ?? '—'}</TD>
                  <TD>
                    {r.aktif
                      ? <Badge tone="green">Aktif</Badge>
                      : <Badge tone="gray">Nonaktif</Badge>}
                  </TD>
                  {bolehGaji && (
                    <TD align="right">
                      {r.kompensasi?.tarif != null
                        ? `Rp ${Number(r.kompensasi.tarif).toLocaleString('id-ID')} / ${r.kompensasi.jenis_tarif ?? ''}`
                        : '—'}
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}