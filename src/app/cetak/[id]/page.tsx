import TombolCetak from "@/components/TombolCetak";
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
  let data = result[0];

  if (!data) {
    return <div className="p-10 text-xl font-bold text-center mt-20">Laporan tidak ditemukan.</div>;
  }

  // =========================================================
  // TRIK PENTING: Membersihkan nama petugas dari gelar "drh."
  // agar template lama bisa menemukan gambar TTD.
  // =========================================================
  if (data.petugasPelaksana) {
    const petugasBersih = data.petugasPelaksana
      .split('|')
      .map((p: string) => {
        // Hapus "drh." di awal nama, tapi biarkan format jabatan dalam kurung
        return p.replace(/^drh\.\s*/i, '');
      })
      .join('|');
    
    // Timpa data asli dengan data yang sudah bersih
    data = { ...data, petugasPelaksana: petugasBersih };
  }
  // =========================================================

  // Render template berdasarkan jenis kegiatan
  let kontenLaporan = null;
  
  if (data.jenisKegiatan?.includes("CPIB")) {
    kontenLaporan = <TemplateInspeksiCPIBKapal data={data} />;
  } 
  else if (data.jenisKegiatan?.includes("HACCP") && data.jenisKegiatan?.includes("Survailen")) {
    kontenLaporan = <TemplateSurveilanHACCP data={data} />;
  }
  else if (data.jenisKegiatan?.includes("HACCP")) {
    kontenLaporan = <TemplateInspeksiHACCP data={data} />;
  }
  else if (data.jenisKegiatan?.includes("SKP")) {
    kontenLaporan = <TemplateInspeksiSKP data={data} />;
  }
  else {
    kontenLaporan = <div className="text-center p-10">Template untuk "{data.jenisKegiatan}" belum tersedia.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0">
      <TombolCetak />
      
      {/* CONTAINER UTAMA UNTUK KERTAS A4 */}
      <div className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none print:w-full print:mx-0">
        
        {/* LANGSUNG TAMPILKAN ISI LAPORAN (COVER SUDAH ADA DI DALAM TEMPLATE) */}
        <div className="w-[21cm] min-h-[29.7cm] p-[2cm] print:w-full print:min-h-0 print:p-0">
          {kontenLaporan}
        </div>

      </div>
    </div>
  );
}