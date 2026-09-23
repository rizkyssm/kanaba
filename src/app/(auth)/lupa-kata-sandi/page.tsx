'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { lupaSandiAction } from '@/features/auth/actions';
import Link from 'next/link';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded bg-blue text-white py-2 font-medium disabled:opacity-60">
      {pending ? 'Mengirim…' : 'Kirim Tautan Reset'}
    </button>
  );
}

export default function LupaSandiPage() {
  const [state, action] = useActionState(lupaSandiAction, null as any);
  return (
    <form action={action} className="space-y-4">
      <h1 className="text-lg font-semibold">Lupa Kata Sandi</h1>
      <p className="text-sm text-[color:var(--text-2)]">Kami akan mengirim tautan reset ke email Anda.</p>
      <input name="email" type="email" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" placeholder="Email" />
      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      {state?.sukses && <p className="text-sm text-green">Email reset terkirim. Cek kotak masuk Anda.</p>}
      <Tombol />
      <div className="text-sm text-center text-[color:var(--text-2)]">
        <Link href="/masuk" className="hover:underline">Kembali ke halaman masuk</Link>
      </div>
    </form>
  );
}