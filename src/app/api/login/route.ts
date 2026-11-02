import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

// Kunci rahasia untuk mengenkripsi cookie (bebas, asal panjang)
const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Cek apakah username dan password sesuai permintaan
    if (username !== 'admin.id' || password !== 'admin123') {
      return NextResponse.json({ status: "error", message: "Username atau password salah!" }, { status: 401 });
    }

    // Buat token JWT (berlaku 1 hari)
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(SECRET_KEY);

    // Simpan token ke dalam cookie
    const response = NextResponse.json({ status: "success", message: "Login berhasil" });
    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 hari
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}