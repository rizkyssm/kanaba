'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

export async function tandaiDibacaAction(id: string) {
  const ctx = await getKonteks();
  if (!ctx) return { error: 'Belum login.' };
  const supabase = await createClient();
  await supabase
    .from('notifikasi')
    .update({ dibaca: true, dibaca_at: new Date().toISOString() })
    .eq('id', id).eq('penerima_id', ctx.userId);
  revalidatePath('/notifikasi');
  revalidatePath('/beranda');
  return { sukses: true };
}

export async function tandaiSemuaDibacaAction() {
  const ctx = await getKonteks();
  if (!ctx) return { error: 'Belum login.' };
  const supabase = await createClient();
  await supabase
    .from('notifikasi')
    .update({ dibaca: true, dibaca_at: new Date().toISOString() })
    .eq('penerima_id', ctx.userId)
    .eq('dibaca', false);
  revalidatePath('/notifikasi');
  revalidatePath('/beranda');
  return { sukses: true };
}