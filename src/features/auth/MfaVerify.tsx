'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { verifyLoginMfaAction } from './mfa-actions';
import { keluarAction } from './actions';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MfaVerify({ faktorId }: { faktorId: string }) {
  const [pending, start] = useTransition();
  const [kode, setKode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function kirim() {
    start(async () => {
      const r = await verifyLoginMfaAction(faktorId, kode);
      if ((r as any).error) setErr((r as any).error);
      else router.push('/beranda');
    });
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-blue/10 text-blue mx-auto">
            <ShieldCheck size={20} />
          </div>
          <div className="text-[17px] font-semibold tracking-tight">Verifikasi Dua Faktor</div>
          <p className="text-[13px] text-[color:var(--text-2)]">
            Masukkan kode 6 digit dari aplikasi authenticator Anda.
          </p>
        </div>

        <Input
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          className="text-center text-[18px] tracking-[0.4em] tnum h-12"
        />

        {err && <p className="text-[13px] text-red text-center">{err}</p>}

        <Button
          variant="primary" size="lg" className="w-full"
          onClick={kirim}
          disabled={pending || kode.length < 6}
        >
          {pending ? 'Memverifikasi…' : 'Verifikasi'}
        </Button>

        <form action={keluarAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Keluar dari akun ini
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}