'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatKegiatanAction } from './actions';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded bg-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : 'Simpan Kegiatan'}
    </button>
  );
}

export default function FormKegiatan({ sites }: { sites: { id: string; nama: string; kode: string }[] }) {
  const [state, action] = useActionState(buatKegiatanAction, null as any);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Nama Kegiatan</label>
          <input name="nama" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Site</label>
          <select name="site_id" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
            <option value="">— Pilih Site —</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Tanggal</label>
          <input type="date" name="tanggal" defaultValue={today} required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Lokasi</label>
          <input name="lokasi" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Target BCM</label>
          <input type="number" step="0.01" name="target_bcm" defaultValue={0} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Rencana KANABA (pcs)</label>
          <input type="number" name="rencana_kanaba" defaultValue={0} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="text-xs text-[color:var(--text-2)]">Rencana LOX (kg)</label>
          <input type="number" step="0.01" name="rencana_lox_kg" defaultValue={0} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
        </div>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Catatan</label>
        <textarea name="catatan" rows={3} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      <Tombol />
    </form>
  );
}