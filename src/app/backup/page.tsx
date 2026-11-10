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
        showToast('Sinyal backup berhasil dikirim! Proses backup akan berjalan di server (1-2 menit).', 'success');
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

      {/* ======================================================== */}
      {/* CUSTOM MODAL KONFIRMASI (DESAIN BARU LEBIH PREMIUM)      */}
      {/* ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          {/* Kotak Modal */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            
            {/* Garis Aksen Atas (Warna Emerald) */}
            <div className="h-2 w-full bg-emerald-500"></div>

            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                
                {/* Ikon Animasi (Pulse) */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-100 to-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  </div>
                </div>

                {/* Teks */}
                <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Mulai Backup Sekarang?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Proses pencadangan data dan file lampiran akan dijalankan di server. Pastikan koneksi internet stabil sebelum melanjutkan.
                </p>
                
                {/* Tombol Aksi */}
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
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header Halaman */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Backup ke Google Drive</h1>
          <p className="text-slate-500 mt-2">
            Sistem akan mencadangkan seluruh data laporan dan file lampiran ke Google Drive Anda secara aman.
          </p>
        </div>

        {/* Grid Konten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Kolom Kiri: Kartu Informasi */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-200 text-blue-700 p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </span>
                Jadwal Otomatis
              </h2>
              <p className="text-sm text-blue-700 leading-relaxed">
                Backup berjalan otomatis setiap <strong>hari Senin-Jumat pukul 18:00 WITA</strong>.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-200 text-emerald-700 p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </span>
                Format File
              </h2>
              <p className="text-sm text-emerald-700 leading-relaxed">
                Backup berupa folder berisi <strong>lampiran PDF/Gambar asli</strong>, file <strong>.csv</strong> (data excel), dan file database <strong>.dump</strong> (cadangan sistem).
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Area Tombol Aksi */}
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md h-full flex flex-col justify-center">
              
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Mulai Backup Manual</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Klik tombol di bawah ini jika Anda ingin melakukan backup di luar jadwal otomatis.
                </p>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isBackingUp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isBackingUp ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Mengirim Sinyal...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Backup Sekarang
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <Link 
                  href="/backup/arsip" 
                  className="text-slate-600 hover:text-blue-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  📂 Lihat Riwayat Arsip Backup
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}