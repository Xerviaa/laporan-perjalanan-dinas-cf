import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');
const ADMIN_PIN = '123456'; // Ganti PIN sesuai keinginan

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (pin === ADMIN_PIN) {
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(SECRET_KEY);

      const response = NextResponse.json({ success: true, message: 'Login berhasil' });
      
      response.cookies.set({
        name: 'session_token',
        value: token,
        httpOnly: true,
        secure: false, // <-- Biarkan false untuk development
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    return NextResponse.json({ message: 'PIN Salah!' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}