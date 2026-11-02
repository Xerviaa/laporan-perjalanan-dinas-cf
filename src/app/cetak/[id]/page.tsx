import TombolCetak from "@/components/TombolCetak";
import TemplateCPIB from "@/components/cetak/TemplateCPIB";
import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakLaporan({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idLaporan = Number(resolvedParams.id);

  try {
    // Panggil database
    const db = await getDb(process.env.DIRECT_URL!);
    
    // Ambil data
    const result = await db.select().from(reports).where(eq(reports.id, idLaporan));
    const data = result[0];

    // Jika data tidak ada, langsung tampilkan pesan
    if (!data) {
      return (
        <div className="p-10 text-xl font-bold text-center mt-20">
          Laporan dengan ID {idLaporan} tidak ditemukan di database.
        </div>
      );
    }

    // Jika data ADA, tampilkan laporan
    return (
      <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0">
        <TombolCetak />
        <div className="mx-auto w-[21cm] min-h-[29.7cm] bg-white p-[2cm] shadow-xl print:shadow-none">
          
          {/* KOP SURAT */}
          <div className="flex items-center border-b-[3px] border-black pb-4 mb-6">
            <img src="/logo-kkp.png" alt="Logo" className="w-24 h-24 object-contain mr-6" />
            <div className="text-center flex-1 font-serif">
              <h1 className="text-lg font-bold uppercase">Kementerian Kelautan dan Perikanan</h1>
              <h2 className="text-lg font-bold uppercase">Badan Pengendalian dan Pengawasan Mutu Hasil Kelautan dan Perikanan</h2>
              <h3 className="text-xl font-bold uppercase">Balai PPMHKP Denpasar</h3>
            </div>
          </div>

          {/* RENDER TEMPLATE */}
          {data.jenisKegiatan === "CPIB" && <TemplateCPIB data={data} />}
          
        </div>
      </div>
    );

  } catch (error) {
    // Jika database gagal terkoneksi
    console.error("Gagal koneksi ke database:", error);
    return (
      <div className="p-10 text-red-500 font-bold mt-20 text-center">
        Error koneksi database. Cek terminal VS Code untuk detailnya.
      </div>
    );
  }
}