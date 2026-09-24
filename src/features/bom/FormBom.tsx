'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatBomAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

type Material = { id: string; kode: string; nama: string };
type Produk = { id: string; kode: string; nama: string };
type Satuan = { id: string; kode: string; nama: string };
type Row = { material_id: string; jumlah: number; satuan_id: string };

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan BOM'}
    </Button>
  );
}

export default function FormBom({
  produks, materials, satuans,
}: { produks: Produk[]; materials: Material[]; satuans: Satuan[] }) {
  const [state, action] = useActionState(buatBomAction, null as any);
  const [rows, setRows] = useState<Row[]>([{ material_id: '', jumlah: 1, satuan_id: '' }]);

  function update(idx: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function tambah() { setRows((r) => [...r, { material_id: '', jumlah: 1, satuan_id: '' }]); }
  function hapus(idx: number) { setRows((r) => r.filter((_, i) => i !== idx)); }

  const valid = rows.filter((r) => r.material_id && r.jumlah > 0);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(valid)} />

      {/* Header BOM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Kode" required>
          <Input name="kode" required placeholder="BOM-4M-V1" autoFocus />
        </Field>
        <div className="md:col-span-2">
          <Field label="Nama" required>
            <Input name="nama" required placeholder="BOM KANABA 4M Normal" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Produk" required>
            <Select name="produk_id" required defaultValue="">
              <option value="" disabled>— Pilih Produk —</option>
              {produks.map((p) => (
                <option key={p.id} value={p.id}>{p.kode} · {p.nama}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Versi">
          <Input name="versi" defaultValue="v1" />
        </Field>
        <div className="md:col-span-3">
          <Field label="Catatan">
            <Textarea name="catatan" rows={2} />
          </Field>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-medium text-[color:var(--text-2)]">
            Material ({valid.length} baris)
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={tambah}>
            <Plus size={13} /> Tambah Baris
          </Button>
        </div>

        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Select
                  value={r.material_id}
                  onChange={(e) => update(idx, { material_id: e.target.value })}
                >
                  <option value="">— Pilih Material —</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.kode} · {m.nama}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-3">
                <Select
                  value={r.satuan_id}
                  onChange={(e) => update(idx, { satuan_id: e.target.value })}
                >
                  <option value="">— Satuan —</option>
                  {satuans.map((s) => (
                    <option key={s.id} value={s.id}>{s.kode}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number" step="0.0001" min={0.0001}
                  value={r.jumlah}
                  onChange={(e) => update(idx, { jumlah: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => hapus(idx)} disabled={rows.length === 1}
                  aria-label="Hapus baris"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Tombol />
      </div>
    </form>
  );
}