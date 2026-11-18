'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// Tipe data untuk pegawai
type Pegawai = {
  id: number;
  nama_pegawai: string;
  email_dummy: string;
};

export default function DataPegawaiPage() {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalPegawai, setTotalPegawai] = useState(0);
  const [dbError, setDbError] = useState(''); // State baru untuk menampilkan error

  // Inisialisasi Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fungsi untuk mengambil total data
  const fetchTotal = async () => {
    const { data, error } = await supabase
      .from('data_penelitian_pegawai')
      .select('email_dummy');
      
    if (error) {
      console.error("Gagal ambil total:", error);
      setDbError(`Gagal mengambil data: ${error.message}. Pastikan RLS sudah diatur.`);
      return;
    }

    if (data) {
      const uniqueEmails = new Set(data.map(item => item.email_dummy));
      setTotalPegawai(uniqueEmails.size);
    }
  };

  // Mengambil data dari database dengan pencarian
  const fetchPegawai = async (query: string) => {
    setLoading(true);
    setDbError('');
    let dbQuery = supabase.from('data_penelitian_pegawai').select('id, nama_pegawai, email_dummy');

    if (query) {
      dbQuery = dbQuery.ilike('nama_pegawai', `%${query}%`).or(`email_dummy.ilike.%${query}%`);
    }

    // Ambil data dengan urutan ID
    const { data, error } = await dbQuery.order('id', { ascending: true }).limit(100); 

    if (error) {
      console.error("Gagal ambil pegawai:", error);
      setDbError(`Error Database: ${error.message}`);
      setPegawai([]);
    } else if (data) {
      // Filter data ganda
      const uniquePegawai = data.filter((v, i, a) => a.findIndex(v2 => (v2.email_dummy === v.email_dummy)) === i);
      setPegawai(uniquePegawai.slice(0, 50));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTotal();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPegawai(searchTerm);
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Email ${text} berhasil disalin!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Halaman */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Direktori Pegawai</h1>
            <p className="text-slate-500 mt-1">Cari alamat email pegawai yang terdaftar di sistem MONICA IMUT.</p>
          </div>
          <Link href="/admin/admin-monitoring-dashboard" className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Kembali
          </Link>
        </div>

        {/* TAMPILAN ERROR DATABASE */}
        {dbError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 shadow-sm">
            <p className="font-bold">Terjadi Masalah Koneksi</p>
            <p className="text-sm">{dbError}</p>
          </div>
        )}

        {/* Kartu Ringkasan & Pencarian */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Kartu Total */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <p className="text-blue-100 font-semibold mb-1">Total Pegawai Terdaftar</p>
            <h2 className="text-4xl font-extrabold">{totalPegawai} <span className="text-lg font-medium text-blue-200">Orang</span></h2>
          </div>
          
          {/* Kotak Pencarian */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
             <label className="block text-sm font-bold text-slate-700 mb-3">Pencarian Cepat</label>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="Ketik nama atau email pegawai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-200 text-sm">
                  <th className="p-4 font-semibold w-16 text-center">No</th>
                  <th className="p-4 font-semibold">Nama Lengkap & Gelar</th>
                  <th className="p-4 font-semibold">Email Terdaftar</th>
                  <th className="p-4 font-semibold w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p>Mencari data...</p>
                      </div>
                    </td>
                  </tr>
                ) : pegawai.length > 0 ? (
                  pegawai.map((item, index) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="p-4 font-semibold text-slate-800">{item.nama_pegawai}</td>
                      <td className="p-4">
                        <span className="text-slate-600 font-mono text-sm">{item.email_dummy}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => copyToClipboard(item.email_dummy)}
                          className="bg-slate-100 group-hover:bg-blue-600 text-slate-500 group-hover:text-white p-2 rounded-lg transition-all duration-200"
                          title="Salin Email"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <p className="font-semibold text-slate-600">Data tidak ditemukan</p>
                        <p className="text-sm">Coba gunakan kata kunci pencarian lain.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}