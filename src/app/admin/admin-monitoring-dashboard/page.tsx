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

  // State untuk Filter Sertifikasi (Otomatis set ke bulan & tahun saat ini)
  const now = new Date();
  const [filterYear, setFilterYear] = useState<string>(now.getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>(now.getMonth().toString());

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

  let berkasLengkap = 0;
  let belumAdaBerkas = 0;
  let belumLengkap = 0;

  reports.forEach((report) => {
    const hasSuratTugas = report.suratTugas && report.suratTugas !== '[]';
    const hasBerkasKegiatan = report.berkasKegiatan && report.berkasKegiatan !== '[]';
    const hasBerkasPerbaikan = report.berkasPerbaikan && report.berkasPerbaikan !== '[]';
    const hasPemeriksaan = report.berkasPemeriksaanTindakanPerbaikan && report.berkasPemeriksaanTindakanPerbaikan !== '[]';

    const totalFileTerisi = [hasSuratTugas, hasBerkasKegiatan, hasBerkasPerbaikan, hasPemeriksaan].filter(Boolean).length;

    if (totalFileTerisi === 4) {
      berkasLengkap++;
    } else if (totalFileTerisi === 0) {
      belumAdaBerkas++;
    } else {
      belumLengkap++;
    }
  });

  // --- LOGIKA FILTER ---
  const availableYears = Array.from(new Set(reports.map((r: any) => {
    const d = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
    return d.getFullYear().toString();
  }))).sort().reverse();

  const monthsList = [
    { val: '0', name: 'Januari' }, { val: '1', name: 'Februari' }, { val: '2', name: 'Maret' },
    { val: '3', name: 'April' }, { val: '4', name: 'Mei' }, { val: '5', name: 'Juni' },
    { val: '6', name: 'Juli' }, { val: '7', name: 'Agustus' }, { val: '8', name: 'September' },
    { val: '9', name: 'Oktober' }, { val: '10', name: 'November' }, { val: '11', name: 'Desember' }
  ];

  const filteredSertifikasi = reports.filter((r: any) => {
    if (!r.jenisKegiatan) return false;
    
    const isSertifikasi = ['CBIB', 'CPIB', 'CPPIB', 'CPOIB', 'CDOIB', 'CPIB Kapal', 'HACCP', 'SKP', 'SPDI', 'Selfdecare Kapal', 'Inpres'].some(j => r.jenisKegiatan.includes(j));
    if (!isSertifikasi) return false;

    const d = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
    
    const matchYear = filterYear === 'all' || d.getFullYear().toString() === filterYear;
    const matchMonth = filterMonth === 'all' || d.getMonth().toString() === filterMonth;
    
    return matchYear && matchMonth;
  });

  // Data Target Sertifikasi
  const sertifikasiTargets: { [key: string]: number } = {
    'CBIB': 30, 'CPIB': 30, 'CPPIB': 30, 'CPOIB': 30, 'CDOIB': 30, 
    'CPIB Kapal': 30, 'HACCP': 30, 'SKP': 30, 'SPDI': 30,
    'Selfdecare Kapal': 50, 'Inpres': 50
  };
  
  // Menggunakan `filteredSertifikasi` agar tabel kiri berubah sesuai filter kanan
  const capaianSertifikasi = Object.keys(sertifikasiTargets).map((jenis) => {
    const realisasi = filteredSertifikasi.filter((r) => r.jenisKegiatan?.includes(jenis)).length;
    const target = sertifikasiTargets[jenis];
    const persentase = target > 0 ? Math.round((realisasi / target) * 100) : 0;
    return { jenis, target, realisasi, persentase };
  });

  // Komponen Donut Chart Sederhana
  const DonutChart = ({ percentage, color }: { percentage: number, color: string }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle cx="32" cy="32" r={radius} stroke="#f1f5f9" strokeWidth="6" fill="none" />
          <circle 
            cx="32" cy="32" r={radius} 
            stroke={color} 
            strokeWidth="6" fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute text-xs font-bold text-slate-700">{percentage}%</div>
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
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-semibold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Data Terkini
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin" : ""}>
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
              </svg>
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* KARTU RINGKASAN */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* 1. Total */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Kegiatan</p>
              <p className="text-3xl font-black text-slate-800">{totalKegiatan}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl">📋</div>
          </div>

          {/* 2. Berkas Lengkap */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Berkas Lengkap</p>
              <p className="text-3xl font-black text-slate-800">{berkasLengkap}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center text-xl">✅</div>
          </div>

          {/* 3. Belum Lengkap */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Belum Lengkap</p>
              <p className="text-3xl font-black text-slate-800">{belumLengkap}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl">⏳</div>
          </div>

          {/* 4. Belum Ada Berkas */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Belum Ada Berkas</p>
              <p className="text-3xl font-black text-slate-800">{belumAdaBerkas}</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xl">⚠️</div>
          </div>
        </div>

        {/* GRID UNTUK TABEL & PANEL FILTER */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* TABEL SERTIFIKASI (Lebih Besar, 2 Kolom) */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                      <path d="M4 22h16"></path>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                    </svg>
                  </span>
                  Tabel Sertifikasi
                </h2>
                {/* Keterangan Periode */}
                <p className="text-[11px] text-slate-500 mt-1 ml-8 font-medium">
                  {filterYear === 'all' && filterMonth === 'all' 
                    ? 'Semua Data Sertifikasi' 
                    : `Periode: ${filterMonth !== 'all' ? monthsList.find(m => m.val === filterMonth)?.name : 'Semua Bulan'} ${filterYear !== 'all' ? filterYear : ''}`}
                </p>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-xs text-left relative">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3 text-center">Target</th>
                    <th className="px-4 py-3 text-center">Real.</th>
                    <th className="px-4 py-3 text-center">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {capaianSertifikasi.map((item, idx) => {
                    let strokeColor = '#ef4444'; 
                    if (item.persentase >= 80) strokeColor = '#10b981'; 
                    else if (item.persentase >= 40) strokeColor = '#f59e0b'; 

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-2 font-bold text-slate-700">{item.jenis}</td>
                        <td className="px-4 py-2 text-center text-slate-500 font-medium">{item.target}</td>
                        <td className="px-4 py-2 text-center font-bold text-slate-800">{item.realisasi}</td>
                        <td className="px-4 py-2 flex justify-center">
                           <DonutChart percentage={item.persentase} color={strokeColor} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANEL FILTER SERTIFIKASI (Lebih Kecil, 1 Kolom) */}
          <div className="xl:col-span-1 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col sticky top-24">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-rose-100 text-rose-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </span>
                Filter Data
              </h2>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tahun</label>
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="all">Semua Tahun</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bulan</label>
                <select 
                  value={filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="all">Semua Bulan</option>
                  {monthsList.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}