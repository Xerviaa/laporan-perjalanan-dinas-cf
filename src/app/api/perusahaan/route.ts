import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { perusahaan } from '@/db/schema';
import { perusahaanHACCP, perusahaanSKP } from '@/data/perusahaan';

export async function GET() {
  try {
    const db = getDb();
    
    // 1. Ambil data dari database (data yang diinput manual oleh user)
    const dbPerusahaan = await db.select().from(perusahaan);

    // 2. Gabungkan data statis (HACCP & SKP) dengan data dari database
    const allPerusahaan = [
      ...perusahaanHACCP, 
      ...perusahaanSKP, 
      ...dbPerusahaan.map(p => ({ nama: p.nama, alamat: p.alamat }))
    ];

    // 3. Saring data agar tidak ada duplikat nama perusahaan
    const uniquePerusahaan = allPerusahaan.filter((v, i, a) => 
      a.findIndex(t => t.nama.toLowerCase() === v.nama.toLowerCase()) === i
    );

    // 4. Urutkan data berdasarkan nama (opsional, agar rapi)
    uniquePerusahaan.sort((a, b) => a.nama.localeCompare(b.nama));

    return NextResponse.json({ 
      status: 'success', 
      data: uniquePerusahaan 
    });
  } catch (error) {
    console.error("Gagal mengambil data perusahaan:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Gagal mengambil data perusahaan' 
    }, { status: 500 });
  }
}