import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Daftar rute yang HANYA boleh diakses Admin
  // Pastikan /upload atau /arsip (guest) TIDAK masuk di sini
  const protectedRoutes = ['/admin']; 
  
  // Cek apakah pathname saat ini termasuk rute yang diproteksi
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    if (!token) {
      // Jika tidak ada token, tendang ke halaman guest (dashboard)
      return NextResponse.redirect(new URL('/monitoring-dashboard', request.url));
    }
    try {
      await jwtVerify(token, SECRET_KEY);
    } catch (error) {
      // Jika token tidak valid, hapus cookie & tendang ke guest
      const response = NextResponse.redirect(new URL('/monitoring-dashboard', request.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // HANYA jalankan middleware di rute /admin
  matcher: ['/admin/:path*'],
};