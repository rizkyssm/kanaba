import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';

export default async function OperasionalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getKonteks();
  if (!ctx) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/pilih-organisasi');
    redirect('/masuk');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--bg-subtle)]">
      <TopNav ctx={{ namaLengkap: ctx.namaLengkap, email: ctx.email, organisasiNama: ctx.organisasiNama }} />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}