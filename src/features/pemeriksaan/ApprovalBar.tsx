'use client';
import { useState, useTransition } from 'react';
import { approveSupervisorAction, tolakPemeriksaanAction, setujuiDanSesuaikanAction } from './actions';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function ApprovalBar({
  pemeriksaanId,
  status,
  bolehApproveSupervisor,
  bolehApproveFinal,
}: {
  pemeriksaanId: string;
  status: string;
  bolehApproveSupervisor: boolean;
  bolehApproveFinal: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [showTolak, setShowTolak] = useState(false);

  function run(fn: () => Promise<any>, label: string) {
    setMsg(null); setErr(null);
    start(async () => {
      const r = await fn();
      if ((r as any)?.error) setErr((r as any).error);
      else setMsg(label);
    });
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="text-[13px] font-medium">Tindakan</div>

        <div className="flex flex-wrap items-center gap-2">
          {status === 'diajukan' && bolehApproveSupervisor && (
            <>
              <Button
                variant="primary"
                disabled={pending}
                onClick={() => run(() => approveSupervisorAction(pemeriksaanId), 'Disetujui supervisor.')}
              >
                <CheckCircle2 size={14} /> Setujui (Supervisor)
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => setShowTolak((s) => !s)}
              >
                <XCircle size={14} /> Tolak
              </Button>
            </>
          )}

          {status === 'disetujui_supervisor' && bolehApproveFinal && (
            <Button
              variant="primary"
              disabled={pending}
              onClick={() => run(() => setujuiDanSesuaikanAction(pemeriksaanId), 'Disetujui & penyesuaian stok dibuat.')}
            >
              <Sparkles size={14} /> Setujui & Sesuaikan Stok
            </Button>
          )}

          {status === 'disetujui' && (
            <span className="text-[13px] text-[color:var(--green-fg)]">
              ✓ Penyesuaian stok sudah dibuat.
            </span>
          )}

          {status === 'ditolak' && (
            <span className="text-[13px] text-[color:var(--red-fg)]">
              Pemeriksaan ditolak.
            </span>
          )}
        </div>

        {showTolak && status === 'diajukan' && bolehApproveSupervisor && (
          <div className="space-y-2 border-t pt-3">
            <Textarea
              rows={2}
              placeholder="Alasan penolakan"
              value={alasanTolak}
              onChange={(e) => setAlasanTolak(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                disabled={pending || !alasanTolak.trim()}
                onClick={() => run(() => tolakPemeriksaanAction(pemeriksaanId, alasanTolak), 'Ditolak.')}
              >
                Kirim Penolakan
              </Button>
              <Button variant="ghost" onClick={() => setShowTolak(false)}>Batal</Button>
            </div>
          </div>
        )}

        {msg && <p className="text-[13px] text-[color:var(--green-fg)]">{msg}</p>}
        {err && <p className="text-[13px] text-red">{err}</p>}
      </CardBody>
    </Card>
  );
}