'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatPengeluaranAction, buatPengembalianAction } from './actions';

type Material = { id: string; kode: string; nama: string; satuan?: string | null };
type Kegiatan = { id: string; nomor: string; nama: string };

function Tombol({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded bg-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : label}
    </button>
  );
}

export default function FormTransaksiMaterial({
  mode, kegiatans, materials,
}: { mode: 'pengeluaran' | 'pengembalian'; kegiatans: Kegiatan[]; materials: Material[] }) {
  const action = mode === 'pengeluaran' ? buatPengeluaranAction : buatPengembalianAction;
  const [state, formAction] = useActionState(action, null as any);
  const [rows, setRows] = useState<{ material_id: string; jumlah: number }[]>([{ material_id: '', jumlah: 1 }]);

  function update(idx: number, patch: Partial<{ material_id: string; jumlah: number }>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function tambah() { setRows((r) => [...r, { material_id: '', jumlah: 1 }]); }
  function hapus(idx: number) { setRows((r) => r.filter((_, i) => i !== idx)); }

  return (
    <form action={formAction} className="space-y-4 max-w-3xl">
      <input type="hidden" name="items" value={JSON.stringify(rows.filter((r) => r.material_id && r.jumlah > 0))} />

      <div>
        <label className="text-xs text-[color:var(--text-2)]">Kegiatan</label>
        <select name="kegiatan_id" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          <option value="">— Pilih Kegiatan —</option>
          {kegiatans.map((k) => <option key={k.id} value={k.id}>{k.nomor} · {k.nama}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-[color:var(--text-2)]">Material</div>
        {rows.map((r, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <select
              value={r.material_id}
              onChange={(e) => update(idx, { material_id: e.target.value })}
              className="flex-1 rounded border border-[color:var(--border)] px-2 py-1.5 text-sm bg-transparent"
            >
              <option value="">— Pilih Material —</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.kode} · {m.nama}</option>)}
            </select>
            <input
              type="number" step="0.01" min={0.01}
              value={r.jumlah}
              onChange={(e) => update(idx, { jumlah: Number(e.target.value) })}
              className="w-28 rounded border border-[color:var(--border)] px-2 py-1.5 text-sm bg-transparent"
            />
            {rows.length > 1 && (
              <button type="button" onClick={() => hapus(idx)} className="text-red text-sm">Hapus</button>
            )}
          </div>
        ))}
        <button type="button" onClick={tambah} className="text-sm text-blue hover:underline">+ Tambah baris</button>
      </div>

      <div>
        <label className="text-xs text-[color:var(--text-2)]">Catatan</label>
        <textarea name="catatan" rows={2} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      {state?.sukses && <p className="text-sm text-green">Tersimpan.</p>}
      <Tombol label={mode === 'pengeluaran' ? 'Simpan Pengeluaran' : 'Simpan Pengembalian'} />
    </form>
  );
}