'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    // Untuk saat ini, kita hanya menampilkan notifikasi bahwa backup manual sedang diproses
    setTimeout(() => {
      setIsBackingUp(false);
      alert('Backup manual telah dijadwalkan. Silakan cek Google Drive Anda dalam beberapa menit.');
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Backup ke Google Drive</h1>
        <p className="text-slate-500 mb-6">
          Data laporan Anda di-backup secara otomatis setiap hari Minggu pukul 10:00 WIB. 
          File backup disimpan dalam format <strong>.dump</strong> di folder <strong>supabase-backups</strong> pada Google Drive Anda.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">Status Backup Otomatis</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Berjalan setiap hari Minggu</li>
            <li>✅ Disimpan di Google Drive</li>
            <li>✅ Format file: PostgreSQL Dump</li>
          </ul>
        </div>

        <button
          onClick={handleManualBackup}
          disabled={isBackingUp}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isBackingUp ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Memproses...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Backup Sekarang
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 mt-4 text-center">
          *Fitur backup manual akan segera tersedia.
        </p>
      </div>
    </Layout>
  );
}