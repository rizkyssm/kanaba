'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Filter, X } from 'lucide-react';

export default function FilterLog({
  penggunas, nilaiAwal,
}: {
  penggunas: { id: string; nama_lengkap: string; email: string }[];
  nilaiAwal: { aksi: string; dari: string; sampai: string; pengguna: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [aksi, setAksi] = useState(nilaiAwal.aksi);
  const [dari, setDari] = useState(nilaiAwal.dari);
  const [sampai, setSampai] = useState(nilaiAwal.sampai);
  const [pengguna, setPengguna] = useState(nilaiAwal.pengguna);

  function apply() {
    const next = new URLSearchParams(params.toString());
    const set = (k: string, v: string) => v ? next.set(k, v) : next.delete(k);
    set('aksi', aksi);
    set('dari', dari);
    set('sampai', sampai);
    set('pengguna', pengguna);
    start(() => router.push(`/admin/log?${next.toString()}`));
  }

  function reset() {
    start(() => router.push('/admin/log'));
  }

  return (
    <Card>
      <CardBody className="flex items-end gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--text-2)] mr-1 self-center">
          <Filter size={13} /> Filter
        </div>
        <div>
          <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Aksi</label>
          <Input
            value={aksi}
            onChange={(e) => setAksi(e.target.value)}
            placeholder="mis. pengeluaran"
            className="w-[180px]"
          />
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
          <label className="text-[11px] text-[color:var(--text-3)] block mb-1">Pengguna</label>
          <Select value={pengguna} onChange={(e) => setPengguna(e.target.value)} className="w-[200px]">
            <option value="">Semua pengguna</option>
            {penggunas.map((p) => (
              <option key={p.id} value={p.id}>{p.nama_lengkap} · {p.email}</option>
            ))}
          </Select>
        </div>
        <Button variant="primary" onClick={apply} disabled={pending}>Terapkan</Button>
        <Button variant="ghost" size="sm" onClick={reset} disabled={pending}>
          <X size={13} /> Reset
        </Button>
      </CardBody>
    </Card>
  );
}