import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { dataPenelitianPegawai } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { nama, email, password } = await request.json();

    if (!nama || !email || !password) {
      return NextResponse.json(
        { status: "error", message: "Semua kolom wajib diisi!" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Cek apakah email sudah terdaftar di database
    const existing = await db
      .select()
      .from(dataPenelitianPegawai)
      .where(eq(dataPenelitianPegawai.emailDummy, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { status: "error", message: "Email sudah terdaftar!" },
        { status: 400 }
      );
    }

    // 2. Simpan data baru secara langsung ke tabel data_penelitian_pegawai
    await db.insert(dataPenelitianPegawai).values({
      namaPegawai: nama,
      emailDummy: email,
      passwordMentah: password, // Menyimpan password mentah untuk kebutuhan analisis skripsi
    });

    return NextResponse.json({ 
      status: "success", 
      message: "Registrasi berhasil! Silakan login." 
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}