import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: 'Email dan password baru wajib diisi.' }, { status: 400 });
    }

    // Inisialisasi Supabase dengan SERVICE_ROLE_KEY (Hanya boleh di server!)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Pastikan variabel ini ada di .env / Cloudflare
    );

    // 1. Cari user berdasarkan email
    const { data: usersData, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      return NextResponse.json({ message: 'Gagal mencari user: ' + searchError.message }, { status: 500 });
    }

    const user = usersData.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ message: 'Email tidak terdaftar dalam sistem.' }, { status: 404 });
    }

    // 2. Update password user tersebut
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json({ message: 'Gagal mengubah password: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password berhasil diubah.' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Terjadi kesalahan server: ' + error.message }, { status: 500 });
  }
}