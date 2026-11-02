import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ status: "success", message: "Logout berhasil" });
  
  // Hapus cookie dengan mengatur Max-Age menjadi 0
  response.cookies.set({
    name: 'session_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Ini yang menghapus cookie
  });
  
  return response;
}