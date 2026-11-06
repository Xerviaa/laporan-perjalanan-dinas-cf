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

  const parseFiles = (jsonString: string) => {
    try {
      if (!jsonString || jsonString === '[]') return [];
      return JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
  };

  const berkasKegiatan = parseFiles(report.berkasKegiatan);
  const berkasPerbaikan = parseFiles(report.berkasPerbaikan);
  const fotoKegiatan = parseFiles(report.fotoKegiatan);

  // FUNGSI YANG SAMA PERSIS DENGAN TEMPLATE CETAK (YANG SUDAH BERHASIL)
  const parsePetugas = (petugasString: string) => {
    if (!petugasString) return [];
    return petugasString.split('|').map((p) => {
      const parts = p.split('(');
      const namaLengkap = parts[0].trim(); 
      const jabatan = parts[1] ? parts[1].replace(')', '').trim() : 'Anggota Tim';

      // LOGIKA BARU: Hapus gelar "drh. " di depan nama
      let namaBersih = namaLengkap.split(',')[0].trim().toLowerCase();
      namaBersih = namaBersih.replace(/^drh\.\s*/i, ''); 
      namaBersih = namaBersih.replace(/[^a-z0-9\s-]/g, '');
      const namaFile = namaBersih.replace(/\s+/g, '-');

      return { 
        nama: namaLengkap, 
        jabatan, 
        namaFileTtd: `${namaFile}.png` 
      };
    });
  };

  const tanggalCetak = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0 font-sans text-black">
      <TombolCetak />
      
      <div className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none p-[2cm] print:p-0">
        
        {/* HEADER */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold uppercase">Laporan Monitoring Sertifikasi</h1>
          <p className="text-sm mt-1">BPPMHKP Denpasar</p>
        </div>

        {/* INFO LAPORAN */}
        <table className="w-full text-sm mb-6">
          <tbody>
            <tr>
              <td className="py-1 font-semibold w-40">Nama Perusahaan</td>
              <td className="py-1">: {report.namaPerusahaan || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Jenis Kegiatan</td>
              <td className="py-1">: {report.jenisKegiatan || '-'}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Tanggal Pelaksanaan</td>
              <td className="py-1">: {formatTanggal(report.tanggal)}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Petugas Pelaksana</td>
              <td className="py-1">: {report.petugasPelaksana ? report.petugasPelaksana.split('|').map((p: string) => p.split('(')[0].trim()).join(', ') : '-'}</td>
            </tr>
          </tbody>
        </table>

        <hr className="my-4 border-gray-300" />

        {/* HASIL & KENDALA */}
        <div className="mb-6">
          <h2 className="font-bold bg-gray-100 p-2 mb-2 border-l-4 border-black">A. Hasil Kegiatan</h2>
          <p className="text-sm text-justify whitespace-pre-wrap">{report.hasilKegiatan || '-'}</p>
        </div>
        <div className="mb-6">
          <h2 className="font-bold bg-gray-100 p-2 mb-2 border-l-4 border-black">B. Kendala</h2>
          <p className="text-sm text-justify whitespace-pre-wrap">{report.kendala || '-'}</p>
        </div>

        {/* BERKAS TERLAMPIR */}
        <div className="mb-6">
          <h2 className="font-bold bg-gray-100 p-2 mb-3 border-l-4 border-black">C. Berkas Terlampir</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">1. Berkas Kegiatan</h3>
            {berkasKegiatan.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {berkasKegiatan.map((key: string, idx: number) => {
                  const fileName = key.split('-').pop() || key;
                  return <li key={idx}>{fileName}</li>;
                })}
              </ul>
            ) : (
              <p className="text-sm italic text-gray-500">Tidak ada berkas kegiatan.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">2. Berkas Perbaikan</h3>
            {berkasPerbaikan.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {berkasPerbaikan.map((key: string, idx: number) => {
                  const fileName = key.split('-').pop() || key;
                  return <li key={idx}>{fileName}</li>;
                })}
              </ul>
            ) : (
              <p className="text-sm italic text-gray-500">Tidak ada berkas perbaikan.</p>
            )}
          </div>
        </div>

        {/* DOKUMENTASI FOTO KEGIATAN */}
        <div className="mb-6">
          <h2 className="font-bold bg-gray-100 p-2 mb-4 border-l-4 border-black">IV. Dokumentasi Foto Kegiatan</h2>
          
          {fotoKegiatan.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fotoKegiatan.map((key: string, idx: number) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full h-48 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
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

        {/* BAGIAN TANDA TANGAN PELAKSANA (SUDAH DIPERBAIKI) */}
        <div className="mb-12 mt-10">
          <h2 className="font-bold bg-gray-100 p-2 mb-8 border-l-4 border-black uppercase">V. Tanda Tangan Pelaksana</h2>
          
          <div className="grid grid-cols-3 gap-8">
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

        {/* FOOTER / KETERANGAN CETAK */}
        <div className="mt-16 text-center text-xs text-gray-600 border-t border-gray-300 pt-4">
          <p>Laporan ini dibuat secara otomatis melalui Sistem MONICA IMUT</p>
          <p>Tanggal cetak: {tanggalCetak}</p>
        </div>

      </div>
    </div>
  );
}