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

  // Inisialisasi Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Mengambil data dari database
  const fetchPegawai = async (query: string) => {
    setLoading(true);
    let dbQuery = supabase.from('data_penelitian_pegawai').select('id, nama_pegawai, email_dummy');

    // Jika ada kata kunci pencarian, filter berdasarkan nama atau email
    if (query) {
      dbQuery = dbQuery.ilike('nama_pegawai', `%${query}%`).or(`email_dummy.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery.limit(50); // Batasi 50 agar tidak lag

    if (!error && data) {
      setPegawai(data);
    }
    setLoading(false);
  };

  // Jalankan pencarian saat pertama kali load atau saat searchTerm berubah (dengan delay)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPegawai(searchTerm);
    }, 500); // 500ms delay agar tidak spam request ke database

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Cari Data Pegawai</h1>
            <p className="text-slate-500 text-sm mt-1">Gunakan fitur ini jika pegawai lupa alamat emailnya.</p>
          </div>
          <Link href="/admin/monitoring" className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold transition-all">
            &larr; Kembali
          </Link>
        </div>

        {/* Kolom Pencarian */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ketik nama pegawai (contoh: Dedy / Abdul)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Hasil Pencarian */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm">
                <th className="p-4 font-bold border-b">No</th>
                <th className="p-4 font-bold border-b">Nama Pegawai</th>
                <th className="p-4 font-bold border-b">Email Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">Mencari data...</td>
                </tr>
              ) : pegawai.length > 0 ? (
                pegawai.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-4 border-b text-slate-500">{index + 1}</td>
                    <td className="p-4 border-b font-medium text-slate-800">{item.nama_pegawai}</td>
                    <td className="p-4 border-b">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {item.email_dummy}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Data tidak ditemukan. Coba kata kunci lain.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}