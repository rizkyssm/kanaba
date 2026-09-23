'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { aturUlangSandiAction } from '@/features/auth/actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Kata Sandi Baru'}
    </Button>
  );
}

export default function AturUlangPage() {
  const [state, action] = useActionState(aturUlangSandiAction, null as any);

  return (
    <form action={action} className="space-y-5">
      <div className="text-center">
        <div className="text-[20px] font-semibold tracking-tight">Atur Ulang Kata Sandi</div>
        <p className="text-[13px] text-[color:var(--text-2)] mt-1">Masukkan kata sandi baru Anda.</p>
      </div>

      <Field label="Kata Sandi Baru" required>
        <Input name="password" type="password" required minLength={6} autoComplete="new-password" />
      </Field>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}

      <Tombol />
    </form>
  );
}