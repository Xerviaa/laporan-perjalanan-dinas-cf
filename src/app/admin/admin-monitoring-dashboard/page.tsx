'use client';

import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';

const SERTIFIKASI_TARGETS: { [key: string]: number } = {
  CBIB: 30,
  CPIB: 30,
  CPPIB: 30,
  CPOIB: 30,
  CDOIB: 30,
  'CPIB Kapal': 30,
  HACCP: 30,
  SKP: 30,
  SPDI: 30,
  'Selfdecare Kapal': 50,
  Inpres: 50,
};

const MONTHS_LIST = [
  { val: '0', name: 'Januari' },
  { val: '1', name: 'Februari' },
  { val: '2', name: 'Maret' },
  { val: '3', name: 'April' },
  { val: '4', name: 'Mei' },
  { val: '5', name: 'Juni' },
  { val: '6', name: 'Juli' },
  { val: '7', name: 'Agustus' },
  { val: '8', name: 'September' },
  { val: '9', name: 'Oktober' },
  { val: '10', name: 'November' },
  { val: '11', name: 'Desember' },
];

export default function MonitoringDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [capaianView, setCapaianView] = useState<'grid' | 'table'>('grid');
  const [jenisQuery, setJenisQuery] = useState('');

  // STATE UNTUK TOAST NOTIFIKASI
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // State untuk Filter Sertifikasi
  const now = new Date();
  const [filterYear, setFilterYear] = useState<string>(now.getFullYear().toString());
  const [filterPeriodType, setFilterPeriodType] = useState<string>('bulanan');
  const [filterPeriodValue, setFilterPeriodValue] = useState<string>(now.getMonth().toString());

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchReports = async () => {
    try {
      // GANTI ENDPOINT INI JIKA ADMIN PUNYA ENDPOINT KHUSUS
      const res = await fetch('/api/reports', { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'success') {
        setReports(data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Gagal mengambil data:', error);
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

  // --- LOGIKA PERHITUNGAN DATA ADMINISTRASI ---
  const { totalKegiatan, berkasLengkap, belumAdaBerkas, belumLengkap, tuntasPct } = useMemo(() => {
    const total = reports.length;
    let lengkap = 0;
    let tanpaBerkas = 0;
    let kurang = 0;

    reports.forEach((report) => {
      const hasSuratTugas = report.suratTugas && report.suratTugas !== '[]';
      const hasBerkasKegiatan = report.berkasKegiatan && report.berkasKegiatan !== '[]';
      const hasBerkasPerbaikan = report.berkasPerbaikan && report.berkasPerbaikan !== '[]';
      const hasPemeriksaan =
        report.berkasPemeriksaanTindakanPerbaikan &&
        report.berkasPemeriksaanTindakanPerbaikan !== '[]';

      const totalFileTerisi = [
        hasSuratTugas,
        hasBerkasKegiatan,
        hasBerkasPerbaikan,
        hasPemeriksaan,
      ].filter(Boolean).length;

      if (totalFileTerisi === 4) {
        lengkap++;
      } else if (totalFileTerisi === 0) {
        tanpaBerkas++;
      } else {
        kurang++;
      }
    });

    const pct = total > 0 ? Math.round((lengkap / total) * 100) : 0;
    return {
      totalKegiatan: total,
      berkasLengkap: lengkap,
      belumAdaBerkas: tanpaBerkas,
      belumLengkap: kurang,
      tuntasPct: pct,
    };
  }, [reports]);

  // --- LOGIKA FILTER ---
  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        reports.map((r: any) => {
          const d = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
          return Number.isNaN(d.getTime())
            ? now.getFullYear().toString()
            : d.getFullYear().toString();
        })
      )
    )
      .sort()
      .reverse();
  }, [reports]);

  const filteredSertifikasi = useMemo(() => {
    return reports.filter((r: any) => {
      if (!r.jenisKegiatan) return false;

      const isSertifikasi = Object.keys(SERTIFIKASI_TARGETS).some((j) =>
        r.jenisKegiatan.includes(j)
      );
      if (!isSertifikasi) return false;

      const d = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) return false;

      const reportYear = d.getFullYear().toString();
      const reportMonth = d.getMonth();

      if (filterYear !== 'all' && reportYear !== filterYear) return false;

      if (filterPeriodType === 'bulanan') {
        if (filterPeriodValue !== 'all' && reportMonth.toString() !== filterPeriodValue)
          return false;
      } else if (filterPeriodType === 'triwulan') {
        const q = parseInt(filterPeriodValue, 10);
        const startMonth = (q - 1) * 3;
        const endMonth = startMonth + 2;
        if (reportMonth < startMonth || reportMonth > endMonth) return false;
      } else if (filterPeriodType === 'semester') {
        const s = parseInt(filterPeriodValue, 10);
        const startMonth = (s - 1) * 6;
        const endMonth = startMonth + 5;
        if (reportMonth < startMonth || reportMonth > endMonth) return false;
      }

      return true;
    });
  }, [reports, filterYear, filterPeriodType, filterPeriodValue]);

  const capaianSertifikasi = useMemo(() => {
    return Object.keys(SERTIFIKASI_TARGETS).map((jenis) => {
      const realisasi = filteredSertifikasi.filter((r) => r.jenisKegiatan?.includes(jenis)).length;
      const target = SERTIFIKASI_TARGETS[jenis];
      const persentase = target > 0 ? Math.round((realisasi / target) * 100) : 0;
      return { jenis, target, realisasi, persentase };
    });
  }, [filteredSertifikasi]);

  const displayedCapaian = useMemo(() => {
    if (!jenisQuery.trim()) return capaianSertifikasi;
    return capaianSertifikasi.filter((item) =>
      item.jenis.toLowerCase().includes(jenisQuery.toLowerCase())
    );
  }, [capaianSertifikasi, jenisQuery]);

  const jenisAdaRealisasi = useMemo(() => {
    return capaianSertifikasi.filter((item) => item.realisasi > 0).length;
  }, [capaianSertifikasi]);

  // Helper untuk Label Periode
  const getPeriodTitle = () => {
    if (filterPeriodType === 'bulanan') {
      const monthName =
        filterPeriodValue !== 'all'
          ? MONTHS_LIST.find((m) => m.val === filterPeriodValue)?.name
          : 'Semua Bulan';
      return filterYear !== 'all' ? `${monthName} ${filterYear}` : `${monthName} (Semua Tahun)`;
    }
    if (filterPeriodType === 'triwulan') {
      return filterYear !== 'all'
        ? `Triwulan ${filterPeriodValue} • ${filterYear}`
        : `Triwulan ${filterPeriodValue}`;
    }
    if (filterPeriodType === 'semester') {
      return filterYear !== 'all'
        ? `Semester ${filterPeriodValue} • ${filterYear}`
        : `Semester ${filterPeriodValue}`;
    }
    return filterYear !== 'all' ? `Tahun ${filterYear}` : 'Semua Tahun';
  };

  const resetFilter = () => {
    setFilterPeriodType('bulanan');
    setFilterYear(now.getFullYear().toString());
    setFilterPeriodValue(now.getMonth().toString());
    setJenisQuery('');
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-10 text-center text-slate-500 text-xs animate-pulse">
          Memuat Dashboard...
        </div>
      </Layout>
    );
  }

  const lengkapPctBar = totalKegiatan > 0 ? (berkasLengkap / totalKegiatan) * 100 : 0;
  const kurangPctBar = totalKegiatan > 0 ? (belumLengkap / totalKegiatan) * 100 : 0;
  const kosongPctBar = totalKegiatan > 0 ? (belumAdaBerkas / totalKegiatan) * 100 : 0;

  return (
    <Layout>
      {/* TOAST NOTIFIKASI */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white ${
            toast.type === 'success'
              ? 'border-emerald-200 text-slate-800'
              : 'border-rose-200 text-slate-800'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <div>
            <p className="font-bold text-xs">{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
            <p className="text-xs text-slate-500">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast({ ...toast, show: false })}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-5">
        {/* TOP COMMAND HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              Pusat Kendali Laporan
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Monitoring Overview
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sinkron Aktif</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-700 font-bold">{getPeriodTitle()}</span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isRefreshing ? 'animate-spin' : ''}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
              </svg>
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* BENTO ROW ATAS: STATUS ADMINISTRASI (7) + FILTER SERTIFIKASI (5) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* KIRI (7 KOLOM): STATUS ADMINISTRASI */}
          <div className="xl:col-span-7 relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col justify-between gap-5">
            <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-indigo-500/6 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Status Administrasi
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-black text-slate-900 tabular-nums">
                    {totalKegiatan}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    total kegiatan terdata
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3.5 py-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-800">Berkas Tuntas</span>
                <span className="text-sm font-extrabold text-emerald-900 tabular-nums">
                  {tuntasPct}%
                </span>
              </div>
            </div>

            {/* STACKED BAR KELENGKAPAN DOKUMEN */}
            <div className="relative space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 p-0.5 ring-1 ring-inset ring-slate-200/60">
                {lengkapPctBar > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${lengkapPctBar}%` }}
                  />
                )}
                {kurangPctBar > 0 && (
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${kurangPctBar}%` }}
                  />
                )}
                {kosongPctBar > 0 && (
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${kosongPctBar}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Kelengkapan dokumen tiap laporan</span>
                <span className="font-semibold text-slate-700 tabular-nums">
                  {totalKegiatan} terklasifikasi
                </span>
              </div>
            </div>

            {/* 3 KARTU METRIK STATUS */}
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Lengkap</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {berkasLengkap}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Belum Lengkap</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {belumLengkap}
                </p>
              </div>

              <div className="rounded-xl border border-rose-200/70 bg-rose-50/40 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800">Tanpa Berkas</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {belumAdaBerkas}
                </p>
              </div>
            </div>
          </div>

          {/* KANAN (5 KOLOM): PANEL FILTER SERTIFIKASI */}
          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Penyaringan Periode
                </p>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">Filter Sertifikasi</h2>
              </div>

              <button
                type="button"
                onClick={resetFilter}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                Reset
              </button>
            </div>

            {/* SEGMENTED TAB: BULAN | TRIWULAN | SEMESTER | TAHUN */}
            <div className="grid grid-cols-4 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 gap-1">
              {[
                { id: 'bulanan', label: 'Bulan', defaultVal: now.getMonth().toString() },
                { id: 'triwulan', label: 'Triwulan', defaultVal: '1' },
                { id: 'semester', label: 'Semester', defaultVal: '1' },
                { id: 'tahunan', label: 'Tahun', defaultVal: 'all' },
              ].map((tab) => {
                const active = filterPeriodType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setFilterPeriodType(tab.id);
                      setFilterPeriodValue(tab.defaultVal);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                        : 'text-slate-600 font-semibold hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* DROPDOWN TAHUN + SUB-PERIODE */}
            <div
              className={`grid gap-3 ${
                filterPeriodType === 'tahunan' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tahun</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                >
                  <option value="all">Semua Tahun</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {filterPeriodType === 'bulanan' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bulan</label>
                  <select
                    value={filterPeriodValue}
                    onChange={(e) => setFilterPeriodValue(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">Semua Bulan</option>
                    {MONTHS_LIST.map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filterPeriodType === 'triwulan' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Triwulan
                  </label>
                  <select
                    value={filterPeriodValue}
                    onChange={(e) => setFilterPeriodValue(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="1">Triwulan I (Jan - Mar)</option>
                    <option value="2">Triwulan II (Apr - Jun)</option>
                    <option value="3">Triwulan III (Jul - Sep)</option>
                    <option value="4">Triwulan IV (Okt - Des)</option>
                  </select>
                </div>
              )}

              {filterPeriodType === 'semester' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Semester
                  </label>
                  <select
                    value={filterPeriodValue}
                    onChange={(e) => setFilterPeriodValue(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="1">Semester I (Jan - Jun)</option>
                    <option value="2">Semester II (Jul - Des)</option>
                  </select>
                </div>
              )}
            </div>

            {/* FOOTER RINGKASAN REALISASI & JUMLAH LAPORAN */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <p className="text-slate-500 tabular-nums">
                <span className="font-bold text-slate-800">{jenisAdaRealisasi}</span> dari{' '}
                {Object.keys(SERTIFIKASI_TARGETS).length} jenis ada realisasi
              </p>
              <span className="font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/70 px-3 py-1 rounded-full tabular-nums">
                {filteredSertifikasi.length} laporan
              </span>
            </div>
          </div>
        </div>

        {/* SECTION CAPAIAN SERTIFIKASI (GAYA KARTU GUEST) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Capaian Sertifikasi ({getPeriodTitle()})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Realisasi dibandingkan target per jenis kegiatan sertifikasi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari jenis sertifikasi..."
                value={jenisQuery}
                onChange={(e) => setJenisQuery(e.target.value)}
                className="border border-slate-200 bg-slate-50/70 focus:bg-white px-3 py-1.5 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />

              <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 text-white text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCapaianView('grid')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    capaianView === 'grid'
                      ? 'bg-white text-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Grid Kartu
                </button>
                <button
                  type="button"
                  onClick={() => setCapaianView('table')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    capaianView === 'table'
                      ? 'bg-white text-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Tabel
                </button>
              </div>
            </div>
          </div>

          {capaianView === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayedCapaian.map((item) => {
                const isMulai = item.realisasi > 0;
                const barWidth = Math.min(item.persentase, 100);

                return (
                  <div
                    key={item.jenis}
                    className="rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 transition-all bg-white flex flex-col justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {item.jenis}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 tabular-nums">
                          Realisasi:{' '}
                          <span className="font-bold text-slate-800">{item.realisasi}</span> /{' '}
                          <span className="text-slate-500">{item.target}</span>
                        </p>
                      </div>

                      {isMulai ? (
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-full shrink-0">
                          Mulai
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-2.5 py-0.5 rounded-full shrink-0">
                          Kosong
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Capaian</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {item.persentase}%
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMulai
                              ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                              : 'bg-slate-200'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white text-slate-400 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3.5">Jenis Sertifikasi</th>
                    <th className="px-4 py-3.5 text-center">Target</th>
                    <th className="px-4 py-3.5 text-center">Realisasi</th>
                    <th className="px-4 py-3.5 text-right w-56">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedCapaian.map((item) => {
                    const isMulai = item.realisasi > 0;
                    const barWidth = Math.min(item.persentase, 100);

                    return (
                      <tr
                        key={item.jenis}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {item.jenis}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-400 font-medium tabular-nums">
                          {item.target}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-900 tabular-nums">
                          {item.realisasi}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isMulai
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                    : 'bg-slate-200'
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800 text-xs tabular-nums w-9 text-right">
                              {item.persentase}%
                            </span>
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
      </div>
    </Layout>
  );
}