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
  
  // STATE UNTUK FILE BARU YANG DIUPLOAD
  const [fileSuratTugas, setFileSuratTugas] = useState<File[]>([]);
  const [fileBerkasKegiatan, setFileBerkasKegiatan] = useState<File[]>([]);
  const [fileBerkasPerbaikan, setFileBerkasPerbaikan] = useState<File[]>([]);
  const [filePemeriksaan, setFilePemeriksaan] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // STATE UNTUK FILE LAMA YANG DIHAPUS
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

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
      // Jangan set loading true di sini agar tabel tidak berkedip saat update background
      const res = await fetch('/api/reports', { cache: 'no-store' }); 
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

  const getAutoStatus = (report: any) => {
    const missingFiles: string[] = [];

    if (!report.suratTugas || report.suratTugas === '[]') {
      missingFiles.push('Surat Tugas');
    }
    if (!report.berkasKegiatan || report.berkasKegiatan === '[]') {
      missingFiles.push('Berkas Kegiatan');
    }
    if (!report.berkasPerbaikan || report.berkasPerbaikan === '[]') {
      missingFiles.push('Berkas Tindakan Perbaikan');
    }
    if (!report.berkasPemeriksaanTindakanPerbaikan || report.berkasPemeriksaanTindakanPerbaikan === '[]') {
      missingFiles.push('Pemeriksaan Tindakan Perbaikan');
    }

    if (missingFiles.length === 0) {
      return { teks: 'Berkas Lengkap', warna: 'bg-emerald-500 text-white', isList: false, list: [] };
    } 
    
    return { 
      teks: 'Belum upload berkas', 
      warna: 'bg-red-500 text-white', 
      isList: true, 
      list: missingFiles 
    };
  };

  const filteredReports = reports.filter((report) => {
    const matchSearch = 
      (report.jenisKegiatan && report.jenisKegiatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.namaPerusahaan && report.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchStatus = true;
    if (statusFilter !== 'Semua Status') {
      if (statusFilter === 'Berkas Lengkap') {
        matchStatus = getAutoStatus(report).teks === 'Berkas Lengkap';
      } else if (statusFilter === 'Belum upload berkas') {
        matchStatus = getAutoStatus(report).isList === true;
      }
    }

    return matchSearch && matchStatus;
  });

  const handleEditClick = (report: any) => {
    setSelectedReport(report);
    setFileSuratTugas([]);
    setFileBerkasKegiatan([]);
    setFileBerkasPerbaikan([]);
    setFilePemeriksaan([]);
    setFilesToDelete([]); 
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
        
        // Optimistic Delete: Langsung hapus dari tampilan
        setReports((prev) => prev.filter(r => r.id !== reportToDelete.id));
        
        // Sinkronisasi background
        fetchReports();
      } else {
        const errorData = await res.json();
        console.error("Pesan dari API:", errorData);
        showToast(errorData.message || errorData.error || 'Gagal menghapus laporan.', 'error');
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
    
    // Kirim file baru
    if (fileSuratTugas.length > 0) fileSuratTugas.forEach(file => formData.append('suratTugas', file));
    if (fileBerkasKegiatan.length > 0) fileBerkasKegiatan.forEach(file => formData.append('berkasKegiatan', file));
    if (fileBerkasPerbaikan.length > 0) fileBerkasPerbaikan.forEach(file => formData.append('berkasPerbaikan', file));
    if (filePemeriksaan.length > 0) filePemeriksaan.forEach(file => formData.append('berkasPemeriksaanTindakanPerbaikan', file));

    if (filesToDelete.length > 0) {
      formData.append('filesToDelete', JSON.stringify(filesToDelete));
    }

    // Data lama (sebagai fallback tambahan, walaupun API baru kita sudah pintar)
    if (selectedReport.suratTugas) formData.append('oldSuratTugas', selectedReport.suratTugas);
    if (selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]') formData.append('oldBerkasKegiatan', selectedReport.berkasKegiatan);
    if (selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]') formData.append('oldBerkasPerbaikan', selectedReport.berkasPerbaikan);
    if (selectedReport.berkasPemeriksaanTindakanPerbaikan) formData.append('oldBerkasPemeriksaan', selectedReport.berkasPemeriksaanTindakanPerbaikan);

    try {
      const res = await fetch(`/api/monitoring/${selectedReport.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        showToast('Berkas berhasil di-upload!', 'success');
        
        // --- OPTIMISTIC UI ---
        // 1. Buat salinan data laporan
        const updatedReport = { ...selectedReport };
        
        // 2. Update state secara lokal berdasarkan file yang baru di-upload
        // (Cukup isi dengan string dummy agar dianggap "ada file")
        if (fileSuratTugas.length > 0) updatedReport.suratTugas = 'new-file-uploaded.pdf';
        if (fileBerkasKegiatan.length > 0) updatedReport.berkasKegiatan = '["new-file-uploaded.pdf"]';
        if (fileBerkasPerbaikan.length > 0) updatedReport.berkasPerbaikan = '["new-file-uploaded.pdf"]';
        if (filePemeriksaan.length > 0) updatedReport.berkasPemeriksaanTindakanPerbaikan = 'new-file-uploaded.pdf';

        // 3. Update state utama (tabel langsung berubah saat itu juga!)
        setReports((prev) => 
          prev.map((r) => r.id === selectedReport.id ? updatedReport : r)
        );

        // 4. Ambil data asli dari DB di belakang layar (Sinkronisasi)
        setTimeout(() => fetchReports(), 1000); 

      } else {
        const errorData = await res.json();
        console.error("Pesan dari API:", errorData);
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

      return { 
        nama: namaLengkap, 
        jabatan, 
        namaFileTtd: `${namaFile}.png` 
      };
    });
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
            <option value="Belum upload berkas">Belum upload berkas (Ada yang kosong)</option>
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
                        {autoStatus.isList ? (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block whitespace-nowrap text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-md w-max ${autoStatus.warna}`}>
                              Belum upload:
                            </span>
                            {autoStatus.list.map((item, i) => (
                              <span key={i} className="text-[11px] text-red-600 font-medium leading-tight">
                                • {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={`inline-block whitespace-nowrap text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-md ${autoStatus.warna}`}>
                            {autoStatus.teks}
                          </span>
                        )}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Upload Berkas</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <form id="editForm" onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kegiatan</label>
                  <input type="text" value={selectedReport.jenisKegiatan} disabled className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                </div>
                <hr className="border-slate-200" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. SURAT TUGAS */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">📄 Surat Tugas</p>
                    {selectedReport.suratTugas && !filesToDelete.includes(selectedReport.suratTugas) && (
                      <div className="mb-2 flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
                        <a href={`/api/r2/${selectedReport.suratTugas}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[80%]">{selectedReport.suratTugas.split('/').pop()}</a>
                        <button type="button" onClick={() => setFilesToDelete([...filesToDelete, selectedReport.suratTugas])} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded" title="Hapus file ini">✕</button>
                      </div>
                    )}
                    {fileSuratTugas.length > 0 && fileSuratTugas.map((file, idx) => (
                      <div key={idx} className="mb-2 flex items-center justify-between bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        <span className="text-xs text-emerald-700 truncate max-w-[80%]">{file.name}</span>
                        <button type="button" onClick={() => setFileSuratTugas(fileSuratTugas.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                      </div>
                    ))}
                    <input type="file" onChange={(e) => { if (e.target.files && e.target.files[0]) { setFileSuratTugas([...fileSuratTugas, e.target.files[0]]); e.target.value = ''; } }} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 border border-slate-300 rounded-md cursor-pointer bg-white" />
                  </div>

                  {/* 2. BERKAS KEGIATAN */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">📄 Berkas Kegiatan</p>
                    {selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]' && JSON.parse(selectedReport.berkasKegiatan).map((key: string, idx: number) => {
                      if (filesToDelete.includes(key)) return null;
                      return (
                        <div key={idx} className="mb-2 flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
                          <a href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[80%]">{key.split('/').pop()}</a>
                          <button type="button" onClick={() => setFilesToDelete([...filesToDelete, key])} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                        </div>
                      );
                    })}
                    {fileBerkasKegiatan.length > 0 && fileBerkasKegiatan.map((file, idx) => (
                      <div key={idx} className="mb-2 flex items-center justify-between bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        <span className="text-xs text-emerald-700 truncate max-w-[80%]">{file.name}</span>
                        <button type="button" onClick={() => setFileBerkasKegiatan(fileBerkasKegiatan.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                      </div>
                    ))}
                    <input type="file" multiple onChange={(e) => { if (e.target.files) { const newFiles = Array.from(e.target.files); setFileBerkasKegiatan([...fileBerkasKegiatan, ...newFiles]); e.target.value = ''; } }} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 border border-slate-300 rounded-md cursor-pointer bg-white" />
                  </div>

                  {/* 3. BERKAS PERBAIKAN */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">📄 Berkas Tindakan Perbaikan</p>
                    {selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]' && JSON.parse(selectedReport.berkasPerbaikan).map((key: string, idx: number) => {
                      if (filesToDelete.includes(key)) return null;
                      return (
                        <div key={idx} className="mb-2 flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
                          <a href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[80%]">{key.split('/').pop()}</a>
                          <button type="button" onClick={() => setFilesToDelete([...filesToDelete, key])} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                        </div>
                      );
                    })}
                    {fileBerkasPerbaikan.length > 0 && fileBerkasPerbaikan.map((file, idx) => (
                      <div key={idx} className="mb-2 flex items-center justify-between bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        <span className="text-xs text-emerald-700 truncate max-w-[80%]">{file.name}</span>
                        <button type="button" onClick={() => setFileBerkasPerbaikan(fileBerkasPerbaikan.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                      </div>
                    ))}
                    <input type="file" multiple onChange={(e) => { if (e.target.files) { const newFiles = Array.from(e.target.files); setFileBerkasPerbaikan([...fileBerkasPerbaikan, ...newFiles]); e.target.value = ''; } }} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 border border-slate-300 rounded-md cursor-pointer bg-white" />
                  </div>

                  {/* 4. PEMERIKSAAN TINDAKAN PERBAIKAN */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">📄 Pemeriksaan Tindakan Perbaikan</p>
                    {selectedReport.berkasPemeriksaanTindakanPerbaikan && !filesToDelete.includes(selectedReport.berkasPemeriksaanTindakanPerbaikan) && (
                      <div className="mb-2 flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
                        <a href={`/api/r2/${selectedReport.berkasPemeriksaanTindakanPerbaikan}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[80%]">{selectedReport.berkasPemeriksaanTindakanPerbaikan.split('/').pop()}</a>
                        <button type="button" onClick={() => setFilesToDelete([...filesToDelete, selectedReport.berkasPemeriksaanTindakanPerbaikan])} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                      </div>
                    )}
                    {filePemeriksaan.length > 0 && filePemeriksaan.map((file, idx) => (
                      <div key={idx} className="mb-2 flex items-center justify-between bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        <span className="text-xs text-emerald-700 truncate max-w-[80%]">{file.name}</span>
                        <button type="button" onClick={() => setFilePemeriksaan(filePemeriksaan.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">✕</button>
                      </div>
                    ))}
                    <input type="file" multiple onChange={(e) => { if (e.target.files) { const newFiles = Array.from(e.target.files); setFilePemeriksaan([...filePemeriksaan, ...newFiles]); e.target.value = ''; } }} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 border border-slate-300 rounded-md cursor-pointer bg-white" />
                  </div>

                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer">Batal</button>
              <button type="submit" form="editForm" disabled={isUpdating} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50">{isUpdating ? 'Menyimpan...' : 'Upload Berkas'}</button>
            </div>
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
                  <p className="text-xs text-slate-600 mt-1 italic">{selectedReport.alamatPerusahaan || 'Alamat belum diisi'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Jenis Kegiatan</p>
                  <p className="font-bold text-slate-800 text-base">{selectedReport.jenisKegiatan || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Tanggal Pelaksanaan</p>
                  <p className="font-medium text-slate-800">{selectedReport.tanggal ? new Date(selectedReport.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
                
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold">Status Berkas</p>
                  <div className="mt-1">
                    {getAutoStatus(selectedReport).isList ? (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block whitespace-nowrap text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-md w-max ${getAutoStatus(selectedReport).warna}`}>Belum upload:</span>
                        {getAutoStatus(selectedReport).list.map((item: string, i: number) => (
                          <span key={i} className="text-xs text-red-600 font-medium leading-tight">• {item}</span>
                        ))}
                      </div>
                    ) : (
                      <span className={`inline-block whitespace-nowrap text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-md ${getAutoStatus(selectedReport).warna}`}>{getAutoStatus(selectedReport).teks}</span>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Hasil Kegiatan</p>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap h-24 overflow-y-auto">{selectedReport.hasilKegiatan || '-'}</div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Kendala</p>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap h-24 overflow-y-auto">{selectedReport.kendala || '-'}</div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">📄 Surat Tugas</p>
                  {selectedReport.suratTugas ? (
                    <a href={`/api/r2/${selectedReport.suratTugas}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{selectedReport.suratTugas.split('/').pop()}</a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">📄 Berkas Kegiatan</p>
                  {selectedReport.berkasKegiatan && selectedReport.berkasKegiatan !== '[]' ? (
                    <div className="flex flex-col gap-1">
                      {JSON.parse(selectedReport.berkasKegiatan).map((key: string, idx: number) => (
                        <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{key.split('/').pop()}</a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">📄 Berkas Tindakan Perbaikan</p>
                  {selectedReport.berkasPerbaikan && selectedReport.berkasPerbaikan !== '[]' ? (
                    <div className="flex flex-col gap-1">
                      {JSON.parse(selectedReport.berkasPerbaikan).map((key: string, idx: number) => (
                        <a key={idx} href={`/api/r2/${key}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{key.split('/').pop()}</a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">📄 Pemeriksaan Tindakan Perbaikan</p>
                  {selectedReport.berkasPemeriksaanTindakanPerbaikan ? (
                    <a href={`/api/r2/${selectedReport.berkasPemeriksaanTindakanPerbaikan}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{selectedReport.berkasPemeriksaanTindakanPerbaikan.split('/').pop()}</a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada file.</p>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="mt-6">
                <p className="font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 border-slate-800 pl-3">V. Tanda Tangan Pelaksana</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {parsePetugas(selectedReport.petugasPelaksana).map((petugas: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center justify-end text-center h-40">
                      <div className="h-20 w-full flex items-end justify-center mb-2">
                        <img 
                          src={`/tanda-tangan/${petugas.namaFileTtd}`} 
                          alt={`TTD ${petugas.nama}`}
                          className="max-h-20 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="w-full border-t-2 border-slate-800 mb-2"></div>
                      <p className="font-bold text-sm text-slate-800">{petugas.nama}</p>
                      <p className="text-xs text-slate-600">{petugas.jabatan}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isDeleteModalOpen && reportToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Laporan?</h3>
            <p className="text-slate-500 text-sm mb-6">Laporan <strong>{reportToDelete.jenisKegiatan}</strong> akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer">{isDeleting ? 'Menghapus...' : 'Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}