import TombolCetak from "@/components/TombolCetak";
import TemplateInspeksiCPIBKapal from "@/components/cetak/TemplateInspeksiCPIBKapal";
import TemplateInspeksiHACCP from "@/components/cetak/TemplateInspeksiHACCP";
import TemplateInspeksiSKP from "@/components/cetak/TemplateInspeksiSKP";
import TemplateSurveilanHACCP from "@/components/cetak/TemplateSurveilanHACCP";
import TemplateInspeksiCPIB from "@/components/cetak/TemplateInspeksiCPIB";
import TemplateInspeksiCBIB from "@/components/cetak/TemplateInspeksiCBIB";
import TemplateSurveilanCBIB from "@/components/cetak/TemplateSurveilanCBIB";
import TemplateSurveilanCPIB from "@/components/cetak/TemplateSurveilanCPIB";

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakLaporan({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ mode?: string, tampilkanST?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const idLaporan = Number(resolvedParams.id);
  const isPdfMode = resolvedSearchParams.mode === 'pdf';
  
  // Surat Tugas HANYA muncul jika ada parameter "tampilkanST=true"
  const skipSuratTugas = resolvedSearchParams.tampilkanST !== 'true';

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
  
  const jenis = data.jenisKegiatan?.toLowerCase() || "";

  if (jenis.includes("surveilan cbib") || jenis.includes("survailen cbib")) {
    kontenLaporan = <TemplateSurveilanCBIB data={data} />;
  }
  else if (jenis.includes("inspeksi cbib")) {
    kontenLaporan = <TemplateInspeksiCBIB data={data} />;
  }
  else if (jenis.includes("surveilan cpib") || jenis.includes("survailen cpib")) {
    kontenLaporan = <TemplateSurveilanCPIB data={data} />;
  }
  else if (jenis.includes("cpib kapal")) {
    kontenLaporan = <TemplateInspeksiCPIBKapal data={data} />;
  }
  else if (jenis.includes("inspeksi cpib")) {
    kontenLaporan = <TemplateInspeksiCPIB data={data} />;
  }
  else if (jenis.includes("surveilan haccp") || jenis.includes("survailen haccp")) {
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

  const isPdfSuratTugas = data.suratTugas?.toLowerCase().endsWith('.pdf');
  const isImageSuratTugas = data.suratTugas?.match(/\.(jpeg|jpg|gif|png)$/i);

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
        
        {/* 1. LAMPIRAN SURAT TUGAS (HANYA JIKA tampilkanST=true) */}
        {!skipSuratTugas && (
          data.suratTugas ? (
            <div className="w-[21cm] h-[29.7cm] bg-white break-after-page print:block print:w-[21cm] print:h-[29.7cm] print:p-0 print:m-0 print:overflow-hidden flex flex-col">
              
              {isPdfSuratTugas ? (
                <iframe 
                  src={`/api/r2/${data.suratTugas}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                  className="w-full h-full border-0 block"
                  style={{ width: '100%', height: '100%' }}
                  title="Surat Tugas PDF"
                />
              ) : isImageSuratTugas ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={`/api/r2/${data.suratTugas}`} 
                    alt="Surat Tugas" 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="text-center p-10 border-2 border-dashed border-red-300 rounded-lg bg-red-50 w-full">
                            <p class="text-red-500 font-bold text-lg mb-2">⚠️ File Surat Tugas Tidak Ditemukan</p>
                            <p class="text-slate-500 text-sm">Pastikan file sudah di-upload dengan benar ke sistem.</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center">
                  <p className="text-gray-500 mb-4">File Surat Tugas tidak dapat ditampilkan langsung.</p>
                  <a href={`/api/r2/${data.suratTugas}`} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded">
                    Buka File Surat Tugas
                  </a>
                </div>
              )}
              
            </div>
          ) : (
            <div className="w-[21cm] h-[29.7cm] bg-white break-after-page print:block print:w-[21cm] print:h-[29.7cm] p-10 flex items-center justify-center">
               <div className="text-center p-10 border-2 border-dashed border-red-300 rounded-lg bg-red-50 w-full">
                  <p className="text-red-500 font-bold text-lg mb-2">⚠️ Surat Tugas Belum Di-upload</p>
                  <p className="text-slate-500 text-sm">Data laporan ini belum memiliki file Surat Tugas.</p>
               </div>
            </div>
          )
        )}

        {/* 2. ISI LAPORAN (COVER DLL) */}
        <div className="w-full p-[2cm] print:p-[2cm] print:w-full">
          {kontenLaporan}
        </div>

      </div>
    </div>
  );
}