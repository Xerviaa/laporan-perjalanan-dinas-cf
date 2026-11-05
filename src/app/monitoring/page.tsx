'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function MonitoringPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  // STATE UNTUK MODAL EDIT
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [berkasKegiatan, setBerkasKegiatan] = useState<File[]>([]);
  const [berkasPerbaikan, setBerkasPerbaikan] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // STATE UNTUK MODAL VIEW DETAIL
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // STATE UNTUK MODAL HAPUS
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // STATE UNTUK TOAST NOTIFIKASI
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.status === 'success') {
        setReports(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi menentukan status otomatis
  const getAutoStatus = (report: any) => {
    const hasBerkasKegiatan = report.berkasKegiatan && report.berkasKegiatan !== '[]';
    const hasBerkasPerbaikan = report.berkasPerbaikan && report.berkasPerbaikan !== '[]';

    if (hasBerkasKegiatan && hasBerkasPerbaikan) {
      return { teks: 'Berkas Lengkap', warna: 'bg-emerald-500 text-white' };
    } else if (hasBerkasKegiatan && !hasBerkasPerbaikan) {
      return { teks: 'Belum upload berkas perbaikan', warna: 'bg-red-500 text-white' };
    } else if (!hasBerkasKegiatan && hasBerkasPerbaikan) {
      return { teks: 'Belum upload berkas kegiatan', warna: 'bg-red-500 text-white' };
    } else {
      return { teks: 'Belum upload berkas', warna: 'bg-red-500 text-white' };
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchSearch = 
      (report.jenisKegiatan && report.jenisKegiatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.namaPerusahaan && report.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchStatus = true;
    if (statusFilter !== 'Semua Status') {
      matchStatus = getAutoStatus(report).teks === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  const handleEditClick = (report: any) => {
    setSelectedReport(report);
    setBerkasKegiatan([]);
    setBerkasPerbaikan([]);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (report: any) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (report: any) => {
    setReportToDelete(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        showToast('Laporan berhasil dihapus!', 'success');
        fetchReports();
      } else {
        showToast('Gagal menghapus laporan.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    
    setIsUpdating(true);
    const formData = new FormData();
    
    berkasKegiatan.forEach(file => formData.append('berkasKegiatan', file));
    berkasPerbaikan.forEach(file => formData.append('berkasPerbaikan', file));

    try {
      const res = await fetch(`/api/monitoring/${selectedReport.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        showToast('Berkas berhasil di-upload!', 'success');
        fetchReports();
      } else {
        showToast('Gagal meng-upload berkas.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Layout>
      {/* TOAST NOTIFIKASI */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 animate-in slide-in-from-top-4 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : 'bg-white border-red-500 text-slate-800'
        }`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
            <p className="text-xs text-slate-500">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Monitoring Sertifikasi</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Cari kegiatan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 bg-white" 
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Berkas Lengkap">Berkas Lengkap</option>
            <option value="Belum upload berkas">Belum upload berkas</option>
            <option value="Belum upload berkas kegiatan">Belum upload berkas kegiatan</option>
            <option value="Belum upload berkas perbaikan">Belum upload berkas perbaikan</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-4 text-center">No.</th>
                <th className="px-4 py-4">Nama Kegiatan</th>
                <th className="px-4 py-4">Tanggal</th>
                <th className="px-4 py-4">Pelaksana</th>
                <th className="px-4 py-4">Jenis</th>
                <th className="px-4 py-4 min-w-[180px]">Status Berkas</th>
                <th className="px-4 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Tidak ada data monitoring yang ditemukan.</td></tr>
              ) : (
                filteredReports.map((report, index) => {
                  const kegiatanArray = report.jenisKegiatan ? report.jenisKegiatan.split(' ') : [];
                  const namaKegiatan = kegiatanArray.length > 0 ? kegiatanArray[0] : '-';
                  const jenisSertifikasi = kegiatanArray.length > 1 ? kegiatanArray.slice(1).join(' ') : '-';
                  const autoStatus = getAutoStatus(report);

                  return (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-center font-medium text-slate-700">{index + 1}</td>
                      <td className="px-4 py-4 text-slate-700 font-medium capitalize">{namaKegiatan}</td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                        {report.tanggal ? new Date(report.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-600 align-top">
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
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{jenisSertifikasi}</td>
                      
                      <td className="px-4 py-4">
                        <span className={`inline-block whitespace-nowrap text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-md ${autoStatus.warna}`}>
                          {autoStatus.teks}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleViewClick(report)} title="Lihat Detail" className="p-1.5 bg-cyan-400 text-white rounded hover:bg-cyan-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button onClick={() => handleEditClick(report)} title="Upload Berkas" className="p-1.5 bg-yellow-400 text-white rounded hover:bg-yellow-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteClick(report)} 
                            title="Hapus Laporan" 
                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </button>
                          
                          {/* TOMBOL PRINT DIARAHKAN KE HALAMAN BARU */}
                          <a 
                            href={`/monitoring/print/${report.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Cetak Laporan Monitoring" 
                            className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT (UPLOAD BERKAS) */}
      {isEditModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Upload Berkas</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kegiatan</label>
                <input type="text" value={selectedReport.jenisKegiatan} disabled className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Berkas Kegiatan Tersedia</label>
                {selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]' ? (
                  <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border border-slate-200 max-h-24 overflow-y-auto">
                    {JSON.parse(selectedReport.berkasKegiatan).map((key: string, idx: number) => (
                      <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                        📄 {key.split('-').pop()}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada berkas kegiatan.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Berkas Perbaikan Tersedia</label>
                {selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]' ? (
                  <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border border-slate-200 max-h-24 overflow-y-auto">
                    {JSON.parse(selectedReport.berkasPerbaikan).map((key: string, idx: number) => (
                      <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                        📄 {key.split('-').pop()}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada berkas perbaikan.</p>
                )}
              </div>

              <hr className="border-slate-200" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Berkas Kegiatan (Jika belum ada)</label>
                <input 
                  type="file" 
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setBerkasKegiatan(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-lg cursor-pointer bg-white" 
                />
                {berkasKegiatan.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">{berkasKegiatan.length} file dipilih</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Berkas Perbaikan (Jika belum ada)</label>
                <input 
                  type="file" 
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setBerkasPerbaikan(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-lg cursor-pointer bg-white" 
                />
                {berkasPerbaikan.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">{berkasPerbaikan.length} file dipilih</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50">
                  {isUpdating ? 'Menyimpan...' : 'Upload Berkas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW DETAIL */}
      {isViewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Detail Laporan</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Nama Perusahaan</p>
                  <p className="font-bold text-slate-800 text-base">{selectedReport.namaPerusahaan || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Jenis Kegiatan</p>
                  <p className="font-bold text-slate-800 text-base">{selectedReport.jenisKegiatan || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Tanggal Pelaksanaan</p>
                  <p className="font-medium text-slate-800">
                    {selectedReport.tanggal ? new Date(selectedReport.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Status Berkas</p>
                  <div className="mt-1">
                    <span className={`inline-block whitespace-nowrap text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-md ${getAutoStatus(selectedReport).warna}`}>
                      {getAutoStatus(selectedReport).teks}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Hasil Kegiatan</p>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap h-24 overflow-y-auto">
                    {selectedReport.hasilKegiatan || '-'}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Kendala</p>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap h-24 overflow-y-auto">
                    {selectedReport.kendala || '-'}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    Berkas Kegiatan
                  </p>
                  {selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]' ? (
                    <div className="flex flex-col gap-2">
                      {JSON.parse(selectedReport.berkasKegiatan).map((key: string, idx: number) => {
                        const fileName = key.split('-').pop() || key;
                        return (
                          <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            <span className="truncate">{fileName}</span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-2 rounded border border-dashed">Belum ada berkas.</p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Berkas Perbaikan
                  </p>
                  {selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]' ? (
                    <div className="flex flex-col gap-2">
                      {JSON.parse(selectedReport.berkasPerbaikan).map((key: string, idx: number) => {
                        const fileName = key.split('-').pop() || key;
                        return (
                          <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            <span className="truncate">{fileName}</span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-2 rounded border border-dashed">Belum ada berkas perbaikan.</p>
                  )}
                </div>
              </div>
              
              <div>
                  <p className="font-semibold text-slate-700 mb-2">Foto Kegiatan</p>
                  {selectedReport.fotoKegiatan && selectedReport.fotoKegiatan !== '[]' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {JSON.parse(selectedReport.fotoKegiatan).map((key: string, idx: number) => (
                        <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={`/api/r2/${key}`} 
                            alt={`Foto ${idx}`} 
                            className="w-full h-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-2 rounded border border-dashed">Belum ada foto.</p>
                  )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isDeleteModalOpen && reportToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Laporan?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Laporan <strong>{reportToDelete.jenisKegiatan}</strong> akan dihapus permanen.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer">
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}