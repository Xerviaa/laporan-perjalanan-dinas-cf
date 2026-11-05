export default function TemplateInspeksiSKP({ data }: { data: any }) {
  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-";
    try {
      const date = new Date(tgl);
      if (isNaN(date.getTime())) return "-";
      // Tanggal langsung kapital
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

  // TAMBAHAN: Fungsi untuk memindahkan ", PT" atau ", CV" ke depan
  const formatNamaPerusahaan = (nama: string) => {
    if (!nama) return "-";
    const namaUpper = nama.toUpperCase();
    
    if (namaUpper.endsWith(', PT')) {
      return 'PT. ' + nama.slice(0, -4).trim();
    }
    if (namaUpper.endsWith(', CV')) {
      return 'CV. ' + nama.slice(0, -4).trim();
    }
    
    return nama;
  };

  let fotoArray: string[] = [];
  try {
    if (data.fotoKegiatan && data.fotoKegiatan !== "[]") {
      const parsed = JSON.parse(data.fotoKegiatan);
      if (Array.isArray(parsed)) fotoArray = parsed;
    }
  } catch (e) {
    fotoArray = [];
  }

  return (
    <div className="text-[11pt] leading-relaxed text-justify text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      
      {/* ========================================= */}
      {/* HALAMAN 1: COVER (SKP)                    */}
      {/* ========================================= */}
      <div className="w-full h-[25.7cm] relative print:break-after-page flex flex-col items-center">
        
        {/* BAGIAN ATAS: JUDUL, PERUSAHAAN, TANGGAL */}
        <div className="mt-16 w-full flex flex-col items-center gap-4">
          
          <h1 className="text-[16pt] font-bold uppercase leading-tight">
            LAPORAN PERJALANAN DINAS
          </h1>
          
          <h2 className="w-full text-center text-[14pt] font-bold uppercase leading-snug">
            KEGIATAN INSPEKSI PENERBITAN<br/>
            SERTIFIKAT KELAYAKAN PENGOLAHAN<br/>
            UNIT PENGOLAHAN IKAN
          </h2>

          <div className="mt-8 flex flex-col items-center gap-2 tracking-tight">
            {/* HANYA BAGIAN INI YANG DIUBAH (Memanggil formatNamaPerusahaan) */}
            <p className="font-bold text-[14pt] uppercase">{formatNamaPerusahaan(data.namaPerusahaan)}</p>
            <p className="font-bold text-[14pt] uppercase">{tanggalIndo}</p>
          </div>

        </div>

        {/* BAGIAN TENGAH: LOGO KKP */}
        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img src="/logo-kkp.png" alt="Logo KKP" className="w-40 h-40 object-contain mx-auto" />
        </div>

        {/* BAGIAN BAWAH: FOOTER KEMENTERIAN */}
        <div className="absolute bottom-10 w-full text-center">
          <h3 className="text-[14pt] font-bold uppercase leading-tight">
            KEMENTERIAN KELAUTAN DAN PERIKANAN<br/>
            BADAN PENGENDALIAN DAN PENGAWASAN MUTU<br/>
            HASIL KELAUTAN DAN PERIKANAN<br/>
            BALAI PPMHKP DENPASAR<br/>
            2026
          </h3>
        </div>
      </div>

      {/* ========================================= */}
      {/* HALAMAN 2: ISI LAPORAN                    */}
      {/* ========================================= */}
      <div className="mt-10">

        {/* JUDUL DI HALAMAN 2 */}
        <div className="w-full text-center mb-8">
          <h3 className="font-bold uppercase text-[12pt] leading-tight">
            LAPORAN PERJALANAN DINAS<br/>
            KEGIATAN INSPEKSI PENERAPAN SERTIFIKAT KELAYAKAN PENGOLAHAN<br/>
            UNIT PENGOLAHAN IKAN
          </h3>
        </div>
        
        {/* I. DASAR PELAKSANAAN */}
        <div className="mb-4">
          <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Daftar Isian Pelaksanaan Anggaran (DIPA) Balai Pengendalian dan Pengawasan Mutu Hasil Kelautan dan Perikanan Denpasar Tahun Anggaran 2026 Nomor DIPA-032.13.2.427624/2026</li>
            <li>Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009</li>
            <li>PERMEN KP No. 10 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Resiko Sektor Kelautan dan Perikanan</li>
            <li>PERMEN KP No. 17 Tahun 2019 tentang Persyaratan dan Tata cara Penerbitan Sertifikat Kelayakan pengolahan</li>
          </ol>
        </div>

        {/* II. PENDAHULUAN */}
        <div className="mb-4">
          <h4 className="font-bold">II. Pendahuluan</h4>
          <p className="indent-8 mt-1">
            Aspek keamanan produk perikanan adalah bagian dari keseluruhan mutu produk perikanan yang bersifat wajib. Masalah keracunan dan kontaminasi pada produk perikanan menjadi perhatian konsumen di seluruh dunia, sehingga masalah mutu dan keamanan produk perikanan menjadi sesuatu yang tidak bisa dinegosiasi.
          </p>
          <p className="indent-8 mt-1">
            Pertama, ikan dan produk perikanan harus aman dimakan, dan kedua menyehatkan bila dimakan. Oleh karena itu, Cara Pengolahan Ikan yang Baik (Good Manufacturing Practices) merupakan prasyarat utama bagi suatu industri pengolahan ikan. Program persyaratan dasar Cara Pengolahan Ikan yang Baik (Good Manufacturing Practices) berfungsi sebagai dasar pemenuhan kondisi lingkungan dan pelaksanaan proses penanganan dan pengolahan dilakukan dengan baik. Cara Pengolahan Ikan yang Baik (Good Manufacturing Practices) harus dikembangkan dan diterapkan pada setiap produk atau kelompok produk/proses produksi.
          </p>
          <p className="indent-8 mt-1">
            Dalam Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009, serta Peraturan Pemerintah Nomor 28 Tahun 2004 tentang Keamanan mutu dan Gizi Pangan, telah ditetapkan bahwa produk pangan termasuk dalam hal ini hasil perikanan yang dipasarkan untuk konsumsi manusia harus mengikuti persyaratan-persyaratan yang ditetapkan sehingga dapat menjamin kesehatan manusia. Berdasarkan Permen KP No. 17 Tahun 2019 tentang Persyaratan dan Tata Cara Penerbitan Sertifikat Kelayakan Pengolahan yang sudah dimiliki oleh UMKM memiliki masa berlaku selama 2 (dua) tahun, untuk menjaga kualitas dari produk hasil perikanan yang dihasilkan oleh UMKM tersebut dengan dilakukannya verifikasi oleh Inspektur Mutu yang Balai PPMHKP Denpasar. Balai PPMHKP Denpasar yang bertanggung jawab terhadap seluruh UMKM yang ada di wilayah Provinsi Bali wajib merekam, mendokumentasikan dan melaporkan kondisi UMKM pada saat inspeksi sebagai cermin komitmen manajemen dan tim SKP dalam menerapkan GMP dan SSOP. Seluruh mekanisme pelaporan dan dokumentasi hasil inspeksi wajib di input online ke sistem https://skp-pdspkp.kkp.go.id/skp-online/auth/login agar dapat diproses oleh tim teknis pusat dalam menentukan hasil akhir, penentuan grade dan penerbitan sertifikat dan diupload ke google drive.
          </p>
        </div>

        {/* III. MAKSUD DAN TUJUAN */}
        <div className="mb-4">
          <h4 className="font-bold">III. Maksud dan Tujuan</h4>
          <p className="indent-8 mt-1">
            Maksud dan tujuan dari kegiatan ini adalah melaksanakan kegiatan inspeksi dalam rangka penerbitan penjaminan Sistem Jaminan Mutu dan Keamanan Hasil Perikanan dari Usaha Mikro Kecil dan Menengah yang berada di Provinsi Bali.
          </p>
        </div>

        {/* IV. WAKTU DAN TEMPAT PELAKSANAAN */}
        <div className="mb-4">
          <h4 className="font-bold">IV. Waktu dan Tempat Pelaksanaan</h4>
          <p className="indent-8 mt-1">
            Kegiatan ini dilaksanakan berdasarkan Surat Tugas Nomor {data.noSurat || "-"} pada tanggal <strong>{tanggalIndo || "-"}</strong> di Unit Pengolahan Ikan <strong>{data.namaPerusahaan || "-"}</strong> yang beralamat di {data.alamatPerusahaan || "-"} oleh Inspektur Mutu yang dimiliki oleh Balai PPMHKP Denpasar.
          </p>
        </div>

        {/* V. PELAKSANAAN KEGIATAN */}
        <div className="mb-4">
          <h4 className="font-bold">V. Pelaksanaan Kegiatan</h4>
          <p className="indent-8 mt-1">
            Kegiatan inspeksi penerbitan SKP ini dilaksanakan oleh Tim Inspektur mutu yang terdiri dari Ketua dan Anggota menghasilkan laporan hasil inspeksi berupa temuan ketidaksesuaian dari penerapan dokumen SKP dari UPI sehingga dapat dijadikan perbaikan secara berkelanjutan. Penyelesaian dari tindakan perbaikan inspeksi penerbitan SKP diberikan batas waktu maksimal 30 hari kalender. Pemeriksaan tindakan perbaikan dilaksanakan oleh Inspektur Mutu.
          </p>
        </div>

        {/* VI. PENUTUP */}
        <div className="mb-4">
          <h4 className="font-bold">VI. Penutup</h4>
          <p className="indent-8 mt-1">
            Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan melalui pelaksanaan GMP dan SSOP untuk seluruh produk diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia. Pelaksanan kegiatan telah berjalan dengan baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar.
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
                      <div 
                        className="w-[80px] h-10 bg-no-repeat bg-contain bg-center"
                        style={{ backgroundImage: `url(${getTtdUrl(namaLengkap)})` }}
                      ></div>
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
            {fotoArray.length > 0 ? (
               fotoArray.map((key: string, i: number) => (
                  <div key={i} className="mb-4">
                    <div 
                      className="w-full h-64 bg-slate-100 border border-gray-300 bg-no-repeat bg-contain bg-center"
                      style={{ backgroundImage: `url(/api/r2/${key})` }}
                    ></div>
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