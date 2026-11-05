import TombolCetak from "@/components/TombolCetak";
// 1. UBAH NAMA VARIABEL IMPORT DI SINI
import TemplateInspeksiCPIBKapal from "@/components/cetak/TemplateInspeksiCPIBKapal";
import TemplateInspeksiHACCP from "@/components/cetak/TemplateInspeksiHACCP";
import TemplateInspeksiSKP from "@/components/cetak/TemplateInspeksiSKP";
import TemplateSurveilanHACCP from "@/components/cetak/TemplateSurveilanHACCP";
import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakLaporan({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idLaporan = Number(resolvedParams.id);

  // Ambil data dari database
  const db = getDb(); 
  const result = await db.select().from(reports).where(eq(reports.id, idLaporan));
  const data = result[0];

  if (!data) {
    return <div className="p-10 text-xl font-bold text-center mt-20">Laporan tidak ditemukan.</div>;
  }

  // Format tanggal untuk halaman COVER
  const formatTanggalCover = (tgl: string | Date | null) => {
    if (!tgl) return "-";
    try {
      const date = new Date(tgl);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return "-";
    }
  };

  // Render template berdasarkan jenis kegiatan
  let kontenLaporan = null;
  if (data.jenisKegiatan === "Primer - Inspeksi - Inspeksi CPIB Kapal") {
    // 2. UBAH NAMA KOMPONEN YANG DIPANGGIL DI SINI
    kontenLaporan = <TemplateInspeksiCPIBKapal data={data} />;
  } 
  else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi HACCP") {
    // 3. UBAH NAMA KOMPONEN YANG DIPANGGIL DI SINI
    kontenLaporan = <TemplateInspeksiHACCP data={data} />;
  }
  else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi SKP") {
    kontenLaporan = <TemplateInspeksiSKP data={data} />;
  }
  else if (data.jenisKegiatan === "Pasca - Survailen - Survailen HACCP") {
    kontenLaporan = <TemplateSurveilanHACCP data={data} />;
  }
  else {
    kontenLaporan = <div>Template belum tersedia.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0">
      <TombolCetak />
      <div className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none">
        
        {/* HALAMAN 1: COVER */}
        <div className="w-[21cm] h-[29.7cm] p-[2cm] flex flex-col justify-between items-center text-center font-serif print:break-after-page relative">
          <div className="mt-10 w-full">
            <h1 className="text-[16pt] font-bold uppercase leading-tight mb-4">
              PELAPORAN PERJALANAN DINAS
            </h1>
            <h2 className="text-[14pt] font-bold uppercase leading-tight">
              {data.jenisKegiatan?.replace(/-/g, '\n')}
            </h2>
            <div className="mt-8 space-y-2">
              <p className="font-bold text-[14pt] uppercase">{data.namaPerusahaan}</p>
              {/* TANGGAL SUDAH DIFORMAT */}
              <p className="font-bold text-[14pt] uppercase">{formatTanggalCover(data.tanggal)}</p>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img src="/logo-kkp.png" alt="Logo KKP" className="w-40 h-40 object-contain mx-auto" />
          </div>
          <div className="mb-10 w-full">
            <h3 className="text-[14pt] font-bold uppercase leading-tight">
              KEMENTERIAN KELAUTAN DAN PERIKANAN<br/>
              BADAN PENGENDALIAN DAN PENGAWASAN MUTU<br/>
              HASIL KELAUTAN DAN PERIKANAN<br/>
              BALAI PPMHKP DENPASAR<br/>
              2026
            </h3>
          </div>
        </div>

        {/* HALAMAN 2: ISI LAPORAN */}
        <div className="w-[21cm] min-h-[29.7cm] p-[2cm]">
          {kontenLaporan}
        </div>

      </div>
    </div>
  );
}