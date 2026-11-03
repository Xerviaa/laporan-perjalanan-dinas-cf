'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import * as XLSX from 'xlsx';

export default function ArsipPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Accordion: Menyimpan Tahun yang sedang terbuka, dan Bulan yang terbuka di dalamnya
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [openMonths, setOpenMonths] = useState<string[]>([]);
  
  // State Hapus & Copy
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // --- STATE UNTUK SCROLL TO TOP ---
  const [showScrollTop, setShowScrollTop] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // --- STATE UNTUK FILTER TANGGAL ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // --- STATE UNTUK MODAL EKSPOR & CETAK ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<1 | 2>(1);
  const [selectedExportMonth, setSelectedExportMonth] = useState<string>('');
  const [selectedExportIds, setSelectedExportIds] = useState<number[]>([]);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printStep, setPrintStep] = useState<1 | 2>(1);
  const [selectedPrintMonth, setSelectedPrintMonth] = useState<string>('');
  const [selectedPrintIds, setSelectedPrintIds] = useState<number[]>([]);

  const [openExportDropdown, setOpenExportDropdown] = useState(false);
  const [openPrintDropdown, setOpenPrintDropdown] = useState(false);

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

  // Daftar semua bulan (untuk keperluan dropdown ekspor/cetak)
  const availableMonths = Object.values(dataByYear).flatMap(months => 
    Object.values(months).map(m => m.fullMonth)
  );

  const getReportsByMonth = (monthYear: string) => {
    return reports.filter(r => getReportDate(r).fullMonth === monthYear);
  };

  const toggleYear = (year: string) => {
    if (selectedYear === year) {
      setSelectedYear(null); // Tutup jika diklik lagi
      setOpenMonths([]); // Reset bulan yang terbuka
    } else {
      setSelectedYear(year); // Buka tahun baru
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

  // --- FUNGSI HAPUS (DIPERBAIKI DENGAN OPTIMISTIC UI) ---
  const confirmDelete = async () => {
    if (!deleteId) return;
    
    // Simpan data lama untuk jaga-jaga jika gagal
    const previousReports = [...reports];
    
    // 1. Langsung hapus dari tampilan (Optimistic Update)
    setReports(reports.filter(r => r.id !== deleteId));
    setDeleteId(null); // Tutup modal konfirmasi
    setIsDeleting(true);

    try {
      // 2. Kirim permintaan hapus ke server
      const res = await fetch(`/api/reports/${deleteId}`, { method: 'DELETE' });
      
      if (!res.ok) {
        // Jika gagal, kembalikan data
        setReports(previousReports);
        alert('Gagal menghapus laporan dari server');
      }
    } catch (error) {
      // Jika error jaringan, kembalikan data
      setReports(previousReports);
      alert('Terjadi kesalahan jaringan saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FUNGSI COPY LINK ---
  const handleCopyLink = (id: number) => {
    const url = `${window.location.origin}/cetak/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- FUNGSI EKSPOR EXCEL ---
  const handleExportExcel = () => {
    let dataToExport = filteredReports;
    if (selectedExportMonth !== 'semua') {
      dataToExport = dataToExport.filter(r => getReportDate(r).fullMonth === selectedExportMonth);
      if (selectedExportIds.length > 0) {
        dataToExport = dataToExport.filter(r => selectedExportIds.includes(r.id));
      }
    }

    if (dataToExport.length === 0) return alert('Tidak ada data untuk diekspor');

    const excelData = dataToExport.map((report, index) => ({
      'No': index + 1,
      'Nama Perusahaan': report.namaPerusahaan || '-',
      'Jenis Kegiatan': report.jenisKegiatan || '-',
      'Pembuat Laporan': report.uploadedBy || '-',
      'Tanggal Dinas': report.tanggal || '-',
      'Tanggal Upload': new Date(report.createdAt).toLocaleDateString('id-ID'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Dinas');
    worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
    
    const fileName = selectedExportMonth === 'semua' 
      ? `Semua_Laporan_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Laporan_${selectedExportMonth.replace(' ', '_')}.xlsx`;
      
    XLSX.writeFile(workbook, fileName);
    closeExportModal();
  };

  // --- FUNGSI CETAK ---
  const handlePrint = () => {
    let dataToPrint = getReportsByMonth(selectedPrintMonth);
    if (selectedPrintIds.length > 0) {
      dataToPrint = dataToPrint.filter(r => selectedPrintIds.includes(r.id));
    }

    if (dataToPrint.length === 0) return alert('Tidak ada file yang dipilih untuk dicetak');

    dataToPrint.forEach((report) => {
      window.open(`/cetak/${report.id}`, '_blank');
    });

    closePrintModal();
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportStep(1);
    setSelectedExportMonth('');
    setSelectedExportIds([]);
    setOpenExportDropdown(false);
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    setPrintStep(1);
    setSelectedPrintMonth('');
    setSelectedPrintIds([]);
    setOpenPrintDropdown(false);
  };

  return (
    <Layout>
      <div ref={topRef}></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">ARSIP LAPORAN</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Seluruh riwayat perjalanan dinas</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowExportModal(true)} className="flex-1 md:flex-none bg-emerald-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-emerald-700 text-xs md:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <span>📊</span> Ekspor
          </button>
          <button onClick={() => setShowPrintModal(true)} className="flex-1 md:flex-none bg-slate-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-slate-700 text-xs md:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <span>🖨️</span> Cetak Masal
          </button>
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
            const totalReportsInYear = Object.values(monthsInYear).reduce((sum, m) => sum + m.reports.length, 0);
            
            // Urutkan bulan (Januari - Desember)
            const monthOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const sortedMonthsInYear = Object.keys(monthsInYear).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

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

                {/* DAFTAR BULAN (Jika Tahun Dibuka) */}
                {isYearOpen && (
                  <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-2">
                    {sortedMonthsInYear.map((month) => {
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

                          {/* TABEL LAPORAN (Jika Bulan Dibuka) */}
                          {isMonthOpen && (
                            <div className="border-t border-slate-100 overflow-x-auto">
                              <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs">
                                  <tr>
                                    <th className="px-4 py-3">Nama Perusahaan</th>
                                    <th className="px-4 py-3 hidden md:table-cell">Pembuat Laporan</th>
                                    <th className="px-4 py-3 hidden lg:table-cell">Tanggal Dinas</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {monthData.reports.map((report: any) => {
                                    // LOGIKA HITUNG KETERLAMBATAN
                                    let statusTeks = "Tepat Waktu";
                                    let statusWarna = "text-emerald-600 bg-emerald-50 border-emerald-200";

                                    if (report.tanggal && report.createdAt) {
                                      const tglDinas = new Date(report.tanggal);
                                      const tglUpload = new Date(report.createdAt);
                                      
                                      // Hitung selisih hari (dibulatkan ke bawah)
                                      const selisihWaktu = tglUpload.getTime() - tglDinas.getTime();
                                      const selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
                                      
                                      if (selisihHari > 3) {
                                        statusTeks = "Terlambat";
                                        statusWarna = "text-red-600 bg-red-50 border-red-200";
                                      }
                                    }

                                    return (
                                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                        {/* BAGIAN YANG DIUBAH: NAMA PERUSAHAAN & JENIS KEGIATAN SEJAJAR */}
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-blue-600 line-clamp-1">{report.namaPerusahaan}</p>
                                            <p className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">{report.jenisKegiatan}</p>
                                          </div>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-slate-700 hidden md:table-cell">
                                          {/* TAMPILKAN NAMA + GELAR & TANGGAL UPLOAD */}
                                          <p className="font-medium text-slate-800">{report.uploadedBy}</p>
                                          <p className="text-[10px] text-slate-400 mt-1">
                                            Diunggah: {new Date(report.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} 
                                            {' '}pukul{' '}
                                            {new Date(report.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-medium hidden lg:table-cell">
                                          {report.tanggal ? new Date(report.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                          
                                          {/* BADGE STATUS TEPAT WAKTU / TERLAMBAT */}
                                          <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${statusWarna}`}>
                                            {statusTeks}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center justify-center gap-1 md:gap-2">
                                            <button onClick={() => setDeleteId(report.id)} title="Hapus" className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-red-50 hover:text-red-600 cursor-pointer">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                            </button>
                                            <button onClick={() => handleCopyLink(report.id)} title="Salin Link Cetak" className={`p-1.5 rounded-md cursor-pointer ${copiedId === report.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                              {copiedId === report.id ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>}
                                            </button>
                                            <a href={`/cetak/${report.id}`} target="_blank" title="Cetak Laporan" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                              <span className="hidden md:inline">Cetak PDF</span>
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

      {/* --- MODAL EKSPOR EXCEL --- */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-lg">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4">
              {exportStep === 1 ? 'Pilih Bulan Ekspor' : 'Pilih Laporan'}
            </h3>
            
            {exportStep === 1 ? (
              <>
                <div className="relative mb-6">
                  <button onClick={() => setOpenExportDropdown(!openExportDropdown)} className="w-full border border-slate-300 p-3 rounded-lg text-left flex justify-between items-center bg-white hover:border-emerald-500 cursor-pointer">
                    <span className={selectedExportMonth ? 'text-slate-800' : 'text-slate-500'}>{selectedExportMonth || '-- Pilih Bulan --'}</span>
                    <span className="text-slate-400">▼</span>
                  </button>
                  
                  {openExportDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div onClick={() => { setSelectedExportMonth('semua'); setOpenExportDropdown(false); }} className="p-3 hover:bg-emerald-50 cursor-pointer text-sm font-semibold text-slate-700 border-b">Semua Bulan</div>
                      {availableMonths.map(m => (
                        <div key={m} onClick={() => { setSelectedExportMonth(m); setOpenExportDropdown(false); }} className="p-3 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{m}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={closeExportModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                  <button onClick={() => { if (!selectedExportMonth) return alert('Pilih bulan dulu!'); if (selectedExportMonth === 'semua') { handleExportExcel(); } else { setExportStep(2); } }} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer">Lanjut</button>
                </div>
              </>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg mb-4 p-2">
                  <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border-b">
                    <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={selectedExportIds.length === getReportsByMonth(selectedExportMonth).length} onChange={(e) => { if (e.target.checked) { setSelectedExportIds(getReportsByMonth(selectedExportMonth).map(r => r.id)); } else { setSelectedExportIds([]); } }} />
                    <span className="font-bold text-slate-700">Pilih Semua</span>
                  </label>
                  {getReportsByMonth(selectedExportMonth).map(r => (
                    <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={selectedExportIds.includes(r.id)} onChange={(e) => { if (e.target.checked) { setSelectedExportIds([...selectedExportIds, r.id]); } else { setSelectedExportIds(selectedExportIds.filter(id => id !== r.id)); } }} />
                      <span className="text-sm text-slate-600 truncate">{r.namaPerusahaan} - {r.uploadedBy}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between gap-3">
                  <button onClick={() => setExportStep(1)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Kembali</button>
                  <div className="flex gap-3">
                    <button onClick={closeExportModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                    <button onClick={handleExportExcel} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer">Ekspor</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL CETAK MASAL --- */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-lg">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4">
              {printStep === 1 ? 'Pilih Bulan Cetak' : 'Pilih Laporan'}
            </h3>
            
            {printStep === 1 ? (
              <>
                <div className="relative mb-6">
                  <button onClick={() => setOpenPrintDropdown(!openPrintDropdown)} className="w-full border border-slate-300 p-3 rounded-lg text-left flex justify-between items-center bg-white hover:border-blue-500 cursor-pointer">
                    <span className={selectedPrintMonth ? 'text-slate-800' : 'text-slate-500'}>{selectedPrintMonth || '-- Pilih Bulan --'}</span>
                    <span className="text-slate-400">▼</span>
                  </button>
                  
                  {openPrintDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div onClick={() => { setSelectedPrintMonth('semua'); setOpenPrintDropdown(false); }} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b">Semua Bulan</div>
                      {availableMonths.map(m => (
                        <div key={m} onClick={() => { setSelectedPrintMonth(m); setOpenPrintDropdown(false); }} className="p-3 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{m}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={closePrintModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                  <button onClick={() => { if (!selectedPrintMonth) return alert('Pilih bulan dulu!'); if (selectedPrintMonth === 'semua') { handlePrint(); } else { setPrintStep(2); } }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">Lanjut</button>
                </div>
              </>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg mb-4 p-2">
                  <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer border-b">
                    <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={selectedPrintIds.length === getReportsByMonth(selectedPrintMonth).length} onChange={(e) => { if (e.target.checked) { setSelectedPrintIds(getReportsByMonth(selectedPrintMonth).map(r => r.id)); } else { setSelectedPrintIds([]); } }} />
                    <span className="font-bold text-slate-700">Pilih Semua</span>
                  </label>
                  {getReportsByMonth(selectedPrintMonth).map(r => (
                    <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={selectedPrintIds.includes(r.id)} onChange={(e) => { if (e.target.checked) { setSelectedPrintIds([...selectedPrintIds, r.id]); } else { setSelectedPrintIds(selectedPrintIds.filter(id => id !== r.id)); } }} />
                      <span className="text-sm text-slate-600 truncate">{r.namaPerusahaan} - {r.uploadedBy}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between gap-3">
                  <button onClick={() => setPrintStep(1)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Kembali</button>
                  <div className="flex gap-3">
                    <button onClick={closePrintModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">Cetak</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Laporan?</h3>
            <p className="text-slate-500 text-sm mb-6">Laporan ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer">{isDeleting ? 'Menghapus...' : 'Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}