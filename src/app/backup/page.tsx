'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const executeBackup = async () => {
    setShowConfirmModal(false);
    setIsBackingUp(true);
    
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        showToast('Perintah backup berhasil dikirim! Proses sedang berjalan di latar belakang. Silakan cek Google Drive Anda secara berkala.', 'success');
      } else {
        showToast('Gagal memicu backup: ' + (data.error || 'Terjadi kesalahan server.'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan. Pastikan koneksi internet stabil.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <Layout>
      {/* TOAST NOTIFIKASI */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border-l-4 animate-in slide-in-from-right-8 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : 'bg-white border-red-500 text-slate-800'
        }`}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            )}
          </div>
          <div className="max-w-[300px]">
            <p className="font-bold text-sm">{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      {/* CUSTOM MODAL KONFIRMASI */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="h-2 w-full bg-emerald-500"></div>
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-100 to-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Mulai Back up Sekarang?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Proses pencadangan data dan file lampiran akan dijalankan di server. Pastikan koneksi internet stabil sebelum melanjutkan.
                </p>
                
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowConfirmModal(false)} 
                    className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={executeBackup} 
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container Utama */}
      <div className="max-w-5xl mx-auto py-10 px-4">
        
        {/* Header Halaman (Sederhana & Bersih) */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Backup ke Google Drive</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Sistem akan mencadangkan seluruh data laporan dan file lampiran ke Google Drive secara aman.
          </p>
        </div>

        {/* Grid Konten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* Kolom Kiri: Kartu Informasi & Akses */}
          <div className="md:col-span-1 space-y-6">
            {/* Kartu 1: Jadwal */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-600 p-2.5 rounded-xl shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </span>
                Jadwal Backup Otomatis
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Proses backup berjalan otomatis setiap <strong className="text-blue-700">hari Sabtu pukul 00:00 WITA</strong>.
              </p>
            </div>

            {/* Kartu 2: Akses Backup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-3">
                <span className="bg-orange-100 text-orange-600 p-2.5 rounded-xl shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </span>
                GOOGLE DRIVE
              </h2>
              
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Semua file backup akan disimpan secara otomatis ke dalam folder Google Drive.
              </p>
              
              <a 
                href="https://drive.google.com/drive/folders/1KB4yOsjA2SPYjlGF_4YaezMXZC66D4aP?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Buka Google Drive
              </a>
            </div>
          </div>

          {/* Kolom Kanan: Area Tombol Aksi Back up Manual */}
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl flex flex-col justify-center relative overflow-hidden h-full min-h-[400px]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Mulai Backup Manual</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Klik tombol di bawah ini jika Anda ingin melakukan back up di luar jadwal otomatis. Proses akan berjalan di latar belakang.
                </p>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isBackingUp}
                className="w-full max-w-sm mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                {isBackingUp ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Mengirim Sinyal...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Back up Sekarang
                  </>
                )}
              </button>

            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}