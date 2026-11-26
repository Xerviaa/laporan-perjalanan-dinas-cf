'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import EditForm from '@/components/EditForm';

type JenisFilter = 'all' | 'Inspeksi' | 'Surveilan' | 'Inpres' | 'Selfdeclare Kapal';
type StatusFilter = 'all' | 'Tepat Waktu' | 'Terlambat';

interface MonthGroup {
  fullMonth: string;
  reports: any[];
}

export default function ArsipPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
        if (data.status === 'success' && Array.isArray(data.data)) {
          setReports(data.data);
        } else {
          setReports([]);
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

  // Hitung Status Ketepatan Waktu
  const getKetepatanStatus = (report: any): 'Tepat Waktu' | 'Terlambat' => {
    if (report.tanggal && report.createdAt) {
      const tglDinas = new Date(report.tanggal);
      const tglUpload = new Date(report.createdAt);
      const selisihWaktu = tglUpload.getTime() - tglDinas.getTime();
      const selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
      if (selisihHari > 3) {
        return 'Terlambat';
      }
    }
    return 'Tepat Waktu';
  };

  // Normalisasi Nama Kegiatan & Jenis
  const parseJenisKegiatan = (report: any) => {
    const jenisKegiatanTampil = (report.jenisKegiatan || '')
      .replace(/Survailen/gi, 'Surveilan')
      .trim();
    const normalized = jenisKegiatanTampil
      .toLowerCase()
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ');

    if (normalized === 'inpres' || normalized.startsWith('inpres ')) {
      return {
        jenisKegiatanTampil,
        namaKegiatan: 'Inpres',
        jenis: 'Inpres',
      };
    }

    if (
      normalized === 'selfdeclare kapal' ||
      normalized === 'self declare kapal' ||
      normalized.startsWith('selfdeclare kapal') ||
      normalized.startsWith('self declare kapal')
    ) {
      return {
        jenisKegiatanTampil,
        namaKegiatan: 'Selfdeclare Kapal',
        jenis: 'Selfdeclare Kapal',
      };
    }

    const parts = jenisKegiatanTampil.split(/\s+/).filter(Boolean);
    const namaKegiatan = parts[0] || '-';
    const jenis = parts.slice(1).join(' ') || '-';
    return { jenisKegiatanTampil, namaKegiatan, jenis };
  };

  const normalizeForFilter = (text: string) =>
    text
      .toLowerCase()
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Filter Berdasarkan Pencarian, Tanggal, Jenis Utama, dan Status Ketepatan Waktu
  const filteredReports = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      (r.namaPerusahaan && r.namaPerusahaan.toLowerCase().includes(q)) ||
      (r.uploadedBy && r.uploadedBy.toLowerCase().includes(q)) ||
      (r.jenisKegiatan && r.jenisKegiatan.toLowerCase().includes(q));

    let matchDate = true;
    if (startDate || endDate) {
      const reportDate = r.tanggal
        ? new Date(r.tanggal).getTime()
        : new Date(r.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      matchDate = reportDate >= start && reportDate <= end;
    }

    const { jenisKegiatanTampil } = parseJenisKegiatan(r);
    const normalizedJenis = normalizeForFilter(jenisKegiatanTampil);
    const matchJenis =
      jenisFilter === 'all' ||
      (jenisFilter === 'Selfdeclare Kapal'
        ? normalizedJenis.includes('selfdeclare kapal') || normalizedJenis.includes('self declare kapal')
        : normalizedJenis.includes(normalizeForFilter(jenisFilter)));

    const matchStatus = statusFilter === 'all' || getKetepatanStatus(r) === statusFilter;

    return matchSearch && matchDate && matchJenis && matchStatus;
  });

  // Mengelompokkan data per Tahun -> Bulan
  const dataByYear: Record<string, Record<string, MonthGroup>> = filteredReports.reduce(
    (acc, report) => {
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
    },
    {} as Record<string, Record<string, MonthGroup>>
  );

  // Urutkan Tahun dari terbaru ke terlama
  const sortedYears = Object.keys(dataByYear).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  // Otomatis buka tahun terbaru & bulan saat filter aktif
  useEffect(() => {
    if (loading || sortedYears.length === 0) return;

    const hasActiveSearchOrDate = Boolean(
      searchTerm.trim() ||
        startDate ||
        endDate ||
        jenisFilter !== 'all' ||
        statusFilter !== 'all'
    );

    if (hasActiveSearchOrDate) {
      const firstYear = sortedYears[0];
      setSelectedYear(firstYear);
      const monthsObj: Record<string, MonthGroup> = dataByYear[firstYear] || {};
      const matchingFullMonths = Object.values(monthsObj).map(
        (m: MonthGroup) => m.fullMonth
      );
      setOpenMonths(matchingFullMonths);
    } else if (!selectedYear) {
      setSelectedYear(sortedYears[0]);
    }
  }, [
    loading,
    filteredReports.length,
    searchTerm,
    startDate,
    endDate,
    jenisFilter,
    statusFilter,
  ]);

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

  const hasActiveFilters = Boolean(
    searchTerm || startDate || endDate || jenisFilter !== 'all' || statusFilter !== 'all'
  );

  const resetAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setJenisFilter('all');
    setStatusFilter('all');
  };

  // --- FUNGSI DOWNLOAD (BUKA HALAMAN CETAK MODE PDF) ---
  const handleDownload = (id: number) => {
    window.open(`/cetak/${id}?mode=pdf`, '_blank');
  };

  // --- FUNGSI VIEW DETAIL ---
  const handleViewClick = (report: any) => {
    setViewReport(report);
    setIsViewModalOpen(true);
  };

  const parseJsonArraySafe = (raw: any): string[] | null => {
    if (!raw || raw === '[]') return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const renderFileLinks = (raw: any, emptyText = 'Tidak ada file.') => {
    if (!raw || raw === '[]') {
      return <p className="text-xs text-slate-400 italic">{emptyText}</p>;
    }
    const parsedArray = parseJsonArraySafe(raw);
    if (parsedArray !== null) {
      if (parsedArray.length === 0) {
        return <p className="text-xs text-slate-400 italic">{emptyText}</p>;
      }
      return (
        <div className="flex flex-col gap-1.5">
          {parsedArray.map((key: string, idx: number) => (
            <a
              key={idx}
              href={`/api/r2/${key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline break-all font-medium"
            >
              {key.split('/').pop()}
            </a>
          ))}
        </div>
      );
    }
    return (
      <a
        href={`/api/r2/${raw}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline break-all font-medium"
      >
        {String(raw).split('/').pop()}
      </a>
    );
  };

  const jenisOptions: { label: string; value: JenisFilter }[] = [
    { label: 'Semua Jenis', value: 'all' },
    { label: 'Inspeksi', value: 'Inspeksi' },
    { label: 'Surveilan', value: 'Surveilan' },
    { label: 'Inpres', value: 'Inpres' },
    { label: 'Selfdeclare Kapal', value: 'Selfdeclare Kapal' },
  ];

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Semua Status', value: 'all' },
    { label: 'Tepat Waktu', value: 'Tepat Waktu' },
    { label: 'Terlambat', value: 'Terlambat' },
  ];

  const fotoList = viewReport ? parseJsonArraySafe(viewReport.fotoKegiatan) || [] : [];

  return (
    <Layout>
      <div ref={topRef} />

      {/* HEADER HALAMAN BERSIH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            ARSIP LAPORAN
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Seluruh riwayat perjalanan dinas terkelompok berdasarkan tahun dan bulan pelaksanaan.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* PANEL FILTER MODERN DENGAN CHIP KATEGORI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 md:p-5 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-indigo-600 rounded-full shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Filter & Pencarian Arsip</h2>
              <p className="text-xs text-slate-400">
                Saring laporan berdasarkan nama perusahaan, pengunggah, jenis, status, atau tanggal
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Cari Nama / Perusahaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* CHIP FILTER JENIS & STATUS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {jenisOptions.map((opt) => {
              const active = jenisFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJenisFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {statusOptions.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50/70 text-blue-700 hover:bg-blue-100/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* RENTANG TANGGAL DINAS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 px-3.5 py-3 rounded-xl border border-slate-200/70">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
              Filter Tanggal Dinas:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
              <span className="text-xs font-medium text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="self-start md:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* KONTEN UTAMA AKORDEON TAHUN & BULAN */}
      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center text-slate-500 text-sm shadow-2xs">
          Memuat data arsip laporan...
        </div>
      ) : sortedYears.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center shadow-2xs space-y-2">
          <p className="text-slate-700 font-semibold text-sm">Tidak ada laporan yang ditemukan.</p>
          <p className="text-slate-400 text-xs">
            Coba ubah kata kunci pencarian, filter kategori, atau rentang tanggal dinas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedYears.map((year) => {
            const isYearOpen = selectedYear === year;
            const monthsInYear = dataByYear[year] || {};
            const allReportsInYear: any[] = Object.values(monthsInYear).flatMap(
              (m: MonthGroup) => m.reports
            );
            const totalReportsInYear = allReportsInYear.length;
            const tepatInYear = allReportsInYear.filter(
              (r) => getKetepatanStatus(r) === 'Tepat Waktu'
            ).length;

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
                className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all"
              >
                {/* HEADER TAHUN */}
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shadow-2xs shrink-0">
                      {year.slice(-2)}
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                        Tahun {year}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {sortedMonthsInYear.length} bulan · {tepatInYear} tepat waktu
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full">
                      {totalReportsInYear} Laporan
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                        isYearOpen ? 'rotate-180 text-slate-900' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {/* DAFTAR BULAN */}
                {isYearOpen && (
                  <div className="bg-slate-50/70 border-t border-slate-200/80 p-3 sm:p-5 space-y-3">
                    {sortedMonthsInYear.map((month: string) => {
                      const monthData: MonthGroup = monthsInYear[month];
                      const isMonthOpen = openMonths.includes(monthData.fullMonth);

                      return (
                        <div
                          key={month}
                          className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs"
                        >
                          {/* HEADER BULAN */}
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthData.fullMonth)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                                {month.slice(0, 3).toUpperCase()}
                              </span>
                              <span className="font-bold text-sm text-slate-800">
                                {monthData.fullMonth}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2.5 py-0.5 rounded-full font-bold">
                                {monthData.reports.length} Laporan
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                  isMonthOpen ? 'rotate-180 text-indigo-600' : ''
                                }`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                          </button>

                          {/* TABEL LAPORAN */}
                          {isMonthOpen && (
                            <div className="border-t border-slate-100 overflow-x-auto">
                              <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-900 text-slate-100 font-semibold text-[11px] uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Perusahaan & Kegiatan</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Pelaksana</th>
                                    <th className="px-4 py-3">Jenis</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {monthData.reports.map((report: any) => {
                                    const { namaKegiatan, jenis } = parseJenisKegiatan(report);
                                    const statusTeks = getKetepatanStatus(report);
                                    const statusWarna =
                                      statusTeks === 'Terlambat'
                                        ? 'text-rose-700 bg-rose-50 border-rose-200/80'
                                        : 'text-emerald-700 bg-emerald-50 border-emerald-200/80';

                                    return (
                                      <tr
                                        key={report.id}
                                        className="hover:bg-blue-50/30 transition-colors"
                                      >
                                        <td className="px-4 py-3.5 align-top">
                                          <p className="font-bold text-slate-900 text-sm leading-snug">
                                            {report.namaPerusahaan || '-'}
                                          </p>
                                          <p className="text-xs text-slate-500 capitalize mt-0.5">
                                            {namaKegiatan}
                                          </p>
                                        </td>

                                        <td className="px-4 py-3.5 text-slate-600 font-medium align-top">
                                          <div>
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
                                          </div>

                                          <div
                                            className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${statusWarna}`}
                                          >
                                            {statusTeks}
                                          </div>
                                        </td>

                                        <td className="px-4 py-3.5 text-slate-600 align-top">
                                          <div className="flex flex-col gap-1 min-w-[160px]">
                                            {report.petugasPelaksana ? (
                                              report.petugasPelaksana
                                                .split('|')
                                                .map((petugas: string, idx: number) => {
                                                  const namaSaja = petugas.split('(')[0].trim();
                                                  return (
                                                    <span
                                                      key={idx}
                                                      className="text-xs md:text-sm text-slate-700 leading-snug block border-b border-slate-100 last:border-0 pb-1 last:pb-0"
                                                    >
                                                      {namaSaja}
                                                    </span>
                                                  );
                                                })
                                            ) : (
                                              <span className="text-xs md:text-sm text-slate-400">
                                                -
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        <td className="px-4 py-3.5 whitespace-nowrap align-top">
                                          <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                                            {jenis}
                                          </span>
                                        </td>

                                        <td className="px-4 py-3.5 align-top">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleViewClick(report)}
                                              title="Lihat Detail"
                                              className="p-2 bg-cyan-50 text-cyan-700 border border-cyan-200/70 rounded-lg hover:bg-cyan-100 transition-colors cursor-pointer"
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

                                            <button
                                              type="button"
                                              onClick={() => setEditId(report.id)}
                                              title="Edit Laporan"
                                              className="p-2 bg-amber-50 text-amber-700 border border-amber-200/70 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
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

                                            <button
                                              type="button"
                                              onClick={() => handleDownload(report.id)}
                                              title="Download PDF"
                                              className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
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

                                            <a
                                              href={`/cetak/${report.id}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title="Cetak Laporan"
                                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
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

      {/* --- TOMBOL SCROLL TO TOP --- */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-all duration-200 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Detail Laporan</h3>
                <p className="text-xs text-slate-500">Informasi lengkap perjalanan dinas & berkas</p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
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

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-blue-50/70 p-4 rounded-xl border border-blue-100">
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold tracking-wide">
                    Nama Perusahaan
                  </p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {viewReport.namaPerusahaan || '-'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 italic">
                    {viewReport.alamatPerusahaan || 'Alamat belum diisi'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold tracking-wide">
                    Jenis Kegiatan
                  </p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {viewReport.jenisKegiatan || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold tracking-wide">
                    Tanggal Pelaksanaan
                  </p>
                  <p className="font-medium text-slate-800 mt-0.5">
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
                  <p className="text-slate-500 text-[11px] uppercase font-semibold tracking-wide">
                    No Surat
                  </p>
                  <p className="font-medium text-slate-800 mt-0.5">{viewReport.noSurat || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-sm text-slate-800 mb-1.5">Hasil Kegiatan</p>
                  <div className="p-3.5 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-200/80 whitespace-pre-wrap h-28 overflow-y-auto">
                    {viewReport.hasilKegiatan || '-'}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 mb-1.5">Kendala</p>
                  <div className="p-3.5 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-200/80 whitespace-pre-wrap h-28 overflow-y-auto">
                    {viewReport.kendala || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-2">
                    📄 Surat Tugas
                  </p>
                  {renderFileLinks(viewReport.suratTugas)}
                </div>
                <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-2">
                    📄 Berkas Kegiatan
                  </p>
                  {renderFileLinks(viewReport.berkasKegiatan)}
                </div>
                <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-2">
                    📄 Berkas Tindakan Perbaikan
                  </p>
                  {renderFileLinks(viewReport.berkasPerbaikan)}
                </div>
                <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-xs uppercase tracking-wide text-slate-700 mb-2">
                    📄 Pemeriksaan Tindakan Perbaikan
                  </p>
                  {renderFileLinks(viewReport.berkasPemeriksaanTindakanPerbaikan)}
                </div>
              </div>

              {/* BAGIAN FOTO KEGIATAN */}
              <div className="pt-1">
                <p className="font-bold text-sm text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-blue-600 pl-3">
                  Foto Kegiatan
                </p>
                {fotoList.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fotoList.map((key: string, idx: number) => (
                      <div
                        key={idx}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50"
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
                <p className="font-bold text-sm text-slate-900 mb-6 uppercase tracking-wide border-l-4 border-slate-800 pl-3">
                  V. Tanda Tangan Pelaksana
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(viewReport.petugasPelaksana || '')
                    .split('|')
                    .map((petugas: string, idx: number) => {
                      const parts = petugas.split('(');
                      const namaLengkap = parts[0].trim();
                      const jabatan = parts[1]
                        ? parts[1].replace(')', '').trim()
                        : 'Anggota Tim';
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
                          <p className="font-bold text-sm text-slate-800">{namaLengkap}</p>
                          <p className="text-xs text-slate-600">{jabatan}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/80 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT (FORM EDIT) */}
      {editId && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit Laporan</h3>
                <p className="text-xs text-slate-500">Perbarui data atau berkas laporan tersimpan</p>
              </div>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
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