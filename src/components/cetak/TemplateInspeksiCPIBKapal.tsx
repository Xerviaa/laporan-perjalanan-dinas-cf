export default function TemplateInspeksiCPIBKapal({ data }: { data: any }) {
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
    
    if (namaUpper.endsWith(', PT')) {
      return 'PT. ' + nama.slice(0, -4).trim();
    }
    if (namaUpper.endsWith(', CV')) {
      return 'CV. ' + nama.slice(0, -4).trim();
    }
    
    return nama;
  };

  return (
    <div className="text-[11pt] leading-relaxed text-justify text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      
      {/* ========================================= */}
      {/* HALAMAN 1: COVER                          */}
      {/* ========================================= */}
      <div className="w-full h-[24cm] relative page-break-after-always block">
        
        {/* BAGIAN ATAS: JUDUL */}
        <div className="mt-10 w-full text-center">
          <h1 className="w-full text-center text-[16pt] font-bold uppercase leading-tight">
            PELAPORAN PERJALANAN DINAS
          </h1>
          
          <h2 className="w-full text-center text-[14pt] font-bold uppercase leading-snug mt-4">
            KEGIATAN INSPEKSI CARA PENANGANAN IKAN<br/>
            YANG BAIK (CPIB) DI ATAS KAPAL
          </h2>
        </div>

        {/* BAGIAN TENGAH: LOGO, PERUSAHAAN, TANGGAL */}
        <div className="absolute top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full flex flex-col items-center text-center">
          
          {/* Logo KKP */}
          <img src="/logo-kkp.png" alt="Logo KKP" className="w-40 h-40 object-contain mx-auto mb-8" />

          {/* Nama Perusahaan & Tanggal */}
          <div className="flex flex-col items-center gap-1 tracking-tight">
            <p className="font-bold text-[14pt] uppercase">{formatNamaPerusahaan(data.namaPerusahaan)}</p>
            <p className="font-bold text-[14pt] uppercase">{tanggalIndo}</p>
          </div>

        </div>

        {/* BAGIAN BAWAH: FOOTER KEMENTERIAN */}
        <div className="absolute bottom-0 w-full text-center pb-4">
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
      {/* PERBAIKAN: mt-12 agar judul turun lebih lega dari batas atas kertas */}
<div className="w-full page-break-before-always mt-12 print:mt-0" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
        
        {/* JUDUL DI HALAMAN 2 */}
        <div className="w-full text-center mb-8">
          <h3 className="font-bold uppercase text-[12pt] leading-tight">
            LAPORAN PERJALANAN DINAS<br/>
            KEGIATAN INSPEKSI CARA PENANGANAN IKAN YANG BAIK (CPIB)<br/>
            DI ATAS KAPAL
          </h3>
        </div>

        {/* I. DASAR PELAKSANAAN */}
        <div className="mb-4">
          <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Surat Tugas Nomor : {data.noSurat || "-"}</li>
            <li>DIPA -032.13.2.427624/2026 Tanggal 1 Desember 2025</li>
            <li>Peraturan Menteri Kelautan dan Perikanan Nomor 10 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk Pada Penyelenggaraan Perizinan Berusaha Berbasis Risiko Sektor Kelautan dan Perikanan</li>
            <li>Peraturan Presiden Nomor 193 Tahun 2024 tentang Kementerian Kelautan dan Perikanan</li>
            <li>Peraturan Menteri Kelautan dan Perikanan Nomor 2 Tahun 2025 tentang Organisasi dan Tata Kerja Kementerian Kelautan dan Perikanan</li>
            <li>Peraturan Menteri Kelautan dan Perikanan Nomor 16 Tahun 2024 tentang Kewenangan Pembinaan dan Pengendalian Dalam Rangka Penerbitan Sertifikat Jaminan Mutu dan Keamanan Hasil Perikanan</li>
          </ol>
        </div>

        {/* II. PETUGAS PELAKSANA */}
        <div className="mb-4 break-inside-avoid page-break-inside-avoid">
          <h4 className="font-bold">II. Petugas Pelaksana</h4>
          <div className="mt-2 space-y-2">
            {data.petugasPelaksana ? (
              data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
                const match = petugas.trim().match(/(.*)\((.*)\)/);
                const nama = match ? match[1].trim() : petugas.trim();
                const peran = match ? match[2].trim() : 'Anggota';
                return (
                  <div key={index} className="flex items-start pl-4">
                    <span className="w-6 shrink-0">{String.fromCharCode(97 + index)}.</span>
                    <div className="flex-1">
                      <span className="font-semibold block">{nama}</span>
                      <span className="text-sm italic text-gray-700">({peran})</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="pl-4">-</p>
            )}
          </div>
        </div>

        {/* III. PENDAHULUAN */}
        <div className="mb-4">
          <h4 className="font-bold">III. Pendahuluan</h4>
          <p className="indent-8 mt-1">
            Penanganan Ikan adalah suatu rangkaian kegiatan dan/atau perlakuan terhadap ikan tanpa mengubah bentuk dasar. Cara Penanganan Ikan yang Baik adalah pedoman dan tata cara penanganan ikan hasil tangkapan di atas kapal penangkap ikan dan/atau kapal pengangkut ikan serta pembongkaran ikan dari kapal perikanan di pelabuhan perikanan untuk memenuhi persyaratan pengendalian mutu pada usaha penangkapan ikan. Ikan adalah segala jenis organisme yang seluruh atau sebagian dari siklus hidupnya berada di dalam lingkungan perairan.
          </p>
          <p className="indent-8 mt-1">
            Sertifikat Cara Penanganan Ikan yang Baik adalah sertifikat yang diberikan kepada kapal penangkap ikan dan/atau kapal pengangkut ikan yang menyatakan bahwa kapal tersebut telah memenuhi persyaratan Pengendalian Mutu pada kegiatan Penangkapan Ikan. Penangkapan Ikan adalah kegiatan untuk memperoleh Ikan di perairan yang tidak dalam keadaan dibudidayakan dengan alat dan cara yang mengedepankan asas keberlanjutan dan kelestarian, termasuk kegiatan yang menggunakan kapal untuk memuat, mengangkut, menyimpan, mendinginkan, menangani, mengolah, dan/atau mengawetkannya.
          </p>
          <p className="indent-8 mt-1">
            Pengendalian Mutu adalah semua kegiatan yang meliputi inspeksi, surveilan, dan pengambilan contoh dalam rangka memberikan jaminan mutu dan keamanan hasil perikanan. Berdasarkan permen KP No. 16 Tahun 2024 terkait dengan kewenangan pengendalian penerbitan sertifikat jaminan mutu dan keamanan hasil perikanan antara lain sertifikat Cara Penanganan Ikan yang Baik dilaksnakaan oleh Kepala Badan yang mempunyai tugas menyelenggarakan pengendalian dan pengawasan mutu dan keamanan hasil kelautan dan perikanan berdasarkan hasil pembinaan dari direktorat jenderal yang mempunyai tugas menyelenggarakan perumusan dan pelaksanaan kebijakan di bidang pengelolaan perikanan tangkap sesuai dengan ketentuan peraturan perundang-undangan. Sertifikat Cara Penanganan Ikan yang Baik merupakan persyaratan bagi unit pengolahan ikan dalam menerima bahan baku yang berasal dari usaha penangkapan dan/atau pengangkutan ikan dalam sistem penjaminan mutu dan keamanan hasil perikanan.
          </p>
        </div>

        {/* IV. MAKSUD DAN TUJUAN */}
        <div className="mb-4">
          <h4 className="font-bold">IV. Maksud dan Tujuan</h4>
          <p className="indent-8 mt-1">
            Maksud pelaksanaan inspeksi dalam rangka penerbitan Sertifikat Cara Penanganan Ikan yang Baik adalah untuk mengatur pelaku usaha yang ingin mendapatkan Sertifikat CPIB sebagai jaminan mutu dan keamanan hasil perikanan dalam melakukan penangkapan ikan, pengangkutan ikan atau penangkapan ikan.
          </p>
        </div>

        {/* V. WAKTU DAN TEMPAT PELAKSANAAN */}
        <div className="mb-4">
          <h4 className="font-bold">V. Waktu dan Tempat Pelaksanaan</h4>
          <p className="indent-8 mt-1">
            Kegiatan ini dilaksanakan di <strong>{data.namaPerusahaan || "-"}</strong> di Pelabuhan Benoa, Denpasar-Bali yang mengajukan permohonan kepada BPPMHKP dan akan diteruskan pada inspektur mutu/asisten inspektur mutu yang berada di Balai PPMHKP Denpasar setelah dilakukan verifikasi permohonan.
          </p>
          <p className="indent-8 mt-1">
            Inspeksi dilaksanakan pada tanggal <strong>{tanggalIndo || "-"}</strong> oleh Inspektur Mutu/Asisten Inspektur Mutu dan petugas yang dimiliki oleh Balai PPMHKP Denpasar.
          </p>
        </div>

        {/* VI. PELAKSANAAN KEGIATAN */}
        <div className="mb-4">
          <h4 className="font-bold">VI. Pelaksanaan Kegiatan</h4>
          <p className="indent-8 mt-1">
            Inspeksi dapat dilakukan setelah adanya surat perintah dari pusat berdasarkan pengajuan permohonan kepada Kepala Balai PPMHKP Denpasar, dengan persyaratan sebagai berikut:
          </p>
          <div className="pl-4 mt-1 space-y-1">
            <p>a. Nomor induk berusaha dan perizinan berusaha subsector Penangkapan Ikan atau subsector pengangkutan ikan;</p>
            <p>b. Salinan Sertifikat Pelatihan Cara Penanganan Ikan yang Baik</p>
            <p>c. Surat kesediaan dilakukan inspeksi pengendalian mutu</p>
            <p>d. Salinan Sertifikat Kelaikan Kapal Perikanan – Laik Simpan sebagai hasil pembinaan dari Ditjen Perikanan Tangkap</p>
          </div>
          <p className="indent-8 mt-1">
            Setelah kelengkapan terpenuhi maka pusat akan melakukan verifikasi dan membuat surat perintah untuk dilakukan inspeksi CPIB diatas kapal oleh inspektur mutu/asisten inspektur mutu.
          </p>
          <p className="indent-8 mt-1">
            Sistem, mekanisme dan prosedur inspeksi CPIB diatas kapal adalah sebagai berikut
          </p>
          <div className="pl-4 mt-1 space-y-1">
            <p>a. Pelaku usaha yang telah mendapatkan pembinaan dari Ditjen Perikanan Tangkap melakukan permohonan melalui system SIAPMUTU</p>
            <p>b. Verifikasi kelengkapan dan keabsahan dokumen oleh petugas</p>
            <p>c. Inspeksi CPIB oleh petugas</p>
            <p>d. Review oleh Tim Teknis</p>
            <p>e. Rekomendasi penerbitan sertifikat CPIB</p>
            <p>f. Penerbitan sertifikat CPIB melalui system SIAPMUTU</p>
          </div>
          <p className="indent-8 mt-1">
            Jangka waktu terbitnya sertifikat adalah 10 hari kerja sejak dokumen permohonan dinyatakan lengkap dan sesuai. Inspeksi jaminan mutu dilakukan jika persyaratan fasilitas, peralatan dan prosedur penanganan selama pembongkaran ikan dari Kapal Perikanan di pelabuhan perikanan atau pelabuhan yang ditunjuk, standar fasilitas penanganan dan penyimpanan ikan di Kapal Perikanan; dan standar prosedur penanganan ikan di Kapal Perikanan dalam penerapan Hazard Analysis Critical Control Points (HACCP)*
          </p>
        </div>

        {/* VII. HASIL KEGIATAN DAN KENDALA */}
        <div className="mb-4">
          <h4 className="font-bold">VII. Hasil Kegiatan dan Kendala</h4>
          
          <div className="mt-2">
            <p className="font-semibold">A. Hasil Kegiatan</p>
            <p className="indent-8 mt-1 text-justify">
              {data.hasilKegiatan || "-"}
            </p>
          </div>

          <div className="mt-2">
            <p className="font-semibold">B. Kendala</p>
            <p className="indent-8 mt-1 text-justify">
              {data.kendala || "-"}
            </p>
          </div>
        </div>

        {/* VIII. PENUTUP */}
        <div className="mb-4">
          <h4 className="font-bold">VIII. Penutup</h4>
          <p className="indent-8 mt-1">
            Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan yang diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia. Pelaksanaan kegiatan ini lebih baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar sehingga hasil yang didapat lebih sempurna.
          </p>
        </div>

        {/* TANDA TANGAN PETUGAS */}
        <div className="mt-8 mb-8 ml-20 break-inside-avoid page-break-inside-avoid w-full max-w-[500px]">
          <p className="mb-4">Petugas Pelaksana :</p>
          
          <table className="w-full border-collapse">
            <tbody>
              {data.petugasPelaksana ? (
                data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
                  const match = petugas.trim().match(/(.*)\((.*)\)/);
                  const namaLengkap = match ? match[1].trim() : petugas.trim();
                  const ttdUrl = getTtdUrl(namaLengkap);

                  return (
                    <tr key={index}>
                      {/* Kolom 1: Abjad */}
                      <td className="w-[30px] align-middle pb-8">
                        {String.fromCharCode(97 + index)}.
                      </td>
                      
                      {/* Kolom 2: Nama */}
                      <td className="w-[250px] align-middle pb-8">
                        {namaLengkap}
                      </td>
                      
                      {/* Kolom 3: Kurung & TTD */}
                      <td className="align-middle pb-8 text-lg">
                        <div className="flex flex-row items-center justify-start h-[40px] gap-2">
                          <span>(</span>
                          
                          {/* TRIK BACKGROUND IMAGE: Gambar tidak akan bisa keluar dari kotak ini */}
                          <div 
                            className="w-[80px] h-full bg-no-repeat bg-center bg-contain"
                            style={{ backgroundImage: `url(${ttdUrl})` }}
                          ></div>

                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="w-[30px] align-middle pb-8">a.</td>
                  <td className="w-[250px] align-middle pb-8">-</td>
                  <td className="align-middle pb-8 text-lg">
                    <div className="flex flex-row items-center justify-start h-[40px] gap-2">
                      <span>(</span>
                      <div className="w-[80px] h-full"></div>
                      <span>)</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* HALAMAN BARU UNTUK DOKUMENTASI */}
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