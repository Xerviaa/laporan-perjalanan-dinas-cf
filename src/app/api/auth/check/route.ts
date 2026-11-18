import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    let isAdmin = false;
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        
        // KUNCI UTAMA: Hanya berikan status admin jika payload token memiliki role 'admin'
        if (payload.role === 'admin') {
          isAdmin = true;
        }
      } catch (error) {
        // Token tidak valid atau kedaluwarsa
        isAdmin = false;
      }
    }

    return NextResponse.json({ 
      isAdmin: isAdmin,
      hasSession: isAdmin 
    });

  } catch (error) {
    return NextResponse.json({ isAdmin: false, hasSession: false });
  }
}