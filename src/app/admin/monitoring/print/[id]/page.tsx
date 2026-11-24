'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TombolCetak from '@/components/TombolCetak';

export default function PrintMonitoringPage() {
  const params = useParams();
  const id = Number(params.id);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/reports', { cache: 'no-store' });
        const data = await res.json();
        if (data.status === 'success') {
          const found = data.data.find((r: any) => Number(r.id) === id);
          setReport(found || null);
        }
      } catch (error) {
        console.error('Gagal mengambil data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">
        Memuat data laporan monitoring...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-rose-600 text-sm font-semibold">
        Laporan tidak ditemukan.
      </div>
    );
  }

  const formatTanggal = (tgl: string) => {
    if (!tgl) return '-';
    const d = new Date(tgl);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatNamaPerusahaan = (nama: string) => {
    if (!nama) return 'NAMA PERUSAHAAN BELUM DIISI';
    const namaUpper = nama.toUpperCase();
    if (namaUpper.endsWith(', PT')) return 'PT. ' + nama.slice(0, -4).trim();
    if (namaUpper.endsWith(' PT')) return 'PT. ' + nama.slice(0, -3).trim();
    if (namaUpper.endsWith(', CV')) return 'CV. ' + nama.slice(0, -4).trim();
    if (namaUpper.endsWith(' CV')) return 'CV. ' + nama.slice(0, -3).trim();
    return nama;
  };

  const parseFiles = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      if (value === '[]') return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
      } catch {
        return [value];
      }
    }
    return [];
  };

  const suratTugasFiles = parseFiles(report.suratTugas);
  const berkasKegiatanFiles = parseFiles(report.berkasKegiatan);
  const berkasPerbaikanFiles = parseFiles(report.berkasPerbaikan);
  const pemeriksaanFiles = parseFiles(report.berkasPemeriksaanTindakanPerbaikan);
  const fotoKegiatan = parseFiles(report.fotoKegiatan);

  const hasSuratTugas = suratTugasFiles.length > 0;
  const hasBerkasKegiatan = berkasKegiatanFiles.length > 0;
  const hasBerkasPerbaikan = berkasPerbaikanFiles.length > 0;
  const hasPemeriksaan = pemeriksaanFiles.length > 0;

  const berkasItems = [
    {
      no: 1,
      title: 'Surat Tugas',
      files: suratTugasFiles,
      ok: hasSuratTugas,
    },
    {
      no: 2,
      title: 'Berkas Kegiatan',
      files: berkasKegiatanFiles,
      ok: hasBerkasKegiatan,
    },
    {
      no: 3,
      title: 'Berkas Tindakan Perbaikan',
      files: berkasPerbaikanFiles,
      ok: hasBerkasPerbaikan,
    },
    {
      no: 4,
      title: 'Pemeriksaan Tindakan Perbaikan',
      files: pemeriksaanFiles,
      ok: hasPemeriksaan,
    },
  ];

  const totalFileTerisi = berkasItems.filter((item) => item.ok).length;
  const isLengkap = totalFileTerisi === 4;

  const namaKegiatanBersih = (report.jenisKegiatan || '-')
    .replace(/Survailen/gi, 'Surveilan')
    .trim();

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

  const petugasList = parsePetugas(report.petugasPelaksana);

  return (
    <div className="min-h-screen bg-slate-200/80 py-8 print:bg-white print:py-0 font-sans text-slate-900">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Tombol cetak disembunyikan saat print */}
      <div className="print:hidden mb-4">
        <TombolCetak />
      </div>

      {/* Kertas Putih Utama (Ukuran A4) */}
      <div className="mx-auto w-full max-w-[21cm] bg-white shadow-xl print:shadow-none print:max-w-none p-7 sm:p-10 print:p-0 border border-slate-200/80 print:border-0 rounded-xl print:rounded-none">
        {/* HEADER ATAS (KOP SURAT) */}
        <header className="text-center pb-5 mb-6 border-b-2 border-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Balai Pengendalian dan Pengujian Mutu Hasil Kelautan dan Perikanan
          </p>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900 mt-1">
            Laporan Monitoring Sertifikasi
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
            BPPMHKP Denpasar
          </p>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-extrabold uppercase text-slate-900 tracking-tight">
              {formatNamaPerusahaan(report.namaPerusahaan)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl mx-auto leading-relaxed">
              {report.alamatPerusahaan || 'Alamat belum diisi'}
            </p>
          </div>
        </header>

        <div className="space-y-6 text-sm">
          {/* I. INFORMASI UMUM */}
          <section>
            <h2 className="font-bold bg-slate-100 px-3 py-2 mb-3 border-l-4 border-slate-900 uppercase text-xs tracking-wider text-slate-900">
              I. Informasi Umum
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-2">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Nama Kegiatan
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">{namaKegiatanBersih}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Nomor Surat Tugas
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">{report.noSurat || '-'}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Pelaksana
                  </p>
                  {petugasList.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {petugasList.map((p: any, i: number) => (
                        <li key={i} className="text-xs sm:text-sm text-slate-800 leading-snug">
                          <span className="font-bold text-slate-900">{p.nama}</span>{' '}
                          <span className="text-slate-500 text-xs">({p.jabatan})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 mt-0.5">-</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tanggal Pelaksanaan
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5 tabular-nums">
                    {formatTanggal(report.tanggal)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Status Kelengkapan
                  </p>
                  <div className="mt-1">
                    {isLengkap ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-xs rounded-md font-bold tabular-nums">
                        ✓ Berkas Lengkap (4/4)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs rounded-md font-bold tabular-nums">
                        ! Belum Lengkap ({totalFileTerisi}/4)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* II. KELENGKAPAN BERKAS */}
          <section>
            <h2 className="font-bold bg-slate-100 px-3 py-2 mb-3 border-l-4 border-slate-900 uppercase text-xs tracking-wider text-slate-900">
              II. Kelengkapan Berkas
            </h2>

            <div className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-lg overflow-hidden">
              {berkasItems.map((item) => (
                <div
                  key={item.no}
                  className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white"
                >
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    {item.no}. {item.title}
                  </div>

                  {item.ok ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md w-max tabular-nums">
                      ✓ Terlampir ({item.files.length} file)
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-slate-400 italic">
                      — Tidak ada
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* III. DOKUMENTASI FOTO */}
          <section>
            <h2 className="font-bold bg-slate-100 px-3 py-2 mb-3 border-l-4 border-slate-900 uppercase text-xs tracking-wider text-slate-900">
              III. Dokumentasi Foto Kegiatan
            </h2>

            <div className="px-1">
              {fotoKegiatan.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {fotoKegiatan.map((key: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center break-inside-avoid"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <div className="w-full h-40 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 p-1.5">
                        <img
                          src={`/api/r2/${key}`}
                          alt={`Foto Kegiatan ${idx + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }}
                        />
                      </div>
                      <p className="text-xs italic text-slate-600 mt-1.5">
                        Foto Kegiatan {idx + 1}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm italic text-slate-500 py-2">
                  Tidak ada foto kegiatan yang dilampirkan.
                </p>
              )}
            </div>
          </section>

          {/* IV. TANDA TANGAN PELAKSANA */}
          <section
            className="pt-4 break-inside-avoid"
            style={{ pageBreakInside: 'avoid' }}
          >
            <h2 className="font-bold bg-slate-100 px-3 py-2 mb-6 border-l-4 border-slate-900 uppercase text-xs tracking-wider text-slate-900">
              IV. Tanda Tangan Pelaksana
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-2">
              {petugasList.map((petugas: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end text-center min-h-[150px]"
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
                  <div className="w-full border-t border-slate-900 mb-2" />
                  <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {petugas.nama}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{petugas.jabatan}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}