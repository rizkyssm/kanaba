import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import MfaSetup from '@/features/auth/MfaSetup';

export default async function KeamananPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: { user } }, { data: faktor }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.mfa.listFactors(),
  ]);
  const { data: profil } = user
    ? await supabase.from('profil').select('mfa_required').eq('id', user.id).maybeSingle()
    : { data: null };

  const daftarFaktor = (faktor?.totp ?? []).map((f: any) => ({
    id: f.id,
    friendly_name: f.friendly_name,
    status: f.status,
    created_at: f.created_at,
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb items={[{ label: 'Pengaturan', href: '/pengaturan' }, { label: 'Keamanan' }]} />
      <PageHeader
        title="Keamanan Akun"
        subtitle="Kelola autentikasi dua faktor dan sesi login Anda."
      />
      <MfaSetup faktorAktif={daftarFaktor} wajib={!!profil?.mfa_required} />
    </div>
  );
}