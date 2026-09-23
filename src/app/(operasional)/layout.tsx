import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';

export default async function OperasionalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getKonteks();

  if (!ctx) {
    // Cek: apakah user login?
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Login tapi tidak punya organisasi → ke pilih-organisasi, BUKAN /masuk
    if (user) redirect('/pilih-organisasi');
    redirect('/masuk');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--bg)]">
      <TopNav ctx={{ namaLengkap: ctx.namaLengkap, organisasiNama: ctx.organisasiNama }} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}