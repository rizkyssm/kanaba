'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatKegiatanAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

function Tombol() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan Kegiatan'}</Button>;
}

const BASIS: { v: string; l: string; hint: string }[] = [
  { v: 'per_bcm',      l: 'Per BCM',      hint: 'Kontrak berbasis volume pemberaian / galian' },
  { v: 'per_lubang',   l: 'Per Lubang',   hint: 'Kontrak berbasis jumlah lubang blasting dengan LOX' },
  { v: 'per_kegiatan', l: 'Per Kegiatan', hint: 'Flat per kegiatan (mis. jasa survey)' },
  { v: 'per_jam',      l: 'Per Jam',      hint: 'Kontrak berbasis jam operasi' },
];

export default function FormKegiatan({ sites }: { sites: { id: string; nama: string; kode: string }[] }) {
  const [state, action] = useActionState(buatKegiatanAction, null as any);
  const today = new Date().toISOString().slice(0, 10);
  const [basis, setBasis] = useState('per_bcm');

  const basisHint = BASIS.find((b) => b.v === basis)?.hint ?? '';

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
            <div className="md:col-span-2">
              <Field label="Basis Hasil" required hint={basisHint}>
                <Select name="basis_hasil" required value={basis} onChange={(e) => setBasis(e.target.value)}>
                  {BASIS.map((b) => <option key={b.v} value={b.v}>{b.l}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="text-[13px] font-medium text-[color:var(--text-2)]">Target & Rencana</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BCM — selalu tampil karena sering jadi referensi lapangan */}
            <Field label="Target BCM" hint={basis === 'per_bcm' ? 'Basis utama kontrak' : 'Referensi operasional'}>
              <Input type="number" step="0.01" name="target_bcm" defaultValue={0} />
            </Field>

            <Field label="Target Lubang" hint={basis === 'per_lubang' ? 'Basis utama kontrak' : 'Untuk blasting LOX'}>
              <Input type="number" step="0.01" name="target_lubang" defaultValue={0} />
            </Field>

            <Field label="Rencana LOX (kg)" hint="Total rencana">
              <Input type="number" step="0.01" name="rencana_lox_kg" defaultValue={0} />
            </Field>

            <Field label="Rencana KANABA (pcs)">
              <Input type="number" name="rencana_kanaba" defaultValue={0} />
            </Field>

            <Field label="Rencana LOX per Lubang (kg)" hint="Otomatis untuk analitik blasting">
              <Input type="number" step="0.001" name="rencana_lox_per_lubang_kg" defaultValue={0} />
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
      <Tombol />
    </form>
  );
}