'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { tambahItemBomAction } from './actions';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Plus } from 'lucide-react';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" disabled={pending}>
      {pending ? 'Menyimpan…' : <><Plus size={13} /> Tambah Material</>}
    </Button>
  );
}

export default function ItemBomManager({
  bomId, materials, satuans,
}: {
  bomId: string;
  materials: { id: string; kode: string; nama: string }[];
  satuans: { id: string; kode: string; nama: string }[];
}) {
  const [state, action] = useActionState(tambahItemBomAction, null as any);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.sukses) formRef.current?.reset();
  }, [state]);

  return (
    <Card>
      <CardBody>
        <form ref={formRef} action={action} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <input type="hidden" name="bom_id" value={bomId} />

          <div className="md:col-span-5">
            <Field label="Material" required>
              <Select name="material_id" required defaultValue="">
                <option value="" disabled>— Pilih Material —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.kode} · {m.nama}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Jumlah" required>
              <Input type="number" step="0.0001" min={0.0001} name="jumlah" required defaultValue={1} />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Satuan">
              <Select name="satuan_id" defaultValue="">
                <option value="">—</option>
                {satuans.map((s) => (
                  <option key={s.id} value={s.id}>{s.kode}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <div className="flex-1">
              <Field label="Catatan">
                <Input name="catatan" />
              </Field>
            </div>
          </div>

          <div className="md:col-span-12 flex items-center gap-3">
            <Tombol />
            {state?.error && <span className="text-sm text-red">{state.error}</span>}
            {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}