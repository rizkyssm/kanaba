import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type Jenis =
  | 'login_gagal' | 'login_berhasil' | 'logout'
  | 'akses_ditolak' | 'cross_organisasi' | 'privilege_escalation'
  | 'token_invalid' | 'session_kedaluwarsa'
  | 'upload_invalid' | 'rate_limit'
  | 'mfa_enrolled' | 'mfa_verified' | 'mfa_disabled' | 'mfa_gagal';

type Opsi = {
  jenis: Jenis;
  organisasiId?: string | null;
  profilId?: string | null;
  detail?: Record<string, any>;
  supabase?: SupabaseClient<any>;
};

/**
 * Catat security event. Aman dipanggil dari server action / route handler.
 * Untuk konteks belum login, kirim supabase = createClient() agar RLS insert tetap valid.
 */
export async function catatSecurityEvent(opts: Opsi) {
  try {
    const supabase = opts.supabase ?? (await createClient());
    await supabase.from('security_event').insert({
      jenis: opts.jenis,
      organisasi_id: opts.organisasiId ?? null,
      profil_id: opts.profilId ?? null,
      detail: opts.detail ?? null,
    });
  } catch {
    // sengaja tidak throw — security logging tidak boleh mengganggu flow utama
  }
}