'use client';
import { useState, useTransition } from 'react';
import { transisiPengeluaranAction } from './actions';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { CheckCircle2, XCircle, Send, CreditCard, BookOpen } from 'lucide-react';

export default function ApprovalBar({
  pengeluaranId, status, bolehKelola,
}: { pengeluaranId: string; status: string; bolehKelola: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tolak, setTolak] = useState(false);
  const [alasan, setAlasan] = useState('');

  function run(s: string, note?: string) {
    setMsg(null); setErr(null);
    start(async () => {
      const r = await transisiPengeluaranAction(pengeluaranId, s, note);
      if ((r as any)?.error) setErr((r as any).error);
      else { setMsg('Status diperbarui.'); setTolak(false); }
    });
  }

  if (!bolehKelola) return null;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="text-[13px] font-medium">Tindakan</div>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'draf' && (
            <Button variant="primary" disabled={pending} onClick={() => run('diajukan')}>
              <Send size={14} /> Ajukan
            </Button>
          )}
          {status === 'diajukan' && (
            <>
              <Button variant="primary" disabled={pending} onClick={() => run('diverifikasi_operasional')}>
                <CheckCircle2 size={14} /> Verifikasi Operasional
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => setTolak((v) => !v)}>
                <XCircle size={14} /> Tolak
              </Button>
            </>
          )}
          {status === 'diverifikasi_operasional' && (
            <>
              <Button variant="primary" disabled={pending} onClick={() => run('diverifikasi_keuangan')}>
                <CheckCircle2 size={14} /> Verifikasi Keuangan
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => setTolak((v) => !v)}>
                <XCircle size={14} /> Tolak
              </Button>
            </>
          )}
          {status === 'diverifikasi_keuangan' && (
            <>
              <Button variant="primary" disabled={pending} onClick={() => run('disetujui')}>
                <CheckCircle2 size={14} /> Setujui
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => setTolak((v) => !v)}>
                <XCircle size={14} /> Tolak
              </Button>
            </>
          )}
          {status === 'disetujui' && (
            <Button variant="primary" disabled={pending} onClick={() => run('dibayar')}>
              <CreditCard size={14} /> Tandai Dibayar
            </Button>
          )}
          {status === 'dibayar' && (
            <Button variant="primary" disabled={pending} onClick={() => run('dibukukan')}>
              <BookOpen size={14} /> Bukukan
            </Button>
          )}
          {status === 'dibukukan' && (
            <span className="text-[13px] text-[color:var(--green-fg)]">✓ Selesai & dibukukan.</span>
          )}
          {(status === 'ditolak' || status === 'dibatalkan') && (
            <span className="text-[13px] text-[color:var(--red-fg)]">
              {status === 'ditolak' ? 'Ditolak.' : 'Dibatalkan.'}
            </span>
          )}
        </div>

        {tolak && (
          <div className="space-y-2 border-t pt-3">
            <Textarea rows={2} placeholder="Alasan penolakan" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button variant="danger" disabled={pending || !alasan.trim()} onClick={() => run('ditolak', alasan)}>
                Kirim Penolakan
              </Button>
              <Button variant="ghost" onClick={() => setTolak(false)}>Batal</Button>
            </div>
          </div>
        )}

        {msg && <p className="text-[13px] text-[color:var(--green-fg)]">{msg}</p>}
        {err && <p className="text-[13px] text-red">{err}</p>}
      </CardBody>
    </Card>
  );
}