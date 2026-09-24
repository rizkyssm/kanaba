'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { Filter, ChevronDown, Calendar } from 'lucide-react';

const PERIODE: { v: string; l: string }[] = [
  { v: 'harian',  l: 'Harian' },
  { v: 'bulanan', l: 'Bulanan' },
  { v: 'tahunan', l: 'Tahunan' },
];

const BASIS: { v: string; l: string }[] = [
  { v: '',            l: 'Semua Basis' },
  { v: 'per_bcm',     l: 'Per BCM' },
  { v: 'per_lubang',  l: 'Per Lubang' },
  { v: 'per_kegiatan',l: 'Per Kegiatan' },
  { v: 'per_jam',     l: 'Per Jam' },
];

export default function FilterBar({
  sites,
  nilaiAwal,
}: {
  sites: { id: string; kode: string; nama: string }[];
  nilaiAwal: {
    periode: string;
    dari: string;
    sampai: string;
    site: string;
    basis: string;
  };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(nilaiAwal.dari);
  const [sampai, setSampai] = useState(nilaiAwal.sampai);

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    start(() => router.push(`/analitik?${next.toString()}`));
  }

  const periodeAktif = nilaiAwal.periode;

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {/* Toggle periode */}
      <div className="inline-flex items-center rounded-[var(--radius-md)] bg-[color:var(--bg-subtle)] p-0.5">
        {PERIODE.map((p) => (
          <button
            key={p.v}
            onClick={() => apply({ periode: p.v, dari: '', sampai: '' })}
            className={
              'px-3 h-7 text-[12px] font-medium rounded-[calc(var(--radius-md)-2px)] transition ' +
              (periodeAktif === p.v
                ? 'bg-[color:var(--bg-elev)] text-[color:var(--text)] shadow-[var(--shadow-xs)]'
                : 'text-[color:var(--text-2)] hover:text-[color:var(--text)]')
            }
            disabled={pending}
          >
            {p.l}
          </button>
        ))}
      </div>

      {/* Range tanggal */}
      <Dropdown
        align="right"
        trigger={
          <button className="h-8 px-3 rounded-[var(--radius-md)] border bg-[color:var(--bg)] text-[12px] font-medium flex items-center gap-1.5 hover:bg-[color:var(--bg-hover)]">
            <Calendar size={12} className="text-[color:var(--text-3)]" />
            <span className="tnum">{nilaiAwal.dari}</span>
            <span className="text-[color:var(--text-3)]">→</span>
            <span className="tnum">{nilaiAwal.sampai}</span>
            <ChevronDown size={12} className="text-[color:var(--text-3)] ml-0.5" />
          </button>
        }
      >
        {(close) => (
          <div className="p-3 w-[280px]">
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Dari</label>
                <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Sampai</label>
                <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => {
                  apply({ periode: 'kustom', dari, sampai });
                  close();
                }}
              >
                Terapkan
              </Button>
            </div>
          </div>
        )}
      </Dropdown>

      {/* Site */}
      <Select
        value={nilaiAwal.site}
        onChange={(e) => apply({ site: e.target.value })}
        className="h-8 text-[12px] w-[180px]"
      >
        <option value="">Semua Site</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
        ))}
      </Select>

      {/* Filter lainnya */}
      <Dropdown
        align="right"
        trigger={
          <button className="h-8 px-3 rounded-[var(--radius-md)] border bg-[color:var(--bg)] text-[12px] font-medium flex items-center gap-1.5 hover:bg-[color:var(--bg-hover)]">
            <Filter size={12} className="text-[color:var(--text-3)]" />
            Filter Lainnya
          </button>
        }
      >
        {(close) => (
          <>
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)]">
              Basis Hasil
            </div>
            {BASIS.map((b) => (
              <DropdownItem
                key={b.v || 'all'}
                onClick={() => { apply({ basis: b.v }); close(); }}
              >
                {nilaiAwal.basis === b.v ? '✓ ' : '   '}{b.l}
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <DropdownItem
              onClick={() => {
                apply({ periode: 'bulanan', dari: '', sampai: '', site: '', basis: '' });
                close();
              }}
            >
              Reset semua filter
            </DropdownItem>
          </>
        )}
      </Dropdown>
    </div>
  );
}