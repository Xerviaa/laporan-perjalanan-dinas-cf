import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ isAdmin: false });
    }

    // Verifikasi token
    await jwtVerify(token, SECRET_KEY);
    
    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}