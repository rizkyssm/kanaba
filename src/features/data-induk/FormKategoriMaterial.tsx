'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatKategoriMaterialAction } from './kategori-actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Kategori'}
    </Button>
  );
}

export default function FormKategoriMaterial() {
  const [state, action] = useActionState(buatKategoriMaterialAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <Field label="Kode" required hint="Contoh: BAHAN_KIMIA">
        <Input name="kode" required placeholder="BAHAN_KIMIA" autoFocus className="uppercase" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="Bahan Kimia" />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}