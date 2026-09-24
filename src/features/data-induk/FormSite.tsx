'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatSiteAction } from './actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Site'}
    </Button>
  );
}

export default function FormSite() {
  const [state, action] = useActionState(buatSiteAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
      <Field label="Kode" required>
        <Input name="kode" required placeholder="SITE-01" autoFocus />
      </Field>

      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="Gunung Batujajar" />
        </Field>
      </div>

      <div className="md:col-span-3">
        <Field label="Alamat">
          <Input name="alamat" />
        </Field>
      </div>

      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}

      <div className="md:col-span-3 flex items-center gap-2">
        <Tombol />
      </div>
    </form>
  );
}