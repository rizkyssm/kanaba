'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { catatLoxAction } from './actions';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Transaksi'}
    </Button>
  );
}

const JENIS: [string, string][] = [
  ['penerimaan', 'Penerimaan (masuk)'],
  ['pengeluaran_site', 'Pengeluaran ke Site (keluar)'],
  ['pengembalian_site', 'Pengembalian dari Site (masuk)'],
  ['pemakaian', 'Pemakaian (keluar)'],
  ['penyesuaian_positif', 'Penyesuaian +'],
  ['penyesuaian_negatif', 'Penyesuaian −'],
];

export default function FormLox({
  kegiatans,
  sites,
}: {
  kegiatans: { id: string; nomor: string; nama: string }[];
  sites: { id: string; kode: string; nama: string }[];
}) {
  const [state, action] = useActionState(catatLoxAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <Field label="Jenis" required>
        <Select name="jenis" required defaultValue="penerimaan">
          {JENIS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </Field>

      <Field label="Jumlah (kg)" required>
        <Input type="number" step="0.01" min={0.01} name="jumlah_kg" required />
      </Field>

      <Field label="Kegiatan (opsional)">
        <Select name="kegiatan_id" defaultValue="">
          <option value="">— Tidak terhubung kegiatan —</option>
          {kegiatans.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nomor} · {k.nama}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Site (opsional)">
        <Select name="site_id" defaultValue="">
          <option value="">— Tidak ditentukan —</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.kode} · {s.nama}
            </option>
          ))}
        </Select>
      </Field>

      <div className="md:col-span-2">
        <Field label="Catatan">
          <Input name="catatan" />
        </Field>
      </div>

      <div className="md:col-span-2 flex items-center gap-3">
        <Tombol />
        {state?.error && <span className="text-sm text-red">{state.error}</span>}
        {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
      </div>
    </form>
  );
}