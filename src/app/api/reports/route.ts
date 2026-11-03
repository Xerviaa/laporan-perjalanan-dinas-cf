import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));

    // Tentukan tanggal awal bulan ini dan awal bulan depan
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Filter laporan: Hanya ambil yang di-upload bulan ini (untuk leaderboard)
    const reportsThisMonth = allReports.filter(r => {
      const createdAt = new Date(r.createdAt!);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    });

    // Tambahkan status tepat waktu / terlambat
    const reportsWithStatus = allReports.map(r => {
      let status = "TEPAT WAKTU";
      if (r.deadline && new Date(r.createdAt!) > new Date(r.deadline)) {
        status = "TERLAMBAT";
      }
      return { ...r, status };
    });

    // Hitung Leaderboard KHUSUS bulan ini
    const pegawaiMap = new Map();
    
    reportsThisMonth.forEach(report => {
      // PERBAIKAN: Gunakan kolom uploadedBy (sesuai schema.ts)
      const namaPegawai = report.uploadedBy || "Tidak Diketahui";
      
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

    // Urutkan leaderboard
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