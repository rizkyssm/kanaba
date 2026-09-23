'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatPengeluaranAction, buatPengembalianAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus } from 'lucide-react';

type Material = { id: string; kode: string; nama: string };
type Kegiatan = { id: string; nomor: string; nama: string };
type Row = { material_id: string; jumlah: number };

function TombolSimpan({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : label}
    </Button>
  );
}

export default function FormTransaksiMaterial({
  mode,
  kegiatans,
  materials,
}: {
  mode: 'pengeluaran' | 'pengembalian';
  kegiatans: Kegiatan[];
  materials: Material[];
}) {
  const action = mode === 'pengeluaran' ? buatPengeluaranAction : buatPengembalianAction;
  const [state, formAction] = useActionState(action, null as any);
  const [rows, setRows] = useState<Row[]>([{ material_id: '', jumlah: 1 }]);

  function update(idx: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function tambah() {
    setRows((r) => [...r, { material_id: '', jumlah: 1 }]);
  }
  function hapus(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  const valid = rows.filter((r) => r.material_id && r.jumlah > 0);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(valid)} />

      <Field label="Kegiatan" required>
        <Select name="kegiatan_id" required defaultValue="">
          <option value="" disabled>— Pilih Kegiatan —</option>
          {kegiatans.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nomor} · {k.nama}
            </option>
          ))}
        </Select>
      </Field>

      <div className="space-y-2">
        <div className="text-[13px] font-medium text-[color:var(--text-2)]">Material</div>
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Select
                value={r.material_id}
                onChange={(e) => update(idx, { material_id: e.target.value })}
                className="flex-1"
              >
                <option value="">— Pilih Material —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.kode} · {m.nama}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                value={r.jumlah}
                onChange={(e) => update(idx, { jumlah: Number(e.target.value) })}
                className="w-28"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => hapus(idx)}
                disabled={rows.length === 1}
                aria-label="Hapus baris"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={tambah}
          className="text-[13px] text-blue hover:underline inline-flex items-center gap-1"
        >
          <Plus size={13} /> Tambah baris
        </button>
      </div>

      <Field label="Catatan">
        <Textarea name="catatan" rows={2} />
      </Field>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      {state?.sukses && <p className="text-sm text-green">Tersimpan.</p>}

      <div className="flex items-center gap-2">
        <TombolSimpan label={mode === 'pengeluaran' ? 'Simpan Pengeluaran' : 'Simpan Pengembalian'} />
      </div>
    </form>
  );
}