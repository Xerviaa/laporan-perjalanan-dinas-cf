'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TombolCetak from '@/components/TombolCetak';

export default function PrintMonitoringPage() {
  const params = useParams();
  const id = Number(params.id);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (data.status === 'success') {
          const found = data.data.find((r: any) => r.id === id);
          setReport(found);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <div className="text-center mt-20">Memuat data...</div>;
  if (!report) return <div className="text-center mt-20 text-red-500">Laporan tidak ditemukan.</div>;

  const formatTanggal = (tgl: string) => {
    if (!tgl) return '-';
    return new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatNamaPerusahaan = (nama: string) => {
    if (!nama) return 'NAMA PERUSAHAAN BELUM DIISI';
    const namaUpper = nama.toUpperCase();
    if (namaUpper.endsWith(', PT')) return 'PT. ' + nama.slice(0, -4).trim();
    if (namaUpper.endsWith(' PT')) return 'PT. ' + nama.slice(0, -3).trim();
    if (namaUpper.endsWith(', CV')) return 'CV. ' + nama.slice(0, -4).trim();
    if (namaUpper.endsWith(' CV')) return 'CV. ' + nama.slice(0, -3).trim();
    return nama;
  };

  const parseFiles = (jsonString: string) => {
    try {
      if (!jsonString || jsonString === '[]') return [];
      return JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
  };

  // --- LOGIKA PENGECEKAN STATUS BERKAS ---
  const hasSuratTugas = report.suratTugas && report.suratTugas !== '[]';
  const hasBerkasKegiatan = report.berkasKegiatan && report.berkasKegiatan !== '[]';
  const hasBerkasPerbaikan = report.berkasPerbaikan && report.berkasPerbaikan !== '[]';
  const hasPemeriksaan = report.berkasPemeriksaanTindakanPerbaikan && report.berkasPemeriksaanTindakanPerbaikan !== '[]';

  const totalFileTerisi = [hasSuratTugas, hasBerkasKegiatan, hasBerkasPerbaikan, hasPemeriksaan].filter(Boolean).length;
  const isLengkap = totalFileTerisi === 4;

  const fotoKegiatan = parseFiles(report.fotoKegiatan);

  const parsePetugas = (petugasString: string) => {
    if (!petugasString) return [];
    return petugasString.split('|').map((p) => {
      const parts = p.split('(');
      const namaLengkap = parts[0].trim(); 
      const jabatan = parts[1] ? parts[1].replace(')', '').trim() : 'Anggota Tim';
      let namaBersih = namaLengkap.split(',')[0].trim().toLowerCase();
      namaBersih = namaBersih.replace(/^drh\.\s*/i, ''); 
      namaBersih = namaBersih.replace(/[^a-z0-9\s-]/g, '');
      const namaFile = namaBersih.replace(/\s+/g, '-');
      return { nama: namaLengkap, jabatan, namaFileTtd: `${namaFile}.png` };
    });
  };

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0 font-sans text-slate-800">
      
      {/* Tombol cetak disembunyikan saat print */}
      <div className="print:hidden">
        <TombolCetak />
      </div>
      
      {/* Kertas Putih Utama */}
      <div className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none print:w-full p-[2cm] print:p-0">
        
        {/* HEADER ATAS (KOP SURAT) */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold uppercase tracking-wide text-black">
            LAPORAN MONITORING SERTIFIKASI
          </h1>
          <p className="text-sm text-gray-800 mt-1">BPPMHKP Denpasar</p>
          <hr className="my-4 border-black w-full" />

          <h2 className="text-2xl font-bold uppercase text-black mt-2">
            {formatNamaPerusahaan(report.namaPerusahaan)}
          </h2>
          
          <p className="text-sm text-gray-700 mt-1 max-w-2xl mx-auto">
            {report.alamatPerusahaan || 'Alamat belum diisi'}
          </p>
        </div>

        <div className="space-y-6 text-sm">
          {/* I. INFORMASI UMUM (TANPA TUJUAN & ALAMAT KARENA SUDAH ADA DI HEADER) */}
          <div>
            <h2 className="font-bold bg-gray-100 p-2 mb-3 border-l-4 border-black uppercase text-sm">I. INFORMASI UMUM</h2>
            <div className="grid grid-cols-2 gap-6 px-2">
              
              {/* Kolom Kiri */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Nama Kegiatan</p>
                  <p className="font-bold">{report.jenisKegiatan || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nomor Surat Tugas</p>
                  <p className="font-bold">{report.noSurat || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pelaksana</p>
                  <ul className="list-none">
                    {parsePetugas(report.petugasPelaksana).map((p: any, i: number) => (
                      <li key={i} className="font-bold">{p.nama} <span className="text-gray-500 font-normal">({p.jabatan})</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Tanggal Pelaksanaan</p>
                  <p className="font-bold">{formatTanggal(report.tanggal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  {isLengkap ? (
                    <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-1 text-xs rounded font-bold">Berkas Lengkap</span>
                  ) : (
                    <span className="inline-block bg-amber-100 text-amber-700 px-2 py-1 text-xs rounded font-bold">Belum Lengkap ({totalFileTerisi}/4)</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          <hr className="border-gray-300" />

          {/* II. KELENGKAPAN BERKAS */}
          <div>
            <h2 className="font-bold bg-gray-100 p-2 mb-3 border-l-4 border-black uppercase text-sm">II. KELENGKAPAN BERKAS</h2>
            <div className="px-2">
              <div className="mb-2">
                <h3 className="font-semibold text-sm">1. Surat Tugas</h3>
                <p className="text-sm pl-5">
                  {hasSuratTugas ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Terlampir
                    </span>
                  ) : "- Tidak ada"}
                </p>
              </div>
              <div className="mb-2">
                <h3 className="font-semibold text-sm">2. Berkas Kegiatan</h3>
                <p className="text-sm pl-5">
                  {hasBerkasKegiatan ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Terlampir
                    </span>
                  ) : "- Tidak ada"}
                </p>
              </div>
              <div className="mb-2">
                <h3 className="font-semibold text-sm">3. Berkas Perbaikan</h3>
                <p className="text-sm pl-5">
                  {hasBerkasPerbaikan ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Terlampir
                    </span>
                  ) : "- Tidak ada"}
                </p>
              </div>
              <div className="mb-2">
                <h3 className="font-semibold text-sm">4. Pemeriksaan Tindakan Perbaikan</h3>
                <p className="text-sm pl-5">
                  {hasPemeriksaan ? (
                    <span className="text-blue-600 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Terlampir
                    </span>
                  ) : "- Tidak ada"}
                </p>
              </div>
            </div>
          </div>

          {/* III. DOKUMENTASI FOTO */}
          <div>
            <h2 className="font-bold bg-gray-100 p-2 mb-4 border-l-4 border-black uppercase text-sm">III. DOKUMENTASI FOTO KEGIATAN</h2>
            <div className="px-2">
              {fotoKegiatan.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fotoKegiatan.map((key: string, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full h-40 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                        <img 
                          src={`/api/r2/${key}`} 
                          alt={`Foto Kegiatan ${idx + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }}
                        />
                      </div>
                      <p className="text-xs italic text-gray-600 mt-2">Foto Kegiatan {idx + 1}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-gray-500">Tidak ada foto kegiatan yang dilampirkan.</p>
              )}
            </div>
          </div>

          {/* IV. TANDA TANGAN PELAKSANA */}
          <div className="mt-10 mb-12 break-inside-avoid page-break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
            <h2 className="font-bold bg-gray-100 p-2 mb-8 border-l-4 border-black uppercase text-sm">
              IV. TANDA TANGAN PELAKSANA
            </h2>
            
            <div className="grid grid-cols-3 gap-8 px-2">
              {parsePetugas(report.petugasPelaksana).map((petugas: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center justify-end text-center h-40">
                  <div className="h-20 w-full flex items-end justify-center mb-2">
                    <img 
                      src={`/tanda-tangan/${petugas.namaFileTtd}`} 
                      alt={`TTD ${petugas.nama}`}
                      className="max-h-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="w-full border-t border-black mb-2"></div>
                  <p className="font-bold text-sm text-black">{petugas.nama}</p>
                  <p className="text-xs text-black">{petugas.jabatan}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}