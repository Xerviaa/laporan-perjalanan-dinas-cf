import TombolCetak from "@/components/TombolCetak";
import TemplateInspeksiCPIBKapal from "@/components/cetak/TemplateInspeksiCPIBKapal";
import TemplateInspeksiHACCP from "@/components/cetak/TemplateInspeksiHACCP";
import TemplateInspeksiSKP from "@/components/cetak/TemplateInspeksiSKP";
import TemplateSurveilanHACCP from "@/components/cetak/TemplateSurveilanHACCP";
// IMPORT TEMPLATE BARU
import TemplateInspeksiCPIB from "@/components/cetak/TemplateInspeksiCPIB";
import TemplateInspeksiCBIB from "@/components/cetak/TemplateInspeksiCBIB";
import TemplateSurveilanCBIB from "@/components/cetak/TemplateSurveilanCBIB";

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakLaporan({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ mode?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const idLaporan = Number(resolvedParams.id);
  const isPdfMode = resolvedSearchParams.mode === 'pdf';

  const db = getDb(); 
  const result = await db.select().from(reports).where(eq(reports.id, idLaporan));
  let data = result[0];

  if (!data) {
    return <div className="p-10 text-xl font-bold text-center mt-20">Laporan tidak ditemukan.</div>;
  }

  if (data.petugasPelaksana) {
    const petugasBersih = data.petugasPelaksana
      .split('|')
      .map((p: string) => p.replace(/^drh\.\s*/i, ''))
      .join('|');
    data = { ...data, petugasPelaksana: petugasBersih };
  }

  let kontenLaporan = null;
  
  // --- LOGIKA PEMILIHAN TEMPLATE (URUTAN SUDAH DIPERBAIKI) ---
  const jenis = data.jenisKegiatan?.toLowerCase() || "";

  if (jenis.includes("surveilan cbib") || jenis.includes("survailen cbib")) {
    kontenLaporan = <TemplateSurveilanCBIB data={data} />;
  }
  else if (jenis.includes("inspeksi cbib")) {
    kontenLaporan = <TemplateInspeksiCBIB data={data} />;
  }
  // CEK CPIB KAPAL DULU SEBELUM INSPEKSI CPIB
  else if (jenis.includes("cpib kapal")) {
    kontenLaporan = <TemplateInspeksiCPIBKapal data={data} />;
  }
  else if (jenis.includes("inspeksi cpib")) {
    kontenLaporan = <TemplateInspeksiCPIB data={data} />;
  }
  else if (jenis.includes("survailen haccp") || jenis.includes("surveilan haccp")) {
    kontenLaporan = <TemplateSurveilanHACCP data={data} />;
  }
  else if (jenis.includes("haccp")) {
    kontenLaporan = <TemplateInspeksiHACCP data={data} />;
  }
  else if (jenis.includes("skp")) {
    kontenLaporan = <TemplateInspeksiSKP data={data} />;
  }
  else {
    kontenLaporan = <div className="text-center p-10">Template untuk "{data.jenisKegiatan}" belum tersedia.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white relative">
      
      {!isPdfMode && (
        <div className="fixed top-4 right-4 z-[9999] print:hidden">
          <TombolCetak />
        </div>
      )}
      
      {isPdfMode && (
        <script dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 2500);
            };
          `
        }} />
      )}
      
      <div 
        className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none print:m-0 print:p-0 print:w-[21cm] print:max-w-none"
        style={{ overflow: 'visible' }}
      >
        
        {/* 1. SURAT TUGAS (HALAMAN PERTAMA) */}
        {data.suratTugas && (
          <div className="w-[21cm] h-[29.7cm] bg-white break-after-page print:block print:w-[21cm] print:h-[29.7cm] print:p-0 print:m-0 print:overflow-hidden">
            <iframe 
              src={`/api/r2/${data.suratTugas}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
              className="w-full h-full border-0 block"
              style={{ width: '100%', height: '100%' }}
              title="Surat Tugas"
            />
          </div>
        )}

        {/* 2. ISI LAPORAN (COVER DLL) */}
        <div className="w-full p-[2cm] print:p-[2cm] print:w-full">
          {kontenLaporan}
        </div>

      </div>
    </div>
  );
}