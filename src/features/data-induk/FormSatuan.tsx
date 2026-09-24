'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatSatuanAction } from './satuan-actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Satuan'}
    </Button>
  );
}

export default function FormSatuan() {
  const [state, action] = useActionState(buatSatuanAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <Field label="Kode" required hint="Contoh: PCS, KG, M, BCM">
        <Input name="kode" required placeholder="PCS" autoFocus className="uppercase" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Nama" required hint="Nama lengkap satuan.">
          <Input name="nama" required placeholder="Pieces" />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}