import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // Rute yang bebas diakses tanpa login
  const publik = ['/masuk', '/lupa-kata-sandi', '/atur-ulang-kata-sandi', '/auth', '/pilih-organisasi'];
  const isPublik = publik.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'));

  if (!user && !isPublik) {
    url.pathname = '/masuk';
    const redirect = NextResponse.redirect(url);
    // Salin cookie dari supabaseResponse agar session tetap sinkron
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Sudah login tapi membuka halaman auth → arahkan ke beranda
  const halamanAuth = ['/masuk', '/lupa-kata-sandi', '/atur-ulang-kata-sandi'];
  if (user && halamanAuth.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))) {
    url.pathname = '/beranda';
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return supabaseResponse;
}