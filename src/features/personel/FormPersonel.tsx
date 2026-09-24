'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatPersonelAction } from './actions';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Personel'}
    </Button>
  );
}

const TIPE: [string, string][] = [
  ['karyawan', 'Karyawan'],
  ['tenaga_lepas', 'Tenaga Lepas'],
  ['vendor', 'Vendor'],
];

const JENIS_TARIF: [string, string][] = [
  ['per_hari', 'Per Hari'],
  ['per_jam', 'Per Jam'],
  ['per_kegiatan', 'Per Kegiatan'],
  ['per_hasil', 'Per Hasil Kerja'],
];

export default function FormPersonel({ bolehGaji }: { bolehGaji: boolean }) {
  const [state, action] = useActionState(buatPersonelAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      <Field label="Tipe" required>
        <Select name="tipe" required defaultValue="karyawan">
          {TIPE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>

      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required autoFocus />
        </Field>
      </div>

      <Field label="Telepon">
        <Input name="telepon" />
      </Field>

      <div className="md:col-span-2">
        <Field label="Keahlian" hint="Contoh: operator LOX, tukang bor, pengemudi">
          <Input name="keahlian" />
        </Field>
      </div>

      {bolehGaji && (
        <>
          <Field label="Tarif" hint="Hanya tersimpan untuk pengguna dengan hak gaji.">
            <Input type="number" step="0.01" name="tarif" />
          </Field>
          <Field label="Jenis Tarif">
            <Select name="jenis_tarif" defaultValue="">
              <option value="">— Pilih —</option>
              {JENIS_TARIF.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </>
      )}

      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}

      <div className="md:col-span-3 flex items-center gap-2">
        <Tombol />
      </div>
    </form>
  );
}