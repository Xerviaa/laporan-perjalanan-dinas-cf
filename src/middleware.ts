import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ========================================================
  // 1. PROTEKSI HALAMAN PEGAWAI (Supabase Auth)
  // ========================================================
  if (pathname.startsWith('/upload') || pathname.startsWith('/arsip')) {
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
    return response;
  }

  // ========================================================
  // 2. PROTEKSI HALAMAN ADMIN (PIN JWT)
  // ========================================================
  if (pathname.startsWith('/admin')) {
    // PENTING: Jangan proteksi halaman login PIN itu sendiri
    if (pathname === '/admin/login-pin') {
      return NextResponse.next();
    }

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
  matcher: ['/admin/:path*', '/upload/:path*', '/arsip/:path*'],
};