'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { enrollMfaAction, verifyEnrollMfaAction, unenrollMfaAction } from './mfa-actions';
import { ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';

type Faktor = { id: string; friendly_name?: string; status: string; created_at: string };

export default function MfaSetup({
  faktorAktif, wajib,
}: {
  faktorAktif: Faktor[];
  wajib: boolean;
}) {
  const [pending, start] = useTransition();
  const [enroll, setEnroll] = useState<{ factorId: string; qrSvg: string; secret: string } | null>(null);
  const [kode, setKode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const aktif = faktorAktif.find((f) => f.status === 'verified');

  function mulaiEnroll() {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await enrollMfaAction();
      if ((r as any).error) setErr((r as any).error);
      else setEnroll({
        factorId: (r as any).factorId,
        qrSvg: (r as any).qrSvg,
        secret: (r as any).secret,
      });
    });
  }

  function verify() {
    if (!enroll) return;
    start(async () => {
      const r = await verifyEnrollMfaAction(enroll.factorId, kode);
      if ((r as any).error) setErr((r as any).error);
      else {
        setMsg('MFA berhasil diaktifkan.');
        setEnroll(null);
        setKode('');
      }
    });
  }

  function hapus(factorId: string) {
    start(async () => {
      const r = await unenrollMfaAction(factorId);
      if ((r as any).error) setErr((r as any).error);
      else setMsg('MFA dinonaktifkan.');
    });
  }

  return (
    <Card>
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold flex items-center gap-2">
            {aktif ? <ShieldCheck size={16} className="text-[color:var(--green-fg)]" /> : <ShieldAlert size={16} className="text-[color:var(--orange-fg)]" />}
            Autentikasi Dua Faktor (TOTP)
          </div>
          <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
            {aktif
              ? 'MFA aktif. Aplikasi authenticator akan meminta kode 6 digit saat login.'
              : 'Amankan akun dengan aplikasi authenticator (Google Authenticator, Authy, 1Password, dsb).'}
          </p>
        </div>
        {wajib && <Badge tone="red">Wajib</Badge>}
      </div>

      <CardBody className="space-y-4">
        {!aktif && !enroll && (
          <Button variant="primary" onClick={mulaiEnroll} disabled={pending}>
            {pending ? 'Menyiapkan…' : 'Aktifkan MFA'}
          </Button>
        )}

        {enroll && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
              <div className="rounded border p-3 bg-white flex items-center justify-center">
                {/* qr_code berupa SVG dari Supabase */}
                <div dangerouslySetInnerHTML={{ __html: enroll.qrSvg }} />
              </div>
              <div className="space-y-3">
                <div className="text-[13px] text-[color:var(--text-2)]">
                  Scan QR dengan aplikasi authenticator. Jika tidak bisa scan, gunakan kode manual:
                </div>
                <div className="font-mono text-[13px] p-2 rounded bg-[color:var(--bg-subtle)] select-all">
                  {enroll.secret}
                </div>
                <div>
                  <label className="text-[12px] text-[color:var(--text-2)] block mb-1">
                    Kode 6 digit dari aplikasi
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={kode}
                      onChange={(e) => setKode(e.target.value)}
                      placeholder="123456"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-32 tnum text-center text-[16px] tracking-widest"
                      autoFocus
                    />
                    <Button variant="primary" onClick={verify} disabled={pending || kode.length < 6}>
                      {pending ? 'Memverifikasi…' : 'Verifikasi & Aktifkan'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setEnroll(null); setKode(''); }}>Batal</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {aktif && (
          <div className="space-y-2">
            <div className="text-[13px] text-[color:var(--text-2)]">
              Aktif sejak {new Date(aktif.created_at).toLocaleDateString('id-ID')}
            </div>
            {!wajib && (
              <Button variant="danger" size="sm" onClick={() => hapus(aktif.id)} disabled={pending}>
                <Trash2 size={13} /> Nonaktifkan MFA
              </Button>
            )}
          </div>
        )}

        {msg && <p className="text-[13px] text-[color:var(--green-fg)]">{msg}</p>}
        {err && <p className="text-[13px] text-red">{err}</p>}
      </CardBody>
    </Card>
  );
}