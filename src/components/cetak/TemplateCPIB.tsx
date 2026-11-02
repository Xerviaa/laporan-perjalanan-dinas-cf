export default function TemplateCPIB({ data }: { data: any }) {
  // Format tanggal dari database (YYYY-MM-DD) menjadi format Indonesia
  const formatTanggal = (tgl: string) => {
    if (!tgl) return "";
    const date = new Date(tgl);
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const tanggalIndo = formatTanggal(data.tanggal);

  return (
    <div className="font-serif text-[11pt] leading-relaxed text-justify text-black">
      
      {/* JUDUL LAPORAN */}
      <div className="text-center mb-8">
        <h3 className="font-bold uppercase text-[12pt] leading-tight">
          Laporan Perjalanan Dinas Kegiatan Inspeksi Cara Penanganan Ikan Yang Baik (CPIB) Di Atas Kapal
        </h3>
        <h4 className="font-bold uppercase text-[12pt] mt-2">
          {data.namaPerusahaan || "KM. NAGA MAS PERKASA"}
        </h4>
        <p className="font-bold mt-1">{tanggalIndo || "3 September 2026"}</p>
      </div>

      {/* I. DASAR PELAKSANAAN */}
      <div className="mb-4">
        <h4 className="font-bold">I. Dasar Pelaksanaan</h4>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>Surat Tugas Nomor : {data.noSurat || "ST/03.0/IX/2026/00183"}</li>
          <li>DIPA -032.13.2.427624/2026 Tanggal 1 Desember 2025</li>
          <li>Peraturan Menteri Kelautan dan Perikanan Nomor 10 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk Pada Penyelenggaraan Perizinan Berusaha Berbasis Risiko Sektor Kelautan dan Perikanan</li>
          <li>Peraturan Presiden Nomor 193 Tahun 2024 tentang Kementerian Kelautan dan Perikanan</li>
          <li>Peraturan Menteri Kelautan dan Perikanan Nomor 2 Tahun 2025 tentang Organisasi dan Tata Kerja Kementerian Kelautan dan Perikanan</li>
          <li>Peraturan Menteri Kelautan dan Perikanan Nomor 16 Tahun 2024 tentang Kewenangan Pembinaan dan Pengendalian Dalam Rangka Penerbitan Sertifikat Jaminan Mutu dan Keamanan Hasil Perikanan</li>
        </ol>
      </div>

      {/* II. PETUGAS PELAKSANA */}
      <div className="mb-4">
        <h4 className="font-bold">II. Petugas Pelaksana</h4>
        <p className="mt-1">Petugas Pelaksana :</p>
        <div className="pl-4">
          {data.petugasPelaksana ? (
            data.petugasPelaksana.split(',').map((petugas: string, index: number) => (
              <p key={index}>{String.fromCharCode(97 + index)}. {petugas.trim()}</p>
            ))
          ) : (
            <p>a. Siti Nurlatifah, S.St.Pi., M.Si</p>
          )}
        </div>
      </div>

      {/* III. PENDAHULUAN */}
      <div className="mb-4">
        <h4 className="font-bold">III. Pendahuluan</h4>
        <p className="indent-8 mt-1">
          Penanganan Ikan adalah suatu rangkaian kegiatan dan/atau perlakuan terhadap ikan tanpa mengubah bentuk dasar. Cara Penanganan Ikan yang Baik adalah pedoman dan tata cara penanganan ikan hasil tangkapan di atas kapal penangkap ikan dan/atau kapal pengangkut ikan serta pembongkaran ikan dari kapal perikanan di pelabuhan perikanan untuk memenuhi persyaratan pengendalian mutu pada usaha penangkapan ikan. Ikan adalah segala jenis organisme yang seluruh atau sebagian dari siklus hidupnya berada di dalam lingkungan perairan. Sertifikat Cara Penanganan Ikan yang Baik adalah sertifikat yang diberikan kepada kapal penangkap ikan dan/atau kapal pengangkut ikan yang menyatakan bahwa kapal tersebut telah memenuhi persyaratan Pengendalian Mutu pada kegiatan Penangkapan Ikan.
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
          Kegiatan ini dilaksanakan di <strong>{data.namaPerusahaan || "KM. Naga Mas Perkasa"}</strong> di Pelabuhan Benoa, Denpasar-Bali yang mengajukan permohonan kepada BPPMHKP dan akan diteruskan pada inspektur mutu/asisten inspektur mutu yang berada di Balai PPMHKP Denpasar setelah dilakukan verifikasi permohonan.
        </p>
        <p className="indent-8 mt-1">
          Inspeksi dilaksanakan pada tanggal <strong>{tanggalIndo || "3 September 2026"}</strong> oleh Inspektur Mutu/Asisten Inspektur Mutu dan petugas yang dimiliki oleh Balai PPMHKP Denpasar.
        </p>
      </div>

      {/* VI. PENUTUP */}
      <div className="mb-4">
        <h4 className="font-bold">VI. Penutup</h4>
        <p className="indent-8 mt-1">
          Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan yang diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia. Pelaksanaan kegiatan ini lebih baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar sehingga hasil yang didapat lebih sempurna.
        </p>
      </div>

      {/* TANDA TANGAN PETUGAS */}
      <div className="mt-8 mb-8">
        <p>Petugas Pelaksana :</p>
        <div className="mt-4 space-y-4 pl-4">
          {data.petugasPelaksana ? (
            data.petugasPelaksana.split(',').map((petugas: string, index: number) => (
              <div key={index} className="flex">
                <span className="w-[60%]">{String.fromCharCode(97 + index)}. {petugas.trim()}</span>
                <span>(........................... )</span>
              </div>
            ))
          ) : (
            <div className="flex">
              <span className="w-[60%]">a. Siti Nurlatifah, S.St.Pi., M.Si</span>
              <span>(........................... )</span>
            </div>
          )}
        </div>
      </div>

      {/* HALAMAN BARU UNTUK DOKUMENTASI */}
      <div className="page-break-before-always mt-10 pt-10">
        <h4 className="font-bold text-center mb-6 text-[12pt]">DOKUMENTASI KEGIATAN</h4>
        <div className="grid grid-cols-2 gap-4">
          {data.fotoKegiatan ? (
             // Jika fotoKegiatan di database berupa array JSON (["url1", "url2"])
             JSON.parse(data.fotoKegiatan).map((url: string, i: number) => (
                <div key={i} className="mb-4">
                  <img src={url} alt={`Dokumentasi ${i}`} className="w-full h-auto object-cover border border-gray-300" />
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