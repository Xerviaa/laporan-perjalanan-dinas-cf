import TombolCetak from "@/components/TombolCetak";
import TemplateCPIB from "@/components/cetak/TemplateCPIB";
// Sementara comment import lainnya untuk uji isolasi
// import TemplateHACCP from "@/components/cetak/TemplateHACCP";
// import TemplateInspeksiSKP from "@/components/cetak/TemplateInspeksiSKP";
// import TemplateSurveilanHACCP from "@/components/cetak/TemplateSurveilanHACCP";

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakLaporan({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idLaporan = Number(resolvedParams.id);

  try {
    const db = getDb(); 
    const result = await db.select().from(reports).where(eq(reports.id, idLaporan));
    const rawData = result[0];

    if (!rawData) {
      return <div className="p-10 text-xl font-bold text-center mt-20">Laporan dengan ID {idLaporan} tidak ditemukan.</div>;
    }

    const data = {
      id: String(rawData.id),
      title: String(rawData.title || ""),
      fileKey: String(rawData.fileKey || ""),
      uploadedBy: String(rawData.uploadedBy || ""),
      jenisKegiatan: String(rawData.jenisKegiatan || ""),
      noSurat: String(rawData.noSurat || ""),
      petugasPelaksana: String(rawData.petugasPelaksana || ""),
      namaPerusahaan: String(rawData.namaPerusahaan || ""),
      alamatPerusahaan: String(rawData.alamatPerusahaan || ""),
      tanggal: rawData.tanggal ? new Date(rawData.tanggal).toISOString() : "",
      createdAt: rawData.createdAt ? new Date(rawData.createdAt).toISOString() : "",
      deadline: rawData.deadline ? new Date(rawData.deadline).toISOString() : "",
      isRewarded: Boolean(rawData.isRewarded),
      fotoKegiatan: rawData.fotoKegiatan ? String(rawData.fotoKegiatan) : "[]",
      fotoLokasi: rawData.fotoLokasi ? String(rawData.fotoLokasi) : "[]",
    };

    const formatTanggal = (tgl: string) => {
      if (!tgl) return "";
      try {
        const date = new Date(tgl);
        if (isNaN(date.getTime())) return tgl; 
        return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return tgl;
      }
    };
    const tanggalIndo = formatTanggal(data.tanggal);

    let kontenLaporan = null;

    // UJI ISOLASI: Semua jenis kegiatan menggunakan TemplateCPIB sementara
    if (data.jenisKegiatan === "Primer - Inspeksi - Inspeksi CPIB Kapal") {
      kontenLaporan = <TemplateCPIB data={data} />;
    } 
    else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi HACCP") {
      kontenLaporan = <TemplateCPIB data={data} />;
    }
    else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi SKP") {
      kontenLaporan = <TemplateCPIB data={data} />;
    }
    else if (data.jenisKegiatan === "Pasca - Survailen - Survailen HACCP") {
      kontenLaporan = <TemplateCPIB data={data} />;
    }
    else {
      kontenLaporan = (
        <div className="text-center mt-20 font-serif text-lg">
          <p>Template untuk jenis kegiatan <strong>"{data.jenisKegiatan}"</strong> belum tersedia.</p>
        </div>
      );
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
                {data.jenisKegiatan ? data.jenisKegiatan.replace(/-/g, '\n') : "-"}
              </h2>
              
              <div className="mt-8 space-y-2">
                <p className="font-bold text-[14pt] uppercase">{data.namaPerusahaan || "NAMA KAPAL / PT"}</p>
                <p className="font-bold text-[14pt] uppercase">{tanggalIndo || "TANGGAL"}</p>
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

  } catch (error: any) {
    return (
      <div className="p-10 text-red-500 font-mono mt-20">
        <h1 className="text-2xl font-bold mb-4">ERROR ASLI DITEMUKAN:</h1>
        <pre className="bg-red-50 p-4 rounded border border-red-300 overflow-auto text-sm">
          {error?.stack || error?.message || String(error)}
        </pre>
      </div>
    );
  }
}