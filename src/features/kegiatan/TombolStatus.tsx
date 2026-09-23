'use client';
import { useState, useTransition } from 'react';
import { ubahStatusKegiatanAction } from './actions';
import { DAFTAR_STATUS, labelStatus } from './StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Check } from 'lucide-react';

export default function TombolStatus({
  kegiatanId,
  status,
}: {
  kegiatanId: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [pilih, setPilih] = useState(status);
  const [msg, setMsg] = useState<string | null>(null);

  function kirim() {
    start(async () => {
      const r = await ubahStatusKegiatanAction(kegiatanId, pilih);
      if ((r as any)?.error) setMsg((r as any).error);
      else {
        setMsg('Tersimpan');
        setTimeout(() => setMsg(null), 1800);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={pilih}
        onChange={(e) => setPilih(e.target.value)}
        className="h-9 w-[210px] text-[13px]"
      >
        {DAFTAR_STATUS.map((s) => (
          <option key={s} value={s}>{labelStatus(s)}</option>
        ))}
      </Select>
      <Button variant="primary" onClick={kirim} disabled={pending || pilih === status}>
        {pending ? 'Menyimpan…' : <><Check size={14} /> Ubah Status</>}
      </Button>
      {msg && <span className="text-xs text-[color:var(--text-2)]">{msg}</span>}
    </div>
  );
}