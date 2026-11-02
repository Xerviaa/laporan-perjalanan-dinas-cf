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
      
      {/* JUDUL LAPORAN (Sesuai PDF) */}
      <div className="text-center mb-8">
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
        <div className="flex mt-1">
          <span className="w-40">Petugas Pelaksana</span>
          <span className="mr-2">:</span>
          <div>
            {data.petugasPelaksana ? (
              data.petugasPelaksana.split(',').map((petugas: string, index: number) => (
                <p key={index}>{String.fromCharCode(97 + index)}. {petugas.trim()}</p>
              ))
            ) : (
              <p>a. Siti Nurlatifah, S.St.Pi., M.Si</p>
            )}
          </div>
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
          Kegiatan ini dilaksanakan di <strong>{data.namaPerusahaan || "KM. Naga Mas Perkasa"}</strong> di Pelabuhan Benoa, Denpasar-Bali yang mengajukan permohonan kepada BPPMHKP dan akan diteruskan pada inspektur mutu/asisten inspektur mutu yang berada di Balai PPMHKP Denpasar setelah dilakukan verifikasi permohonan.
        </p>
        <p className="indent-8 mt-1">
          Inspeksi dilaksanakan pada tanggal <strong>{tanggalIndo || "3 September 2026"}</strong> oleh Inspektur Mutu/Asisten Inspektur Mutu dan petugas yang dimiliki oleh Balai PPMHKP Denpasar.
        </p>
      </div>

      {/* VI. PELAKSANAAN KEGIATAN (Ini yang sebelumnya terlewat) */}
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

      {/* VII. PENUTUP */}
      <div className="mb-4">
        <h4 className="font-bold">VII. Penutup</h4>
        <p className="indent-8 mt-1">
          Demikian laporan ini dibuat dari hasil kegiatan yang dilaksanakan dengan sebaik-baiknya dengan harapan dapat memberikan jaminan keamanan hasil perikanan yang diekspor ataupun yang dikonsumsi lokal oleh masyarakat Indonesia. Pelaksanaan kegiatan ini lebih baik dengan adanya peralatan dan perlengkapan yang disediakan oleh kantor Balai PPMHKP Denpasar sehingga hasil yang didapat lebih sempurna.
        </p>
      </div>

      {/* TANDA TANGAN PETUGAS */}
      <div className="mt-8 mb-8">
        <p>Petugas Pelaksana :</p>
        <div className="mt-2 space-y-1">
          {data.petugasPelaksana ? (
            data.petugasPelaksana.split(',').map((petugas: string, index: number) => (
              <div key={index} className="flex">
                <span className="w-[60%]">{String.fromCharCode(97 + index)}. {petugas.trim()}</span>
                <span>(....................)</span>
              </div>
            ))
          ) : (
            <div className="flex">
              <span className="w-[60%]">a. Siti Nurlatifah, S.St.Pi., M.Si</span>
              <span>(....................)</span>
            </div>
          )}
        </div>
      </div>

      {/* HALAMAN BARU UNTUK DOKUMENTASI */}
      <div className="page-break-before-always mt-10 pt-10">
        <h4 className="font-bold text-center mb-6 text-[12pt]">DOKUMENTASI KEGIATAN</h4>
        <div className="grid grid-cols-2 gap-4">
          {data.fotoKegiatan ? (
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