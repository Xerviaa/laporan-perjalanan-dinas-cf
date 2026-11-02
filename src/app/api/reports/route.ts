import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = await getDb(process.env.DATABASE_URL!);
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));

    // 1. Tentukan tanggal awal bulan ini dan awal bulan depan
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 2. Filter laporan: Hanya ambil yang di-upload bulan ini
    const reportsThisMonth = allReports.filter(r => {
      const createdAt = new Date(r.createdAt!);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    });

    // 3. Tambahkan status tepat waktu / terlambat
    const reportsWithStatus = allReports.map(r => {
      let status = "TEPAT WAKTU";
      if (r.deadline && new Date(r.createdAt!) > new Date(r.deadline)) {
        status = "TERLAMBAT";
      }
      return { ...r, status };
    });

    // 4. Hitung Leaderboard KHUSUS bulan ini
    const pegawaiMap = new Map();
    
    reportsThisMonth.forEach(report => {
      if (!pegawaiMap.has(report.uploadedBy)) {
        pegawaiMap.set(report.uploadedBy, { 
          nama: report.uploadedBy, 
          totalLaporan: 0, 
          totalTepatWaktu: 0 
        });
      }
      
      const data = pegawaiMap.get(report.uploadedBy);
      data.totalLaporan += 1;

      // Cek apakah upload sebelum deadline
      if (report.deadline && new Date(report.createdAt!) <= new Date(report.deadline)) {
        data.totalTepatWaktu += 1;
      }
    });

    // 5. Urutkan berdasarkan yang paling banyak tepat waktu
    const leaderboard = Array.from(pegawaiMap.values())
      .sort((a, b) => b.totalTepatWaktu - a.totalTepatWaktu || b.totalLaporan - a.totalLaporan)
      .slice(0, 5);

    return Response.json({ 
      status: "success", 
      data: reportsWithStatus,
      leaderboard: leaderboard 
    });
  } catch (error: any) {
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}