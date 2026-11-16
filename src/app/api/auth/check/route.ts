import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const SECRET_KEY = new TextEncoder().encode('rahasia-negara-laporan-dinas-2026');

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // 1. Cek Sesi Login Supabase (Pegawai)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Cek PIN Admin (Cookie session_token)
    const token = cookieStore.get('session_token')?.value;
    let isAdminPinValid = false;
    
    if (token) {
      try {
        await jwtVerify(token, SECRET_KEY);
        isAdminPinValid = true;
      } catch (error) {
        // Token PIN tidak valid (kedaluwarsa atau salah)
      }
    }

    // 3. Tentukan Status Admin
    // Admin sejati adalah yang sudah login Supabase DAN memiliki PIN valid
    // Jika hanya pegawai biasa (login Supabase tapi tidak punya PIN), isAdmin = false
    const isAdmin = !!session && isAdminPinValid;

    return NextResponse.json({ 
      isAdmin: isAdmin,
      hasSession: !!session 
    });

  } catch (error) {
    return NextResponse.json({ isAdmin: false, hasSession: false });
  }
}