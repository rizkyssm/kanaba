'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { catatLoxAction } from './actions';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded bg-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : 'Simpan Transaksi'}
    </button>
  );
}

const JENIS: [string, string][] = [
  ['penerimaan', 'Penerimaan (masuk)'],
  ['pengeluaran_site', 'Pengeluaran ke Site (keluar)'],
  ['pengembalian_site', 'Pengembalian dari Site (masuk)'],
  ['pemakaian', 'Pemakaian (keluar)'],
  ['penyesuaian_positif', 'Penyesuaian +'],
  ['penyesuaian_negatif', 'Penyesuaian −'],
];

export default function FormLox({
  kegiatans, sites,
}: { kegiatans: { id: string; nomor: string; nama: string }[]; sites: { id: string; kode: string; nama: string }[] }) {
  const [state, action] = useActionState(catatLoxAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Jenis</label>
        <select name="jenis" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          {JENIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Jumlah (kg)</label>
        <input type="number" step="0.01" min={0.01} name="jumlah_kg" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Kegiatan (opsional)</label>
        <select name="kegiatan_id" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          <option value="">— Tidak terhubung kegiatan —</option>
          {kegiatans.map((k) => <option key={k.id} value={k.id}>{k.nomor} · {k.nama}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Site (opsional)</label>
        <select name="site_id" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          <option value="">— Tidak ditentukan —</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-[color:var(--text-2)]">Catatan</label>
        <input name="catatan" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Tombol />
        {state?.error && <span className="text-sm text-red">{state.error}</span>}
        {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
      </div>
    </form>
  );
}