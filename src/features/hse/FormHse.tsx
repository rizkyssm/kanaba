'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatHseAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Catatan HSE'}
    </Button>
  );
}

const JENIS: [string, string][] = [
  ['pemeriksaan', 'Pemeriksaan'],
  ['temuan', 'Temuan'],
  ['insiden', 'Insiden'],
  ['kondisi_tidak_aman', 'Kondisi Tidak Aman'],
  ['tindakan_perbaikan', 'Tindakan Perbaikan'],
];

const TINGKAT: [string, string][] = [
  ['rendah', 'Rendah'],
  ['sedang', 'Sedang'],
  ['tinggi', 'Tinggi'],
  ['kritis', 'Kritis'],
];

const STATUS: [string, string][] = [
  ['terbuka', 'Terbuka'],
  ['ditindaklanjuti', 'Ditindaklanjuti'],
  ['selesai', 'Selesai'],
  ['ditutup', 'Ditutup'],
];

export default function FormHse({
  kegiatans,
  sites,
}: {
  kegiatans: { id: string; nomor: string; nama: string }[];
  sites: { id: string; kode: string; nama: string }[];
}) {
  const [state, action] = useActionState(buatHseAction, null as any);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <Field label="Jenis" required>
        <Select name="jenis" required defaultValue="pemeriksaan">
          {JENIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>

      <Field label="Judul" required>
        <Input name="judul" required />
      </Field>

      <Field label="Tingkat" required>
        <Select name="tingkat" required defaultValue="rendah">
          {TINGKAT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>

      <Field label="Status" required>
        <Select name="status" required defaultValue="terbuka">
          {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>

      <Field label="Kegiatan (opsional)">
        <Select name="kegiatan_id" defaultValue="">
          <option value="">— Tidak terhubung —</option>
          {kegiatans.map((k) => (
            <option key={k.id} value={k.id}>{k.nomor} · {k.nama}</option>
          ))}
        </Select>
      </Field>

      <Field label="Site (opsional)">
        <Select name="site_id" defaultValue="">
          <option value="">— Tidak ditentukan —</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
          ))}
        </Select>
      </Field>

      <div className="md:col-span-2">
        <Field label="Deskripsi">
          <Textarea name="deskripsi" rows={3} />
        </Field>
      </div>

      <div className="md:col-span-2">
        <Field label="Tindakan Perbaikan">
          <Textarea name="tindakan_perbaikan" rows={2} />
        </Field>
      </div>

      <div className="md:col-span-2 flex items-center gap-3">
        <Tombol />
        {state?.error && <span className="text-sm text-red">{state.error}</span>}
        {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
      </div>
    </form>
  );
}