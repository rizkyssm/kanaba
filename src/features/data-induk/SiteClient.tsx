'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatSiteAction } from './actions';
import { useState } from 'react';

type Site = { id: string; kode: string; nama: string; alamat: string | null; aktif: boolean };

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded bg-blue text-white px-3 py-2 text-sm font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : 'Tambah Site'}
    </button>
  );
}

export default function SiteClient({ data, bisaKelola }: { data: Site[]; bisaKelola: boolean }) {
  const [state, action] = useActionState(buatSiteAction, null as any);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Site</h1>
          <p className="text-sm text-[color:var(--text-2)]">Daftar lokasi operasional organisasi.</p>
        </div>
        {bisaKelola && (
          <button onClick={() => setShowForm((s) => !s)} className="rounded border border-[color:var(--border)] px-3 py-2 text-sm">
            {showForm ? 'Tutup' : 'Site Baru'}
          </button>
        )}
      </div>

      {showForm && bisaKelola && (
        <form action={action} className="rounded border border-[color:var(--border)] p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-[color:var(--text-2)]">Kode</label>
            <input name="kode" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
          </div>
          <div>
            <label className="text-xs text-[color:var(--text-2)]">Nama</label>
            <input name="nama" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-[color:var(--text-2)]">Alamat</label>
            <input name="alamat" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
          </div>
          <div className="md:col-span-3 flex items-center gap-3">
            <Tombol />
            {state?.error && <span className="text-sm text-red">{state.error}</span>}
            {state?.sukses && <span className="text-sm text-green">Site tersimpan.</span>}
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th>Alamat</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={4} className="text-center text-[color:var(--text-2)] py-6">Belum ada site.</td></tr>
            )}
            {data.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.kode}</td>
                <td>{s.nama}</td>
                <td className="text-[color:var(--text-2)]">{s.alamat ?? '—'}</td>
                <td>{s.aktif ? 'Aktif' : 'Nonaktif'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}