'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import StatusBadge from './StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Plus, ListChecks } from 'lucide-react';
import { tanggal } from '@/lib/utils';

type Item = {
  id: string; nomor: string; nama: string; tanggal: string; status: string;
  target_bcm: number; aktual_bcm: number;
  site: { kode: string; nama: string } | null;
};

const TABS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all',           label: 'Semua',              match: () => true },
  { key: 'direncanakan',  label: 'Direncanakan',       match: (s) => ['draf','direncanakan','menunggu_persetujuan','disetujui'].includes(s) },
  { key: 'persiapan',     label: 'Persiapan',          match: (s) => ['persiapan','dikirim_ke_site'].includes(s) },
  { key: 'di_site',       label: 'Di Site',            match: (s) => ['di_site','sedang_berjalan'].includes(s) },
  { key: 'selesai',       label: 'Selesai',            match: (s) => s === 'selesai' },
  { key: 'rekonsiliasi',  label: 'Rekonsiliasi',       match: (s) => s === 'rekonsiliasi' },
  { key: 'ditutup',       label: 'Ditutup',            match: (s) => ['ditutup','dibatalkan'].includes(s) },
];

export default function ListKegiatanClient({ data, bisaKelola }: { data: Item[]; bisaKelola: boolean }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    TABS.forEach((t) => (m[t.key] = data.filter((d) => t.match(d.status)).length));
    return m;
  }, [data]);

  const filtered = useMemo(() => {
    const aktif = TABS.find((t) => t.key === tab)!;
    return data
      .filter((d) => aktif.match(d.status))
      .filter((d) => {
        if (!q.trim()) return true;
        const s = `${d.nomor} ${d.nama} ${d.site?.nama ?? ''}`.toLowerCase();
        return s.includes(q.toLowerCase());
      });
  }, [data, tab, q]);

  return (
    <div className="space-y-4">
      <Tabs
        variant="pill"
        active={tab}
        onSelect={setTab}
        items={TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] ?? 0 }))}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput value={q} onChange={setQ} placeholder="Cari nomor / nama kegiatan…" className="w-full md:w-80" />
        <div className="flex-1" />
        {bisaKelola && (
          <Link href="/kegiatan/baru">
            <Button variant="primary"><Plus size={14} /> Kegiatan Baru</Button>
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)]">
          <EmptyState
            icon={<ListChecks size={20} />}
            title="Belum ada kegiatan"
            description={q ? 'Coba ubah kata kunci pencarian.' : 'Mulai dengan membuat kegiatan baru.'}
          />
        </div>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Nomor</TH>
            <TH>Nama</TH>
            <TH>Site</TH>
            <TH>Tanggal</TH>
            <TH>Status</TH>
            <TH align="right">BCM (Target / Aktual)</TH>
          </THead>
          <TBody>
            {filtered.map((k) => {
              const tgt = Number(k.target_bcm || 0);
              const akt = Number(k.aktual_bcm || 0);
              const pct = tgt > 0 ? Math.round((akt / tgt) * 100) : 0;
              return (
                <TR key={k.id}>
                  <TD>
                    <Link href={`/kegiatan/${k.id}`} className="font-mono text-[12px] text-blue hover:underline">
                      {k.nomor}
                    </Link>
                  </TD>
                  <TD className="font-medium">{k.nama}</TD>
                  <TD className="text-[color:var(--text-2)]">
                    {k.site ? <>{k.site.kode} · {k.site.nama}</> : '—'}
                  </TD>
                  <TD className="text-[color:var(--text-2)]">{tanggal(k.tanggal)}</TD>
                  <TD><StatusBadge status={k.status} /></TD>
                  <TD align="right">
                    <span className="tnum">{akt.toLocaleString('id-ID')}</span>
                    <span className="text-[color:var(--text-3)]"> / {tgt.toLocaleString('id-ID')}</span>
                    {tgt > 0 && <span className="text-[color:var(--text-3)] text-[11px] ml-1.5">({pct}%)</span>}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}