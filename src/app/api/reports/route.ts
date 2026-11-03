import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Panggil getDb() tanpa parameter karena sudah pakai Hyperdrive
    const db = getDb();
    
    // 2. Ambil data dari database
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));

    // 3. Tentukan tanggal awal bulan ini dan awal bulan depan
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 4. Filter laporan: Hanya ambil yang di-upload bulan ini (untuk leaderboard)
    const reportsThisMonth = allReports.filter(r => {
      const createdAt = new Date(r.createdAt!);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    });

    // 5. Tambahkan status tepat waktu / terlambat
    const reportsWithStatus = allReports.map(r => {
      let status = "TEPAT WAKTU";
      if (r.deadline && new Date(r.createdAt!) > new Date(r.deadline)) {
        status = "TERLAMBAT";
      }
      return { ...r, status };
    });

    // 6. Hitung Leaderboard KHUSUS bulan ini
    const pegawaiMap = new Map();
    
    reportsThisMonth.forEach(report => {
      // GUNAKAN KOLOM pembuatLaporan (sesuai form baru)
      const namaPegawai = report.pembuatLaporan || "Tidak Diketahui";
      
      if (!pegawaiMap.has(namaPegawai)) {
        pegawaiMap.set(namaPegawai, { 
          nama: namaPegawai, 
          totalLaporan: 0, 
          totalTepatWaktu: 0 
        });
      }
      
      const data = pegawaiMap.get(namaPegawai);
      data.totalLaporan += 1;

      if (report.deadline && new Date(report.createdAt!) <= new Date(report.deadline)) {
        data.totalTepatWaktu += 1;
      }
    });

    // 7. Urutkan leaderboard
    const leaderboard = Array.from(pegawaiMap.values())
      .sort((a, b) => b.totalTepatWaktu - a.totalTepatWaktu || b.totalLaporan - a.totalLaporan)
      .slice(0, 5);

    return Response.json({ 
      status: "success", 
      data: reportsWithStatus,
      leaderboard: leaderboard 
    });
  } catch (error: any) {
    console.error("API Reports Error:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}