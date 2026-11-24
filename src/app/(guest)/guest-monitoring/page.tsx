'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';

const SERTIFIKASI_LIST = [
  'CBIB',
  'CPIB',
  'CPPIB',
  'CPOIB',
  'CDOIB',
  'CPIB Kapal',
  'HACCP',
  'SKP',
  'SPDI',
  'Selfdecare Kapal',
  'Inpres',
];

const BULAN_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

type PeriodMode = 'bulan' | 'triwulan' | 'semester' | 'tahun';

export default function GuestMonitoringPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'bento' | 'table'>('bento');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [jenisFilter, setJenisFilter] = useState('Semua Jenis');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter Periode ala Filter Sertifikasi
  const [periodMode, setPeriodMode] = useState<PeriodMode>('bulan');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  const [fileSuratTugas, setFileSuratTugas] = useState<File[]>([]);
  const [fileBerkasKegiatan, setFileBerkasKegiatan] = useState<File[]>([]);
  const [fileBerkasPerbaikan, setFileBerkasPerbaikan] = useState<File[]>([]);
  const [filePemeriksaan, setFilePemeriksaan] = useState<File[]>([]);

  // STATE UNTUK FOTO
  const [fileFoto, setFileFoto] = useState<File[]>([]);
  const [fotoToDelete, setFotoToDelete] = useState<string[]>([]);

  const [isUpdating, setIsUpdating] = useState(false);

  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // --- STATE UNTUK TOMBOL DINAMIS (TANPA TOMBOL PRINT & HAPUS) ---
  const [daftarTombol, setDaftarTombol] = useState<any[]>([]);

  // --- STATE UNTUK MODAL DOWNLOAD ---
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadReportId, setDownloadReportId] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchReports();
    fetchPengaturanTombol();
  }, []);

  // Shortcut keyboard: '/' untuk fokus cari, 'Esc' untuk tutup modal/lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === '/' && !isTyping && !isEditModalOpen && !isViewModalOpen && !isDownloadModalOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (lightboxUrl) setLightboxUrl(null);
        else if (isDownloadModalOpen) setIsDownloadModalOpen(false);
        else if (isEditModalOpen) setIsEditModalOpen(false);
        else if (isViewModalOpen) setIsViewModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxUrl, isDownloadModalOpen, isEditModalOpen, isViewModalOpen]);

  const fotoPreviews = useMemo(() => {
    return fileFoto.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [fileFoto]);

  useEffect(() => {
    return () => {
      fotoPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [fotoPreviews]);

  const fetchReports = async (manual = false) => {
    if (manual) setIsSyncing(true);
    try {
      const res = await fetch('/api/reports', { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'success') {
        setReports(data.data);
        if (manual) showToast('Data monitoring berhasil disinkronkan!', 'success');
      } else if (manual) {
        showToast('Gagal menyinkronkan data.', 'error');
      }
    } catch (error) {
      console.error('Gagal mengambil data:', error);
      if (manual) showToast('Terjadi kesalahan jaringan saat sinkronisasi.', 'error');
    } finally {
      setLoading(false);
      if (manual) setIsSyncing(false);
    }
  };

  const fetchPengaturanTombol = async () => {
    const defaultTombol = [
      { key: 'view', label: 'Lihat Detail', warna: 'bg-cyan-500', aktif: true },
      { key: 'edit', label: 'Upload Berkas', warna: 'bg-amber-500', aktif: true },
      { key: 'download', label: 'Download File', warna: 'bg-indigo-600', aktif: true },
    ];

    try {
      const res = await fetch('/api/pengaturan');
      const data = await res.json();
      if (data.status === 'success') {
        const tombol = data.data.find((d: any) => d.tipe === 'tombol_monitoring');
        if (tombol) {
          const parsed = JSON.parse(tombol.nilai);
          setDaftarTombol(parsed.filter((t: any) => !['delete', 'print'].includes(t.key)));
        } else {
          setDaftarTombol(defaultTombol);
        }
      } else {
        setDaftarTombol(defaultTombol);
      }
    } catch (error) {
      console.error('Gagal load pengaturan tombol:', error);
      setDaftarTombol(defaultTombol);
    }
  };

  const handleDownloadClick = (id: number) => {
    setDownloadReportId(id);
    setIsDownloadModalOpen(true);
  };

  const handleDownloadAction = (action: string) => {
    if (!downloadReportId) return;

    if (action === 'pdf-laporan') window.open(`/cetak/${downloadReportId}?mode=pdf&skipST=true`, '_blank');
    if (action === 'pdf-monitoring')
      window.open(`/admin/monitoring/print/${downloadReportId}?mode=pdf`, '_blank');
    if (action === 'zip-berkas')
      window.open(`/api/download-zip?id=${downloadReportId}&type=berkas`, '_blank');
    if (action === 'zip-foto')
      window.open(`/api/download-zip?id=${downloadReportId}&type=foto`, '_blank');

    setIsDownloadModalOpen(false);
  };

  const getAutoStatus = (report: any) => {
    const missingFiles: string[] = [];

    if (!report.suratTugas || report.suratTugas === '[]') missingFiles.push('Surat Tugas');
    if (!report.berkasKegiatan || report.berkasKegiatan === '[]') missingFiles.push('Berkas Kegiatan');
    if (!report.berkasPerbaikan || report.berkasPerbaikan === '[]')
      missingFiles.push('Berkas Tindakan Perbaikan');
    if (
      !report.berkasPemeriksaanTindakanPerbaikan ||
      report.berkasPemeriksaanTindakanPerbaikan === '[]'
    ) {
      missingFiles.push('Pemeriksaan Tindakan Perbaikan');
    }

    const totalWajib = 4;
    const terisi = totalWajib - missingFiles.length;
    const persentase = Math.round((terisi / totalWajib) * 100);

    if (missingFiles.length === 0) {
      return {
        teks: 'Berkas Lengkap',
        warna: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        isList: false,
        list: [],
        terisi,
        totalWajib,
        persentase,
      };
    }

    return {
      teks: 'Belum upload berkas',
      warna: 'bg-rose-50 text-rose-700 border border-rose-200/80',
      isList: true,
      list: missingFiles,
      terisi,
      totalWajib,
      persentase,
    };
  };

  const simulatedCompleteness = useMemo(() => {
    if (!selectedReport) return { terisi: 0, total: 4, pct: 0 };

    const stRemaining =
      selectedReport.suratTugas && !filesToDelete.includes(selectedReport.suratTugas);
    const hasSt = Boolean(stRemaining) || fileSuratTugas.length > 0;

    const existingBk: string[] =
      selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]'
        ? JSON.parse(selectedReport.berkasKegiatan)
        : [];
    const bkRemaining = existingBk.filter((k) => !filesToDelete.includes(k)).length > 0;
    const hasBk = bkRemaining || fileBerkasKegiatan.length > 0;

    const existingBp: string[] =
      selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]'
        ? JSON.parse(selectedReport.berkasPerbaikan)
        : [];
    const bpRemaining = existingBp.filter((k) => !filesToDelete.includes(k)).length > 0;
    const hasBp = bpRemaining || fileBerkasPerbaikan.length > 0;

    const pmRemaining =
      selectedReport.berkasPemeriksaanTindakanPerbaikan &&
      !filesToDelete.includes(selectedReport.berkasPemeriksaanTindakanPerbaikan);
    const hasPm = Boolean(pmRemaining) || filePemeriksaan.length > 0;

    const terisi = [hasSt, hasBk, hasBp, hasPm].filter(Boolean).length;
    return { terisi, total: 4, pct: Math.round((terisi / 4) * 100) };
  }, [
    selectedReport,
    filesToDelete,
    fileSuratTugas,
    fileBerkasKegiatan,
    fileBerkasPerbaikan,
    filePemeriksaan,
  ]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    reports.forEach((r) => {
      const d = r.tanggal ? new Date(r.tanggal) : r.createdAt ? new Date(r.createdAt) : null;
      if (d && !Number.isNaN(d.getTime())) {
        years.add(String(d.getFullYear()));
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [reports]);

  const matchesPeriodFilter = (report: any) => {
    const d = report.tanggal ? new Date(report.tanggal) : report.createdAt ? new Date(report.createdAt) : null;
    if (!d || Number.isNaN(d.getTime())) {
      return (
        selectedYear === 'all' &&
        selectedMonth === 'all' &&
        selectedQuarter === 'all' &&
        selectedSemester === 'all'
      );
    }

    const year = String(d.getFullYear());
    const monthNum = d.getMonth() + 1; // 1..12
    const monthStr = String(monthNum).padStart(2, '0');

    if (selectedYear !== 'all' && year !== selectedYear) return false;

    if (periodMode === 'bulan') {
      if (selectedMonth !== 'all' && monthStr !== selectedMonth) return false;
    } else if (periodMode === 'triwulan') {
      if (selectedQuarter !== 'all') {
        const q = Math.ceil(monthNum / 3);
        if (String(q) !== selectedQuarter) return false;
      }
    } else if (periodMode === 'semester') {
      if (selectedSemester !== 'all') {
        const s = monthNum <= 6 ? '1' : '2';
        if (s !== selectedSemester) return false;
      }
    }

    return true;
  };

  // Laporan yang cocok dengan filter periode & jenis sertifikasi (untuk menghitung realisasi jenis)
  const periodAndJenisReports = useMemo(() => {
    return reports.filter((report) => {
      const matchJenis =
        jenisFilter === 'Semua Jenis' ||
        (report.jenisKegiatan && report.jenisKegiatan.includes(jenisFilter));
      return matchJenis && matchesPeriodFilter(report);
    });
  }, [reports, jenisFilter, periodMode, selectedYear, selectedMonth, selectedQuarter, selectedSemester]);

  const activeJenisRealisasiCount = useMemo(() => {
    const matchedJenis = new Set<string>();
    periodAndJenisReports.forEach((r) => {
      const text = (r.jenisKegiatan || '').replace(/Survailen/gi, 'Surveilan');
      SERTIFIKASI_LIST.forEach((jenis) => {
        if (text.includes(jenis)) {
          matchedJenis.add(jenis);
        }
      });
    });
    return matchedJenis.size;
  }, [periodAndJenisReports]);

  const filteredReports = useMemo(() => {
    return periodAndJenisReports
      .filter((report) => {
        const matchSearch =
          (report.jenisKegiatan &&
            report.jenisKegiatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (report.namaPerusahaan &&
            report.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (report.petugasPelaksana &&
            report.petugasPelaksana.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchStatus = true;
        if (statusFilter !== 'Semua Status') {
          if (statusFilter === 'Berkas Lengkap')
            matchStatus = getAutoStatus(report).teks === 'Berkas Lengkap';
          else if (statusFilter === 'Belum upload berkas')
            matchStatus = getAutoStatus(report).isList === true;
        }

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const timeA = a.tanggal ? new Date(a.tanggal).getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.tanggal ? new Date(b.tanggal).getTime() : new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [periodAndJenisReports, searchTerm, statusFilter, sortOrder]);

  const lengkapCount = reports.filter((r) => !getAutoStatus(r).isList).length;
  const belumLengkapCount = reports.length - lengkapCount;
  const kepatuhanPct = reports.length > 0 ? Math.round((lengkapCount / reports.length) * 100) : 0;
  const lengkapWidthPct = reports.length > 0 ? (lengkapCount / reports.length) * 100 : 0;
  const belumWidthPct = reports.length > 0 ? (belumLengkapCount / reports.length) * 100 : 0;

  const handleEditClick = (report: any) => {
    setSelectedReport(report);
    setFileSuratTugas([]);
    setFileBerkasKegiatan([]);
    setFileBerkasPerbaikan([]);
    setFilePemeriksaan([]);
    setFileFoto([]);
    setFotoToDelete([]);
    setFilesToDelete([]);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (report: any) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const appendDroppedFiles = (zone: string, files: File[]) => {
    if (!files.length) return;
    if (zone === 'suratTugas') setFileSuratTugas((prev) => [...prev, files[0]]);
    else if (zone === 'berkasKegiatan') setFileBerkasKegiatan((prev) => [...prev, ...files]);
    else if (zone === 'berkasPerbaikan') setFileBerkasPerbaikan((prev) => [...prev, ...files]);
    else if (zone === 'pemeriksaan') setFilePemeriksaan((prev) => [...prev, ...files]);
    else if (zone === 'foto') {
      const imgs = files.filter((f) => f.type.startsWith('image/'));
      setFileFoto((prev) => [...prev, ...imgs]);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setIsUpdating(true);
    const formData = new FormData();

    if (fileSuratTugas.length > 0) fileSuratTugas.forEach((file) => formData.append('suratTugas', file));
    if (fileBerkasKegiatan.length > 0)
      fileBerkasKegiatan.forEach((file) => formData.append('berkasKegiatan', file));
    if (fileBerkasPerbaikan.length > 0)
      fileBerkasPerbaikan.forEach((file) => formData.append('berkasPerbaikan', file));
    if (filePemeriksaan.length > 0)
      filePemeriksaan.forEach((file) => formData.append('berkasPemeriksaanTindakanPerbaikan', file));

    if (fileFoto.length > 0) fileFoto.forEach((file) => formData.append('foto', file));
    if (fotoToDelete.length > 0) formData.append('fotoToDelete', JSON.stringify(fotoToDelete));
    if (filesToDelete.length > 0) formData.append('filesToDelete', JSON.stringify(filesToDelete));

    if (selectedReport.suratTugas) formData.append('oldSuratTugas', selectedReport.suratTugas);
    if (selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]')
      formData.append('oldBerkasKegiatan', selectedReport.berkasKegiatan);
    if (selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]')
      formData.append('oldBerkasPerbaikan', selectedReport.berkasPerbaikan);
    if (selectedReport.berkasPemeriksaanTindakanPerbaikan)
      formData.append('oldBerkasPemeriksaan', selectedReport.berkasPemeriksaanTindakanPerbaikan);

    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        showToast('Berkas berhasil di-upload!', 'success');
        fetchReports();
      } else {
        const errorData = await res.json();
        showToast(errorData.message || errorData.error || 'Gagal meng-upload berkas.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const parsePetugas = (petugasString: string) => {
    if (!petugasString) return [];
    return petugasString.split('|').map((p) => {
      const parts = p.split('(');
      const namaLengkap = parts[0].trim();
      const jabatan = parts[1] ? parts[1].replace(')', '').trim() : 'Anggota Tim';
      let namaBersih = namaLengkap.split(',')[0].trim().toLowerCase();
      namaBersih = namaBersih.replace(/^drh\.\s*/i, '');
      namaBersih = namaBersih.replace(/[^a-z0-9\s-]/g, '');
      const namaFile = namaBersih.replace(/\s+/g, '-');
      return { nama: namaLengkap, jabatan, namaFileTtd: `${namaFile}.png` };
    });
  };

  const totalNewFiles =
    fileSuratTugas.length +
    fileBerkasKegiatan.length +
    fileBerkasPerbaikan.length +
    filePemeriksaan.length +
    fileFoto.length;

  const hasActiveFilter =
    searchTerm.trim() !== '' ||
    statusFilter !== 'Semua Status' ||
    jenisFilter !== 'Semua Jenis' ||
    selectedYear !== 'all' ||
    selectedMonth !== 'all' ||
    selectedQuarter !== 'all' ||
    selectedSemester !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('Semua Status');
    setJenisFilter('Semua Jenis');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedQuarter('all');
    setSelectedSemester('all');
  };

  const renderActionButtons = (report: any, compact = false) => {
    return (
      <div className="flex items-center justify-center gap-1.5">
        {daftarTombol
          .filter((t: any) => t.aktif)
          .map((tombol: any) => {
            if (tombol.key === 'view') {
              return (
                <button
                  key="view"
                  type="button"
                  onClick={() => handleViewClick(report)}
                  title={tombol.label}
                  className={`${compact ? 'p-1.5' : 'p-2'} ${
                    tombol.warna
                  } text-white rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={compact ? '14' : '15'}
                    height={compact ? '14' : '15'}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              );
            }
            if (tombol.key === 'edit') {
              return (
                <button
                  key="edit"
                  type="button"
                  onClick={() => handleEditClick(report)}
                  title={tombol.label}
                  className={`${compact ? 'p-1.5' : 'p-2'} ${
                    tombol.warna
                  } text-white rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={compact ? '14' : '15'}
                    height={compact ? '14' : '15'}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              );
            }
            if (tombol.key === 'download') {
              return (
                <button
                  key="download"
                  type="button"
                  onClick={() => handleDownloadClick(report.id)}
                  title={tombol.label}
                  className={`${compact ? 'p-1.5' : 'p-2'} ${
                    tombol.warna
                  } text-white rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={compact ? '14' : '15'}
                    height={compact ? '14' : '15'}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
              );
            }
            return null;
          })}
      </div>
    );
  };

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
        {/* BENTO COMMAND DECK */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* KIRI (6 KOLOM): RINGKASAN KELENGKAPAN BERKAS & PENCARIAN */}
          <div className="xl:col-span-6 relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-indigo-500/6 blur-2xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Rekap & Kelengkapan Dokumen
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Monitoring Sertifikasi
                  </h1>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                    {filteredReports.length} tampil
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3.5 py-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-800">Berkas Tuntas</span>
                <span className="text-sm font-extrabold text-emerald-900 tabular-nums">
                  {kepatuhanPct}%
                </span>
              </div>
            </div>

            {/* SEARCH + JENIS + URUTAN */}
            <div className="relative grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="relative sm:col-span-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari kegiatan, instansi, petugas... (/)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/70 focus:bg-white pl-8.5 pr-3 py-2 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <select
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="sm:col-span-4 border border-slate-200 bg-slate-50/70 focus:bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
              >
                <option value="Semua Jenis">Semua Jenis</option>
                {SERTIFIKASI_LIST.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                className="sm:col-span-2 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer tabular-nums text-center"
              >
                {sortOrder === 'newest' ? '↓ Baru' : '↑ Lama'}
              </button>
            </div>

            {/* STACKED STATUS BAR */}
            <div className="relative space-y-2">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 p-0.5 ring-1 ring-inset ring-slate-200/60">
                {lengkapWidthPct > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${lengkapWidthPct}%` }}
                  />
                )}
                {belumWidthPct > 0 && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-500"
                    style={{ width: `${belumWidthPct}%` }}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Semua Status')}
                    className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer tabular-nums ${
                      statusFilter === 'Semua Status'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    Semua ({reports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Berkas Lengkap')}
                    className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer tabular-nums ${
                      statusFilter === 'Berkas Lengkap'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100/70'
                    }`}
                  >
                    Lengkap ({lengkapCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Belum upload berkas')}
                    className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer tabular-nums ${
                      statusFilter === 'Belum upload berkas'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/70 hover:bg-rose-100/70'
                    }`}
                  >
                    Belum Upload ({belumLengkapCount})
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => setViewMode('bento')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        viewMode === 'bento'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bento Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tabel
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchReports(true)}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isSyncing ? 'animate-spin' : ''}
                    >
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    {isSyncing ? 'Sinkron...' : 'Sinkron'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN (6 KOLOM): FILTER SERTIFIKASI (BULAN / TRIWULAN / SEMESTER / TAHUN) */}
          <div className="xl:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Penyaringan Periode
                </p>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Filter Sertifikasi
                </h2>
              </div>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  Reset
                </button>
              )}
            </div>

            {/* SEGMENTED TAB: BULAN | TRIWULAN | SEMESTER | TAHUN */}
            <div className="grid grid-cols-4 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 gap-1">
              {(
                [
                  { id: 'bulan', label: 'Bulan' },
                  { id: 'triwulan', label: 'Triwulan' },
                  { id: 'semester', label: 'Semester' },
                  { id: 'tahun', label: 'Tahun' },
                ] as const
              ).map((tab) => {
                const active = periodMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPeriodMode(tab.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-indigo-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                periodMode === 'tahun' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                >
                  <option value="all">Semua Tahun</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {periodMode === 'bulan' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bulan</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">Semua Bulan</option>
                    {BULAN_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {periodMode === 'triwulan' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Triwulan
                  </label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">Semua Triwulan</option>
                    <option value="1">Triwulan I (Jan - Mar)</option>
                    <option value="2">Triwulan II (Apr - Jun)</option>
                    <option value="3">Triwulan III (Jul - Sep)</option>
                    <option value="4">Triwulan IV (Okt - Des)</option>
                  </select>
                </div>
              )}

              {periodMode === 'semester' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">Semua Semester</option>
                    <option value="1">Semester I (Jan - Jun)</option>
                    <option value="2">Semester II (Jul - Des)</option>
                  </select>
                </div>
              )}
            </div>

            {/* FOOTER RINGKASAN REALISASI & JUMLAH LAPORAN */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <p className="text-slate-500 tabular-nums">
                <span className="font-bold text-slate-800">{activeJenisRealisasiCount}</span> dari{' '}
                {SERTIFIKASI_LIST.length} jenis ada realisasi
              </p>
              <span className="font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/70 px-3 py-1 rounded-full tabular-nums">
                {filteredReports.length} laporan
              </span>
            </div>
          </div>
        </div>

        {/* KONTEN UTAMA: BENTO GRID ATAU TABEL */}
        {viewMode === 'bento' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-slate-500 text-xs">
                Memuat data monitoring...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-slate-500 text-xs">
                Tidak ada data monitoring yang ditemukan.
              </div>
            ) : (
              filteredReports.map((report, index) => {
                const jenisKegiatanTampil = (report.jenisKegiatan || '').replace(
                  /Survailen/gi,
                  'Surveilan'
                );
                const kegiatanArray = jenisKegiatanTampil ? jenisKegiatanTampil.split(' ') : [];
                const namaKegiatan = kegiatanArray.length > 0 ? kegiatanArray[0] : '-';
                const jenisSertifikasi =
                  kegiatanArray.length > 1 ? kegiatanArray.slice(1).join(' ') : '-';
                const autoStatus = getAutoStatus(report);

                return (
                  <div
                    key={report.id}
                    className="group rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md p-4 transition-all duration-200 flex flex-col justify-between gap-4 bg-white"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 tabular-nums">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                            {jenisSertifikasi}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {report.tanggal
                            ? new Date(report.tanggal).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm capitalize group-hover:text-indigo-700 transition-colors">
                          {namaKegiatan}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {report.namaPerusahaan || 'Instansi belum tercatat'}
                        </p>
                      </div>

                      {/* PELAKSANA (KE BAWAH) */}
                      {report.petugasPelaksana && (
                        <div className="text-[11px] text-slate-700 bg-slate-50/90 border border-slate-200/70 rounded-xl px-3 py-2 flex flex-col divide-y divide-slate-200/60">
                          {report.petugasPelaksana.split('|').map((petugas: string, idx: number) => {
                            const namaSaja = petugas.split('(')[0].trim();
                            return (
                              <span key={idx} className="leading-snug py-1 first:pt-0 last:pb-0">
                                {namaSaja}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* STATUS & PROGRESS */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${autoStatus.warna}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                autoStatus.isList ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                            {autoStatus.teks}
                          </span>
                          <span className="font-bold text-slate-700 tabular-nums text-[11px]">
                            {autoStatus.terisi}/{autoStatus.totalWajib} berkas
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              autoStatus.isList
                                ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            }`}
                            style={{ width: `${autoStatus.persentase}%` }}
                          />
                        </div>

                        {autoStatus.isList && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {autoStatus.list.map((item, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-rose-700 bg-rose-50/70 border border-rose-200/60 px-2 py-0.5 rounded-md font-medium"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                        ID #{report.id}
                      </span>
                      {renderActionButtons(report, true)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* MODE TABEL */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/90 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-14">No.</th>
                    <th className="px-4 py-3.5">Nama Kegiatan</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Pelaksana</th>
                    <th className="px-4 py-3.5">Jenis</th>
                    <th className="px-4 py-3.5 min-w-[230px]">Status Berkas</th>
                    <th className="px-4 py-3.5 text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-xs">
                        Memuat data monitoring...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-xs">
                        Tidak ada data monitoring yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report, index) => {
                      const jenisKegiatanTampil = (report.jenisKegiatan || '').replace(
                        /Survailen/gi,
                        'Surveilan'
                      );

                      const kegiatanArray = jenisKegiatanTampil ? jenisKegiatanTampil.split(' ') : [];
                      const namaKegiatan = kegiatanArray.length > 0 ? kegiatanArray[0] : '-';
                      const jenisSertifikasi =
                        kegiatanArray.length > 1 ? kegiatanArray.slice(1).join(' ') : '-';
                      const autoStatus = getAutoStatus(report);

                      return (
                        <tr
                          key={report.id}
                          className="hover:bg-indigo-50/30 transition-colors align-top"
                        >
                          <td className="px-4 py-3.5 text-center font-semibold text-slate-500 tabular-nums text-xs">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-slate-900 font-semibold capitalize text-xs md:text-sm">
                              {namaKegiatan}
                            </div>
                            {report.namaPerusahaan && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {report.namaPerusahaan}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap tabular-nums text-xs md:text-sm">
                            {report.tanggal
                              ? new Date(report.tanggal).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            <div className="flex flex-col gap-1 min-w-[160px]">
                              {report.petugasPelaksana ? (
                                report.petugasPelaksana
                                  .split('|')
                                  .map((petugas: string, idx: number) => {
                                    const namaSaja = petugas.split('(')[0].trim();
                                    return (
                                      <span
                                        key={idx}
                                        className="text-xs leading-snug block border-b border-slate-100 last:border-0 pb-1 last:pb-0"
                                      >
                                        {namaSaja}
                                      </span>
                                    );
                                  })
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                              {jenisSertifikasi}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5">
                              {autoStatus.isList ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 rounded-full w-max ${autoStatus.warna}`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      Belum upload:
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                                      {autoStatus.terisi}/{autoStatus.totalWajib}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {autoStatus.list.map((item, i) => (
                                      <span
                                        key={i}
                                        className="text-[11px] text-rose-700 bg-rose-50/70 border border-rose-200/60 px-2 py-0.5 rounded-md font-medium leading-tight"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 rounded-full ${autoStatus.warna}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {autoStatus.teks}
                                  </span>
                                  <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                                    4/4
                                  </span>
                                </div>
                              )}

                              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    autoStatus.isList
                                      ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                  }`}
                                  style={{ width: `${autoStatus.persentase}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">{renderActionButtons(report, false)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PILIHAN DOWNLOAD */}
      {isDownloadModalOpen && downloadReportId && (
        <div
          onClick={() => setIsDownloadModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900">Pilih File yang Ingin Diunduh</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unduh dokumen laporan atau arsip lampiran kegiatan
              </p>
            </div>
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => handleDownloadAction('pdf-laporan')}
                className="w-full text-left p-3.5 border border-slate-200/90 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/40 flex items-center gap-3.5 transition-all cursor-pointer"
              >
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">PDF Laporan Lengkap</p>
                  <p className="text-xs text-slate-500">Cetak laporan beserta surat tugas</p>
                </div>
              </button>
              <button
                onClick={() => handleDownloadAction('pdf-monitoring')}
                className="w-full text-left p-3.5 border border-slate-200/90 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/40 flex items-center gap-3.5 transition-all cursor-pointer"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">PDF Monitoring Sertifikasi</p>
                  <p className="text-xs text-slate-500">Halaman print monitoring</p>
                </div>
              </button>
              <button
                onClick={() => handleDownloadAction('zip-berkas')}
                className="w-full text-left p-3.5 border border-slate-200/90 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/40 flex items-center gap-3.5 transition-all cursor-pointer"
              >
                <span className="text-2xl">📎</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Semua Berkas (ZIP)</p>
                  <p className="text-xs text-slate-500">Surat tugas, berkas kegiatan, dll</p>
                </div>
              </button>
              <button
                onClick={() => handleDownloadAction('zip-foto')}
                className="w-full text-left p-3.5 border border-slate-200/90 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/40 flex items-center gap-3.5 transition-all cursor-pointer"
              >
                <span className="text-2xl">🖼️</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Dokumentasi Foto (ZIP)</p>
                  <p className="text-xs text-slate-500">Semua foto kegiatan</p>
                </div>
              </button>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 text-right">
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT (UPLOAD BERKAS + SIMULASI KELENGKAPAN) */}
      {isEditModalOpen && selectedReport && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upload Berkas</h3>
                <p className="text-xs text-slate-500">
                  Simulasi hasil:{' '}
                  <span className="font-bold text-indigo-700 tabular-nums">
                    {simulatedCompleteness.terisi}/{simulatedCompleteness.total} berkas (
                    {simulatedCompleteness.pct}%)
                  </span>{' '}
                  •{' '}
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    +{totalNewFiles} file baru
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <form id="editForm" onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nama Kegiatan
                  </label>
                  <input
                    type="text"
                    value={selectedReport.jenisKegiatan}
                    disabled
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <hr className="border-slate-100" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. SURAT TUGAS */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropZone('suratTugas');
                    }}
                    onDragLeave={() => setActiveDropZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setActiveDropZone(null);
                      appendDroppedFiles('suratTugas', Array.from(e.dataTransfer.files));
                    }}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      activeDropZone === 'suratTugas'
                        ? 'bg-indigo-50/70 border-indigo-400 border-dashed'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                      📄 Surat Tugas
                    </p>
                    {selectedReport.suratTugas && !filesToDelete.includes(selectedReport.suratTugas) && (
                      <div className="mb-2 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <a
                          href={`/api/r2/${selectedReport.suratTugas}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline truncate max-w-[80%]"
                        >
                          {selectedReport.suratTugas.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => setFilesToDelete([...filesToDelete, selectedReport.suratTugas])}
                          className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="Hapus file ini"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {fileSuratTugas.length > 0 &&
                      fileSuratTugas.map((file, idx) => (
                        <div
                          key={idx}
                          className="mb-2 flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                        >
                          <span className="text-xs text-emerald-700 truncate max-w-[80%]">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFileSuratTugas(fileSuratTugas.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileSuratTugas([...fileSuratTugas, e.target.files[0]]);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                  </div>

                  {/* 2. BERKAS KEGIATAN */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropZone('berkasKegiatan');
                    }}
                    onDragLeave={() => setActiveDropZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setActiveDropZone(null);
                      appendDroppedFiles('berkasKegiatan', Array.from(e.dataTransfer.files));
                    }}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      activeDropZone === 'berkasKegiatan'
                        ? 'bg-indigo-50/70 border-indigo-400 border-dashed'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                      📄 Berkas Kegiatan
                    </p>
                    {selectedReport.berkasKegiatan &&
                      selectedReport.berkasKegiatan !== '[]' &&
                      JSON.parse(selectedReport.berkasKegiatan).map((key: string, idx: number) => {
                        if (filesToDelete.includes(key)) return null;
                        return (
                          <div
                            key={idx}
                            className="mb-2 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                          >
                            <a
                              href={`/api/r2/${key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:underline truncate max-w-[80%]"
                            >
                              {key.split('/').pop()}
                            </a>
                            <button
                              type="button"
                              onClick={() => setFilesToDelete([...filesToDelete, key])}
                              className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    {fileBerkasKegiatan.length > 0 &&
                      fileBerkasKegiatan.map((file, idx) => (
                        <div
                          key={idx}
                          className="mb-2 flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                        >
                          <span className="text-xs text-emerald-700 truncate max-w-[80%]">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFileBerkasKegiatan(fileBerkasKegiatan.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setFileBerkasKegiatan([...fileBerkasKegiatan, ...newFiles]);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                  </div>

                  {/* 3. BERKAS PERBAIKAN */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropZone('berkasPerbaikan');
                    }}
                    onDragLeave={() => setActiveDropZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setActiveDropZone(null);
                      appendDroppedFiles('berkasPerbaikan', Array.from(e.dataTransfer.files));
                    }}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      activeDropZone === 'berkasPerbaikan'
                        ? 'bg-indigo-50/70 border-indigo-400 border-dashed'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                      📄 Berkas Tindakan Perbaikan
                    </p>
                    {selectedReport.berkasPerbaikan &&
                      selectedReport.berkasPerbaikan !== '[]' &&
                      JSON.parse(selectedReport.berkasPerbaikan).map((key: string, idx: number) => {
                        if (filesToDelete.includes(key)) return null;
                        return (
                          <div
                            key={idx}
                            className="mb-2 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                          >
                            <a
                              href={`/api/r2/${key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:underline truncate max-w-[80%]"
                            >
                              {key.split('/').pop()}
                            </a>
                            <button
                              type="button"
                              onClick={() => setFilesToDelete([...filesToDelete, key])}
                              className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    {fileBerkasPerbaikan.length > 0 &&
                      fileBerkasPerbaikan.map((file, idx) => (
                        <div
                          key={idx}
                          className="mb-2 flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                        >
                          <span className="text-xs text-emerald-700 truncate max-w-[80%]">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFileBerkasPerbaikan(fileBerkasPerbaikan.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setFileBerkasPerbaikan([...fileBerkasPerbaikan, ...newFiles]);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                  </div>

                  {/* 4. PEMERIKSAAN TINDAKAN PERBAIKAN */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropZone('pemeriksaan');
                    }}
                    onDragLeave={() => setActiveDropZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setActiveDropZone(null);
                      appendDroppedFiles('pemeriksaan', Array.from(e.dataTransfer.files));
                    }}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      activeDropZone === 'pemeriksaan'
                        ? 'bg-indigo-50/70 border-indigo-400 border-dashed'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                      📄 Pemeriksaan Tindakan Perbaikan
                    </p>
                    {selectedReport.berkasPemeriksaanTindakanPerbaikan &&
                      !filesToDelete.includes(selectedReport.berkasPemeriksaanTindakanPerbaikan) && (
                        <div className="mb-2 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <a
                            href={`/api/r2/${selectedReport.berkasPemeriksaanTindakanPerbaikan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline truncate max-w-[80%]"
                          >
                            {selectedReport.berkasPemeriksaanTindakanPerbaikan.split('/').pop()}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setFilesToDelete([
                                ...filesToDelete,
                                selectedReport.berkasPemeriksaanTindakanPerbaikan,
                              ])
                            }
                            className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    {filePemeriksaan.length > 0 &&
                      filePemeriksaan.map((file, idx) => (
                        <div
                          key={idx}
                          className="mb-2 flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                        >
                          <span className="text-xs text-emerald-700 truncate max-w-[80%]">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFilePemeriksaan(filePemeriksaan.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setFilePemeriksaan([...filePemeriksaan, ...newFiles]);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                  </div>

                  {/* 5. FOTO KEGIATAN */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropZone('foto');
                    }}
                    onDragLeave={() => setActiveDropZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setActiveDropZone(null);
                      appendDroppedFiles('foto', Array.from(e.dataTransfer.files));
                    }}
                    className={`p-3.5 rounded-xl border transition-colors md:col-span-2 ${
                      activeDropZone === 'foto'
                        ? 'bg-indigo-50/70 border-indigo-400 border-dashed'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                      📸 Foto Kegiatan
                    </p>

                    {selectedReport.fotoKegiatan && selectedReport.fotoKegiatan !== '[]' && (
                      <div className="mb-3 grid grid-cols-3 gap-2">
                        {JSON.parse(selectedReport.fotoKegiatan).map((key: string, idx: number) => {
                          if (fotoToDelete.includes(key)) return null;
                          return (
                            <div
                              key={idx}
                              className="relative bg-white border border-slate-200 rounded-lg p-1"
                            >
                              <img
                                src={`/api/r2/${key}`}
                                alt={`Foto kegiatan ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => setFotoToDelete([...fotoToDelete, key])}
                                className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {fotoPreviews.length > 0 && (
                      <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {fotoPreviews.map(({ file, url }, idx) => (
                          <div
                            key={idx}
                            className="relative bg-emerald-50/80 border border-emerald-200 rounded-lg p-1.5"
                          >
                            <img
                              src={url}
                              alt={file.name}
                              className="w-full h-16 object-cover rounded-md mb-1"
                            />
                            <p className="text-[11px] text-emerald-800 truncate pr-4">{file.name}</p>
                            <button
                              type="button"
                              onClick={() => setFileFoto(fileFoto.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setFileFoto([...fileFoto, ...newFiles]);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="editForm"
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? 'Menyimpan...' : 'Upload Berkas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIEW DETAIL */}
      {isViewModalOpen && selectedReport && (
        <div
          onClick={() => setIsViewModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900">Detail Laporan</h3>
              <button
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
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold">
                    Nama Perusahaan
                  </p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {selectedReport.namaPerusahaan || '-'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 italic">
                    {selectedReport.alamatPerusahaan || 'Alamat belum diisi'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold">
                    Jenis Kegiatan
                  </p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {selectedReport.jenisKegiatan?.replace(/Survailen/gi, 'Surveilan') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold">
                    Tanggal Pelaksanaan
                  </p>
                  <p className="font-medium text-slate-800 mt-0.5 tabular-nums">
                    {selectedReport.tanggal
                      ? new Date(selectedReport.tanggal).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] uppercase font-semibold">
                    Status Berkas
                  </p>
                  <div className="mt-1">
                    {getAutoStatus(selectedReport).isList ? (
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-block whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full w-max ${
                            getAutoStatus(selectedReport).warna
                          }`}
                        >
                          Belum upload:
                        </span>
                        {getAutoStatus(selectedReport).list.map((item: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs text-rose-700 font-medium leading-tight"
                          >
                            • {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span
                        className={`inline-block whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          getAutoStatus(selectedReport).warna
                        }`}
                      >
                        {getAutoStatus(selectedReport).teks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-1 text-xs">Hasil Kegiatan</p>
                  <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-200/80 whitespace-pre-wrap h-24 overflow-y-auto">
                    {selectedReport.hasilKegiatan || '-'}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1 text-xs">Kendala</p>
                  <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-200/80 whitespace-pre-wrap h-24 overflow-y-auto">
                    {selectedReport.kendala || '-'}
                  </div>
                </div>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                    📄 Surat Tugas
                  </p>
                  {selectedReport.suratTugas ? (
                    <a
                      href={`/api/r2/${selectedReport.suratTugas}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline break-all"
                    >
                      {selectedReport.suratTugas.split('/').pop()}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                    📄 Berkas Kegiatan
                  </p>
                  {selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]' ? (
                    <div className="flex flex-col gap-1">
                      {JSON.parse(selectedReport.berkasKegiatan).map((key: string, idx: number) => (
                        <a
                          key={idx}
                          href={`/api/r2/${key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline break-all"
                        >
                          {key.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                    📄 Berkas Tindakan Perbaikan
                  </p>
                  {selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]' ? (
                    <div className="flex flex-col gap-1">
                      {JSON.parse(selectedReport.berkasPerbaikan).map((key: string, idx: number) => (
                        <a
                          key={idx}
                          href={`/api/r2/${key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline break-all"
                        >
                          {key.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                  <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-xs">
                    📄 Pemeriksaan Tindakan Perbaikan
                  </p>
                  {selectedReport.berkasPemeriksaanTindakanPerbaikan ? (
                    <a
                      href={`/api/r2/${selectedReport.berkasPemeriksaanTindakanPerbaikan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline break-all"
                    >
                      {selectedReport.berkasPemeriksaanTindakanPerbaikan.split('/').pop()}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>
              </div>

              {/* DOKUMENTASI FOTO KEGIATAN + LIGHTBOX */}
              {selectedReport.fotoKegiatan && selectedReport.fotoKegiatan !== '[]' && (
                <>
                  <hr className="border-slate-100" />
                  <div>
                    <p className="font-bold text-slate-800 mb-3 uppercase tracking-wide border-l-4 border-indigo-600 pl-3 text-xs">
                      Dokumentasi Foto Kegiatan (Klik untuk Perbesar)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {JSON.parse(selectedReport.fotoKegiatan).map((key: string, idx: number) => {
                        const url = `/api/r2/${key}`;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLightboxUrl(url)}
                            className="block rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer group"
                          >
                            <img
                              src={url}
                              alt={`Dokumentasi ${idx + 1}`}
                              className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <hr className="border-slate-100" />
              <div className="mt-4">
                <p className="font-bold text-slate-800 mb-5 uppercase tracking-wide border-l-4 border-indigo-600 pl-3 text-xs">
                  V. Tanda Tangan Pelaksana
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {parsePetugas(selectedReport.petugasPelaksana).map(
                    (petugas: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-end text-center h-40"
                      >
                        <div className="h-20 w-full flex items-end justify-center mb-2">
                          <img
                            src={`/tanda-tangan/${petugas.namaFileTtd}`}
                            alt={`TTD ${petugas.nama}`}
                            className="max-h-20 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="w-full border-t-2 border-slate-800 mb-2"></div>
                        <p className="font-bold text-sm text-slate-800">{petugas.nama}</p>
                        <p className="text-xs text-slate-600">{petugas.jabatan}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 text-right">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOTO */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-[60] p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl p-3"
          >
            <div className="flex items-center justify-between px-2 pb-2 text-xs text-slate-300">
              <span>Pratinjau Dokumentasi Foto</span>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
              >
                Tutup (Esc)
              </button>
            </div>
            <img
              src={lightboxUrl}
              alt="Pratinjau foto besar"
              className="w-full max-h-[78vh] object-contain rounded-xl bg-black"
            />
          </div>
        </div>
      )}
    </Layout>
  );
}