export default function TemplateSurveilanHACCP({ data }: { data: any }) {
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
    <div className="text-[11pt] leading-relaxed text-justify text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      
            {/* ========================================= */}
      {/* HALAMAN 1: COVER (SURVEILAN HACCP)        */}
      {/* ========================================= */}
      <div className="w-full h-[25.7cm] flex flex-col justify-between items-center text-center print:break-after-page relative">
        
        {/* BAGIAN ATAS: JUDUL, PERUSAHAAN, TANGGAL */}
        <div className="mt-16 w-full flex flex-col items-center">
          
          <h1 className="text-[16pt] font-bold uppercase leading-tight">
            PELAPORAN PERJALANAN DINAS
          </h1>
          
          <h2 className="text-[14pt] font-bold uppercase leading-tight mt-4">
            KEGIATAN SURVAILEN DAN PENGAMBILAN SAMPEL<br/>
            DI UNIT PENGOLAHAN IKAN
          </h2>

          {/* Jarak rapi dengan tracking-tight, dan tanggal tanpa uppercase */}
          <div className="mt-8 space-y-2 tracking-tight">
            <p className="font-bold text-[14pt] uppercase">{data.namaPerusahaan || "-"}</p>
            <p className="font-bold text-[14pt]">{tanggalIndo}</p>
          </div>

        </div>

        {/* BAGIAN TENGAH: LOGO KKP */}
        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img src="/logo-kkp.png" alt="Logo KKP" className="w-40 h-40 object-contain mx-auto" />
        </div>

        {/* BAGIAN BAWAH: FOOTER KEMENTERIAN */}
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

      {/* ========================================= */}
      {/* HALAMAN 2: ISI LAPORAN                    */}
      {/* ========================================= */}
      <div className="mt-10">
        
        {/* I. DASAR PELAKSANAAN */}
        <div className="mb-4">
          <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Daftar Isian Pelaksanaan Anggaran (DIPA) Balai Pengendalian dan Pengawasan Mutu Hasil Kelautan dan Perikanan Denpasar Tahun Anggaran 2026, Nomor DIPA-032.13.2.427624/2026 tanggal 1 Desember 2025</li>
            <li>Undang-undang Nomor 18 Tahun 2012 tentang Pangan dan Undang- Undang Nomor 45 Tahun 2009</li>
            <li>PERMEN KP No. 10 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Resiko Sektor Kelautan dan Perikanan</li>
            <li>PERMEN KP No. 51 Tahun 2018 tentang Persyaratan Dan Tata Cara Penerbitan Sertifikat Penerapan Program Manajemen Mutu Terpadu/Hazard Analysis And Critical Control Point</li>
            <li>Keputusan Kepala Badan karantina Ikan, Pengendalian Mutu dan Keamanan Hasil Perikanan Nomor 35 tahun 2025 Tentang Petunjuk Teknis Pengawasan Mutu Hasil Perikanan dalam Rangka Penerbitan Sertifikat Mutu dan Keamanan Hasil Perikanan, perlu menugaskan pegawai untuk melakukan kegiatan Surveilan HACCP dan Pengambilan Sampel di Unit Pengolahan Ikan.</li>
            <li>Surat Tugas No. {data.noSurat || "-"}</li>
          </ol>
        </div>

        {/* II. PENDAHULUAN */}
        <div className="mb-4">
          <h4 className="font-bold">II. Pendahuluan</h4>
          <p className="indent-8 mt-1">
            Sistem Sertifikasi Mutu dan Keamanan Hasil Perikanan tumbuh seiring dengan perkembangan tuntutan akan jaminan mutu dan keamanan pangan ditataran internasional yang semakin ketat, dan tidak hanya fokus pada mutu dan keamanan dari produk akhir. Sistem jaminan mutu dan keamanan terhadap proses merupakan tuntutan dan penerimaan masyarakat dunia (internasional) akan keberterimaan pangan, termasuk hasil perikanan.
          </p>
          <p className="indent-8 mt-1">
            Perkembangan dalam bidang informasi, berdampak pada dunia perdagangan, yang menuntut adanya efisiensi dan efektivitas pelayanan, termasuk layanan sertifikasi yang cepat dan efisien (on-time and on-line). Peningkatan kualitas layanan sertifikasi yang cepat dan efisien diharapkan dapat mendorong peningkatan ekspor hasil perikanan Indonesia. Disamping itu, tuntutan akan transparansi dan ketertelusuran produk harus diimplementasikan dan terintegrasi dalam sistem sertifikasi hasil perikanan.
          </p>
          <p className="indent-8 mt-1">
            Dengan berkembangnya sistem manajemen mutu, maka penerbitan SMKHP didasarkan pada hasil pengawasan mutu terhadap efektifitas penerapan persyaratan sistem jaminan mutu dan keamanan hasil perikanan pada Unit Usaha Pembenihan, Pembesaran dan Unit Pengolahan Ikan serta Hasil Pengujian Contoh. Kegiatan pengawasan mutu hasil perikanan dalam rangka penerbitan SMKHP dilakukan melalui kegiatan surveilan dan pengambilan contoh yang frekuensi pelaksanaannya berdasarkan peringkat penerapan CPIB, CBIB, SKP dan/ atau HACCP.
          </p>
          <p className="indent-8 mt-1">
            Dalam menjamin Sistem Jaminan Mutu dan Keamanan Hasil Perikanan terdapat dua jenis kegiatan yang dilakukan, yaitu surveilen dan monitoring dalam rangka menjalankan konsistensi penerapan HACCP. Kegiatan surveilen ini dilakukan pengamatan terhadap penerapan GMP/SSOP dan konsistensi HACCP pada suatu unit pengolahan ikan, sedangkan kegiatan monitoring adalah pengambilan contoh uji sesuai dengan penerapan GMP/SSOP dan HACCP sesuai dengan jumlah produk yang tertelusur dan diekspor. Surveilen dan monitoring ini dilakukan secara rutin dan berkelanjutan sesuai dengan grade masing-masing unit pengolahan ikan (UPI). Untuk UPI grade A dilakukan setiap 6 bulan sekali, grade B setiap 4 bulan sekali dan grade C dilakukan setiap 3 bulan sekali. Kegiatan monitoring juga berfungsi sebagai official control otoritas kompeten memberikan jaminan mutu dan keamanan hasil perikanan.
          </p>
        </div>

        {/* III. MAKSUD DAN TUJUAN */}
        <div className="mb-4">
          <h4 className="font-bold">III. Maksud dan Tujuan</h4>
          <p className="indent-8 mt-1">
            Maksud dan tujuan dari kegiatan ini adalah melaksanakan kegiatan survailen dan monitoring guna menjamin Sistem Jaminan Mutu dan Keamanan Hasil Perikanan dari Unit Pengolahan {data.namaPerusahaan || "-"}. Kegiatan Survailen ini dilaksanakan untuk melihat konsistensi dari penerapan HACCP dan monitoring berupa pengambilan sampel untuk memberikan jaminan keamanan hasil perikanan untuk dilakukan pemeriksaan laboratorium yang berhubungan dengan penyakit pada manusia.
          </p>
        </div>

        {/* IV. WAKTU DAN TEMPAT PELAKSANAAN */}
        <div className="mb-4">
          <h4 className="font-bold">IV. Waktu dan Tempat Pelaksanaan</h4>
          <p className="indent-8 mt-1">
            Kegiatan ini dilaksanakan di Unit Pengolahan Ikan <strong>{data.namaPerusahaan || "-"}</strong> yang beralamat di {data.alamatPerusahaan || "-"} pada tanggal <strong>{tanggalIndo || "-"}</strong> oleh Inspektur Mutu yang dimiliki oleh Balai PPMHKP Denpasar.
          </p>
        </div>

        {/* V. PETUGAS PELAKSANA */}
        <div className="mb-4">
          <h4 className="font-bold">V. Petugas Pelaksana</h4>
          <div className="flex mt-1">
            <span className="w-40 shrink-0">Petugas Pelaksana</span>
            <span className="mr-2 shrink-0">:</span>
            <div className="flex-1">
              {data.petugasPelaksana ? (
                data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
                  const match = petugas.trim().match(/(.*)\((.*)\)/);
                  const nama = match ? match[1].trim() : petugas.trim();
                  const peran = match ? match[2].trim() : "";

                  return (
                    <div key={index} className="flex items-start mb-1">
                      <span className="w-6 shrink-0">{String.fromCharCode(97 + index)}.</span>
                      <span className="flex-1">{nama}</span>
                      {peran && <span className="ml-4 shrink-0">({peran})</span>}
                    </div>
                  );
                })
              ) : (
                <p>a. -</p>
              )}
            </div>
          </div>
        </div>

        {/* VI. PELAKSANAAN KEGIATAN */}
        <div className="mb-4">
          <h4 className="font-bold">VI. Pelaksanaan Kegiatan</h4>
          <p className="indent-8 mt-1">
            Kegiatan survivalen HACCP ini menghasilkan laporan hasil survivalen berupa daftar hadir dan temuan ketidaksesuaian dari penerapan GMP/SSOP sebagai dasar Unit Pengolahan Ikan untuk memperbaiki dan bertanggungjawab terhadap penerapan HACCP yang dimiliki.
          </p>
        </div>

        {/* VII. PENUTUP */}
        <div className="mb-4">
          <h4 className="font-bold">VII. Penutup</h4>
          <p className="indent-8 mt-1">
            Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan yang diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia. Pelaksanan kegiatan ini lebih baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar sehingga hasil yang didapat lebih sempurna.
          </p>
        </div>

        {/* TANDA TANGAN PETUGAS */}
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

        {/* DOKUMENTASI KEGIATAN */}
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