'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Layout from '@/components/Layout';

function PreviewContent() {
  const searchParams = useSearchParams();
  
  const key = searchParams.get('key');
  const title = searchParams.get('title') || 'Laporan Tanpa Judul';
  const pelaksana = searchParams.get('pelaksana') || '-';
  const bulan = searchParams.get('bulan') || '-';
  const from = searchParams.get('from') || 'arsip'; 

  // State untuk menyimpan origin URL (hanya ada di client)
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    // Ambil origin hanya saat di client (browser)
    setOrigin(window.location.origin);
  }, []);

  if (!key) {
    return (
      <Layout>
        <div className="p-8 text-center text-red-500 font-bold">
          File tidak ditemukan. <a href={`/${from}`} className="text-blue-500 underline ml-2">Kembali</a>
        </div>
      </Layout>
    );
  }

  const cleanKey = decodeURIComponent(key);
  const fileUrl = `/api/download?key=${cleanKey}`;
  
  const isPdf = cleanKey.toLowerCase().endsWith('.pdf');
  const isImage = cleanKey.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i);
  
  // Pastikan origin sudah terisi sebelum membuat URL Microsoft Viewer
  const previewUrl = (isPdf || isImage) 
    ? fileUrl 
    : (origin ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(origin + fileUrl)}` : '');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-10">
        
        <div className="bg-slate-800 text-white p-6 rounded-t-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Review Laporan</h1>
            <p className="text-slate-300 text-sm font-medium">{bulan}</p>
            <p className="text-yellow-400 text-xs mt-3 max-w-2xl">
              * Jika file Word/Excel tidak muncul, silakan unduh file dan buka di aplikasi penunjang.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <a 
              href={`/${from}`} 
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center"
            >
              Kembali
            </a>
            
            <a 
              href={`${fileUrl}&download=true`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              ⬇️ Download File
            </a>
          </div>
        </div>

        <div className="bg-slate-700 px-6 py-3 text-sm text-slate-300 border-b border-slate-600 flex flex-wrap gap-4">
          <p><span className="font-semibold text-white">Judul:</span> {title}</p>
          <p><span className="font-semibold text-white">Pelaksana:</span> {pelaksana}</p>
        </div>

        <div className="bg-slate-900 rounded-b-xl overflow-hidden shadow-xl min-h-[75vh] p-6 flex items-center justify-center">
          {previewUrl ? (
            <iframe 
              src={previewUrl}
              className="w-full h-[75vh] border-0 rounded-lg bg-white shadow-2xl"
              title="Preview Laporan"
            />
          ) : (
            <div className="text-white text-sm">Memuat pratinjau...</div>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat halaman pratinjau...</div>}>
      <PreviewContent />
    </Suspense>
  );
}