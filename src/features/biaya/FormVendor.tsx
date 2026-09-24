'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatVendorAction } from './vendor-actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan Vendor'}</Button>;
}

export default function FormVendor() {
  const [state, action] = useActionState(buatVendorAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      <Field label="Kode" required><Input name="kode" required placeholder="V-KNI" autoFocus /></Field>
      <div className="md:col-span-2"><Field label="Nama" required><Input name="nama" required placeholder="PT KNI" /></Field></div>
      <Field label="Kategori" required>
        <Select name="kategori" required defaultValue="material">
          <option value="material">Material</option>
          <option value="jasa">Jasa</option>
          <option value="rental">Rental</option>
          <option value="aset">Aset</option>
          <option value="lainnya">Lainnya</option>
        </Select>
      </Field>
      <Field label="Telepon"><Input name="telepon" /></Field>
      <Field label="Email"><Input type="email" name="email" /></Field>
      <Field label="NPWP"><Input name="npwp" /></Field>
      <Field label="Term Pembayaran (hari)"><Input type="number" name="term_hari" defaultValue={30} /></Field>
      <div className="md:col-span-3"><Field label="Alamat"><Input name="alamat" /></Field></div>
      <div className="md:col-span-3"><Field label="Catatan"><Textarea name="catatan" rows={2} /></Field></div>
      {state?.error && <p className="text-sm text-red md:col-span-3">{state.error}</p>}
      <div className="md:col-span-3"><Tombol /></div>
    </form>
  );
}