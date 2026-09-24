import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Package, Plus } from 'lucide-react';

export default async function MaterialPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('material')
    .select('id, kode, nama, deskripsi, aktif, kategori:kategori_id(kode,nama), satuan:satuan_id(kode)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('kode');

  const rows = data ?? [];
  const total = rows.length;
  const aktif = rows.filter((m: any) => m.aktif).length;
  const nonaktif = total - aktif;
  const kategoriUnik = new Set(rows.map((m: any) => m.kategori?.kode).filter(Boolean)).size;

  const bolehKelola = punya(ctx, 'data_induk.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Data Induk', href: '/data-induk' }, { label: 'Material' }]} />
      <PageHeader
        title="Material"
        subtitle="Bahan baku, komponen, dan material habis pakai."
        actions={bolehKelola && (
          <Link href="/data-induk/material/baru">
            <Button variant="primary"><Plus size={14} /> Material Baru</Button>
          </Link>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Material" value={total} />
        <KPICard label="Aktif"          value={aktif} tone="green" />
        <KPICard label="Nonaktif"       value={nonaktif} tone={nonaktif > 0 ? 'orange' : 'neutral'} />
        <KPICard label="Kategori"       value={kategoriUnik} />
      </div>

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<Package size={20} />}
            title="Belum ada material"
            description="Tambahkan material yang digunakan untuk produksi dan kegiatan."
            action={bolehKelola ? (
              <Link href="/data-induk/material/baru">
                <Button variant="primary"><Plus size={14} /> Material Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Kategori</TH>
            <TH>Satuan</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {rows.map((m: any) => (
              <TR key={m.id}>
                <TD className="font-mono text-[12px]">{m.kode}</TD>
                <TD className="font-medium">{m.nama}</TD>
                <TD className="text-[color:var(--text-2)]">
                  {m.kategori ? `${m.kategori.kode} · ${m.kategori.nama}` : '—'}
                </TD>
                <TD className="text-[color:var(--text-2)]">{m.satuan?.kode ?? '—'}</TD>
                <TD>
                  {m.aktif
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