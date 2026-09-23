import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import StatusBadge, { labelStatus } from '@/features/kegiatan/StatusBadge';
import TombolStatus from '@/features/kegiatan/TombolStatus';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Tabs } from '@/components/ui/Tabs';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardBody } from '@/components/ui/Card';
import { StatRow } from '@/components/ui/StatRow';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { tanggal } from '@/lib/utils';

type Params = Promise<{ id: string }>;
type Search = Promise<{ tab?: string }>;

const TABS = [
  { key: 'ringkasan',  label: 'Ringkasan' },
  { key: 'material',   label: 'Material' },
  { key: 'lox',        label: 'Liquid Oxygen' },
  { key: 'personel',   label: 'Personel' },
  { key: 'peralatan',  label: 'Peralatan' },
  { key: 'hse',        label: 'HSE' },
  { key: 'riwayat',    label: 'Riwayat' },
];

export default async function KegiatanDetail({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params;
  const { tab = 'ringkasan' } = await searchParams;

  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: k } = await supabase
    .from('kegiatan')
    .select('*, site:site_id(kode,nama), penanggung_jawab:penanggung_jawab_id(nama_lengkap,email)')
    .eq('id', id).eq('organisasi_id', ctx.organisasiId).single();
  if (!k) notFound();

  const bolehKelola = punya(ctx, 'kegiatan.kelola');
  const tgt = Number(k.target_bcm || 0);
  const akt = Number(k.aktual_bcm || 0);
  const pct = tgt > 0 ? Math.round((akt / tgt) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumb items={[{ label: 'Kegiatan', href: '/kegiatan' }, { label: k.nomor }]} />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[24px] font-semibold tracking-tight truncate">{k.nama}</h1>
              <StatusBadge status={k.status} />
            </div>
            <div className="text-[13px] text-[color:var(--text-2)] mt-1.5 flex items-center gap-3 flex-wrap">
              <span className="font-mono">{k.nomor}</span>
              <span className="text-[color:var(--text-3)]">·</span>
              <span>{k.site?.kode} · {k.site?.nama}</span>
              <span className="text-[color:var(--text-3)]">·</span>
              <span>{tanggal(k.tanggal)}</span>
            </div>
          </div>
          {bolehKelola && <TombolStatus kegiatanId={k.id} status={k.status} />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Target BCM"   value={tgt.toLocaleString('id-ID')} />
        <KPICard label="Aktual BCM"   value={akt.toLocaleString('id-ID')} tone="blue" sub={tgt > 0 ? `${pct}% dari target` : undefined} />
        <KPICard label="KANABA (rencana)" value={`${Number(k.rencana_kanaba).toLocaleString('id-ID')} pcs`} />
        <KPICard label="LOX (rencana)" value={`${Number(k.rencana_lox_kg).toLocaleString('id-ID')} kg`} />
      </div>

      {tgt > 0 && (
        <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] text-[color:var(--text-2)]">Progres BCM</div>
            <div className="text-[13px] tnum">{akt.toLocaleString('id-ID')} / {tgt.toLocaleString('id-ID')} · {pct}%</div>
          </div>
          <ProgressBar value={akt} max={tgt} tone={pct >= 100 ? 'green' : pct >= 60 ? 'blue' : 'orange'} />
        </div>
      )}

      <Tabs
        variant="underline"
        active={tab}
        items={TABS.map((t) => ({ ...t, href: `/kegiatan/${k.id}?tab=${t.key}` }))}
      />

      <section>
        {tab === 'ringkasan' && <TabRingkasan k={k} />}
        {tab === 'material' && <TabMaterial k={k} />}
        {tab === 'lox' && <TabLox k={k} />}
        {tab === 'personel' && <TabPersonel k={k} bolehKelola={bolehKelola} />}
        {tab === 'peralatan' && <TabPeralatan k={k} bolehKelola={bolehKelola} />}
        {tab === 'hse' && <TabHse k={k} />}
        {tab === 'riwayat' && <TabRiwayat k={k} />}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Selisih({ v }: { v: number }) {
  const tone = v === 0 ? 'text-[color:var(--text-2)]' : v > 0 ? 'text-orange' : 'text-red';
  return <span className={`tnum ${tone}`}>{v > 0 ? '+' : ''}{v.toLocaleString('id-ID')}</span>;
}

async function TabRingkasan({ k }: { k: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <div className="px-5 py-4 border-b">
          <div className="text-[15px] font-semibold">Perbandingan Rencana vs Aktual</div>
        </div>
        <TableWrap className="border-0 rounded-none">
          <THead>
            <TH>Parameter</TH>
            <TH align="right">Rencana</TH>
            <TH align="right">Aktual</TH>
            <TH align="right">Selisih</TH>
          </THead>
          <TBody>
            <TR>
              <TD>BCM</TD>
              <TD align="right">{Number(k.target_bcm).toLocaleString('id-ID')}</TD>
              <TD align="right">{Number(k.aktual_bcm).toLocaleString('id-ID')}</TD>
              <TD align="right"><Selisih v={Number(k.aktual_bcm) - Number(k.target_bcm)} /></TD>
            </TR>
            <TR>
              <TD>KANABA</TD>
              <TD align="right">{k.rencana_kanaba.toLocaleString('id-ID')} pcs</TD>
              <TD align="right">{k.aktual_kanaba.toLocaleString('id-ID')} pcs</TD>
              <TD align="right"><Selisih v={k.aktual_kanaba - k.rencana_kanaba} /></TD>
            </TR>
            <TR>
              <TD>Liquid Oxygen</TD>
              <TD align="right">{Number(k.rencana_lox_kg).toLocaleString('id-ID')} kg</TD>
              <TD align="right">{Number(k.aktual_lox_kg).toLocaleString('id-ID')} kg</TD>
              <TD align="right"><Selisih v={Number(k.aktual_lox_kg) - Number(k.rencana_lox_kg)} /></TD>
            </TR>
          </TBody>
        </TableWrap>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b">
          <div className="text-[15px] font-semibold">Informasi</div>
        </div>
        <CardBody className="divide-y divide-[color:var(--border)]">
          <div>
            <StatRow label="Site" value={k.site ? `${k.site.kode} · ${k.site.nama}` : '—'} />
            <StatRow label="Lokasi" value={k.lokasi ?? '—'} />
            <StatRow label="Tanggal" value={tanggal(k.tanggal)} />
            <StatRow label="Penanggung Jawab" value={k.penanggung_jawab?.nama_lengkap ?? '—'} />
          </div>
          {k.catatan && (
            <div className="pt-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)] mb-1.5">Catatan</div>
              <div className="text-[13px] whitespace-pre-wrap leading-relaxed">{k.catatan}</div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

async function TabMaterial({ k }: { k: any }) {
  const supabase = await createClient();
  const [{ data }, { data: kembali }] = await Promise.all([
    supabase.from('pengeluaran_material')
      .select('id, nomor, tanggal, status, item:pengeluaran_material_item(jumlah, material:material_id(kode,nama))')
      .eq('kegiatan_id', k.id).order('tanggal', { ascending: false }),
    supabase.from('pengembalian_material')
      .select('id, nomor, tanggal, item:pengembalian_material_item(jumlah, material:material_id(kode,nama))')
      .eq('kegiatan_id', k.id),
  ]);

  const flatOut = (data ?? []).flatMap((p: any) =>
    (p.item ?? []).map((i: any) => ({ ...i, nomor: p.nomor, tanggal: p.tanggal }))
  );
  const flatIn = (kembali ?? []).flatMap((p: any) =>
    (p.item ?? []).map((i: any) => ({ ...i, nomor: p.nomor, tanggal: p.tanggal }))
  );

  return (
    <div className="space-y-5">
      <Section title="Pengeluaran Material" subtitle={`${flatOut.length} baris`}>
        {flatOut.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
            <EmptyState title="Belum ada pengeluaran" description="Pengeluaran material dari gudang ke site akan tampil di sini." />
          </div>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead><TH>Nomor</TH><TH>Tanggal</TH><TH>Material</TH><TH align="right">Jumlah</TH></THead>
            <TBody>
              {flatOut.map((r: any, idx) => (
                <TR key={idx}>
                  <TD className="font-mono text-[12px]">{r.nomor}</TD>
                  <TD className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</TD>
                  <TD>{r.material?.kode} · {r.material?.nama}</TD>
                  <TD align="right">{Number(r.jumlah).toLocaleString('id-ID')}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>

      <Section title="Pengembalian Material" subtitle={`${flatIn.length} baris`}>
        {flatIn.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
            <EmptyState title="Belum ada pengembalian" />
          </div>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead><TH>Nomor</TH><TH>Tanggal</TH><TH>Material</TH><TH align="right">Jumlah</TH></THead>
            <TBody>
              {flatIn.map((r: any, idx) => (
                <TR key={idx}>
                  <TD className="font-mono text-[12px]">{r.nomor}</TD>
                  <TD className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</TD>
                  <TD>{r.material?.kode} · {r.material?.nama}</TD>
                  <TD align="right">{Number(r.jumlah).toLocaleString('id-ID')}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}

async function TabLox({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('transaksi_lox')
    .select('id, jenis, arah, jumlah_kg, catatan, created_at')
    .eq('kegiatan_id', k.id).order('created_at', { ascending: false });

  const keluar  = (data ?? []).filter((r: any) => r.jenis === 'pengeluaran_site').reduce((s, r: any) => s + Number(r.jumlah_kg), 0);
  const kembali = (data ?? []).filter((r: any) => r.jenis === 'pengembalian_site').reduce((s, r: any) => s + Number(r.jumlah_kg), 0);
  const pakai   = keluar - kembali;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KPICard label="LOX Keluar"  value={`${keluar.toLocaleString('id-ID')} kg`} />
        <KPICard label="LOX Kembali" value={`${kembali.toLocaleString('id-ID')} kg`} tone="green" />
        <KPICard label="LOX Terpakai" value={`${pakai.toLocaleString('id-ID')} kg`} tone="orange" />
      </div>
      {(!data || data.length === 0) ? (
        <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
          <EmptyState title="Belum ada transaksi LOX" />
        </div>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead><TH>Waktu</TH><TH>Jenis</TH><TH>Arah</TH><TH align="right">Jumlah (kg)</TH><TH>Catatan</TH></THead>
          <TBody>
            {(data ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="text-[color:var(--text-2)] text-[12px]">{new Date(r.created_at).toLocaleString('id-ID')}</TD>
                <TD>{r.jenis}</TD>
                <TD>{r.arah}</TD>
                <TD align="right">{Number(r.jumlah_kg).toLocaleString('id-ID')}</TD>
                <TD className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}

async function TabPersonel({ k, bolehKelola }: { k: any; bolehKelola: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('personel_kegiatan')
    .select('id, peran, personel:personel_id(id, nama, tipe, keahlian)')
    .eq('kegiatan_id', k.id);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
        <EmptyState title="Belum ada personel" description="Tugaskan personel dari Data Induk → Personel." />
      </div>
    );
  }
  return (
    <TableWrap className="bg-[color:var(--bg-elev)]">
      <THead><TH>Nama</TH><TH>Tipe</TH><TH>Keahlian</TH><TH>Peran</TH></THead>
      <TBody>
        {(data ?? []).map((r: any) => (
          <TR key={r.id}>
            <TD className="font-medium">{r.personel?.nama}</TD>
            <TD className="text-[color:var(--text-2)]">{r.personel?.tipe}</TD>
            <TD className="text-[color:var(--text-2)]">{r.personel?.keahlian ?? '—'}</TD>
            <TD>{r.peran ?? '—'}</TD>
          </TR>
        ))}
      </TBody>
    </TableWrap>
  );
}

async function TabPeralatan({ k }: { k: any; bolehKelola: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pemakaian_aset')
    .select('id, catatan, aset:aset_id(kode, nama, kategori, status)')
    .eq('kegiatan_id', k.id);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
        <EmptyState title="Belum ada aset dipakai" />
      </div>
    );
  }
  return (
    <TableWrap className="bg-[color:var(--bg-elev)]">
      <THead><TH>Kode</TH><TH>Nama</TH><TH>Kategori</TH><TH>Status</TH><TH>Catatan</TH></THead>
      <TBody>
        {(data ?? []).map((r: any) => (
          <TR key={r.id}>
            <TD className="font-mono text-[12px]">{r.aset?.kode}</TD>
            <TD className="font-medium">{r.aset?.nama}</TD>
            <TD className="text-[color:var(--text-2)]">{r.aset?.kategori ?? '—'}</TD>
            <TD>{r.aset?.status}</TD>
            <TD className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</TD>
          </TR>
        ))}
      </TBody>
    </TableWrap>
  );
}

async function TabHse({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('catatan_hse')
    .select('id, jenis, judul, tingkat, status, created_at')
    .eq('kegiatan_id', k.id).order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
        <EmptyState title="Belum ada catatan HSE" />
      </div>
    );
  }
  return (
    <TableWrap className="bg-[color:var(--bg-elev)]">
      <THead><TH>Waktu</TH><TH>Jenis</TH><TH>Judul</TH><TH>Tingkat</TH><TH>Status</TH></THead>
      <TBody>
        {(data ?? []).map((r: any) => (
          <TR key={r.id}>
            <TD className="text-[12px] text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</TD>
            <TD>{r.jenis}</TD>
            <TD className="font-medium">{r.judul}</TD>
            <TD>{r.tingkat}</TD>
            <TD>{r.status}</TD>
          </TR>
        ))}
      </TBody>
    </TableWrap>
  );
}

async function TabRiwayat({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('riwayat_status_kegiatan')
    .select('id, status_lama, status_baru, catatan, created_at, oleh:oleh_id(nama_lengkap)')
    .eq('kegiatan_id', k.id).order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
        <EmptyState title="Belum ada riwayat" />
      </div>
    );
  }
  return (
    <TableWrap className="bg-[color:var(--bg-elev)]">
      <THead><TH>Waktu</TH><TH>Dari</TH><TH>Ke</TH><TH>Oleh</TH><TH>Catatan</TH></THead>
      <TBody>
        {(data ?? []).map((r: any) => (
          <TR key={r.id}>
            <TD className="text-[12px] text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</TD>
            <TD>{r.status_lama ? labelStatus(r.status_lama) : '—'}</TD>
            <TD>{labelStatus(r.status_baru)}</TD>
            <TD>{r.oleh?.nama_lengkap ?? '—'}</TD>
            <TD className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</TD>
          </TR>
        ))}
      </TBody>
    </TableWrap>
  );
}

// Need to import Section at top
import { Section } from '@/components/ui/Section';