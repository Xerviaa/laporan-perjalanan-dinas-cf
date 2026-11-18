import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { getDb } from '@/db'; // Mengimpor getDb()
import { dataPenelitianPegawai } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Kunci rahasia untuk mengenkripsi cookie
const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Panggil getDb() untuk mendapatkan instance Drizzle ORM
    const db = getDb();

    // 1. Cari data pegawai langsung ke tabel kustom menggunakan Drizzle ORM
    const pegawai = await db
      .select()
      .from(dataPenelitianPegawai)
      .where(
        and(
          eq(dataPenelitianPegawai.emailDummy, email),
          eq(dataPenelitianPegawai.passwordMentah, password)
        )
      )
      .limit(1);

    // 2. Jika data tidak ditemukan di database
    if (pegawai.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Email atau password salah!" }, 
        { status: 401 }
      );
    }

    const user = pegawai[0];

    // 3. Buat token JWT (berlaku 1 hari)
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.emailDummy, 
      nama: user.namaPegawai 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(SECRET_KEY);

    // 4. Simpan token ke dalam cookie
    const response = NextResponse.json({ status: "success", message: "Login berhasil", user });
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