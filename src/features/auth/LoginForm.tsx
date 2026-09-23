'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { masukAction } from './actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Memproses…' : 'Masuk'}
    </Button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState(masukAction, null as any);

  return (
    <form action={action} className="space-y-5">
      <div className="text-center">
        <div className="text-[22px] font-semibold tracking-tight">KANABA</div>
        <p className="text-[13px] text-[color:var(--text-2)] mt-1">Masuk dengan akun organisasi Anda</p>
      </div>

      <Field label="Email" required>
        <Input name="email" type="email" required placeholder="nama@perusahaan.com" autoComplete="email" />
      </Field>

      <Field label="Kata Sandi" required>
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}

      <Tombol />

      <div className="text-[13px] text-center text-[color:var(--text-2)]">
        <Link href="/lupa-kata-sandi" className="hover:text-[color:var(--text)]">Lupa kata sandi?</Link>
      </div>
    </form>
  );
}