export default function TemplateInspeksiHACCP({ data }: { data: any }) {
  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-";
    try {
      const date = new Date(tgl);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    } catch (e) {
      return "-";
    }
  };

  const tanggalIndo = formatTanggal(data.tanggal);

  const getTtdUrl = (nama: string) => {
    if (!nama) return "";
    const namaTanpaGelar = nama.split(',')[0];
    const namaFile = namaTanpaGelar.toLowerCase().replace(/[.]/g, '').trim().replace(/\s+/g, '-');
    return `/tanda-tangan/${namaFile}.png`;
  };

  const formatNamaPerusahaan = (nama: string) => {
    if (!nama) return "-";
    const namaUpper = nama.toUpperCase();
    if (namaUpper.endsWith(', PT')) return 'PT. ' + nama.slice(0, -4).trim();
    if (namaUpper.endsWith(', CV')) return 'CV. ' + nama.slice(0, -4).trim();
    return nama;
  };

  return (
    <div className="text-[11pt] leading-relaxed text-justify text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      
      {/* HALAMAN 1: COVER */}
      <div className="w-full h-[25.7cm] relative print:break-after-page flex flex-col items-center">
        <div className="mt-16 w-full flex flex-col items-center gap-4">
          <h1 className="w-full text-center text-[16pt] font-bold uppercase leading-tight">LAPORAN PERJALANAN DINAS</h1>
          <h2 className="w-full text-center text-[14pt] font-bold uppercase leading-snug">
            KEGIATAN INSPEKSI PENERAPAN HACCP<br/>UNIT PENGOLAHAN IKAN
          </h2>
          <div className="mt-8 flex flex-col items-center gap-2 tracking-tight">
            <p className="font-bold text-[14pt] uppercase">{formatNamaPerusahaan(data.namaPerusahaan)}</p>
            <p className="font-bold text-[14pt] uppercase">{tanggalIndo}</p>
          </div>
        </div>
        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img src="/logo-kkp.png" alt="Logo KKP" className="w-40 h-40 object-contain mx-auto" />
        </div>
        <div className="absolute bottom-10 w-full text-center">
          <h3 className="text-[14pt] font-bold uppercase leading-tight">
            KEMENTERIAN KELAUTAN DAN PERIKANAN<br/>BADAN PENGENDALIAN DAN PENGAWASAN MUTU<br/>HASIL KELAUTAN DAN PERIKANAN<br/>BALAI PPMHKP DENPASAR<br/>2026
          </h3>
        </div>
      </div>

      {/* HALAMAN 2: ISI LAPORAN */}
      <div className="mt-10">
        <div className="w-full text-center mb-8">
          <h3 className="font-bold uppercase text-[12pt] leading-tight">
            LAPORAN PERJALANAN DINAS<br/>KEGIATAN INSPEKSI PENERAPAN HACCP<br/>UNIT PENGOLAHAN IKAN
          </h3>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Daftar Isian Pelaksanaan Anggaran (DIPA) Balai Karantina Ikan, Pengendalian Mutu dan Keamanan Hasil Perikanan Denpasar Tahun Anggaran 2026 Nomor DIPA-032.13.2.427624/2026 Tanggal 1 Desember 2025</li>
            <li>Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009</li>
            <li>PERMEN KP No. 10 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Resiko Sektor Kelautan dan Perikanan</li>
            <li>PERMEN KP No. 51 Tahun 2018 tentang Persyaratan Dan Tata Cara Penerbitan Sertifikat Penerapan Program Manajemen Mutu Terpadu/Hazard Analysis And Critical Control Point</li>
          </ol>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">II. Pendahuluan</h4>
          <p className="indent-8 mt-1">
            Persyaratan jaminan mutu dan keamanan hasil perikanan harus diterapkan oleh setiap pelaku usaha perikanan baik perorangan maupun badan usaha termasuk koperasi yang melakukan kegiatan produksi, pengolahan dan distribusi. Layanan sertifikat HACCP adalah layanan untuk memberikan sertifikat HACCP berdasarkan konsep dan penerapan 7 prinsip HACCP bagi UPI yang telah menerapkan dan memenuhi persyaratan GMP, SSOP dan atau sistem HACCP yang dipersyaratkan Otoritas Kompeten.
          </p>
          <p className="indent-8 mt-1">
            Dalam Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009, serta Peraturan Pemerintah Nomor 28 Tahun 2004 tentang Keamanan mutu dan Gizi Pangan, telah ditetapkan bahwa produk pangan termasuk dalam hal ini hasil perikanan yang dipasarkan untuk konsumsi manusia harus mengikuti persyaratan-persyaratan yang ditetapkan sehingga dapat menjamin kesehatan manusia.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">III. Maksud dan Tujuan</h4>
          <p className="indent-8 mt-1">
            Maksud dan tujuan dari kegiatan ini adalah melaksanakan kegiatan inspeksi penerapan HACCP dalam rangka penerbitan dan verifikasi HACCP oleh otoritas kompeten (BKIPM) dalam rangka menjamin Sistem Jaminan Mutu dan Keamanan Hasil Perikanan dari Unit Pengolahan Ikan yang berada di Provinsi Bali.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">IV. Waktu dan Tempat Pelaksanaan</h4>
          <p className="indent-8 mt-1">
            Kegiatan ini dilaksanakan berdasarkan Surat Tugas Nomor {data.noSurat || "-"} pada tanggal <strong>{tanggalIndo || "-"}</strong> di Unit Pengolahan Ikan <strong>{data.namaPerusahaan || "-"}</strong> yang beralamat di {data.alamatPerusahaan || "-"} oleh Inspektur Mutu yang dimiliki oleh Balai PPMHKP Denpasar.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">V. Pelaksanaan Kegiatan</h4>
          <p className="indent-8 mt-1">
            Kegiatan inspeksi penerapan HACCP ini dilaksanakan oleh Tim Inspektur mutu yang terdiri dari Ketua dan Anggota menghasilkan laporan hasil inspeksi berupa temuan ketidaksesuaian dari penerapan GMP/SSOP, konsistensi penerapan HACCP berupa: Alur Proses, Analisa Bahaya, Penentuan CCP, monitoring CCP, ketertelusuran rekaman dan sistem verifikasi dari tindakan perbaikan dari Unit Pengolahan Ikan.
          </p>
        </div>

        {/* HASIL KEGIATAN & KENDALA */}
        <div className="mb-4">
          <h4 className="font-bold">VI. Hasil Kegiatan dan Kendala</h4>
          <div className="mt-2">
            <p className="font-semibold">A. Hasil Kegiatan</p>
            <p className="indent-8 mt-1 text-justify">{data.hasilKegiatan || "-"}</p>
          </div>
          <div className="mt-2">
            <p className="font-semibold">B. Kendala</p>
            <p className="indent-8 mt-1 text-justify">{data.kendala || "-"}</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">VII. Penutup</h4>
          <p className="indent-8 mt-1">
            Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan melalui pelaksanaan konsepsi HACCP untuk seluruh produk diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia.
          </p>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-8 mb-8 ml-32">
          <p>Petugas Pelaksana :</p>
          <div className="mt-4 space-y-4">
            {data.petugasPelaksana ? (
              data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
                const match = petugas.trim().match(/(.*)\((.*)\)/);
                const namaLengkap = match ? match[1].trim() : petugas.trim();
                return (
                  <div key={index} className="flex items-center">
                    <span className="w-6 shrink-0">{index + 1}.</span>
                    <span className="w-[280px] shrink-0">{namaLengkap}</span>
                    <div className="flex items-center">
                      <span className="text-gray-600">(</span>
                      <div className="w-[80px] h-10 flex items-center justify-center relative">
                        <img 
                          src={getTtdUrl(namaLengkap)} 
                          alt="TTD" 
                          className="absolute h-14 object-contain z-10" 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <span className="text-gray-600">)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center">
                <span className="w-6 shrink-0">1.</span>
                <span className="w-[280px] shrink-0">-</span>
                <span className="text-gray-600">(......)</span>
              </div>
            )}
          </div>
        </div>

        {/* DOKUMENTASI */}
        <div className="page-break-before-always mt-10 pt-10">
          <h4 className="font-bold text-center mb-6 text-[12pt]">DOKUMENTASI KEGIATAN</h4>
          <div className="grid grid-cols-2 gap-4">
            {data.fotoKegiatan && data.fotoKegiatan !== "[]" ? (
               JSON.parse(data.fotoKegiatan).map((key: string, i: number) => (
                  <div key={i} className="mb-4">
                    <img src={`/api/r2/${key}`} alt={`Dokumentasi ${i}`} className="w-full h-auto object-cover border border-gray-300" />
                  </div>
               ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 italic mt-4 border p-10 border-dashed">
                (Belum ada foto dokumentasi yang di-upload)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}