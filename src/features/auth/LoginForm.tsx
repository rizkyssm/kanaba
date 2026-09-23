'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { masukAction } from './actions';
import Link from 'next/link';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-blue text-white py-2 font-medium disabled:opacity-60"
    >
      {pending ? 'Memproses…' : 'Masuk'}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState(masukAction, null as any);
  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Masuk KANABA</h1>
        <p className="text-sm text-[color:var(--text-2)]">Gunakan akun organisasi Anda.</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm">Email</label>
        <input name="email" type="email" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      <div className="space-y-1">
        <label className="text-sm">Kata Sandi</label>
        <input name="password" type="password" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" />
      </div>
      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      <Tombol />
      <div className="text-sm text-center text-[color:var(--text-2)]">
        <Link href="/lupa-kata-sandi" className="hover:underline">Lupa kata sandi?</Link>
      </div>
    </form>
  );
}