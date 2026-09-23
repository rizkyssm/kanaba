'use client';
import { useState, useTransition } from 'react';
import { ubahStatusKegiatanAction } from './actions';
import { DAFTAR_STATUS, labelStatus } from './StatusBadge';

export default function TombolStatus({ kegiatanId, status }: { kegiatanId: string; status: string }) {
  const [pending, start] = useTransition();
  const [pilih, setPilih] = useState(status);
  const [msg, setMsg] = useState<string | null>(null);

  function kirim() {
    start(async () => {
      const r = await ubahStatusKegiatanAction(kegiatanId, pilih);
      if ((r as any)?.error) setMsg((r as any).error);
      else { setMsg('Status diperbarui.'); setTimeout(() => setMsg(null), 2000); }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={pilih}
        onChange={(e) => setPilih(e.target.value)}
        className="rounded border border-[color:var(--border)] px-2 py-1.5 text-sm bg-transparent"
      >
        {DAFTAR_STATUS.map((s) => <option key={s} value={s}>{labelStatus(s)}</option>)}
      </select>
      <button
        onClick={kirim}
        disabled={pending || pilih === status}
        className="rounded bg-blue text-white px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {pending ? 'Menyimpan…' : 'Ubah Status'}
      </button>
      {msg && <span className="text-xs text-[color:var(--text-2)]">{msg}</span>}
    </div>
  );
}