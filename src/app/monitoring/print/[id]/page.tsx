'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TombolCetak from '@/components/TombolCetak';

export default function PrintMonitoringPage() {
  const params = useParams();
  const id = Number(params.id);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Preview File
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');

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

  // Fungsi menangani klik Buka File
  const handlePreviewFile = (fileName: string, fileUrl: string) => {
    // Untuk file dokumen (docx, pdf, excel), kita gunakan Google Docs Viewer
    // agar bisa tampil di dalam iframe.
    const isDocument = fileName.match(/\.(docx|doc|pdf|xlsx|xls)$/i);
    const urlToPreview = isDocument 
      ? `https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + fileUrl)}&embedded=true`
      : fileUrl; // Jika gambar, langsung pakai URL-nya
    
    setPreviewFileUrl(urlToPreview);
    setPreviewFileName(fileName);
  };

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0">
      <TombolCetak />
      
      <div className="mx-auto w-[21cm] bg-white shadow-xl print:shadow-none p-[2cm] print:p-0 font-serif text-black">
        
        {/* HEADER */}
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-xl font-bold uppercase">Laporan Monitoring Sertifikasi</h1>
          <p className="text-sm text-gray-600 mt-1">BPPMHKP Denpasar</p>
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
          <h2 className="font-bold mb-2">A. Hasil Kegiatan</h2>
          <p className="text-sm text-justify whitespace-pre-wrap">{report.hasilKegiatan || '-'}</p>
        </div>
        <div className="mb-6">
          <h2 className="font-bold mb-2">B. Kendala</h2>
          <p className="text-sm text-justify whitespace-pre-wrap">{report.kendala || '-'}</p>
        </div>

        <hr className="my-4 border-gray-300" />

        {/* DAFTAR BERKAS (TANPA IFRAME) */}
        <div className="mb-6">
          <h2 className="font-bold mb-3">C. Berkas Terlampir</h2>
          
          <div className="mb-6">
            <h3 className="font-semibold text-sm mb-2">1. Berkas Kegiatan</h3>
            {berkasKegiatan.length > 0 ? (
              <ul className="space-y-2">
                {berkasKegiatan.map((key: string, idx: number) => {
                  const fileName = key.split('-').pop() || key;
                  return (
                    <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                      <span className="text-sm">{fileName}</span>
                      <button 
                        onClick={() => handlePreviewFile(fileName, `/api/r2/${key}`)}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-semibold hover:bg-blue-200 cursor-pointer"
                      >
                        Buka File
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm italic text-gray-500">Tidak ada berkas kegiatan.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">2. Berkas Perbaikan</h3>
            {berkasPerbaikan.length > 0 ? (
              <ul className="space-y-2">
                {berkasPerbaikan.map((key: string, idx: number) => {
                  const fileName = key.split('-').pop() || key;
                  return (
                    <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                      <span className="text-sm">{fileName}</span>
                      <button 
                        onClick={() => handlePreviewFile(fileName, `/api/r2/${key}`)}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-semibold hover:bg-blue-200 cursor-pointer"
                      >
                        Buka File
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm italic text-gray-500">Tidak ada berkas perbaikan.</p>
            )}
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

        {/* TOMBOL LINK KE LAPORAN PERJALANAN DINAS */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
          <div>
            <p className="text-sm font-semibold text-blue-800">Laporan Perjalanan Dinas Lengkap</p>
            <p className="text-xs text-blue-600">Klik tombol di samping untuk membuka format cetak resmi (Cover, Isi, TTD, Foto).</p>
          </div>
          <a 
            href={`/cetak/${report.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Buka Laporan Perjalanan
          </a>
        </div>

      </div>

      {/* ========================================= */}
      {/* MODAL PREVIEW FILE (POP-UP)               */}
      {/* ========================================= */}
      {previewFileUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 truncate pr-4">{previewFileName}</h3>
              <button 
                onClick={() => setPreviewFileUrl(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex-1 bg-gray-100 p-2">
              <iframe 
                src={previewFileUrl} 
                className="w-full h-full border-0 rounded"
                title="Preview File"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}