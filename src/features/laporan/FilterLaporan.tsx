'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Filter } from 'lucide-react';

export default function FilterLaporan({
  sites, nilaiAwal, basePath,
}: {
  sites: { id: string; kode: string; nama: string }[];
  nilaiAwal: { dari: string; sampai: string; site: string };
  basePath: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dari, setDari] = useState(nilaiAwal.dari);
  const [sampai, setSampai] = useState(nilaiAwal.sampai);
  const [site, setSite] = useState(nilaiAwal.site);

  function apply() {
    const params = new URLSearchParams();
    if (dari) params.set('dari', dari);
    if (sampai) params.set('sampai', sampai);
    if (site) params.set('site', site);
    start(() => router.push(`${basePath}?${params.toString()}`));
  }

  return (
    <Card>
      <CardBody className="flex items-end gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--text-2)] mr-1 self-center">
          <Filter size={13} /> Filter
        </div>
        <div>
          <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Dari</label>
          <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Sampai</label>
          <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Site</label>
          <Select value={site} onChange={(e) => setSite(e.target.value)} className="w-[200px]">
            <option value="">Semua Site</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
          </Select>
        </div>
        <Button variant="primary" onClick={apply} disabled={pending}>Terapkan</Button>
      </CardBody>
    </Card>
  );
}