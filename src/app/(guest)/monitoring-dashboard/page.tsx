'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

const normalizeJenisText = (text?: string) =>
  (text || '')
    .replace(/Survailen/gi, 'Surveilan')
    .replace(/Selfdecare/gi, 'Selfdeclare')
    .replace(/Self\s+Declare/gi, 'Selfdeclare')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function MonitoringDashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

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
      const res = await fetch('/api/reports');
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
    }, 400);
  };

  const handleResetFilter = () => {
    setFilterYear(now.getFullYear().toString());
    setFilterPeriodType('bulanan');
    setFilterPeriodValue(now.getMonth().toString());
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2.5 text-sm text-slate-500">
          <span className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span>Menyiapkan workspace monitoring...</span>
        </div>
      </Layout>
    );
  }

  // --- PERHITUNGAN STATUS BERKAS ---
  const totalKegiatan = reports.length;
  let berkasLengkap = 0;
  let belumAdaBerkas = 0;
  let belumLengkap = 0;

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

    if (totalFileTerisi === 4) berkasLengkap++;
    else if (totalFileTerisi === 0) belumAdaBerkas++;
    else belumLengkap++;
  });

  const wLengkap = totalKegiatan > 0 ? (berkasLengkap / totalKegiatan) * 100 : 0;
  const wBelumLengkap = totalKegiatan > 0 ? (belumLengkap / totalKegiatan) * 100 : 0;
  const wBelumAda = totalKegiatan > 0 ? (belumAdaBerkas / totalKegiatan) * 100 : 0;
  const rasioKepatuhan = totalKegiatan > 0 ? Math.round(wLengkap) : 0;

  // --- LOGIKA FILTER ---
  const availableYears = Array.from(
    new Set(
      reports.map((r: any) => {
        const d = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
        return d.getFullYear().toString();
      })
    )
  )
    .sort()
    .reverse();

  const monthsList = [
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

  const sertifikasiTargets: { [key: string]: number } = {
    CBIB: 30,
    CPIB: 30,
    CPPIB: 30,
    CPOIB: 30,
    CDOIB: 30,
    'CPIB Kapal': 30,
    HACCP: 30,
    SKP: 30,
    SPDI: 30,
    'Selfdeclare Kapal': 50,
    Inpres: 50,
  };

  const sertifikasiKeys = Object.keys(sertifikasiTargets);

  const filteredSertifikasi = reports.filter((r: any) => {
    if (!r.jenisKegiatan) return false;
    const normalizedKegiatan = normalizeJenisText(r.jenisKegiatan).toLowerCase();
    const isSertifikasi = sertifikasiKeys.some((j) =>
      normalizedKegiatan.includes(j.toLowerCase())
    );
    if (!isSertifikasi) return false;

    const d = r.tanggal ? new Date(r.tanggal) : new Date(r.createdAt);
    const reportYear = d.getFullYear().toString();
    const reportMonth = d.getMonth();

    if (filterYear !== 'all' && reportYear !== filterYear) return false;

    if (filterPeriodType === 'bulanan') {
      if (filterPeriodValue !== 'all' && reportMonth.toString() !== filterPeriodValue) return false;
    } else if (filterPeriodType === 'triwulan') {
      const q = parseInt(filterPeriodValue);
      const startMonth = (q - 1) * 3;
      const endMonth = startMonth + 2;
      if (reportMonth < startMonth || reportMonth > endMonth) return false;
    } else if (filterPeriodType === 'semester') {
      const s = parseInt(filterPeriodValue);
      const startMonth = (s - 1) * 6;
      const endMonth = startMonth + 5;
      if (reportMonth < startMonth || reportMonth > endMonth) return false;
    }

    return true;
  });

  const capaianSertifikasi = sertifikasiKeys.map((jenis) => {
    const targetJenis = jenis.toLowerCase();
    const realisasi = filteredSertifikasi.filter((r) =>
      normalizeJenisText(r.jenisKegiatan).toLowerCase().includes(targetJenis)
    ).length;
    const target = sertifikasiTargets[jenis];
    const persentase = target > 0 ? Math.round((realisasi / target) * 100) : 0;
    return { jenis, target, realisasi, persentase };
  });

  const jenisBerjalan = capaianSertifikasi.filter((item) => item.realisasi > 0).length;

  const getPeriodLabel = () => {
    if (filterYear === 'all' && filterPeriodType === 'bulanan' && filterPeriodValue === 'all') {
      return 'Semua Data';
    }
    let label = '';
    if (filterPeriodType === 'bulanan') {
      label +=
        filterPeriodValue !== 'all'
          ? monthsList.find((m) => m.val === filterPeriodValue)?.name
          : 'Semua Bulan';
    } else if (filterPeriodType === 'triwulan') {
      label += `Triwulan ${filterPeriodValue}`;
    } else if (filterPeriodType === 'semester') {
      label += `Semester ${filterPeriodValue}`;
    } else {
      label += 'Tahunan';
    }
    if (filterYear !== 'all') label += ` ${filterYear}`;
    return label.trim();
  };

  return (
    <Layout>
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-full shadow-xl border border-slate-700/80 px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* TOP COMMAND BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              Pusat Kendali Laporan
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Monitoring Overview
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sinkron Aktif</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-900">{getPeriodLabel()}</span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
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
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ASYMMETRIC SPLIT TOP: DISTRIBUSI BERKAS + FILTER INTERAKTIF */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* KIRI (7 KOLOM): DISTRIBUSI KELENGKAPAN BERKAS */}
          <div className="xl:col-span-7 relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col justify-between gap-5">
            <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-indigo-500/5 blur-2xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status Administrasi
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                    {totalKegiatan}
                  </span>
                  <span className="text-sm text-slate-500">total kegiatan terdata</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3.5 py-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-800">Berkas Tuntas</span>
                <span className="text-sm font-extrabold text-emerald-900 tabular-nums">
                  {rasioKepatuhan}%
                </span>
              </div>
            </div>

            {/* STACKED SEGMENTED BAR */}
            <div className="relative space-y-2">
              <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 p-0.5 ring-1 ring-inset ring-slate-200/60">
                {wLengkap > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${wLengkap}%` }}
                    title={`Berkas Lengkap: ${berkasLengkap}`}
                  />
                )}
                {wBelumLengkap > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                    style={{ width: `${wBelumLengkap}%` }}
                    title={`Belum Lengkap: ${belumLengkap}`}
                  />
                )}
                {wBelumAda > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${wBelumAda}%` }}
                    title={`Belum Ada Berkas: ${belumAdaBerkas}`}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Kelengkapan dokumen tiap laporan</span>
                <span className="tabular-nums font-medium text-slate-600">
                  {berkasLengkap + belumLengkap + belumAdaBerkas} terklasifikasi
                </span>
              </div>
            </div>

            {/* 3 BREAKDOWN CHIPS */}
            <div className="relative grid grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 border-l-4 border-l-emerald-500 p-3">
                <div className="text-[11px] font-semibold text-slate-600">Lengkap</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {berkasLengkap}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 border-l-4 border-l-amber-400 p-3">
                <div className="text-[11px] font-semibold text-slate-600">Belum Lengkap</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {belumLengkap}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 border-l-4 border-l-rose-500 p-3">
                <div className="text-[11px] font-semibold text-slate-600">Tanpa Berkas</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {belumAdaBerkas}
                </div>
              </div>
            </div>
          </div>

          {/* KANAN (5 KOLOM): PANEL FILTER INTERAKTIF */}
          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Penyaringan Periode
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">Filter Sertifikasi</h2>
              </div>
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* SEGMENTED TIPE PERIODE */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
              {[
                { id: 'bulanan', label: 'Bulan' },
                { id: 'triwulan', label: 'Triwulan' },
                { id: 'semester', label: 'Semester' },
                { id: 'tahunan', label: 'Tahun' },
              ].map((tab) => {
                const active = filterPeriodType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setFilterPeriodType(tab.id);
                      setFilterPeriodValue(tab.id === 'bulanan' ? now.getMonth().toString() : '1');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* DROPDOWN TAHUN + PERIODE SPESIFIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Tahun
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
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
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Bulan
                  </label>
                  <select
                    value={filterPeriodValue}
                    onChange={(e) => setFilterPeriodValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">Semua Bulan</option>
                    {monthsList.map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filterPeriodType === 'triwulan' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Triwulan
                  </label>
                  <select
                    value={filterPeriodValue}
                    onChange={(e) => setFilterPeriodValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="1">Triwulan 1 (Jan–Mar)</option>
                    <option value="2">Triwulan 2 (Apr–Jun)</option>
                    <option value="3">Triwulan 3 (Jul–Sep)</option>
                    <option value="4">Triwulan 4 (Okt–Des)</option>
                  </select>
                </div>
              )}

              {filterPeriodType === 'semester' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Semester
                  </label>
                  <select
                    value={filterPeriodValue}
                    onChange={(e) => setFilterPeriodValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="1">Semester 1 (Jan–Jun)</option>
                    <option value="2">Semester 2 (Jul–Des)</option>
                  </select>
                </div>
              )}

              {filterPeriodType === 'tahunan' && (
                <div className="flex items-end">
                  <div className="w-full rounded-xl bg-indigo-50/70 border border-indigo-100 px-3 py-2 text-xs text-indigo-800 font-medium">
                    Akumulasi 12 bulan penuh
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                <strong className="text-slate-700">{jenisBerjalan}</strong> dari{' '}
                {capaianSertifikasi.length} jenis ada realisasi
              </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full tabular-nums">
                {filteredSertifikasi.length} laporan
              </span>
            </div>
          </div>
        </div>

        {/* SECTION SERTIFIKASI: MODE KARTU GRID / TABEL RINGKAS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                Capaian Sertifikasi ({getPeriodLabel()})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Realisasi dibandingkan target per jenis kegiatan sertifikasi.
              </p>
            </div>

            {/* TOGGLE VIEW MODE */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid Kartu
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabel
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {capaianSertifikasi.map((item, idx) => {
                const widthPct = Math.min(item.persentase, 100);
                let badgeLabel = 'Mulai';
                let badgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200/70';
                let barClass = 'bg-gradient-to-r from-indigo-600 to-violet-500';

                if (item.persentase >= 80) {
                  badgeLabel = 'Tercapai';
                  badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/70';
                  barClass = 'bg-gradient-to-r from-emerald-500 to-teal-500';
                } else if (item.persentase >= 40) {
                  badgeLabel = 'Berjalan';
                  badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200/70';
                  barClass = 'bg-gradient-to-r from-amber-500 to-orange-400';
                } else if (item.persentase === 0) {
                  badgeLabel = 'Kosong';
                  badgeClass = 'bg-rose-50 text-rose-700 border border-rose-200/70';
                  barClass = 'bg-rose-500';
                }

                return (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md p-4 transition-all duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                          {item.jenis}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          Realisasi{' '}
                          <span className="font-semibold text-slate-800">{item.realisasi}</span> /{' '}
                          {item.target}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Capaian</span>
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          {item.persentase}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Jenis Sertifikasi</th>
                    <th className="py-3 px-4 text-right">Target</th>
                    <th className="py-3 px-4 text-right">Realisasi</th>
                    <th className="py-3 px-4 w-48">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {capaianSertifikasi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.jenis}</td>
                      <td className="py-3 px-4 text-right text-slate-500 tabular-nums">
                        {item.target}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {item.realisasi}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
                              style={{ width: `${Math.min(item.persentase, 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-bold text-slate-800 tabular-nums">
                            {item.persentase}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}