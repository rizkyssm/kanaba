'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatPusatBiayaAction } from './pusat-actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan Pusat Biaya'}</Button>;
}

export default function FormPusatBiaya({ sites }: { sites: { id: string; kode: string; nama: string }[] }) {
  const [state, action] = useActionState(buatPusatBiayaAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
      <Field label="Kode" required><Input name="kode" required placeholder="PB-HO" autoFocus /></Field>
      <div className="md:col-span-2"><Field label="Nama" required><Input name="nama" required placeholder="Head Office" /></Field></div>
      <div className="md:col-span-3">
        <Field label="Site (opsional)">
          <Select name="site_id" defaultValue="">
            <option value="">— Tidak terhubung site —</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
          </Select>
        </Field>
      </div>
      <div className="md:col-span-3"><Field label="Deskripsi"><Textarea name="deskripsi" rows={2} /></Field></div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}