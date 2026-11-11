import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
  
  // Hapus cookie secara paksa dari sisi server
  response.cookies.set({
    name: 'session_token',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0, // 0 artinya langsung hapus
  });

  return response;
}