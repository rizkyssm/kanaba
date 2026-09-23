'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatAsetAction } from './actions';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded bg-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : 'Tambah Aset'}
    </button>
  );
}

const STATUS = ['aktif','digunakan','tersedia','dalam_perawatan','rusak','tidak_aktif','dihapus'];

export default function FormAset({ sites }: { sites: { id: string; kode: string; nama: string }[] }) {
  const [state, action] = useActionState(buatAsetAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl">
      <div><label className="text-xs text-[color:var(--text-2)]">Kode</label><input name="kode" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" /></div>
      <div className="md:col-span-2"><label className="text-xs text-[color:var(--text-2)]">Nama</label><input name="nama" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" /></div>
      <div><label className="text-xs text-[color:var(--text-2)]">Kategori</label><input name="kategori" placeholder="ranger_tank / kendaraan / …" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" /></div>
      <div><label className="text-xs text-[color:var(--text-2)]">Nomor Seri</label><input name="nomor_seri" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" /></div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Status</label>
        <select name="status" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          {STATUS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-[color:var(--text-2)]">Site (opsional)</label>
        <select name="site_id" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          <option value="">—</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
        </select>
      </div>
      <div className="md:col-span-3 flex items-center gap-3">
        <Tombol />
        {state?.error && <span className="text-sm text-red">{state.error}</span>}
        {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
      </div>
    </form>
  );
}