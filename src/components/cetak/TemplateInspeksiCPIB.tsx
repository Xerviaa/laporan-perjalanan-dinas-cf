export default function TemplateInspeksiCPIB({ data }: { data: any }) {
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

  return (
    <div className="text-[11pt] leading-relaxed text-justify text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      {/* HALAMAN 1: COVER */}
      <div className="w-full h-[25.7cm] relative print:break-after-page flex flex-col items-center">
        <div className="mt-16 w-full flex flex-col items-center gap-4">
          <h1 className="w-full text-center text-[16pt] font-bold uppercase leading-tight">LAPORAN PERJALANAN DINAS</h1>
          <h2 className="w-full text-center text-[14pt] font-bold uppercase leading-snug">
            KEGIATAN INSPEKSI CARA PEMBENIHAN IKAN<br/>YANG BAIK (CPIB)
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
      <div className="pt-8">
        <div className="w-full text-center mb-8">
          <h3 className="font-bold uppercase text-[12pt] leading-tight">
            LAPORAN PERJALANAN DINAS<br/>KEGIATAN INSPEKSI CARA PEMBENIHAN IKAN YANG BAIK (CPIB)
          </h3>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Surat Tugas Nomor {data.noSurat || "-"}</li>
            <li>DIPA -032.13.2.427624/2026 Tanggal 1 Desember 2025</li>
          </ol>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">II. Petugas Pelaksana</h4>
          <div className="mt-1">
            {data.petugasPelaksana ? (
              data.petugasPelaksana.split('|').map((petugas: string, index: number) => {
                const match = petugas.trim().match(/(.*)\((.*)\)/);
                const nama = match ? match[1].trim() : petugas.trim();
                const peran = match ? match[2].trim() : '';
                return (
                  <p key={index}>{String.fromCharCode(97 + index)}. {nama} {peran ? `(${peran})` : ''}</p>
                );
              })
            ) : (<p>-</p>)}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">III. Pendahuluan</h4>
          <p className="indent-8 mt-1">
            Cara Pembenihan Ikan yang Baik (CPIB) merupakan pedoman yang mengatur seluruh kegiatan pembenihan ikan agar menghasilkan benih yang bermutu, sehat, dan aman bagi lingkungan...
          </p>
          <p className="indent-8 mt-1">
            CPIB bertujuan untuk memastikan bahwa setiap tahapan pembenihan dilakukan sesuai dengan standar teknis...
          </p>
          <p className="indent-8 mt-1">
            Penerapan CPIB memberikan banyak manfaat bagi pada pembudidaya, antara lain meningkatkan produktivitas usaha...
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">IV. Maksud dan Tujuan</h4>
          <p className="indent-8 mt-1">
            (Isi teks Maksud dan Tujuan dari file docx Anda di sini)
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">V. Waktu dan Tempat Pelaksanaan</h4>
          <p className="indent-8 mt-1">
            Kegiatan ini dilaksanakan di <strong>{data.namaPerusahaan || "-"}</strong> yang mengajukan permohonan kepada Balai PPMHKP pusat...
          </p>
          <p className="indent-8 mt-1">
            Kegiatan inspeksi sertifikasi cara pembenihan ikan yang baik (CPIB) dilaksanakan pada tanggal <strong>{tanggalIndo || "-"}</strong> oleh Inspektur Mutu/Asisten Inspektur Mutu Balai PPMHKP Denpasar.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">VI. Pelaksanaan Kegiatan</h4>
          <p className="indent-8 mt-1">
            Inspeksi dapat dilakukan setelah adanya surat perintah dari pusat...
          </p>
          <div className="pl-4 mt-1 space-y-1">
            <p>a. Nomor induk berusaha dan sertifikat standar;</p>
            <p>b. Data umum pemenihan...</p>
            <p>c. Layout tata letak unit budidaya</p>
            <p>d. Struktur organisasi dan uraian tugas dari tiap personil</p>
            <p>e. Standar operasional prosedur kegiatan budidaya</p>
          </div>
          <p className="indent-8 mt-1">
            Setelah kelengkapan terpenuhi maka verifikator akan melakukan verifikasi...
          </p>
          <div className="pl-4 mt-1 space-y-1">
            <p>a. Pelaku usaha melakukan permohonan melalui OSS...</p>
            <p>b. Verifikasi kelengkapan dan keabsahan dokumen oleh petugas</p>
            <p>c. Inspeksi CPIB oleh Inspektur Mutu</p>
            <p>d. Review oleh Tim Teknis Internal BPPMHKP Denpasar</p>
            <p>e. Rekomendasi penerbitan sertifikat CPIB</p>
            <p>f. Penerbitan sertifikat CPIB melalui sistem OSS</p>
          </div>
          <p className="indent-8 mt-1">
            Jangka waktu terbitnya sertifikat adalah 10 hari kerja sejak dokumen permohonan dinyatakan lengkap dan sesuai.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold">VII. Penutup</h4>
          <p className="indent-8 mt-1">
            Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik- baiknya...
          </p>
        </div>

        {/* TANDA TANGAN */}
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
                      <td className="w-[30px] align-middle pb-8">{String.fromCharCode(97 + index)}.</td>
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