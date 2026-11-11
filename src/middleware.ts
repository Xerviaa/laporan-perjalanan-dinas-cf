import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Proteksi seluruh area /admin
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Lempar ke halaman utama (karena login pakai modal)
      return NextResponse.redirect(new URL('/monitoring-dashboard', request.url));
    }
    try {
      await jwtVerify(token, SECRET_KEY);
    } catch (error) {
      const response = NextResponse.redirect(new URL('/monitoring-dashboard', request.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};