'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Select, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Filter, X } from 'lucide-react';

const PERIODE = [
  { v: 'bulan',    l: 'Bulan Ini' },
  { v: '3bulan',   l: '3 Bulan Terakhir' },
  { v: 'tahun',    l: 'Tahun Ini' },
  { v: 'kustom',   l: 'Kustom' },
];

export default function FilterAnalitik({
  sites, nilaiAwal,
}: {
  sites: { id: string; kode: string; nama: string }[];
  nilaiAwal: { periode: string; dari: string; sampai: string; site: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    start(() => router.push(`/analitik?${next.toString()}`));
  }

  function reset() {
    start(() => router.push('/analitik'));
  }

  return (
    <Card>
      <CardBody className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--text-2)] mr-1">
          <Filter size={13} /> Filter
        </div>

        <Select
          value={nilaiAwal.periode}
          onChange={(e) => apply({ periode: e.target.value })}
          className="w-[170px]"
        >
          {PERIODE.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
        </Select>

        {nilaiAwal.periode === 'kustom' && (
          <>
            <Input
              type="date" value={nilaiAwal.dari}
              onChange={(e) => apply({ dari: e.target.value })}
              className="w-[150px]"
            />
            <span className="text-[color:var(--text-3)]">—</span>
            <Input
              type="date" value={nilaiAwal.sampai}
              onChange={(e) => apply({ sampai: e.target.value })}
              className="w-[150px]"
            />
          </>
        )}

        <Select
          value={nilaiAwal.site}
          onChange={(e) => apply({ site: e.target.value })}
          className="w-[200px]"
        >
          <option value="">Semua Site</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
        </Select>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={reset} disabled={pending}>
          <X size={13} /> Reset
        </Button>
      </CardBody>
    </Card>
  );
}