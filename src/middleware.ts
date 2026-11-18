import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. PENGECUALIAN RUTE PUBLIK
  if (pathname.startsWith('/reset-password') || pathname.startsWith('/forgot-password')) {
    return NextResponse.next();
  }

  // ========================================================
  // 1. PROTEKSI HALAMAN PEGAWAI (Supabase Auth) - DIPERBARUI
  // ========================================================
  if (pathname.startsWith('/upload') || pathname.startsWith('/arsip') || pathname.startsWith('/guest-monitoring-dashboard')) {
    let response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // --- TAMBAHAN: Cek Role untuk mencegah Guest masuk ke Admin ---
    // Asumsi: Anda menyimpan role di user_metadata Supabase, misal: session.user.user_metadata.role
    const userRole = session.user.user_metadata?.role || 'guest'; 

    // Jika Guest mencoba mengakses halaman admin lewat URL, tendang ke dashboard guest
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
       return NextResponse.redirect(new URL('/guest-monitoring-dashboard', request.url));
    }

    return response;
  }

  // ========================================================
  // 2. PROTEKSI HALAMAN ADMIN (PIN JWT)
  // ========================================================
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login-pin') return NextResponse.next();

    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login-pin', request.url));
    }

    try {
      await jwtVerify(token, SECRET_KEY);
    } catch (error) {
      const response = NextResponse.redirect(new URL('/admin/login-pin', request.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};