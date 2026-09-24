'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatProdukAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Produk'}
    </Button>
  );
}

export default function FormProduk({ satuans }: { satuans: { id: string; kode: string; nama: string }[] }) {
  const [state, action] = useActionState(buatProdukAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
      <Field label="Kode" required>
        <Input name="kode" required placeholder="KANABA-4M" autoFocus />
      </Field>
      <div className="md:col-span-2">
        <Field label="Nama" required>
          <Input name="nama" required placeholder="KANABA 4M Normal" />
        </Field>
      </div>
      <Field label="Satuan">
        <Select name="satuan_id" defaultValue="">
          <option value="">— Pilih —</option>
          {satuans.map((s) => (
            <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
          ))}
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Deskripsi">
          <Textarea name="deskripsi" rows={2} />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}