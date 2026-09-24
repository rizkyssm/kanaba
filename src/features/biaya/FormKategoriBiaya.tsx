'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatKategoriBiayaAction } from './kategori-actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Kategori'}
    </Button>
  );
}

export default function FormKategoriBiaya() {
  const [state, action] = useActionState(buatKategoriBiayaAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
      <Field label="Kode" required>
        <Input name="kode" required placeholder="LOX" autoFocus />
      </Field>
      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="Liquid Oxygen" />
        </Field>
      </div>
      <Field label="Jenis" required>
        <Select name="jenis" required defaultValue="langsung">
          <option value="langsung">Langsung</option>
          <option value="tidak_langsung">Tidak Langsung</option>
        </Select>
      </Field>
      <Field label="Klasifikasi" required>
        <Select name="klasifikasi" required defaultValue="opex">
          <option value="opex">OPEX</option>
          <option value="capex">CAPEX</option>
        </Select>
      </Field>
      <div className="md:col-span-3">
        <Field label="Deskripsi">
          <Textarea name="deskripsi" rows={2} />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}