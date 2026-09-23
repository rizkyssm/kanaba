'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SkemaMasuk = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

export async function masukAction(_prev: any, formData: FormData) {
  const parsed = SkemaMasuk.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Email atau kata sandi salah.' };
  redirect('/beranda');
}

export async function keluarAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/masuk');
}

export async function lupaSandiAction(_prev: any, formData: FormData) {
  const email = String(formData.get('email') || '');
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/atur-ulang-kata-sandi`,
  });
  if (error) return { error: 'Gagal mengirim email reset.' };
  return { sukses: true };
}

export async function aturUlangSandiAction(_prev: any, formData: FormData) {
  const password = String(formData.get('password') || '');
  if (password.length < 6) return { error: 'Kata sandi minimal 6 karakter.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: 'Gagal memperbarui kata sandi.' };
  redirect('/beranda');
}