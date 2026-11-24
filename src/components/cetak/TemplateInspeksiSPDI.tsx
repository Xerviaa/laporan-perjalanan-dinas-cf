export default function TemplateInspeksiSPDI({ data }: { data: any }) {
  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-";
    try {
      const date = new Date(tgl);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    } catch (e) { return "-"; }
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

  // Helper untuk merender teks tim yang dinamis di Bagian V
  const renderTimPelaksana = () => {
    if (!data.petugasPelaksana) return "-";
    
    const timArr = data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
      const match = petugas.trim().match(/(.*)\((.*)\)/);
      let nama = match ? match[1].trim() : petugas.trim();
      let peran = match ? match[2].trim() : '';
      
      // Hapus koma di akhir nama jika ada
      nama = nama.replace(/,\s*$/, ''); 

      return peran ? `${peran} ${nama}` : nama;
    });

    // Gabungkan dengan format bahasa Indonesia yang benar (A, B, dan C)
    if (timArr.length === 1) return timArr[0];
    if (timArr.length === 2) return `${timArr[0]}, dan ${timArr[1]}`;
    
    const last = timArr.pop();
    return `${timArr.join(', ')}, dan ${last}`;
  };

  // Teks default untuk Bab V jika form tidak mengirimkan data khusus
  const defaultBabV = "menghasilkan laporan hasil inspeksi berupa temuan ketidaksesuaian dari pemenuhan standar kelayakan mutu, higiene dan sanitasi fasilitas, dan sistem ketertelusuran dokumen (traceability) sehingga dapat dijadikan perbaikan secara berkelanjutan. Penyelesaian dari tindakan perbaikan inspeksi penerapan SPDI diberikan batas waktu maksimal 30 hari kalender. Pemeriksaan tindakan perbaikan dilaksanakan oleh Inspektur Mutu.";

  return (
    <div className="text-[11pt] leading-relaxed text-justify text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      {/* HALAMAN 1: COVER */}
      <div className="w-full h-[25.7cm] relative print:break-after-page flex flex-col items-center">
        <div className="mt-16 w-full flex flex-col items-center gap-4">
          <h1 className="w-full text-center text-[16pt] font-bold uppercase leading-tight">LAPORAN PERJALANAN DINAS</h1>
          <h2 className="w-full text-center text-[14pt] font-bold uppercase leading-snug">
            KEGIATAN INSPEKSI SERTIFIKASI PENERAPAN DISTRIBUSI IKAN (SPDI)<br/>
            {formatNamaPerusahaan(data.namaPerusahaan)}
          </h2>
          <div className="mt-8 flex flex-col items-center gap-2 tracking-tight">
            <p className="font-bold text-[14pt] uppercase">{tanggalIndo}</p>
          </div>
        </div>
        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img src="/logo-kkp.png" alt="Logo KKP" className="w-40 h-40 object-contain mx-auto" />
        </div>
        <div className="absolute bottom-10 w-full text-center">
          <h3 className="text-[14pt] font-bold uppercase leading-tight">
            KEMENTERIAN KELAUTAN DAN PERIKANAN<br/>BADAN PENGENDALIAN DAN PENGAWASAN MUTU<br/>HASIL KELAUTAN DAN PERIKANAN DENPASAR<br/>BALAI PPMHKP DENPASAR<br/>2026
          </h3>
        </div>
      </div>

      {/* HALAMAN 2: ISI LAPORAN */}
      <div className="pt-8">
        <div className="w-full text-center mb-8">
          <h3 className="font-bold uppercase text-[12pt] leading-tight">
            LAPORAN PERJALANAN DINAS<br/>
            KEGIATAN INSPEKSI SERTIFIKASI PENERAPAN DISTRIBUSI IKAN (SPDI)<br/>
            {formatNamaPerusahaan(data.namaPerusahaan)}
          </h3>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">I. DASAR PELAKSANAAN</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Surat Tugas nomor {data.noSurat || "-"}</li>
            <li>Daftar Isian Pelaksanaan Anggaran (DIPA) Balai Karantina Ikan, Pengendalian Mutu dan Keamanan Hasil Perikanan Denpasar Tahun Anggaran 2026 Nomor DIPA-032.13.2.427624/2026 Tanggal 01 Desember 2025</li>
            <li>Undang- Undang Nomor 45 Tahun 2009 tentang Perikanan</li>
            <li>Peraturan Menteri Kelautan dan Perikanan Nomor 9 Tahun 2024 tentang Pengelolaan Sistem Distribusi Ikan</li>
          </ol>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">II. PENDAHULUAN</h4>
          <p className="indent-8 mt-1">
            Laporan perjalanan dinas ini disusun untuk memberikan laporan menyeluruh mengenai hasil kegiatan verifikasi lapangan terkait Sertifikasi Penerapan Distribusi Ikan (SPDI) yang dilaksanakan. Kegiatan ini merupakan langkah krusial dalam menjaga standardisasi kelayakan unit distribusi perikanan demi mendukung ketahanan mutu pangan sektor kelautan dan perikanan. Seluruh rangkaian pengamatan, evaluasi fasilitas penanganan, serta koordinasi dengan pelaku usaha telah terangkum dalam laporan ini sebagai bahan evaluasi pimpinan.
          </p>
          <p className="indent-8 mt-1">
            Regulasi utama yang menaungi kegiatan ini adalah Peraturan Menteri Kelautan dan Perikanan Nomor 9 Tahun 2024 tentang Pengelolaan Sistem Distribusi Ikan. Peraturan ini diterbitkan untuk menggantikan aturan lama (Permen KP No. 52/PERMEN-KP/2018 tentang sertifikasi di tingkat supplier) agar standar mutu logistik hasil perikanan menjadi lebih terintegrasi dari hulu ke hilir. Sertifikat Penerapan Distribusi Ikan /SPDI yang sudah dimiliki oleh Unit usaha/Pelaku Usaha memiliki masa berlaku selama 4 (empat) tahun.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">III. MAKSUD DAN TUJUAN</h4>
          <p className="indent-8 mt-1">
            Maksud dan tujuan dari kegiatan ini adalah Melakukan verifikasi dan penilaian dari hasil pembinaan kesiapan sarana-prasarana distribusi pelaku usaha perikanan terkait persyaratan Cara Distribusi Ikan yang Baik (CDIB). Memastikan unit usaha telah memenuhi standar kelayakan mutu dan keamanan pangan untuk diterbitkannya Sertifikat Penerapan Distribusi Ikan (SPDI).
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">IV. WAKTU DAN TEMPAT PELAKSANAAN</h4>
          <p className="indent-8 mt-1">
            Kegiatan ini di laksanakan berdasarkan Surat Tugas Nomor {data.noSurat || "-"} pada tanggal {tanggalIndo || "-"} di Unit Usaha <strong>{formatNamaPerusahaan(data.namaPerusahaan)}</strong> yang beralamat di {data.alamat || "-"} oleh Inspektur Mutu yang dimiliki oleh Balai PPMHKP Denpasar.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">V. PELAKSANAAN KEGIATAN</h4>
          <p className="indent-8 mt-1">
            Kegiatan inspeksi penerapan SPDI ini dilaksanakan oleh Tim Inspektur mutu yang terdiri dari {renderTimPelaksana()}, dan{" "}
            {/* Logika: Jika ada isian dari form (catatanBabV), pakai itu. Jika tidak, pakai defaultBabV */}
            {data.catatanBabV || defaultBabV}
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">VI. PENUTUP</h4>
          <p className="indent-8 mt-1">
            Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik- baiknya dengan harapan dapat memberikan jaminan pendistribusian ikan melalui pelaksanaan konsepsi SPDI untuk seluruh produk diekspor ataupun yang dikonsumsi/nonkonsumsi lokal oleh masyarakat Indonesia. Pelaksanan kegiatan telah berjalan dengan baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar.
          </p>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-8 mb-8 ml-20 break-inside-avoid page-break-inside-avoid w-full max-w-[500px]">
          <p className="mb-4 font-bold">Petugas Pelaksana :</p>
          <table className="w-full border-collapse">
            <tbody>
              {data.petugasPelaksana ? (
                data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
                  const match = petugas.trim().match(/(.*)\((.*)\)/);
                  const namaLengkap = match ? match[1].trim() : petugas.trim();
                  const ttdUrl = getTtdUrl(namaLengkap);
                  return (
                    <tr key={index}>
                      <td className="w-[30px] align-middle pb-8">{index + 1}.</td>
                      <td className="w-[250px] align-middle pb-8">{namaLengkap}</td>
                      <td className="align-middle pb-8 text-lg">
                        <div className="flex flex-row items-center justify-start h-[40px] gap-2">
                          <span>(</span>
                          <div className="w-[80px] h-full bg-no-repeat bg-center bg-contain" style={{ backgroundImage: `url(${ttdUrl})` }}></div>
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : ( <tr><td colSpan={3}>-</td></tr> )}
            </tbody>
          </table>
        </div>

        {/* DOKUMENTASI */}
        <div className="page-break-before-always mt-10 pt-10" style={{ pageBreakBefore: 'always' }}>
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