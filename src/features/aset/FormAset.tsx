'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatAsetAction } from './actions';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Tambah Aset'}
    </Button>
  );
}

const STATUS: [string, string][] = [
  ['aktif', 'Aktif'],
  ['digunakan', 'Digunakan'],
  ['tersedia', 'Tersedia'],
  ['dalam_perawatan', 'Dalam Perawatan'],
  ['rusak', 'Rusak'],
  ['tidak_aktif', 'Tidak Aktif'],
  ['dihapus', 'Dihapus'],
];

export default function FormAset({ sites }: { sites: { id: string; kode: string; nama: string }[] }) {
  const [state, action] = useActionState(buatAsetAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      <Field label="Kode" required>
        <Input name="kode" required placeholder="RT-001" />
      </Field>

      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="Ranger Tank 500L" />
        </Field>
      </div>

      <Field label="Kategori" hint="ranger_tank, kendaraan, mesin, peralatan">
        <Input name="kategori" />
      </Field>

      <Field label="Nomor Seri">
        <Input name="nomor_seri" />
      </Field>

      <Field label="Status" required>
        <Select name="status" required defaultValue="aktif">
          {STATUS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </Field>

      <div className="md:col-span-2">
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
      </div>

      <div className="md:col-span-3 flex items-center gap-3">
        <Tombol />
        {state?.error && <span className="text-sm text-red">{state.error}</span>}
        {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
      </div>
    </form>
  );
}