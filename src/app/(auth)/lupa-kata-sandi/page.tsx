'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { lupaSandiAction } from '@/features/auth/actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Mengirim…' : 'Kirim Tautan Reset'}
    </Button>
  );
}

export default function LupaSandiPage() {
  const [state, action] = useActionState(lupaSandiAction, null as any);

  return (
    <form action={action} className="space-y-5">
      <div className="text-center">
        <div className="text-[20px] font-semibold tracking-tight">Lupa Kata Sandi</div>
        <p className="text-[13px] text-[color:var(--text-2)] mt-1">
          Kami akan mengirim tautan reset ke email Anda.
        </p>
      </div>

      <Field label="Email" required>
        <Input name="email" type="email" required placeholder="nama@perusahaan.com" />
      </Field>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      {state?.sukses && <p className="text-sm text-green">Email reset terkirim. Cek kotak masuk Anda.</p>}

      <Tombol />

      <div className="text-[13px] text-center text-[color:var(--text-2)]">
        <Link href="/masuk" className="hover:text-[color:var(--text)]">Kembali ke halaman masuk</Link>
      </div>
    </form>
  );
}