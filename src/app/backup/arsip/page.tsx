'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function ArsipBackupPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Accordion
  const [openYears, setOpenYears] = useState<string[]>([]);
  const [openMonths, setOpenMonths] = useState<string[]>([]);
  const [openJenis, setOpenJenis] = useState<string[]>([]);
  const [openDetails, setOpenDetails] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setReports(data.data);
        setLoading(false);
      });
  }, []);

  const toggle = (id: string, state: string[], setState: (val: string[]) => void) => {
    if (state.includes(id)) setState(state.filter(item => item !== id));
    else setState([...state, id]);
  };

  // Mengelompokkan data: Tahun -> Bulan -> Jenis Kegiatan -> Detail
  const groupedData = reports.reduce((acc, report) => {
    const date = report.tanggal ? new Date(report.tanggal) : new Date(report.createdAt);
    const year = date.getFullYear().toString();
    const month = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const jenisParts = (report.jenisKegiatan || '').split(' ');
    const jenisKegiatan = jenisParts.slice(1).join(' ') || jenisParts[0] || 'Lainnya';

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = {};
    if (!acc[year][month][jenisKegiatan]) acc[year][month][jenisKegiatan] = [];
    
    acc[year][month][jenisKegiatan].push(report);
    return acc;
  }, {} as Record<string, Record<string, Record<string, any[]>>>);

  const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/backup" className="text-blue-600 hover:underline text-sm mb-2 inline-block">&larr; Kembali ke Backup</Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Arsip Backup Data</h1>
        <p className="text-slate-500 mt-1">Telusuri data backup berdasarkan Tahun, Bulan, Jenis Kegiatan, dan Detail.</p>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Memuat data...</div>
      ) : sortedYears.length === 0 ? (
        <div className="text-center p-8 text-slate-500">Belum ada data backup.</div>
      ) : (
        <div className="space-y-3">
          {sortedYears.map(year => (
            <div key={year} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => toggle(year, openYears, setOpenYears)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 font-bold text-lg text-slate-800">
                <span>📅 Tahun {year}</span>
                <span>{openYears.includes(year) ? '▼' : '▶'}</span>
              </button>

              {openYears.includes(year) && (
                <div className="p-4 space-y-2 bg-white">
                  {Object.keys(groupedData[year]).map(month => (
                    <div key={month} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button onClick={() => toggle(`${year}-${month}`, openMonths, setOpenMonths)} className="w-full flex justify-between items-center p-3 bg-white hover:bg-blue-50 font-semibold text-slate-700">
                        <span>📁 {month}</span>
                        <span>{openMonths.includes(`${year}-${month}`) ? '▼' : '▶'}</span>
                      </button>

                      {openMonths.includes(`${year}-${month}`) && (
                        <div className="p-3 space-y-2 bg-slate-50">
                          {Object.keys(groupedData[year][month]).map(jenis => (
                            <div key={jenis} className="border border-slate-200 rounded-lg overflow-hidden">
                              <button onClick={() => toggle(`${year}-${month}-${jenis}`, openJenis, setOpenJenis)} className="w-full flex justify-between items-center p-2.5 bg-white hover:bg-emerald-50 font-medium text-slate-700">
                                <span>📂 {jenis}</span>
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{groupedData[year][month][jenis].length} Laporan</span>
                              </button>

                              {openJenis.includes(`${year}-${month}-${jenis}`) && (
                                <div className="p-2 space-y-1 bg-white">
                                  {groupedData[year][month][jenis].map((report: any) => (
                                    <div key={report.id} className="border border-slate-100 rounded-md">
                                      <button onClick={() => toggle(`detail-${report.id}`, openDetails, setOpenDetails)} className="w-full flex justify-between items-center p-2 text-sm text-slate-600 hover:bg-slate-50">
                                        <span>📄 {report.namaPerusahaan || 'Tanpa Nama'} - {new Date(report.tanggal).toLocaleDateString('id-ID')}</span>
                                        <span>{openDetails.includes(`detail-${report.id}`) ? '▼' : '▶'}</span>
                                      </button>

                                      {openDetails.includes(`detail-${report.id}`) && (
                                        <div className="p-3 bg-slate-50 text-xs space-y-2 border-t border-slate-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {report.suratTugas && (
                                              <a href={`/api/r2/${report.suratTugas}`} target="_blank" className="text-blue-600 hover:underline block">📎 Surat Tugas</a>
                                            )}
                                            {report.berkasKegiatan && report.berkasKegiatan !== '[]' && JSON.parse(report.berkasKegiatan).map((key: string, i: number) => (
                                              <a key={i} href={`/api/r2/${key}`} target="_blank" className="text-blue-600 hover:underline block">📎 Berkas Kegiatan {i+1}</a>
                                            ))}
                                            {report.berkasPerbaikan && report.berkasPerbaikan !== '[]' && JSON.parse(report.berkasPerbaikan).map((key: string, i: number) => (
                                              <a key={i} href={`/api/r2/${key}`} target="_blank" className="text-blue-600 hover:underline block">📎 Berkas Perbaikan {i+1}</a>
                                            ))}
                                            {report.berkasPemeriksaanTindakanPerbaikan && (
                                              <a href={`/api/r2/${report.berkasPemeriksaanTindakanPerbaikan}`} target="_blank" className="text-blue-600 hover:underline block">📎 Pemeriksaan Perbaikan</a>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}