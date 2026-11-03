import TombolCetak from "@/components/TombolCetak";
import TemplateCPIB from "@/components/cetak/TemplateCPIB";
// import TemplateHACCP from "@/components/cetak/TemplateHACCP"; // Nanti kita buat
// import TemplateSKP from "@/components/cetak/TemplateSKP"; // Nanti kita buat

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakLaporan({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idLaporan = Number(resolvedParams.id);

  try {
    const db = getDb(); 
    const result = await db.select().from(reports).where(eq(reports.id, idLaporan));
    const data = result[0];

    if (!data) {
      return <div className="p-10 text-xl font-bold text-center mt-20">Laporan dengan ID {idLaporan} tidak ditemukan.</div>;
    }

    const formatTanggal = (tgl: string) => {
      if (!tgl) return "";
      const date = new Date(tgl);
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const tanggalIndo = formatTanggal(data.tanggal);

    // Variabel untuk menampung komponen template yang akan dirender
    let kontenLaporan = null;

    // LOGIKA PEMILIHAN TEMPLATE BERDASARKAN JENIS KEGIATAN
    // Silakan sesuaikan string ini dengan data dari form upload Anda
    if (data.jenisKegiatan === "Primer - Inspeksi - Inspeksi CPIB Kapal") {
      kontenLaporan = <TemplateCPIB data={data} />;
    } 
    // else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi HACCP") {
    //   kontenLaporan = <TemplateHACCP data={data} />;
    // }
    // else if (data.jenisKegiatan === "Pasca - Inspeksi - Inspeksi SKP") {
    //   kontenLaporan = <TemplateSKP data={data} />;
    // }
    else {
      // Jika jenis kegiatan belum memiliki template
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
          
          {/* HALAMAN 1: COVER (Bisa dibuat dinamis menyesuaikan jenis kegiatan nanti) */}
          <div className="w-[21cm] h-[29.7cm] p-[2cm] flex flex-col justify-between items-center text-center font-serif print:break-after-page relative">
            <div className="mt-10 w-full">
              <h1 className="text-[16pt] font-bold uppercase leading-tight mb-4">
                PELAPORAN PERJALANAN DINAS
              </h1>
              <h2 className="text-[14pt] font-bold uppercase leading-tight">
                {data.jenisKegiatan.replace(/-/g, '\n')}
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

          {/* HALAMAN 2: ISI LAPORAN (KOP SURAT + TEMPLATE DINAMIS) */}
          <div className="w-[21cm] min-h-[29.7cm] p-[2cm]">
            {/* KOP SURAT */}
            <div className="flex items-center border-b-[3px] border-black pb-4 mb-6">
              <img src="/logo-kkp.png" alt="Logo" className="w-24 h-24 object-contain mr-6" />
              <div className="text-center flex-1 font-serif">
                <h1 className="text-lg font-bold uppercase">KEMENTERIAN KELAUTAN DAN PERIKANAN</h1>
                <h2 className="text-lg font-bold uppercase">BADAN PENGENDALIAN DAN PENGAWASAN MUTU<br/>HASIL KELAUTAN DAN PERIKANAN</h2>
                <h3 className="text-xl font-bold uppercase">BALAI PPMHKP DENPASAR</h3>
              </div>
            </div>

            {/* RENDER TEMPLATE YANG SUDAH DIPILIH DI ATAS */}
            {kontenLaporan}
          </div>

        </div>
      </div>
    );

  } catch (error) {
    console.error("Gagal koneksi ke database:", error);
    return <div className="p-10 text-red-500 font-bold mt-20 text-center">Error koneksi database. Cek terminal.</div>;
  }
}