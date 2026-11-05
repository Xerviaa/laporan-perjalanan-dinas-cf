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
  const data = result[0];

  if (!data) {
    return <div className="p-10 text-xl font-bold text-center mt-20">Laporan tidak ditemukan.</div>;
  }

  // Render template berdasarkan jenis kegiatan
  let kontenLaporan = null;
  if (data.jenisKegiatan === "Primer - Inspeksi - Inspeksi CPIB Kapal") {
    kontenLaporan = <TemplateInspeksiCPIBKapal data={data} />;
  } 
  else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi HACCP") {
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
      
      {/* CONTAINER UTAMA UNTUK KERTAS A4 */}
      <div className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none">
        
        {/* LANGSUNG TAMPILKAN ISI LAPORAN (COVER SUDAH ADA DI DALAM TEMPLATE) */}
        <div className="w-[21cm] min-h-[29.7cm] p-[2cm]">
          {kontenLaporan}
        </div>

      </div>
    </div>
  );
}