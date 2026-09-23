'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatHseAction } from './actions';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded bg-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : 'Simpan Catatan HSE'}
    </button>
  );
}

const JENIS = ['pemeriksaan','temuan','insiden','kondisi_tidak_aman','tindakan_perbaikan'];
const TINGKAT = ['rendah','sedang','tinggi','kritis'];
const STATUS = ['terbuka','ditindaklanjuti','selesai','ditutup'];

export default function FormHse({
  kegiatans, sites,
}: { kegiatans: { id: string; nomor: string; nama: string }[]; sites: { id: string; kode: string; nama: string }[] }) {
  const [state, action] = useActionState(buatHseAction, null as any);
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Jenis</label>
        <select name="jenis" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          {JENIS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Judul</label>
        <input name="judul" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Tingkat</label>
        <select name="tingkat" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          {TINGKAT.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Status</label>
        <select name="status" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          {STATUS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Kegiatan (opsional)</label>
        <select name="kegiatan_id" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          <option value="">—</option>
          {kegiatans.map((k) => <option key={k.id} value={k.id}>{k.nomor} · {k.nama}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[color:var(--text-2)]">Site (opsional)</label>
        <select name="site_id" className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent">
          <option value="">—</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-[color:var(--text-2)]">Deskripsi</label>
        <textarea name="deskripsi" rows={3} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-[color:var(--text-2)]">Tindakan Perbaikan</label>
        <textarea name="tindakan_perbaikan" rows={2} className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Tombol />
        {state?.error && <span className="text-sm text-red">{state.error}</span>}
        {state?.sukses && <span className="text-sm text-green">Tersimpan.</span>}
      </div>
    </form>
  );
}