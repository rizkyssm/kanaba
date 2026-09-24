import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const RUTE_SENSITIF = [
  '/biaya', '/analitik', '/laporan',
  '/admin', '/data-induk/kategori-biaya', '/data-induk/pusat-biaya',
  '/pengaturan/keamanan',
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();

  const publik = [
    '/masuk', '/lupa-kata-sandi', '/atur-ulang-kata-sandi',
    '/auth', '/pilih-organisasi', '/mfa',
  ];
  const isPublik = publik.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + '/')
  );

  // Belum login & bukan rute publik → /masuk
  if (!user && !isPublik) {
    url.pathname = '/masuk';
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Sudah login tapi buka halaman auth → /beranda (kecuali /mfa)
  const halamanAuth = ['/masuk', '/lupa-kata-sandi', '/atur-ulang-kata-sandi'];
  if (user && halamanAuth.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))) {
    url.pathname = '/beranda';
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Cek AAL untuk rute sensitif
  if (user && !isPublik && RUTE_SENSITIF.some((p) => url.pathname.startsWith(p))) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    // Jika ada nextLevel aal2 tapi current masih aal1 → wajib verifikasi
    if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
      url.pathname = '/mfa/verifikasi';
      url.search = '';
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      return redirect;
    }
  }

  return supabaseResponse;
}