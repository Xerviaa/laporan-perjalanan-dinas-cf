'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import EditForm from '@/components/EditForm';

const normalizeDisplayText = (value?: string) =>
  (value || '')
    .replace(/Survailen/gi, 'Surveilan')
    .replace(/Selfdecare\s+Kapal/gi, 'Selfdeclare Kapal')
    .replace(/Self\s+Declare\s+Kapal/gi, 'Selfdeclare Kapal')
    .trim();

const getKolomKegiatanDanJenis = (rawJenis?: string) => {
  const clean = normalizeDisplayText(rawJenis);
  if (!clean) return { namaKegiatan: '-', jenis: '-' };

  const lower = clean.toLowerCase();

  if (lower === 'selfdeclare kapal' || lower.startsWith('selfdeclare ')) {
    return {
      namaKegiatan: 'Selfdeclare Kapal',
      jenis: 'Selfdeclare Kapal',
    };
  }

  if (lower === 'inpres' || lower.startsWith('inpres ')) {
    return {
      namaKegiatan: 'Inpres',
      jenis: 'Inpres',
    };
  }

  if (lower.startsWith('inspeksi ') || lower.startsWith('surveilan ')) {
    const firstSpace = clean.indexOf(' ');
    return {
      namaKegiatan: clean.slice(0, firstSpace),
      jenis: clean.slice(firstSpace + 1).trim() || '-',
    };
  }

  return {
    namaKegiatan: clean,
    jenis: clean,
  };
};

const getStatusKetepatan = (report: any) => {
  if (report.tanggal && report.createdAt) {
    const tglDinas = new Date(report.tanggal);
    const tglUpload = new Date(report.createdAt);
    const selisihHari = Math.floor(
      (tglUpload.getTime() - tglDinas.getTime()) / (1000 * 3600 * 24)
    );
    if (selisihHari > 3) {
      return {
        teks: 'Terlambat',
        isTerlambat: true,
        badgeClass: 'text-rose-600 bg-rose-50 border-rose-200',
      };
    }
  }
  return {
    teks: 'Tepat Waktu',
    isTerlambat: false,
    badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };
};

const getMonthShortBadge = (monthName: string) => {
  const map: Record<string, string> = {
    Januari: 'JAN',
    Februari: 'FEB',
    Maret: 'MAR',
    April: 'APR',
    Mei: 'MEI',
    Juni: 'JUN',
    Juli: 'JUL',
    Agustus: 'AGU',
    September: 'SEP',
    Oktober: 'OKT',
    November: 'NOV',
    Desember: 'DES',
  };
  return map[monthName] || monthName.slice(0, 3).toUpperCase();
};

const JENIS_FILTERS = [
  'Semua Jenis',
  'Inspeksi',
  'Surveilan',
  'Inpres',
  'Selfdeclare Kapal',
] as const;

const STATUS_FILTERS = ['Semua Status', 'Tepat Waktu', 'Terlambat'] as const;

export default function ArsipAdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua Jenis');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua Status');

  // State untuk Accordion
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [openMonths, setOpenMonths] = useState<string[]>([]);

  // --- STATE UNTUK MODAL EDIT ---
  const [editId, setEditId] = useState<number | null>(null);

  // --- STATE UNTUK MODAL VIEW ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewReport, setViewReport] = useState<any>(null);

  // --- STATE UNTUK SCROLL TO TOP ---
  const [showScrollTop, setShowScrollTop] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // --- STATE UNTUK FILTER TANGGAL ---
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchReports = () => {
    setLoading(true);
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setReports(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      fullMonth: dateToUse.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
  };

  // Filter Berdasarkan Pencarian, Jenis, Status, dan Tanggal
  const filteredReports = reports.filter((r) => {
    const query = searchTerm.toLowerCase();
    const namaPerusahaanNorm = normalizeDisplayText(r.namaPerusahaan).toLowerCase();
    const jenisKegiatanNorm = normalizeDisplayText(r.jenisKegiatan).toLowerCase();
    const petugasNorm = (r.petugasPelaksana || '').toLowerCase();
    const uploadedByNorm = (r.uploadedBy || '').toLowerCase();

    const matchSearch =
      !query ||
      namaPerusahaanNorm.includes(query) ||
      jenisKegiatanNorm.includes(query) ||
      petugasNorm.includes(query) ||
      uploadedByNorm.includes(query);

    const matchJenis =
      selectedJenis === 'Semua Jenis' ||
      jenisKegiatanNorm.includes(selectedJenis.toLowerCase());

    const statusInfo = getStatusKetepatan(r);
    const matchStatus =
      selectedStatus === 'Semua Status' || statusInfo.teks === selectedStatus;

    let matchDate = true;
    if (startDate || endDate) {
      const reportDate = r.tanggal
        ? new Date(r.tanggal).getTime()
        : new Date(r.createdAt).getTime();
      const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
      const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Infinity;
      matchDate = reportDate >= start && reportDate <= end;
    }

    return matchSearch && matchJenis && matchStatus && matchDate;
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
        reports: [],
      };
    }
    acc[year][month].reports.push(report);
    return acc;
  }, {} as Record<string, Record<string, { fullMonth: string; reports: any[] }>>);

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
      setOpenMonths(openMonths.filter((m) => m !== monthYear));
    } else {
      setOpenMonths([...openMonths, monthYear]);
    }
  };

  const handleDownload = (id: number) => {
    window.open(`/cetak/${id}?mode=pdf`, '_blank');
  };

  const handleViewClick = (report: any) => {
    setViewReport(report);
    setIsViewModalOpen(true);
  };

  return (
    <Layout>
      <div ref={topRef} />

      <div className="space-y-5">
        {/* HEADER HALAMAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
              ARSIP LAPORAN
            </h1>
            <p className="text-slate-500 mt-1 text-xs md:text-sm">
              Seluruh riwayat perjalanan dinas terkelompok berdasarkan tahun dan bulan pelaksanaan.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* PANEL FILTER & PENCARIAN ARSIP */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-1 h-9 bg-indigo-600 rounded-full mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                  Filter &amp; Pencarian Arsip
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saring laporan berdasarkan nama perusahaan, pengunggah, jenis, status, atau tanggal
                </p>
              </div>
            </div>

            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="🔍 Cari Nama / Perusahaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 bg-white px-3.5 py-2 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* CHIP FILTER JENIS & STATUS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {JENIS_FILTERS.map((jenis) => {
                const active = selectedJenis === jenis;
                return (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => setSelectedJenis(jenis)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {jenis}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((status) => {
                const active = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FILTER TANGGAL DINAS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                FILTER TANGGAL DINAS:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-slate-700 outline-none transition-all"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-slate-700 outline-none transition-all"
              />
            </div>

            {(startDate ||
              endDate ||
              searchTerm ||
              selectedJenis !== 'Semua Jenis' ||
              selectedStatus !== 'Semua Status') && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setSelectedJenis('Semua Jenis');
                  setSelectedStatus('Semua Status');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer self-start sm:self-auto"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* DAFTAR ACCORDION TAHUN -> BULAN */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-sm text-slate-500 shadow-2xs">
            Memuat data...
          </div>
        ) : sortedYears.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-sm text-slate-500 shadow-2xs">
            Tidak ada laporan yang ditemukan.
          </div>
        ) : (
          <div className="space-y-3.5">
            {sortedYears.map((year) => {
              const isYearOpen = selectedYear === year;
              const monthsInYear = dataByYear[year];
              const allReportsInYear: any[] = Object.values(monthsInYear).flatMap(
                (m: any) => m.reports
              );
              const totalReportsInYear = allReportsInYear.length;
              const tepatWaktuInYear = allReportsInYear.filter(
                (r) => !getStatusKetepatan(r).isTerlambat
              ).length;
              const monthCountInYear = Object.keys(monthsInYear).length;
              const shortYear = year.slice(-2);

              const monthOrder = [
                'Januari',
                'Februari',
                'Maret',
                'April',
                'Mei',
                'Juni',
                'Juli',
                'Agustus',
                'September',
                'Oktober',
                'November',
                'Desember',
              ];
              const sortedMonthsInYear: string[] = Object.keys(monthsInYear).sort(
                (a: string, b: string) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
              );

              return (
                <div
                  key={year}
                  className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden"
                >
                  {/* HEADER TAHUN */}
                  <button
                    type="button"
                    onClick={() => toggleYear(year)}
                    className="w-full flex items-center justify-between px-4 md:px-5 py-4 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800 font-extrabold text-xs flex items-center justify-center tabular-nums shrink-0">
                        {shortYear}
                      </span>
                      <div className="text-left">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                          Tahun {year}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                          {monthCountInYear} bulan · {tepatWaktuInYear} tepat waktu
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full tabular-nums">
                        {totalReportsInYear} Laporan
                      </span>
                      <span
                        className={`text-slate-400 text-xs transition-transform ${
                          isYearOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ⌄
                      </span>
                    </div>
                  </button>

                  {/* DAFTAR BULAN */}
                  {isYearOpen && (
                    <div className="bg-slate-50/60 border-t border-slate-100 p-3.5 space-y-2.5">
                      {sortedMonthsInYear.map((month: string) => {
                        const monthData = monthsInYear[month];
                        const isMonthOpen = openMonths.includes(monthData.fullMonth);

                        return (
                          <div
                            key={month}
                            className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs"
                          >
                            {/* HEADER BULAN */}
                            <button
                              type="button"
                              onClick={() => toggleMonth(monthData.fullMonth)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                                  {getMonthShortBadge(month)}
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-slate-800">
                                  {monthData.fullMonth}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                                  {monthData.reports.length} Laporan
                                </span>
                                <span
                                  className={`text-slate-400 text-xs transition-transform ${
                                    isMonthOpen ? 'rotate-180' : ''
                                  }`}
                                >
                                  ⌄
                                </span>
                              </div>
                            </button>

                            {/* TABEL LAPORAN */}
                            {isMonthOpen && (
                              <div className="border-t border-slate-100 overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                                      <th className="px-4 py-3">Nama Kegiatan</th>
                                      <th className="px-4 py-3">Tanggal</th>
                                      <th className="px-4 py-3">Pelaksana</th>
                                      <th className="px-4 py-3">Jenis</th>
                                      <th className="px-4 py-3 text-center">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(monthData.reports as any[]).map((report: any) => {
                                      const { namaKegiatan, jenis } = getKolomKegiatanDanJenis(
                                        report.jenisKegiatan
                                      );
                                      const statusInfo = getStatusKetepatan(report);

                                      return (
                                        <tr
                                          key={report.id}
                                          className="hover:bg-slate-50/80 transition-colors"
                                        >
                                          <td className="px-4 py-3 text-slate-800 font-semibold">
                                            {namaKegiatan}
                                          </td>

                                          <td className="px-4 py-3 text-slate-600 font-medium tabular-nums">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span>
                                                {report.tanggal
                                                  ? new Date(report.tanggal).toLocaleDateString(
                                                      'id-ID',
                                                      {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                      }
                                                    )
                                                  : '-'}
                                              </span>
                                              <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${statusInfo.badgeClass}`}
                                              >
                                                {statusInfo.teks}
                                              </span>
                                            </div>
                                          </td>

                                          <td className="px-4 py-3 text-slate-600 align-top">
                                            <div className="flex flex-col gap-1 min-w-[150px]">
                                              {report.petugasPelaksana ? (
                                                report.petugasPelaksana
                                                  .split('|')
                                                  .map((petugas: string, idx: number) => {
                                                    const namaSaja = petugas.split('(')[0].trim();
                                                    return (
                                                      <span
                                                        key={idx}
                                                        className="text-xs md:text-sm leading-tight block border-b border-slate-100 last:border-0 pb-1 last:pb-0"
                                                      >
                                                        {namaSaja}
                                                      </span>
                                                    );
                                                  })
                                              ) : (
                                                <span className="text-xs md:text-sm">-</span>
                                              )}
                                            </div>
                                          </td>

                                          <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                                            {jenis}
                                          </td>

                                          <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                              {/* TOMBOL VIEW */}
                                              <button
                                                type="button"
                                                onClick={() => handleViewClick(report)}
                                                title="Lihat Detail"
                                                className="p-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200/70 rounded-lg hover:bg-cyan-100 cursor-pointer transition-colors"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                  <circle cx="12" cy="12" r="3" />
                                                </svg>
                                              </button>

                                              {/* TOMBOL EDIT */}
                                              <button
                                                type="button"
                                                onClick={() => setEditId(report.id)}
                                                title="Edit Laporan"
                                                className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200/70 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                              </button>

                                              {/* TOMBOL DOWNLOAD (PRINT PDF) */}
                                              <button
                                                type="button"
                                                onClick={() => handleDownload(report.id)}
                                                title="Download PDF"
                                                className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-lg hover:bg-emerald-100 cursor-pointer transition-colors"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                  <polyline points="7 10 12 15 17 10" />
                                                  <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                              </button>

                                              {/* TOMBOL CETAK */}
                                              <a
                                                href={`/cetak/${report.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Cetak Laporan"
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  width="13"
                                                  height="13"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <path d="M6 9V2h12v7" />
                                                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                  <rect x="6" y="14" width="12" height="8" />
                                                </svg>
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
      </div>

      {/* --- TOMBOL SCROLL TO TOP --- */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-all duration-300 cursor-pointer"
          title="Kembali ke Atas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      )}

      {/* MODAL VIEW DETAIL */}
      {isViewModalOpen && viewReport && (
        <div
          onClick={() => setIsViewModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="text-base md:text-lg font-bold text-slate-900">Detail Laporan</h3>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <p className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider">
                    Nama Perusahaan
                  </p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {normalizeDisplayText(viewReport.namaPerusahaan) || '-'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 italic">
                    {viewReport.alamatPerusahaan || 'Alamat belum diisi'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider">
                    Jenis Kegiatan
                  </p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {normalizeDisplayText(viewReport.jenisKegiatan) || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider">
                    Tanggal Pelaksanaan
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {viewReport.tanggal
                      ? new Date(viewReport.tanggal).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider">
                    No Surat
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {viewReport.noSurat || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-xs text-slate-700 mb-1.5">Hasil Kegiatan</p>
                  <div className="p-3 bg-slate-50/80 rounded-xl text-xs sm:text-sm text-slate-700 border border-slate-200/80 whitespace-pre-wrap h-24 overflow-y-auto">
                    {viewReport.hasilKegiatan || '-'}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-xs text-slate-700 mb-1.5">Kendala</p>
                  <div className="p-3 bg-slate-50/80 rounded-xl text-xs sm:text-sm text-slate-700 border border-slate-200/80 whitespace-pre-wrap h-24 overflow-y-auto">
                    {viewReport.kendala || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs text-slate-800 mb-1.5 flex items-center gap-2">
                    <span>📄</span>
                    <span>Surat Tugas</span>
                  </p>
                  {viewReport.suratTugas ? (
                    <a
                      href={`/api/r2/${viewReport.suratTugas}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-indigo-700 hover:underline break-all font-medium"
                    >
                      {viewReport.suratTugas.split('/').pop()}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs text-slate-800 mb-1.5 flex items-center gap-2">
                    <span>📄</span>
                    <span>Berkas Kegiatan</span>
                  </p>
                  {viewReport.berkasKegiatan && viewReport.berkasKegiatan !== '[]' ? (
                    <div className="flex flex-col gap-1">
                      {JSON.parse(viewReport.berkasKegiatan).map((key: string, idx: number) => (
                        <a
                          key={idx}
                          href={`/api/r2/${key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-indigo-700 hover:underline break-all font-medium"
                        >
                          {key.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs text-slate-800 mb-1.5 flex items-center gap-2">
                    <span>📄</span>
                    <span>Berkas Tindakan Perbaikan</span>
                  </p>
                  {viewReport.berkasPerbaikan && viewReport.berkasPerbaikan !== '[]' ? (
                    <div className="flex flex-col gap-1">
                      {JSON.parse(viewReport.berkasPerbaikan).map((key: string, idx: number) => (
                        <a
                          key={idx}
                          href={`/api/r2/${key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-indigo-700 hover:underline break-all font-medium"
                        >
                          {key.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs text-slate-800 mb-1.5 flex items-center gap-2">
                    <span>📄</span>
                    <span>Pemeriksaan Tindakan Perbaikan</span>
                  </p>
                  {viewReport.berkasPemeriksaanTindakanPerbaikan ? (
                    <a
                      href={`/api/r2/${viewReport.berkasPemeriksaanTindakanPerbaikan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-indigo-700 hover:underline break-all font-medium"
                    >
                      {viewReport.berkasPemeriksaanTindakanPerbaikan.split('/').pop()}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>
              </div>

              {/* BAGIAN FOTO KEGIATAN */}
              <div className="pt-2">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 border-l-4 border-indigo-600 pl-3">
                  Foto Kegiatan
                </p>
                {viewReport.fotoKegiatan && viewReport.fotoKegiatan !== '[]' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {JSON.parse(viewReport.fotoKegiatan).map((key: string, idx: number) => (
                      <div
                        key={idx}
                        className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50"
                      >
                        <img
                          src={`/api/r2/${key}`}
                          alt={`Foto Kegiatan ${idx + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada foto kegiatan.</p>
                )}
              </div>

              {/* TANDA TANGAN PELAKSANA */}
              <div className="pt-2">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-5 border-l-4 border-indigo-600 pl-3">
                  V. Tanda Tangan Pelaksana
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(viewReport.petugasPelaksana || '')
                    .split('|')
                    .map((petugas: string, idx: number) => {
                      const parts = petugas.split('(');
                      const namaLengkap = parts[0].trim();
                      const jabatan = parts[1] ? parts[1].replace(')', '').trim() : 'Anggota Tim';
                      let namaBersih = namaLengkap.split(',')[0].trim().toLowerCase();
                      namaBersih = namaBersih.replace(/^drh\.\s*/i, '');
                      namaBersih = namaBersih.replace(/[^a-z0-9\s-]/g, '');
                      const namaFile = namaBersih.replace(/\s+/g, '-');

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center justify-end text-center h-40"
                        >
                          <div className="h-20 w-full flex items-end justify-center mb-2">
                            <img
                              src={`/tanda-tangan/${namaFile}.png`}
                              alt={`TTD ${namaLengkap}`}
                              className="max-h-20 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="w-full border-t-2 border-slate-800 mb-2" />
                          <p className="font-bold text-xs sm:text-sm text-slate-900">
                            {namaLengkap}
                          </p>
                          <p className="text-xs text-slate-500">{jabatan}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 text-right">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT (FORM EDIT) */}
      {editId && (
        <div
          onClick={() => setEditId(null)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="text-base md:text-lg font-bold text-slate-900">Edit Laporan</h3>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <EditForm
              id={editId}
              onSuccess={() => {
                setEditId(null);
                fetchReports();
              }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}