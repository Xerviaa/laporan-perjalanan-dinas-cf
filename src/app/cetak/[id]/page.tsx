'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TombolCetak from '@/components/TombolCetak';

export default function PreviewLaporanPage() {
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

  // --- FUNGSI PENGECEKAN STATUS & FILE ---
  const hasSuratTugas = report.suratTugas && report.suratTugas !== '[]';
  const hasBerkasKegiatan = report.berkasKegiatan && report.berkasKegiatan !== '[]';
  const hasBerkasPerbaikan = report.berkasPerbaikan && report.berkasPerbaikan !== '[]';
  const hasPemeriksaan = report.berkasPemeriksaanTindakanPerbaikan && report.berkasPemeriksaanTindakanPerbaikan !== '[]';

  const totalFileTerisi = [hasSuratTugas, hasBerkasKegiatan, hasBerkasPerbaikan, hasPemeriksaan].filter(Boolean).length;
  const isLengkap = totalFileTerisi === 4;

  const parseFiles = (jsonString: string) => {
    try {
      if (!jsonString || jsonString === '[]') return [];
      return JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
  };

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
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0 font-sans text-slate-800">
      
      {/* Tombol Aksi (Disembunyikan saat print) */}
      <div className="print:hidden max-w-[21cm] mx-auto flex justify-between items-center mb-4 px-4">
        <a href="/monitoring" className="text-blue-600 hover:underline text-sm font-semibold flex items-center gap-2">
           &larr; Kembali
        </a>
        <TombolCetak />
      </div>

      {/* Kertas Putih Utama */}
      <div className="mx-auto w-[21cm] bg-white shadow-lg print:shadow-none print:w-full">
        
        {/* HEADER ATAS */}
        <div className="text-center pt-8 pb-6 px-10">
          <h1 className="text-xl font-bold uppercase tracking-wide">LAPORAN PERJALANAN DINAS</h1>
          <h2 className="text-sm font-bold uppercase mt-1">BPPMHKP DENPASAR</h2>
          <p className="text-xs text-gray-500 mt-1">Monitoring Capaian Sertifikasi Mutu Terpadu</p>
          <hr className="mt-4 border-t-2 border-black" />
        </div>

        <div className="px-10 pb-10 space-y-4 text-sm">

          {/* I. INFORMASI UMUM */}
          <div>
            <div className="bg-slate-100 px-3 py-1 font-bold text-xs uppercase border-l-4 border-slate-400">I. INFORMASI UMUM</div>
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-200">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Nama Kegiatan</p>
                  <p className="font-semibold">{report.jenisKegiatan || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nomor Surat Tugas</p>
                  <p className="font-semibold">{report.noSurat || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tujuan</p>
                  <p className="font-semibold uppercase">{report.namaPerusahaan || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Alamat</p>
                  <p className="font-semibold uppercase">{report.alamatPerusahaan || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pelaksana</p>
                  <ul className="list-none">
                    {parsePetugas(report.petugasPelaksana).map((p: any, i: number) => (
                      <li key={i} className="font-semibold">{p.nama} <span className="text-gray-500 font-normal">({p.jabatan})</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Tanggal Pelaksanaan</p>
                  <p className="font-semibold">{report.tanggal ? new Date(report.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  {isLengkap ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 text-xs rounded font-bold">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      Berkas Lengkap
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 text-xs rounded font-bold">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Belum Lengkap ({totalFileTerisi}/4)
                    </span>
                  )}
                </div>
                <div className="pt-6">
                  <p className="text-xs text-gray-500">Jenis Sertifikasi</p>
                  <p className="font-semibold uppercase">
                    {report.jenisKegiatan?.includes('CPIB Kapal') ? 'CPIB' : report.jenisKegiatan?.split(' ')[1] || '-'}
                  </p>
                </div>
                {/* RUANG LINGKUP SUDAH DIHAPUS */}
              </div>
            </div>
          </div>

          {/* II. KELENGKAPAN BERKAS (DESAIN CARD BARU) */}
          <div>
            <div className="bg-slate-100 px-3 py-1 font-bold text-xs uppercase border-l-4 border-slate-400">II. KELENGKAPAN BERKAS</div>
            <div className="p-4 bg-white border-b border-slate-200">
              
              {/* Grid untuk 4 Card */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Card 1: Surat Tugas */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasSuratTugas ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${hasSuratTugas ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {hasSuratTugas ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${hasSuratTugas ? 'text-emerald-900' : 'text-rose-900'}`}>Surat Tugas</p>
                    <p className={`text-[10px] ${hasSuratTugas ? 'text-emerald-600' : 'text-rose-600'}`}>{hasSuratTugas ? 'Telah di-upload' : 'Belum di-upload'}</p>
                  </div>
                </div>

                {/* Card 2: Berkas Kegiatan */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasBerkasKegiatan ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${hasBerkasKegiatan ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {hasBerkasKegiatan ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${hasBerkasKegiatan ? 'text-emerald-900' : 'text-rose-900'}`}>Berkas Kegiatan</p>
                    <p className={`text-[10px] ${hasBerkasKegiatan ? 'text-emerald-600' : 'text-rose-600'}`}>{hasBerkasKegiatan ? 'Telah di-upload' : 'Belum di-upload'}</p>
                  </div>
                </div>

                {/* Card 3: Berkas Perbaikan */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasBerkasPerbaikan ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${hasBerkasPerbaikan ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {hasBerkasPerbaikan ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${hasBerkasPerbaikan ? 'text-emerald-900' : 'text-rose-900'}`}>Berkas Perbaikan</p>
                    <p className={`text-[10px] ${hasBerkasPerbaikan ? 'text-emerald-600' : 'text-rose-600'}`}>{hasBerkasPerbaikan ? 'Telah di-upload' : 'Belum di-upload'}</p>
                  </div>
                </div>

                {/* Card 4: Pemeriksaan */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasPemeriksaan ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${hasPemeriksaan ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {hasPemeriksaan ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${hasPemeriksaan ? 'text-emerald-900' : 'text-rose-900'}`}>Pemeriksaan Perbaikan</p>
                    <p className={`text-[10px] ${hasPemeriksaan ? 'text-emerald-600' : 'text-rose-600'}`}>{hasPemeriksaan ? 'Telah di-upload' : 'Belum di-upload'}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* III. DOKUMENTASI FOTO */}
          <div>
            <div className="bg-slate-100 px-3 py-1 font-bold text-xs uppercase border-l-4 border-slate-400">III. DOKUMENTASI FOTO KEGIATAN</div>
            <div className="p-4 grid grid-cols-2 gap-6">
              {fotoKegiatan.length > 0 ? (
                fotoKegiatan.map((key: string, idx: number) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img src={`/api/r2/${key}`} alt={`Foto ${idx + 1}`} className="w-full h-48 object-contain border border-gray-300" />
                    <p className="text-xs text-gray-600 mt-2">Foto Kegiatan {idx + 1}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic col-span-2">Belum ada foto dilampirkan.</p>
              )}
            </div>
          </div>

          {/* IV. TANDA TANGAN */}
          <div className="pt-8">
            <div className="bg-slate-100 px-3 py-1 font-bold text-xs uppercase border-l-4 border-slate-400 mb-8">IV. TANDA TANGAN PELAKSANA</div>
            <div className="grid grid-cols-3 gap-4">
              {parsePetugas(report.petugasPelaksana).map((petugas: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="h-20 w-full flex items-end justify-center mb-2">
                    <img 
                      src={`/tanda-tangan/${petugas.namaFileTtd}`} 
                      alt="TTD" 
                      className="max-h-20 object-contain" 
                      onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none'; 
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if(parent) parent.innerHTML = '<span class="text-xs text-gray-400 italic">TTD tidak tersedia</span>';
                      }} 
                    />
                  </div>
                  <div className="w-full border-t border-black pt-2 mt-2">
                    <p className="font-bold text-sm">{petugas.nama}</p>
                    <p className="text-xs text-gray-600">{petugas.jabatan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}