'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatAlasanPenyesuaianAction } from './alasan-actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Alasan'}
    </Button>
  );
}

export default function FormAlasanPenyesuaian() {
  const [state, action] = useActionState(buatAlasanPenyesuaianAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <Field label="Kode" required hint="Otomatis diubah jadi huruf kecil & underscore.">
        <Input name="kode" required placeholder="rusak_parah" autoFocus />
      </Field>
      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="Rusak Parah" />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}