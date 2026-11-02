'use client';

import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { daftarPegawai } from '@/data/pegawai';
import { daftarPerusahaan } from '@/data/perusahaan';

// --- DATA BERTINGKAT UNTUK JENIS KEGIATAN ---
const jenisKegiatanData: Record<string, Record<string, string[]>> = {
  "Primer": {
    "Inspeksi": ["Inspeksi CPIB Kapal", "Inspeksi CBIB", "Inspeksi CPIB"],
    "Survailen": ["Survailen CPIB Kapal", "Survailen CBIB", "Survailen CPIB"]
  },
  "Pasca": {
    "Inspeksi": ["Inspeksi HACCP", "Inspeksi SKP", "Inspeksi SPDI"],
    "Survailen": ["Survailen HACCP", "Survailen SKP", "Survailen SPDI"],
    "Inpres": ["Inpres"]
  }
};

export default function UploadPage() {
  const [fileDokumen, setFileDokumen] = useState<File | null>(null);
  const [fotoKegiatan, setFotoKegiatan] = useState<File[]>([]);
  const [fotoLokasi, setFotoLokasi] = useState<File[]>([]);
  
  const [pembuatLaporan, setPembuatLaporan] = useState('');
  const [kategori, setKategori] = useState('');
  const [jenis, setJenis] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState('');
  const [isManualPerusahaan, setIsManualPerusahaan] = useState(false);
  const [tanggal, setTanggal] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [petugas, setPetugas] = useState<string[]>(['']); 
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [showPembuatDropdown, setShowPembuatDropdown] = useState(false);
  const [searchPembuat, setSearchPembuat] = useState('');
  const pembuatRef = useRef<HTMLDivElement>(null);

  const [activePetugasIndex, setActivePetugasIndex] = useState<number | null>(null);
  const [searchName, setSearchName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActivePetugasIndex(null);
      }
      if (pembuatRef.current && !pembuatRef.current.contains(event.target as Node)) {
        setShowPembuatDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPembuat = daftarPegawai.filter(nama => 
    nama.toLowerCase().includes(searchPembuat.toLowerCase())
  );

  const filteredPegawai = daftarPegawai.filter(nama => 
    nama.toLowerCase().includes(searchName.toLowerCase())
  );

  const handleSelectPerusahaan = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNama = e.target.value;
    if (selectedNama === 'manual') {
      setIsManualPerusahaan(true);
      setNamaPerusahaan('');
      setAlamatPerusahaan('');
    } else {
      setIsManualPerusahaan(false);
      setNamaPerusahaan(selectedNama);
      const company = daftarPerusahaan.find(c => c.nama === selectedNama);
      if (company) setAlamatPerusahaan(company.alamat);
      else setAlamatPerusahaan('');
    }
  };

  const handleKategoriChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setKategori(e.target.value); setJenis(''); setDetailKegiatan('');
  };

  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setJenis(e.target.value); setDetailKegiatan('');
  };

  const handleAddPetugas = () => {
    if (petugas.length < 10) setPetugas([...petugas, '']);
  };

  const handleRemovePetugas = (index: number) => {
    if (petugas.length > 1) setPetugas(petugas.filter((_, i) => i !== index));
  };

  const handlePetugasChange = (index: number, value: string) => {
    const newPetugas = [...petugas]; newPetugas[index] = value; setPetugas(newPetugas);
  };

  // --- VALIDASI FOTO (MAKS 5MB PER FILE) ---
  const handleFotoKegiatanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) return alert('Maksimal 5 foto kegiatan!');
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        return alert(`File ${file.name} melebihi 5MB!`);
      }
    }
    setFotoKegiatan(files);
  };

  const handleFotoLokasiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) return alert('Maksimal 2 foto lokasi!');
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        return alert(`File ${file.name} melebihi 5MB!`);
      }
    }
    setFotoLokasi(files);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileDokumen) return setStatus('Pilih file dokumen dulu!');
    if (!pembuatLaporan || !kategori || !jenis || !detailKegiatan || !namaPerusahaan || !tanggal || !noSurat) {
      return setStatus('Lengkapi semua data wajib!');
    }

    setIsUploading(true);
    setStatus('Mengunggah dokumen & foto...');

    const fullJenisKegiatan = `${kategori} - ${jenis} - ${detailKegiatan}`;

    const formData = new FormData();
    formData.append('fileDokumen', fileDokumen);
    formData.append('pembuatLaporan', pembuatLaporan);
    formData.append('jenisKegiatan', fullJenisKegiatan);
    formData.append('namaPerusahaan', namaPerusahaan);
    formData.append('alamatPerusahaan', alamatPerusahaan);
    formData.append('tanggal', tanggal);
    formData.append('noSurat', noSurat);
    formData.append('petugasPelaksana', petugas.filter(p => p !== '').join(', '));
    
    fotoKegiatan.forEach(foto => formData.append('fotoKegiatan', foto));
    fotoLokasi.forEach(foto => formData.append('fotoLokasi', foto));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('Upload berhasil!');
        setPembuatLaporan(''); setKategori(''); setJenis(''); setDetailKegiatan('');
        setNamaPerusahaan(''); setAlamatPerusahaan(''); setIsManualPerusahaan(false); 
        setTanggal(''); setNoSurat(''); setPetugas(['']); setFileDokumen(null);
        setFotoKegiatan([]); setFotoLokasi([]);
      } else {
        setStatus(`Gagal: ${data.message}`);
      }
    } catch (error) {
      setStatus('Terjadi kesalahan jaringan.');
    } finally {
      setIsUploading(false);
    }
  };

  const jenisOptions = kategori ? Object.keys(jenisKegiatanData[kategori]) : [];
  const detailOptions = (kategori && jenis) ? jenisKegiatanData[kategori][jenis] : [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Upload Laporan</h1>
        <p className="text-slate-500 mt-2">Unggah dokumen laporan perjalanan dinas beserta dokumentasi.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-3xl p-8">
        {status && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${status.includes('berhasil') ? 'bg-green-50 text-green-700' : status.includes('Gagal') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            {status}
          </div>
        )}
        
        <form onSubmit={handleUpload} className="space-y-6">
          
          {/* NAMA PEMBUAT LAPORAN */}
          <div className="relative z-40" ref={pembuatRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Pembuat Laporan</label>
            <div 
              className={`w-full border p-3 rounded-lg flex justify-between items-center bg-white cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : 'border-slate-300'}`}
              onClick={() => setShowPembuatDropdown(!showPembuatDropdown)}
            >
              <span className={pembuatLaporan ? 'text-slate-800' : 'text-slate-400'}>
                {pembuatLaporan || 'Pilih nama pembuat...'}
              </span>
              <span className="text-slate-400">▼</span>
            </div>
            {showPembuatDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b">
                  <input type="text" placeholder="Cari nama..." value={searchPembuat} onChange={(e) => setSearchPembuat(e.target.value)} className="w-full border border-slate-200 p-2 rounded text-sm outline-none" autoFocus />
                </div>
                {filteredPembuat.map((nama, index) => (
                  <div key={index} className="p-3 text-sm hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0" onClick={() => { setPembuatLaporan(nama); setShowPembuatDropdown(false); setSearchPembuat(''); }}>
                    {nama}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TANGGAL OTOMATIS */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal (Otomatis)</label>
            <input type="text" value={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} disabled className="w-full bg-slate-100 border border-slate-300 p-3 rounded-lg text-slate-500 cursor-not-allowed" />
          </div>

          {/* JENIS KEGIATAN */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <label className="block text-sm font-bold text-slate-800">Jenis Kegiatan</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                <select value={kategori} onChange={handleKategoriChange} className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none cursor-pointer" required>
                  <option value="">-- Pilih Kategori --</option>
                  {Object.keys(jenisKegiatanData).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis</label>
                <select value={jenis} onChange={handleJenisChange} className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none cursor-pointer disabled:bg-slate-100" disabled={!kategori} required>
                  <option value="">-- Pilih Jenis --</option>
                  {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Detail Kegiatan</label>
                <select value={detailKegiatan} onChange={(e) => setDetailKegiatan(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg bg-white outline-none cursor-pointer disabled:bg-slate-100" disabled={!jenis} required>
                  <option value="">-- Pilih Detail --</option>
                  {detailOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* NAMA & ALAMAT PERUSAHAAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Perusahaan</label>
              {isManualPerusahaan ? (
                <input type="text" value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none" placeholder="Ketik nama perusahaan..." required />
              ) : (
                <select value={namaPerusahaan || ''} onChange={handleSelectPerusahaan} className="w-full border border-slate-300 p-3 rounded-lg outline-none bg-white cursor-pointer" required>
                  <option value="">-- Pilih Perusahaan --</option>
                  {daftarPerusahaan.map((p, i) => <option key={i} value={p.nama}>{p.nama}</option>)}
                  <option value="manual">Lainnya (Isi Manual)</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Perusahaan</label>
              <input type="text" value={alamatPerusahaan} onChange={(e) => setAlamatPerusahaan(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none" placeholder="Alamat otomatis terisi" required />
            </div>
          </div>

          {/* TANGGAL & NO SURAT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Pelaksanaan</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none cursor-pointer" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">No Surat</label>
              <input type="text" value={noSurat} onChange={(e) => setNoSurat(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none" placeholder="Contoh: 123/BPPMHKP/2026" required />
            </div>
          </div>

          {/* PETUGAS PELAKSANA */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Petugas Pelaksana (Maks. 10 Orang)</label>
            {petugas.map((p, index) => (
              <div key={index} className="flex gap-2 mb-2 relative">
                <div className="flex-1 relative">
                  <input type="text" value={p} onChange={(e) => handlePetugasChange(index, e.target.value)} onFocus={() => setActivePetugasIndex(index)} className="w-full border border-slate-300 p-3 rounded-lg outline-none" placeholder={`Nama Petugas ${index + 1}`} required />
                  {activePetugasIndex === index && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <input type="text" placeholder="Cari nama..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full border border-slate-200 p-2 rounded text-xs outline-none" autoFocus />
                      </div>
                      {filteredPegawai.map((nama, i) => (
                        <div key={i} className="p-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0" onClick={() => { handlePetugasChange(index, nama); setActivePetugasIndex(null); setSearchName(''); }}>
                          {nama}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {petugas.length > 1 && (
                  <button type="button" onClick={() => handleRemovePetugas(index)} className="px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 cursor-pointer">X</button>
                )}
              </div>
            ))}
            {petugas.length < 10 && (
              <button type="button" onClick={handleAddPetugas} className="text-sm text-blue-600 font-semibold hover:underline mt-1 cursor-pointer">+ Tambah Petugas</button>
            )}
          </div>

          {/* UPLOAD FOTO KEGIATAN & LOKASI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Foto Kegiatan (Maks. 5 file, 5MB/file)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 relative">
                <input type="file" multiple accept="image/*" onChange={handleFotoKegiatanChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-slate-500">
                  <span className="text-3xl block mb-2">📸</span>
                  <span className="text-sm">Klik untuk upload foto kegiatan</span>
                  <p className="text-xs text-slate-400 mt-1">{fotoKegiatan.length} file terpilih</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Foto Lokasi (Maks. 2 file, 5MB/file)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 relative">
                <input type="file" multiple accept="image/*" onChange={handleFotoLokasiChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-slate-500">
                  <span className="text-3xl block mb-2">📍</span>
                  <span className="text-sm">Klik untuk upload foto lokasi</span>
                  <p className="text-xs text-slate-400 mt-1">{fotoLokasi.length} file terpilih</p>
                </div>
              </div>
            </div>
          </div>

          {/* UPLOAD DOKUMEN UTAMA */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">File Dokumen Laporan (PDF/Docx)</label>
            {!fileDokumen ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 relative">
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFileDokumen(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                <div className="text-slate-500">
                  <span className="text-3xl block mb-2">📄</span>
                  <span className="text-sm">Klik untuk upload dokumen utama</span>
                </div>
              </div>
            ) : (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-bold text-blue-700">{fileDokumen.name}</p>
                    <p className="text-xs text-blue-500">{(fileDokumen.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFileDokumen(null)} className="p-2 text-red-500 hover:bg-red-100 rounded-full cursor-pointer">X</button>
              </div>
            )}
          </div>

          {/* TOMBOL SUBMIT */}
          <button type="submit" disabled={isUploading || !fileDokumen} className={`w-full font-semibold p-3 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2 ${isUploading || !fileDokumen ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'}`}>
            {isUploading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses Unggah...</>
            ) : (
              'Proses Unggah Laporan'
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}