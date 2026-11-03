export default function TemplateHACCP({ data }: { data: any }) {
  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-";
    try {
      const date = new Date(tgl);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
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
    <div className="font-serif text-[11pt] leading-relaxed text-justify text-black">
      
      <div className="text-center mb-8">
        <h3 className="font-bold uppercase text-[12pt] leading-tight">
          LAPORAN PERJALANAN DINAS<br/>
          KEGIATAN INSPEKSI PENERAPAN HACCP<br/>
          UNIT PENGOLAHAN IKAN
        </h3>
      </div>

      {/* I. DASAR PELAKSANAAN */}
      <div className="mb-4">
        <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>Daftar Isian Pelaksanaan Anggaran (DIPA) Balai Karantina Ikan, Pengendalian Mutu dan Keamanan Hasil Perikanan Denpasar Tahun Anggaran 2026 Nomor DIPA-032.13.2.427624/2026 Tanggal 1 Desember 2025</li>
          <li>Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009</li>
          <li>PERMEN KP No. 10 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Resiko Sektor Kelautan dan Perikanan</li>
          <li>PERMEN KP No. 51 Tahun 2018 tentang Persyaratan Dan Tata Cara Penerbitan Sertifikat Penerapan Program Manajemen Mutu Terpadu/Hazard Analysis And Critical Control Point</li>
        </ol>
      </div>

      {/* II. PENDAHULUAN */}
      <div className="mb-4">
        <h4 className="font-bold">II. Pendahuluan</h4>
        <p className="indent-8 mt-1">
          Persyaratan jaminan mutu dan keamanan hasil perikanan harus diterapkan oleh setiap pelaku usaha perikanan baik perorangan maupun badan usaha termasuk koperasi yang melakukan kegiatan produksi, pengolahan dan distribusi. Layanan sertifikat HACCP adalah layanan untuk memberikan sertifikat HACCP berdasarkan konsep dan penerapan 7 prinsip HACCP bagi UPI yang telah menerapkan dan memenuhi persyaratan GMP, SSOP dan atau sistem HACCP yang dipersyaratkan Otoritas Kompeten.
        </p>
        <p className="indent-8 mt-1">
          Dalam Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009, serta Peraturan Pemerintah Nomor 28 Tahun 2004 tentang Keamanan mutu dan Gizi Pangan, telah ditetapkan bahwa produk pangan termasuk dalam hal ini hasil perikanan yang dipasarkan untuk konsumsi manusia harus mengikuti persyaratan-persyaratan yang ditetapkan sehingga dapat menjamin kesehatan manusia. Berdasarkan Permen KP No. 51 Tahun 2018 tentang Persyaratan dan Tata Cara Penerbitan Sertifikat Penerapan Program Manajemen Mutu Terpadu/ Hazard Analysis Critical Control Point bahwa sertifikat HACCP yang sudah dimiliki oleh UPI memiliki masa berlaku selama 2 (dua) tahun, untuk menjaga kualitas dari produk hasil perikanan yang dihasilkan oleh UPI tersebut dengan dilakukannya verifikasi oleh Inspektur Mutu yang Balai PPMHKP Denpasar. Balai PPMHKP Denpasar yang bertanggung jawab terhadap seluruh UPI yang ada di wilayah Provinsi Bali wajib merekam, mendokumentasikan dan melaporkan kondisi UPI pada saat inspeksi sebagai cermin komitmen manajemen dan tim HACCP dalam menerapkan konsepsi HACCP dalam rantai produksi, pengolahan dan distribusi. Seluruh mekanisme pelaporan dan dokumentasi hasil inspeksi wajib di input online ke sistem https://haccp.kkp.go.id/h4/ agar dapat diproses oleh tim teknis pusat dalam menentukan hasil akhir, penentuan grade dan penerbitan sertifikat.
        </p>
      </div>

      {/* III. MAKSUD DAN TUJUAN */}
      <div className="mb-4">
        <h4 className="font-bold">III. Maksud dan Tujuan</h4>
        <p className="indent-8 mt-1">
          Maksud dan tujuan dari kegiatan ini adalah melaksanakan kegiatan inspeksi penerapan HACCP dalam rangka penerbitan dan verifikasi HACCP oleh otoritas kompeten (BKIPM) dalam rangka menjamin Sistem Jaminan Mutu dan Keamanan Hasil Perikanan dari Unit Pengolahan Ikan yang berada di Provinsi Bali.
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
          Kegiatan inspeksi penerapan HACCP ini dilaksanakan oleh Tim Inspektur mutu yang terdiri dari Ketua dan Anggota menghasilkan laporan hasil inspeksi berupa temuan ketidaksesuaian dari penerapan GMP/SSOP, konsistensi penerapan HACCP berupa: Alur Proses, Analisa Bahaya, Penentuan CCP, monitoring CCP, ketertelusuran rekaman dan sistem verifikasi dari tindakan perbaikan dari Unit Pengolahan Ikan sehingga dapat dijadikan perbaikan secara berkelanjutan. Penyelesaian dari tindakan perbaikan inspeksi penerapan HACCP diberikan batas waktu maksimal 30 hari kalender. Pemeriksaan tindakan perbaikan dilaksanakan oleh Inspektur Mutu.
        </p>
      </div>

      {/* VI. PENUTUP */}
      <div className="mb-4">
        <h4 className="font-bold">VI. Penutup</h4>
        <p className="indent-8 mt-1">
          Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan melalui pelaksanaan konsepsi HACCP untuk seluruh produk diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia. Pelaksanan kegiatan telah berjalan dengan baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar.
        </p>
      </div>

      {/* TANDA TANGAN (TRICK CSS) */}
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

      {/* DOKUMENTASI (TRICK CSS) */}
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
  );
}