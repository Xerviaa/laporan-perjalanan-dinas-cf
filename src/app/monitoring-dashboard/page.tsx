'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function MonitoringDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // STATE UNTUK TOAST NOTIFIKASI
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.status === 'success') {
        setReports(data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const success = await fetchReports();
    
    // Beri jeda sedikit agar animasi spin terlihat
    setTimeout(() => {
      setIsRefreshing(false);
      if (success) {
        showToast('Data berhasil diperbarui!', 'success');
      } else {
        showToast('Gagal memperbarui data.', 'error');
      }
    }, 500);
  };

  if (loading) return <Layout><div className="p-10 text-center text-slate-500 animate-pulse">Memuat Dashboard...</div></Layout>;

  // --- LOGIKA PERHITUNGAN DATA ---
  const totalKegiatan = reports.length;

  let selesai = 0;
  let menungguPerbaikan = 0;
  let belumUpload = 0;

  reports.forEach((report) => {
    const hasBerkasKegiatan = report.berkasKegiatan && report.berkasKegiatan !== '[]';
    const hasBerkasPerbaikan = report.berkasPerbaikan && report.berkasPerbaikan !== '[]';

    if (hasBerkasKegiatan && hasBerkasPerbaikan) {
      selesai++;
    } else if (hasBerkasKegiatan && !hasBerkasPerbaikan) {
      menungguPerbaikan++;
    } else {
      belumUpload++;
    }
  });

  // Data Target Sertifikasi
  const sertifikasiTargets: { [key: string]: number } = {
    'CBIB': 30, 'CPIB': 30, 'CPPIB': 30, 'CPOIB': 30, 'CDOIB': 30, 
    'CPIB Kapal': 30, 'HACCP': 30, 'SKP': 30, 'SPDI': 30
  };
  
  const capaianSertifikasi = Object.keys(sertifikasiTargets).map((jenis) => {
    const realisasi = reports.filter((r) => r.jenisKegiatan?.includes(jenis)).length;
    const target = sertifikasiTargets[jenis];
    const persentase = target > 0 ? Math.round((realisasi / target) * 100) : 0;
    return { jenis, target, realisasi, persentase };
  });

  // Data Target Kegiatan
  const kegiatanTargets: { [key: string]: number } = {
    'Inspeksi': 50, 'Surveilans': 50, 'Selfdecare Kapal': 50, 'Inpres': 50
  };

  const capaianKegiatan = Object.keys(kegiatanTargets).map((jenis) => {
    const realisasi = reports.filter((r) => r.jenisKegiatan?.startsWith(jenis)).length;
    const target = kegiatanTargets[jenis];
    const persentase = target > 0 ? Math.round((realisasi / target) * 100) : 0;
    return { jenis, target, realisasi, persentase };
  });

  // Komponen Donut Chart Sederhana (Menggunakan SVG)
  const DonutChart = ({ percentage, color }: { percentage: number, color: string }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    
    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle cx="40" cy="40" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="none" />
          <circle 
            cx="40" cy="40" r={radius} 
            stroke={color} 
            strokeWidth="8" fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute text-sm font-bold text-slate-700">{percentage}%</div>
      </div>
    );
  };

  return (
    <Layout>
      {/* TOAST NOTIFIKASI */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 animate-in slide-in-from-top-4 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : 'bg-white border-red-500 text-slate-800'
        }`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
            <p className="text-xs text-slate-500">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* BACKGROUND GRADIENT HALUS DI AREA KONTEN */}
      <div className="bg-slate-50/50 p-2 rounded-2xl -m-2">
        
        {/* HEADER TITLE DENGAN DATA TERKINI DI KANAN ATAS */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Monitoring Overview</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Pantau capaian sertifikasi dan status berkas secara real-time.</p>
          </div>
          
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-semibold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Data Terkini
          </div>
        </div>

        {/* KARTU RINGKASAN GAYA BARU */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          
          {/* Total */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Kegiatan</p>
              <p className="text-4xl font-black text-slate-800">{totalKegiatan}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl">
              📋
            </div>
          </div>

          {/* Selesai */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Selesai</p>
              <p className="text-4xl font-black text-slate-800">{selesai}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>

          {/* Menunggu */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Menunggu</p>
              <p className="text-4xl font-black text-slate-800">{menungguPerbaikan}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl">
              ⏳
            </div>
          </div>

          {/* Belum Upload */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Belum Upload</p>
              <p className="text-4xl font-black text-slate-800">{belumUpload}</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl">
              ⚠️
            </div>
          </div>

        </div>

        {/* TOMBOL REFRESH SAJA (DI BAWAH KARTU) */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" height="16" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={isRefreshing ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
            </svg>
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </button>
        </div>

        {/* GRID UNTUK TABEL */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* TABEL SERTIFIKASI */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  {/* Ikon Piala / Penghargaan */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                </span>
                Sertifikasi
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4 text-center">Target</th>
                    <th className="px-6 py-4 text-center">Real.</th>
                    <th className="px-6 py-4 text-center">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {capaianSertifikasi.map((item, idx) => {
                    let strokeColor = '#ef4444'; // red
                    if (item.persentase >= 80) strokeColor = '#10b981'; // emerald
                    else if (item.persentase >= 40) strokeColor = '#f59e0b'; // amber

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-3 font-bold text-slate-700">{item.jenis}</td>
                        <td className="px-6 py-3 text-center text-slate-500 font-medium">{item.target}</td>
                        <td className="px-6 py-3 text-center font-bold text-slate-800">{item.realisasi}</td>
                        <td className="px-6 py-3 flex justify-center">
                           <DonutChart percentage={item.persentase} color={strokeColor} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL KEGIATAN */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </span>
                Kegiatan
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4 text-center">Target</th>
                    <th className="px-6 py-4 text-center">Real.</th>
                    <th className="px-6 py-4 text-center">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {capaianKegiatan.map((item, idx) => {
                    let strokeColor = '#ef4444';
                    if (item.persentase >= 80) strokeColor = '#10b981';
                    else if (item.persentase >= 40) strokeColor = '#f59e0b';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-3 font-bold text-slate-700">{item.jenis}</td>
                        <td className="px-6 py-3 text-center text-slate-500 font-medium">{item.target}</td>
                        <td className="px-6 py-3 text-center font-bold text-slate-800">{item.realisasi}</td>
                        <td className="px-6 py-3 flex justify-center">
                           <DonutChart percentage={item.persentase} color={strokeColor} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}