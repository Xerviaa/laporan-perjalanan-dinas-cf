'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk Popup Grafik
  const [selectedChartData, setSelectedChartData] = useState<{ name: string, reports: any[] } | null>(null);

  // State untuk Filter Tahun Grafik
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');

  const fetchData = () => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setReports(data.data);
          setLeaderboard((data.leaderboard || []).slice(0, 3));

          // Cari tahun-tahun yang tersedia dari data laporan
          const years = Array.from(new Set(data.data.map((r: any) => {
            const dateToUse = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
            return dateToUse.getFullYear().toString();
          }))) as string[];
          
          years.sort((a, b) => parseInt(b) - parseInt(a));
          setAvailableYears(years);
          
          if (years.length > 0 && !selectedYear) {
            setSelectedYear(years[0]);
          }
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalLaporan = reports.length;
  const totalTepatWaktu = reports.filter(r => r.status === 'TEPAT WAKTU').length;
  const totalTerlambat = reports.filter(r => r.status === 'TERLAMBAT').length;

  // Logika Data Grafik Berdasarkan Filter Tahun
  const monthlyDataMap: Record<string, any[]> = {};
  
  const filteredReportsForChart = reports.filter((report) => {
    if (!selectedYear) return false;
    const dateToUse = report.tanggal ? new Date(report.tanggal) : new Date(report.createdAt);
    return dateToUse.getFullYear().toString() === selectedYear;
  });

  const chartData = filteredReportsForChart.reduce((acc, report) => {
    const dateToUse = report.tanggal ? new Date(report.tanggal) : new Date(report.createdAt);
    const monthName = dateToUse.toLocaleDateString('id-ID', { month: 'short' });
    
    if (!monthlyDataMap[monthName]) {
      monthlyDataMap[monthName] = [];
    }
    monthlyDataMap[monthName].push(report);

    const existing = acc.find((item: any) => item.name === monthName);
    if (existing) {
      existing.total += 1;
    } else {
      acc.push({ name: monthName, total: 1 });
    }
    return acc;
  }, [] as { name: string, total: number }[]);

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  chartData.sort((a: any, b: any) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));

  // UBAH DISINI: Menampilkan 10 laporan terbaru
  const recentReports = reports
    .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10);

  // Handler Klik Grafik
  const handleBarClick = (state: any) => {
    if (state && state.activeLabel) {
      const monthName = state.activeLabel;
      const reportsInMonth = monthlyDataMap[monthName] || [];
      setSelectedChartData({
        name: `${monthName} ${selectedYear}`,
        reports: reportsInMonth
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* KIRI: Header & Tabel */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Utama</h1>
            <p className="text-slate-500 text-sm mt-1">Platform Internal Monitoring & Pengarsipan Perjalanan Dinas</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-800">Daftar Laporan Terbaru</h3>
              </div>
              <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 w-full md:w-48" />
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 md:px-6 py-4">Judul Laporan</th>
                    <th className="px-4 md:px-6 py-4 hidden md:table-cell">Pelaksana</th>
                    <th className="px-4 md:px-6 py-4">Tanggal Dinas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Memuat...</td></tr>
                  ) : recentReports.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Belum ada laporan</td></tr>
                  ) : (
                    recentReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* BAGIAN YANG DIUBAH: NAMA PERUSAHAAN & JENIS KEGIATAN SEJAJAR */}
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-blue-600 line-clamp-1">
                              {report.namaPerusahaan || report.title}
                            </p>
                            {report.jenisKegiatan && (
                              <p className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                {report.jenisKegiatan}
                              </p>
                            )}
                          </div>
                          <p className="text-[10px] md:text-xs text-slate-400 mt-1">Diunggah: {new Date(report.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </td>
                        
                        <td className="px-4 md:px-6 py-4 text-slate-700 truncate max-w-[150px] hidden md:table-cell">{report.uploadedBy}</td>
                        <td className="px-4 md:px-6 py-4 text-slate-500 font-medium">{report.tanggal ? new Date(report.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KANAN: Leaderboard, Grafik, Statistik */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          
          {/* 1. LEADERBOARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 md:p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
              <span className="text-lg">🏆</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">Leaderboard Bulan Ini</h3>
                <p className="text-[10px] text-slate-500">Peringkat Bulan Ini</p>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 text-center">Menghitung peringkat...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((pegawai, index) => (
                  <div key={index} className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-105 ${
                    index === 0 ? 'bg-yellow-50/50 border-yellow-300 shadow-sm' : 
                    index === 1 ? 'bg-slate-50 border-slate-300' : 
                    'bg-orange-50/50 border-orange-300'
                  }`}>
                    <div className="absolute -top-2 -right-2 text-xl animate-bounce drop-shadow-md">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      index === 0 ? 'bg-yellow-200 text-yellow-800' : 
                      index === 1 ? 'bg-slate-200 text-slate-800' : 
                      'bg-orange-200 text-orange-800'
                    }`}>
                      {pegawai.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{pegawai.nama}</p>
                      <p className="text-[9px] text-slate-500">{pegawai.totalTepatWaktu} Tepat Waktu</p>
                    </div>
                    <div className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                      {pegawai.totalLaporan} Laporan
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. GRAFIK */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 md:p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Grafik Laporan</h3>
                <p className="text-[10px] text-slate-400 italic">Klik batang untuk detail</p>
              </div>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-slate-50 cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="h-48 w-full">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Tidak ada data di tahun ini
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar 
                      dataKey="total" 
                      name="Jumlah Laporan" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={25} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 3. STATISTIK RINGKAS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium text-xs">Total Laporan</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">{loading ? '...' : totalLaporan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-600 font-medium text-xs">Tepat Waktu</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">{loading ? '...' : totalTepatWaktu}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-600 font-medium text-xs">Terlambat</span>
              <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-xs">{loading ? '...' : totalTerlambat}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DETAIL GRAFIK (POP-UP KLIK BATANG) --- */}
      {selectedChartData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Detail Laporan {selectedChartData.name}</h3>
                <p className="text-xs text-slate-500">{selectedChartData.reports.length} Laporan ditemukan</p>
              </div>
              <button onClick={() => setSelectedChartData(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {selectedChartData.reports.map((r: any) => (
                  <div key={r.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <p className="font-semibold text-blue-600">{r.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-500">{r.uploadedBy}</p>
                      <p className="text-xs text-slate-400">{new Date(r.tanggal || r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button 
                onClick={() => setSelectedChartData(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}