export default function TemplateHACCP({ data }: { data: any }) {
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
        <p>Ini adalah teks dasar pelaksanaan...</p>
      </div>

      {/* II. PENDAHULUAN */}
      <div className="mb-4">
        <h4 className="font-bold">II. Pendahuluan</h4>
        <p>Ini adalah teks pendahuluan...</p>
      </div>

      {/* III. MAKSUD DAN TUJUAN */}
      <div className="mb-4">
        <h4 className="font-bold">III. Maksud dan Tujuan</h4>
        <p>Ini adalah teks maksud dan tujuan...</p>
      </div>

      {/* IV. WAKTU DAN TEMPAT PELAKSANAAN */}
      <div className="mb-4">
        <h4 className="font-bold">IV. Waktu dan Tempat Pelaksanaan</h4>
        <p>Ini adalah teks waktu dan tempat...</p>
      </div>

      {/* V. PELAKSANAAN KEGIATAN */}
      <div className="mb-4">
        <h4 className="font-bold">V. Pelaksanaan Kegiatan</h4>
        <p>Ini adalah teks pelaksanaan kegiatan...</p>
      </div>

      {/* VI. PENUTUP */}
      <div className="mb-4">
        <h4 className="font-bold">VI. Penutup</h4>
        <p>Ini adalah teks penutup...</p>
      </div>
    </div>
  );
}