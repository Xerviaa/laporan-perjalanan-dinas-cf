import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email dan password wajib diisi!" }, 
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { status: "error", message: "Konfigurasi Supabase di .env belum lengkap!" }, 
        { status: 500 }
      );
    }

    // Menggunakan Supabase Client (HTTP/Fetch via Port 443) - 100% Anti-Hang
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: users, error } = await supabase
      .from('data_penelitian_pegawai')
      .select('*')
      .eq('email_dummy', email)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", message: `Database error: ${error.message}` }, 
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Email atau password salah!" }, 
        { status: 401 }
      );
    }

    const user = users[0];

    // Verifikasi password mentah untuk penelitian skripsi
    if (user.password_mentah !== password) {
      return NextResponse.json(
        { status: "error", message: "Email atau password salah!" }, 
        { status: 401 }
      );
    }

    // Buat token JWT
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email_dummy, 
      nama: user.nama_pegawai 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(SECRET_KEY);

    const response = NextResponse.json({ status: "success", message: "Login berhasil", user });
    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Terjadi kesalahan pada server." }, 
      { status: 500 }
    );
  }
}