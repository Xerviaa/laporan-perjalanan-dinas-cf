'use client';

// Trigger redeploy untuk monitoring page
import { useEffect, useState } from 'react';

// ... sisa kode ...
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function MonitoringPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

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

  // Filter berdasarkan pencarian & status
  const filteredReports = reports.filter((report) => {
    const matchSearch = 
      (report.jenisKegiatan && report.jenisKegiatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.namaPerusahaan && report.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchStatus = true;
    if (statusFilter !== 'Semua Status') {
      matchStatus = report.statusMonitoring === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-md">Selesai</span>;
      case 'Menunggu tindakan perbaikan':
        return <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-md">Menunggu tindakan perbaikan</span>;
      case 'Berkas belum upload':
      default:
        return <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md">Berkas belum upload</span>;
    }
  };

  return (
    <Layout>
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
            <option value="Berkas belum upload">Berkas belum upload</option>
            <option value="Menunggu tindakan perbaikan">Menunggu tindakan perbaikan</option>
            <option value="Selesai">Selesai</option>
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
                <th className="px-4 py-4">Tanggal Pelaksanaan</th>
                <th className="px-4 py-4">Pelaksana/Petugas</th>
                <th className="px-4 py-4">Jenis Sertifikasi</th>
                <th className="px-4 py-4">Status</th>
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
                  // Ambil nama petugas saja (tanpa peran)
                  const listPetugas = report.petugasPelaksana 
                    ? report.petugasPelaksana.split('|').map((p: string) => p.split('(')[0].trim()).join(', ') 
                    : '-';

                  return (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-center font-medium text-slate-700">{index + 1}</td>
                      <td className="px-4 py-4 text-slate-700 font-medium">
                        {report.jenisKegiatan?.split(' - ')[0] || report.jenisKegiatan}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {report.tanggal ? new Date(report.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-4 text-slate-600 max-w-[200px] truncate" title={listPetugas}>
                        {listPetugas}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {report.jenisKegiatan?.split(' - ').pop() || '-'}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(report.statusMonitoring || 'Berkas belum upload')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button title="Lihat Detail" className="p-1.5 bg-cyan-400 text-white rounded hover:bg-cyan-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button title="Edit" className="p-1.5 bg-yellow-400 text-white rounded hover:bg-yellow-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button title="Hapus" className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </button>
                          <button title="Print" className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          </button>
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
    </Layout>
  );
}