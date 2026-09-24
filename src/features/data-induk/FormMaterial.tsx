'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatMaterialAction } from './material-actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Ref = { id: string; kode: string; nama: string };

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Material'}
    </Button>
  );
}

export default function FormMaterial({
  kategoris, satuans,
}: { kategoris: Ref[]; satuans: Ref[] }) {
  const [state, action] = useActionState(buatMaterialAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
      <Field label="Kode" required hint="Huruf besar, contoh: PVC-4M">
        <Input name="kode" required placeholder="PVC-4M" autoFocus className="uppercase" />
      </Field>

      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="PVC 4 Meter" />
        </Field>
      </div>

      <Field label="Kategori">
        <Select name="kategori_id" defaultValue="">
          <option value="">— Tidak dikategorikan —</option>
          {kategoris.map((k) => (
            <option key={k.id} value={k.id}>{k.kode} · {k.nama}</option>
          ))}
        </Select>
      </Field>

      <Field label="Satuan">
        <Select name="satuan_id" defaultValue="">
          <option value="">— Tidak ditentukan —</option>
          {satuans.map((s) => (
            <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
          ))}
        </Select>
      </Field>

      <div className="md:col-span-3">
        <Field label="Deskripsi">
          <Textarea name="deskripsi" rows={2} placeholder="Catatan tambahan tentang material ini" />
        </Field>
      </div>

      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}