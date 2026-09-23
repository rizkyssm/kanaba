'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatKegiatanAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

function Tombol() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan Kegiatan'}</Button>;
}

export default function FormKegiatan({ sites }: { sites: { id: string; nama: string; kode: string }[] }) {
  const [state, action] = useActionState(buatKegiatanAction, null as any);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5 max-w-3xl">
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nama Kegiatan" required>
              <Input name="nama" required />
            </Field>
            <Field label="Site" required>
              <Select name="site_id" required defaultValue="">
                <option value="" disabled>— Pilih Site —</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
              </Select>
            </Field>
            <Field label="Tanggal" required>
              <Input type="date" name="tanggal" defaultValue={today} required />
            </Field>
            <Field label="Lokasi">
              <Input name="lokasi" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="text-[13px] font-medium text-[color:var(--text-2)]">Rencana</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Target BCM">
              <Input type="number" step="0.01" name="target_bcm" defaultValue={0} />
            </Field>
            <Field label="KANABA (pcs)">
              <Input type="number" name="rencana_kanaba" defaultValue={0} />
            </Field>
            <Field label="LOX (kg)">
              <Input type="number" step="0.01" name="rencana_lox_kg" defaultValue={0} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Field label="Catatan">
            <Textarea name="catatan" rows={3} />
          </Field>
        </CardBody>
      </Card>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Tombol />
      </div>
    </form>
  );
}