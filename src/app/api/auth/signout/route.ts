import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  // 1. Tambahkan 'await' di sini
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { 
          return cookieStore.get(name)?.value 
        },
        set(name: string, value: string, options: CookieOptions) {
          // 2. Karena cookieStore sudah di-await, kita bisa memanggil .set
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // 3. Sama, kita bisa memanggil .set untuk menghapus
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Hapus sesi login Supabase
  await supabase.auth.signOut()

  return NextResponse.json({ success: true, message: 'Logout Supabase berhasil' })
}