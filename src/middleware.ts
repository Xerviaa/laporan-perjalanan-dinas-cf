import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. PENGECUALIAN RUTE PUBLIK (Bebas diakses tanpa login)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. PROTEKSI HALAMAN UTAMA / UPLOAD / ARSIP / ADMIN
  // Semua halaman ini sekarang dilindungi oleh session_token JWT kustom kita
  if (
    pathname.startsWith('/upload') ||
    pathname.startsWith('/arsip') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/guest-monitoring-dashboard') ||
    pathname === '/'
  ) {
    const token = request.cookies.get('session_token')?.value;

    // Jika tidak ada token, tendang ke halaman login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verifikasi keabsahan token JWT
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (error) {
      // Jika token invalid atau kadaluarsa, hapus cookie dan arahkan ke login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};