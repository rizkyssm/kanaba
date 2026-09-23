'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { aturUlangSandiAction } from '@/features/auth/actions';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded bg-blue text-white py-2 font-medium disabled:opacity-60">
      {pending ? 'Menyimpan…' : 'Simpan Kata Sandi Baru'}
    </button>
  );
}

export default function AturUlangPage() {
  const [state, action] = useActionState(aturUlangSandiAction, null as any);
  return (
    <form action={action} className="space-y-4">
      <h1 className="text-lg font-semibold">Atur Ulang Kata Sandi</h1>
      <input name="password" type="password" required className="w-full rounded border border-[color:var(--border)] px-3 py-2 bg-transparent" placeholder="Kata sandi baru" />
      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      <Tombol />
    </form>
  );
}