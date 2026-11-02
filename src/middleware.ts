import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;

  // Jika tidak ada token dan mencoba akses halaman terlindungi
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      
      // Jika sudah login tapi buka halaman /login, lempar ke dashboard
      if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/arsip/:path*', '/pengaturan/:path*', '/login'],
};