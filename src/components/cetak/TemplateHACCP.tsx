// ... (bagian teks I-VI tetap sama) ...

{/* TANDA TANGAN (VERSI TEKS) */}
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
            <span className="text-gray-600">(......)</span>
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

{/* DOKUMENTASI (VERSI TEKS) */}
<div className="page-break-before-always mt-10 pt-10">
  <h4 className="font-bold text-center mb-6 text-[12pt]">DOKUMENTASI KEGIATAN</h4>
  <div className="text-center text-gray-500 italic mt-4 border p-10 border-dashed">
    (Fitur foto akan diaktifkan kembali nanti)
  </div>
</div>