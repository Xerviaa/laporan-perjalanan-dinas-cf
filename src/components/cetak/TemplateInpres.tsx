interface FotoMetaItem {
  caption?: string;
  pasarHeader?: string;
  pasarIndex?: number;
  kelompok?: string;
  kolom?: string;
}

interface LokusPasarItem {
  namaPasar?: string;
  sampel?: string[];
}

export default function TemplateInpres({ data }: { data: any }) {
  const fotoKegiatanRaw = data?.fotoKegiatan ?? data?.foto_kegiatan;
  const kendalaRaw = data?.kendala;
  const hasilKegiatanRaw = data?.hasilKegiatan ?? data?.hasil_kegiatan;
  const petugasPelaksanaRaw = data?.petugasPelaksana ?? data?.petugas_pelaksana;
  const namaPerusahaanRaw = data?.namaPerusahaan ?? data?.nama_perusahaan;
  const alamatPerusahaanRaw = data?.alamatPerusahaan ?? data?.alamat_perusahaan;
  const noSuratRaw = data?.noSurat ?? data?.no_surat;
  const tanggalRaw = data?.tanggal;

  // Format tanggal Indonesia: "5 September 2024"
  const formatTanggalIndo = (tgl: string) => {
    if (!tgl) return '-';
    try {
      const date = new Date(tgl);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  // Parsing daftar key foto dari R2
  const getFotoList = (): string[] => {
    if (!fotoKegiatanRaw || fotoKegiatanRaw === '[]') return [];
    try {
      const parsed = JSON.parse(fotoKegiatanRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Parsing metadata khusus Inpres dari field kendala (pukul, lokusPasar, unitKerja, fotoMeta)
  const parseInpresExtra = () => {
    const defaultResult = {
      pukul: '07.00 WITA',
      lokusPasar: [] as LokusPasarItem[],
      unitKerja: [
        'Dinas Kelautan dan Perikanan Provinsi Bali',
        'Balai PPMHKP Denpasar',
      ],
      fotoMeta: [] as FotoMetaItem[],
    };

    if (!kendalaRaw || String(kendalaRaw).trim() === '' || String(kendalaRaw).trim() === '-') {
      return defaultResult;
    }

    try {
      const parsed = JSON.parse(kendalaRaw);
      if (parsed && typeof parsed === 'object' && parsed.isInpresMeta) {
        return {
          pukul: parsed.pukul || '07.00 WITA',
          lokusPasar: Array.isArray(parsed.lokusPasar) ? parsed.lokusPasar : [],
          unitKerja:
            Array.isArray(parsed.unitKerja) && parsed.unitKerja.length > 0
              ? parsed.unitKerja.filter((u: string) => u && u.trim() !== '')
              : defaultResult.unitKerja,
          fotoMeta: Array.isArray(parsed.fotoMeta) ? parsed.fotoMeta : [],
        };
      }
    } catch {
      const lines = String(kendalaRaw)
        .split('\n')
        .filter((item: string) => item.trim() !== '');
      if (lines.length > 0) {
        return { ...defaultResult, unitKerja: lines };
      }
    }

    return defaultResult;
  };

  const extra = parseInpresExtra();

  const captionStandarInpres = [
    'Foto bangunan tampak luar secara keseluruhan',
    'Foto lingkungan bangunan secara keseluruhan',
    'Foto Close up sampel Ikan 1 & Pengecekan Suhu',
    'Foto lapak pedagang yang diambil sebagai sampel Ikan 1',
    'Foto Close up Sampel ikan 2 & Pengecekan Suhu',
    'Foto lapak pedagang yang diambil sebagai sampel ikan 2',
    'Foto Close up sampel ikan 3 & Pengecekan Suhu',
    'Foto lapak pedagang yang diambil sebagai sampel ikan 3',
    'Foto Close up sampel Ikan 4 & Pengecekan Suhu',
    'Foto lapak pedagang yang diambil sebagai sampel Ikan 4',
    'Foto Close up sampel ikan 5 & pengecekan Suhu',
    'Foto lapak pedagang yang diambil sebagai sampel 5',
    'Saluran Air',
    'Penerangan',
    'Fasilitas Sanitasi',
    'Fasilitas Pendukung (Air dan Es)',
    'Peralatan',
    'Distribusi dan transportasi',
    'Pencegahan Kontaminasi Silang',
    'Tingkah laku penjual/pekerja',
  ];

  // Kelompokkan foto berdasarkan Judul Pasar lalu susun menjadi baris 2 kolom
  const fotoList = getFotoList();
  type FotoItem = { key: string; caption: string };
  type FotoSection = { title: string; rows: { left?: FotoItem; right?: FotoItem }[] };

  const sections: FotoSection[] = [];
  const defaultTitle =
    extra.lokusPasar[0]?.namaPasar?.trim() || namaPerusahaanRaw || '-';
  let currentTitle = defaultTitle;
  let currentItems: FotoItem[] = [];

  const flushSection = () => {
    if (currentItems.length === 0) return;
    const rows: { left?: FotoItem; right?: FotoItem }[] = [];
    for (let i = 0; i < currentItems.length; i += 2) {
      rows.push({
        left: currentItems[i],
        right: currentItems[i + 1],
      });
    }
    sections.push({ title: currentTitle, rows });
    currentItems = [];
  };

  fotoList.forEach((key, idx) => {
    const meta = extra.fotoMeta[idx] || {};
    const judulPasarDariMeta =
      meta.pasarHeader?.trim() ||
      (typeof meta.pasarIndex === 'number'
        ? extra.lokusPasar[meta.pasarIndex]?.namaPasar?.trim()
        : '');

    if (judulPasarDariMeta && judulPasarDariMeta !== currentTitle) {
      if (currentItems.length > 0) flushSection();
      currentTitle = judulPasarDariMeta;
    }

    currentItems.push({
      key,
      caption:
        meta.caption && meta.caption.trim() !== ''
          ? meta.caption
          : captionStandarInpres[idx] || `Dokumentasi Kegiatan ${idx + 1}`,
    });
  });
  flushSection();

  const lokasiKegiatan = alamatPerusahaanRaw || namaPerusahaanRaw || '-';

  // Render teks dengan dukungan format **tebal** jika ada
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const narasiDefaultFallback = `Pengawasan Mutu dan Keamanan Hasil Perikanan Domestik merupakan implementasi dari Instruksi Presiden (Inpres) Nomor 01 Tahun 2017 tentang Gerakan Masyarakat Hidup Sehat (GERMAS).

Kegiatan ini dilaksanakan pada sentra-sentra penyedia pangan sehat di pasar modern dan/atau pasar tradisional; tempat pendaratan ikan/pelabuhan perikanan (${namaPerusahaanRaw || '...'}) di ${lokasiKegiatan}

Salah satu lokus kegiatan pengawasan mutu dan keamanan hasil perikanan domestik adalah :

1. Pasar ..., dengan sampel:
a. ...
b. ...
c. ...
d. ...
e. ...

2. Pasar ..., dengan sampel:
a. ...
b. ...
c. ...
d. ...
e. ...`;

  const narasiTampil =
    hasilKegiatanRaw &&
    String(hasilKegiatanRaw).trim() !== '-' &&
    String(hasilKegiatanRaw).trim() !== ''
      ? String(hasilKegiatanRaw)
      : narasiDefaultFallback;

  return (
    <div
      className="text-[11pt] leading-snug text-black"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    >
      {/* ==================== HALAMAN 1: RESUME GIAT KEGIATAN ==================== */}
      <div className="w-full print:break-after-page">
        {/* LOGO KKP */}
        <div className="flex justify-center mb-2">
          <img
            src="/logo-kkp.png"
            alt="Kementerian Kelautan dan Perikanan"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* JUDUL RESUME GIAT KEGIATAN */}
        <div className="text-center font-bold uppercase text-[13pt] tracking-wide mb-4">
          <p>RESUME GIAT KEGIATAN</p>
        </div>

        <table className="w-full border-collapse border border-black text-[11pt]">
          <thead>
            <tr className="bg-white text-black">
              <th
                colSpan={2}
                className="border border-black px-3 py-2 text-center font-bold uppercase text-[10.5pt] leading-snug"
              >
                <div>PENGAWASAN MUTU DAN KEAMANAN HASIL PERIKANAN DALAM NEGERI</div>
                <div>DALAM RANGKA IMPLEMENTASI INPRES 01 TAHUN 2017</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 1. NAMA KEGIATAN */}
            <tr className="break-inside-avoid">
              <td className="w-[30%] border border-black p-2.5 font-bold align-top">
                Nama Kegiatan
              </td>
              <td className="w-[70%] border border-black p-2.5 align-top">
                Pengawasan Mutu dan Keamanan Hasil Perikanan Dalam Negeri
              </td>
            </tr>

            {/* 2. NARASI KEGIATAN */}
            <tr>
              <td className="border border-black p-2.5 font-bold align-top">
                Narasi Kegiatan
              </td>
              <td className="border border-black p-2.5 align-top text-justify whitespace-pre-line">
                {renderFormattedText(narasiTampil)}
              </td>
            </tr>

            {/* 3. UNIT KERJA YANG TERLIBAT */}
            <tr className="break-inside-avoid">
              <td className="border border-black p-2.5 font-bold align-top">
                Unit Kerja yang Terlibat
              </td>
              <td className="border border-black p-2.5 align-top">
                <ol className="list-decimal pl-5 space-y-0.5">
                  {extra.unitKerja.map((unit: string, idx: number) => (
                    <li key={idx}>{unit.replace(/^\d+\.\s*/, '').trim()}</li>
                  ))}
                </ol>
              </td>
            </tr>

            {/* 4. PETUGAS */}
            <tr className="break-inside-avoid">
              <td className="border border-black p-2.5 font-bold align-top">
                Petugas
              </td>
              <td className="border border-black p-2.5 align-top">
                {petugasPelaksanaRaw ? (
                  <ol className="list-decimal pl-5 space-y-0.5">
                    {String(petugasPelaksanaRaw)
                      .split('|')
                      .map((petugas: string, idx: number) => {
                        const namaSaja = petugas.split('(')[0].trim();
                        return <li key={idx}>{namaSaja}</li>;
                      })}
                  </ol>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>

            {/* 5. WAKTU PELAKSANAAN */}
            <tr className="break-inside-avoid">
              <td className="border border-black p-2.5 font-bold align-top">
                Waktu Pelaksanaan
              </td>
              <td className="border border-black p-2.5 align-top">
                <p>{formatTanggalIndo(tanggalRaw)}</p>
                <p>Pukul : {extra.pukul}</p>
              </td>
            </tr>

            {/* 6. DASAR PELAKSANAAN KEGIATAN */}
            <tr className="break-inside-avoid">
              <td className="border border-black p-2.5 font-bold align-top">
                Dasar Pelaksanaan Kegiatan
              </td>
              <td className="border border-black p-2.5 align-top">
                Surat Tugas Nomor {noSuratRaw || '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==================== HALAMAN 2+: DOKUMENTASI KEGIATAN ==================== */}
      <div className="pt-4" style={{ pageBreakBefore: 'always' }}>
        {sections.length > 0 ? (
          sections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? 'mt-8 pt-4 break-before-page' : ''}>
              <div className="text-center font-bold uppercase text-[12pt] mb-4">
                <p>DOKUMENTASI KEGIATAN</p>
                <p>{section.title}</p>
              </div>

              <table className="w-full border-collapse border border-black text-[10pt]">
                <tbody>
                  {section.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="break-inside-avoid">
                      {/* KOLOM KIRI */}
                      <td className="w-1/2 border border-black p-2 align-bottom text-center">
                        {row.left && (
                          <div className="flex flex-col items-center justify-between h-full">
                            <img
                              src={`/api/r2/${row.left.key}`}
                              alt={row.left.caption}
                              className="w-full max-h-56 object-contain mb-2"
                            />
                            <p className="w-full border-t border-black pt-1.5 font-normal text-center">
                              {row.left.caption}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* KOLOM KANAN */}
                      <td className="w-1/2 border border-black p-2 align-bottom text-center">
                        {row.right ? (
                          <div className="flex flex-col items-center justify-between h-full">
                            <img
                              src={`/api/r2/${row.right.key}`}
                              alt={row.right.caption}
                              className="w-full max-h-56 object-contain mb-2"
                            />
                            <p className="w-full border-t border-black pt-1.5 font-normal text-center">
                              {row.right.caption}
                            </p>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <>
            <div className="text-center font-bold uppercase text-[12pt] mb-4">
              <p>DOKUMENTASI KEGIATAN</p>
              <p>{defaultTitle}</p>
            </div>
            <div className="text-center text-gray-500 italic border border-dashed border-gray-400 p-10">
              (Belum ada foto dokumentasi yang di-upload)
            </div>
          </>
        )}
      </div>
    </div>
  );
}