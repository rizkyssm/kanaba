'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatPengeluaranAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

type Ref = { id: string; kode?: string; nama: string; jenis?: string; klasifikasi?: string };

function Tombol() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan Pengeluaran'}</Button>;
}

export default function FormPengeluaran({
  sites, kegiatans, kategoris, pusats, vendors,
}: {
  sites: Ref[]; kegiatans: Ref[]; kategoris: Ref[]; pusats: Ref[]; vendors: Ref[];
}) {
  const [state, action] = useActionState(buatPengeluaranAction, null as any);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5 max-w-4xl">
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Tanggal" required>
            <Input type="date" name="tanggal" defaultValue={today} required />
          </Field>
          <Field label="Kategori Biaya" required>
            <Select name="kategori_biaya_id" required defaultValue="">
              <option value="" disabled>— Pilih —</option>
              {kategoris.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kode} · {k.nama} ({k.jenis === 'langsung' ? 'L' : 'TL'} / {k.klasifikasi?.toUpperCase()})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nilai (Rp)" required>
            <Input type="number" step="0.01" min={0} name="nilai" required />
          </Field>

          <Field label="Jenis" required>
            <Select name="jenis" required defaultValue="langsung">
              <option value="langsung">Langsung</option>
              <option value="tidak_langsung">Tidak Langsung</option>
            </Select>
          </Field>
          <Field label="Klasifikasi" required>
            <Select name="klasifikasi" required defaultValue="opex">
              <option value="opex">OPEX</option>
              <option value="capex">CAPEX</option>
            </Select>
          </Field>
          <Field label="Cara Pembayaran" required>
            <Select name="cara_pembayaran" required defaultValue="transfer">
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="hutang">Hutang</option>
              <option value="lainnya">Lainnya</option>
            </Select>
          </Field>

          <Field label="Kegiatan">
            <Select name="kegiatan_id" defaultValue="">
              <option value="">— Tidak terkait kegiatan —</option>
              {kegiatans.map((k) => (
                <option key={k.id} value={k.id}>{k.kode} · {k.nama}</option>
              ))}
            </Select>
          </Field>
          <Field label="Site">
            <Select name="site_id" defaultValue="">
              <option value="">— Tidak ditentukan —</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
            </Select>
          </Field>
          <Field label="Pusat Biaya">
            <Select name="pusat_biaya_id" defaultValue="">
              <option value="">— Tidak ditentukan —</option>
              {pusats.map((p) => <option key={p.id} value={p.id}>{p.kode} · {p.nama}</option>)}
            </Select>
          </Field>

          <div className="md:col-span-3">
            <Field label="Vendor">
              <Select name="vendor_id" defaultValue="">
                <option value="">— Tidak ada vendor —</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.kode} · {v.nama}</option>)}
              </Select>
            </Field>
          </div>

          <div className="md:col-span-3">
            <Field label="Catatan">
              <Textarea name="catatan" rows={2} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}

      <Tombol />
    </form>
  );
}