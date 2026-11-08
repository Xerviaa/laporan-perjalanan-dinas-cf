'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import EditForm from '@/components/EditForm';

export default function ArsipPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Accordion
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [openMonths, setOpenMonths] = useState<string[]>([]);
  
  // State Copy Link
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // --- STATE UNTUK MODAL EDIT ---
  const [editId, setEditId] = useState<number | null>(null);

  // --- STATE UNTUK SCROLL TO TOP ---
  const [showScrollTop, setShowScrollTop] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // --- STATE UNTUK FILTER TANGGAL ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchReports = () => {
    setLoading(true);
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setReports(data.data);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // --- LOGIKA SCROLL TO TOP ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Dapatkan Tahun dan Bulan dari Tanggal Dinas
  const getReportDate = (report: any) => {
    const dateToUse = report.tanggal ? new Date(report.tanggal) : new Date(report.createdAt);
    return {
      year: dateToUse.getFullYear().toString(),
      month: dateToUse.toLocaleDateString('id-ID', { month: 'long' }),
      fullMonth: dateToUse.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    };
  };

  // Filter Berdasarkan Pencarian dan Tanggal
  const filteredReports = reports.filter(r => {
    const matchSearch = (r.namaPerusahaan && r.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase())) || 
                        (r.uploadedBy && r.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchDate = true;
    if (startDate || endDate) {
      const reportDate = r.tanggal ? new Date(r.tanggal).getTime() : new Date(r.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      matchDate = reportDate >= start && reportDate <= end;
    }

    return matchSearch && matchDate;
  });

  // Mengelompokkan data per Tahun -> Bulan
  const dataByYear = filteredReports.reduce((acc, report) => {
    const { year, month, fullMonth } = getReportDate(report);
    
    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = {
        fullMonth,
        reports: []
      };
    }
    acc[year][month].reports.push(report);
    return acc;
  }, {} as Record<string, Record<string, { fullMonth: string, reports: any[] }>>);

  // Urutkan Tahun dari terbaru ke terlama
  const sortedYears = Object.keys(dataByYear).sort((a, b) => parseInt(b) - parseInt(a));

  const toggleYear = (year: string) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setOpenMonths([]);
    } else {
      setSelectedYear(year);
      setOpenMonths([]);
    }
  };

  const toggleMonth = (monthYear: string) => {
    if (openMonths.includes(monthYear)) {
      setOpenMonths(openMonths.filter(m => m !== monthYear));
    } else {
      setOpenMonths([...openMonths, monthYear]);
    }
  };

  // --- FUNGSI COPY LINK ---
  const handleCopyLink = (id: number) => {
    const url = `${window.location.origin}/cetak/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- FUNGSI DOWNLOAD (BUKA HALAMAN CETAK MODE PDF) ---
  const handleDownload = (id: number) => {
    window.open(`/cetak/${id}?mode=pdf`, '_blank');
  };

  return (
    <Layout>
      <div ref={topRef}></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">ARSIP LAPORAN</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Seluruh riwayat perjalanan dinas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">Semua Data Laporan</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <input type="text" placeholder="🔍 Cari Nama/Perusahaan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border border-slate-300 px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filter Tanggal Dinas:</span>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-300 px-3 py-1.5 rounded text-sm outline-none w-full md:w-auto" />
            <span className="text-slate-400">s/d</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-300 px-3 py-1.5 rounded text-sm outline-none w-full md:w-auto" />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 font-semibold hover:underline cursor-pointer whitespace-nowrap">
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Memuat data...</div>
      ) : sortedYears.length === 0 ? (
        <div className="text-center p-8 text-slate-500">Tidak ada laporan yang ditemukan.</div>
      ) : (
        <div className="space-y-3">
          {/* LOOPING TAHUN */}
          {sortedYears.map((year) => {
            const isYearOpen = selectedYear === year;
            const monthsInYear = dataByYear[year];
            const totalReportsInYear = Object.values(monthsInYear).reduce((sum: number, m: any) => sum + m.reports.length, 0);
            
            const monthOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const sortedMonthsInYear: string[] = Object.keys(monthsInYear).sort((a: string, b: string) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

            return (
              <div key={year} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* HEADER TAHUN */}
                <button 
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 text-xl font-bold">📅</span>
                    <h3 className="text-lg font-bold text-slate-800">{year}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-500">{totalReportsInYear} Laporan</span>
                    <span className={`text-slate-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* DAFTAR BULAN */}
                {isYearOpen && (
                  <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-2">
                    {sortedMonthsInYear.map((month: string) => {
                      const monthData = monthsInYear[month];
                      const isMonthOpen = openMonths.includes(monthData.fullMonth);

                      return (
                        <div key={month} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          {/* HEADER BULAN */}
                          <button 
                            onClick={() => toggleMonth(monthData.fullMonth)}
                            className="w-full flex items-center justify-between p-3 bg-white hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">📁</span>
                              <span className="font-semibold text-slate-700">{monthData.fullMonth}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{monthData.reports.length} Laporan</span>
                              <span className={`text-slate-400 text-xs transition-transform ${isMonthOpen ? 'rotate-180' : ''}`}>▼</span>
                            </div>
                          </button>

                          {/* TABEL LAPORAN */}
                          {isMonthOpen && (
                            <div className="border-t border-slate-100 overflow-x-auto">
                              <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs">
                                  <tr>
                                    <th className="px-4 py-3">Nama Kegiatan</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Pelaksana</th>
                                    <th className="px-4 py-3">Jenis</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {(monthData.reports as any[]).map((report: any) => {
                                    // LOGIKA MEMISAHKAN NAMA KEGIATAN & JENIS
                                    const parts = (report.jenisKegiatan || '').split(' ');
                                    const namaKegiatan = parts[0] || '-';
                                    const jenis = parts.slice(1).join(' ') || '-';

                                    // LOGIKA HITUNG KETERLAMBATAN
                                    let statusTeks = "Tepat Waktu";
                                    let statusWarna = "text-emerald-600 bg-emerald-50 border-emerald-200";

                                    if (report.tanggal && report.createdAt) {
                                      const tglDinas = new Date(report.tanggal);
                                      const tglUpload = new Date(report.createdAt);
                                      const selisihWaktu = tglUpload.getTime() - tglDinas.getTime();
                                      const selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
                                      
                                      if (selisihHari > 3) {
                                        statusTeks = "Terlambat";
                                        statusWarna = "text-red-600 bg-red-50 border-red-200";
                                      }
                                    }

                                    return (
                                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                        
                                        {/* KOLOM 1: NAMA KEGIATAN */}
                                        <td className="px-4 py-3 text-slate-700 font-medium capitalize">
                                          {namaKegiatan}
                                        </td>

                                        {/* KOLOM 2: TANGGAL */}
                                        <td className="px-4 py-3 text-slate-500 font-medium">
                                          {report.tanggal ? new Date(report.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                          
                                          {/* BADGE STATUS */}
                                          <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${statusWarna}`}>
                                            {statusTeks}
                                          </div>
                                        </td>

                                        {/* KOLOM 3: PELAKSANA */}
                                        <td className="px-4 py-3 text-slate-600 align-top">
                                          <div className="flex flex-col gap-1 min-w-[150px]">
                                            {report.petugasPelaksana ? (
                                              report.petugasPelaksana.split('|').map((petugas: string, idx: number) => {
                                                const namaSaja = petugas.split('(')[0].trim();
                                                return (
                                                  <span key={idx} className="text-xs md:text-sm leading-tight block border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                                                    {namaSaja}
                                                  </span>
                                                );
                                              })
                                            ) : (
                                              <span className="text-xs md:text-sm">-</span>
                                            )}
                                          </div>
                                        </td>

                                        {/* KOLOM 4: JENIS */}
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                          {jenis}
                                        </td>

                                        {/* KOLOM 5: AKSI (TANPA TOMBOL HAPUS) */}
                                        <td className="px-4 py-3">
                                          <div className="flex items-center justify-center gap-1 md:gap-2">
                                            
                                            {/* Tombol Copy Link */}
                                            <button onClick={() => handleCopyLink(report.id)} title="Salin Link" className={`p-1.5 rounded-md cursor-pointer ${copiedId === report.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                              {copiedId === report.id ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>}
                                            </button>

                                            {/* TOMBOL EDIT (BUKA MODAL) */}
                                            <button onClick={() => setEditId(report.id)} title="Edit Laporan" className="p-1.5 bg-yellow-100 text-yellow-600 rounded-md hover:bg-yellow-200 cursor-pointer">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>

                                            {/* TOMBOL DOWNLOAD (PRINT PDF) */}
                                            <button onClick={() => handleDownload(report.id)} title="Download PDF" className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-200 cursor-pointer">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            </button>

                                            {/* TOMBOL CETAK (PRINTER) */}
                                            <a href={`/cetak/${report.id}`} target="_blank" title="Cetak Laporan" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                              <span className="hidden md:inline">Cetak</span>
                                            </a>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- TOMBOL SCROLL TO TOP --- */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all duration-300 cursor-pointer"
          title="Kembali ke Atas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      )}

      {/* MODAL EDIT (FORM EDIT) - TETAP ADA */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Edit Laporan</h3>
              <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            {/* PANGGIL KOMPONEN EDITFORM */}
            <EditForm 
              id={editId} 
              onSuccess={() => {
                setEditId(null); // Tutup modal
                fetchReports(); // Refresh data
              }} 
            />
          </div>
        </div>
      )}

    </Layout>
  );
}