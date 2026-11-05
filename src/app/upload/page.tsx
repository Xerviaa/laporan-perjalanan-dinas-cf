'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { perusahaanHACCP, perusahaanSKP } from '@/data/perusahaan'; 
import { daftarPegawai } from '@/data/pegawai'; 

export default function UploadPage() {
  // State
  const [jenisKegiatan, setJenisKegiatan] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [noSurat, setNoSurat] = useState('');
  
  // STATE BARU UNTUK HASIL & KENDALA
  const [hasilKegiatan, setHasilKegiatan] = useState('');
  const [kendala, setKendala] = useState('');

  // State untuk Petugas
  const [petugasList, setPetugasList] = useState([{ nama: '', peran: '', ttd: '' }]);
  
  // State untuk Foto
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref untuk input file tersembunyi
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efek untuk mengisi alamat otomatis berdasarkan nama perusahaan
  useEffect(() => {
    if (namaPerusahaan) {
      const allPerusahaan = [...perusahaanHACCP, ...perusahaanSKP];
      const found = allPerusahaan.find(p => p.nama === namaPerusahaan);
      if (found) setAlamatPerusahaan(found.alamat);
    } else {
      setAlamatPerusahaan('');
    }
  }, [namaPerusahaan]);

  // Handle Petugas
  const handlePetugasChange = (index: number, field: string, value: string) => {
    const newList = [...petugasList];
    newList[index] = { ...newList[index], [field]: value };
    setPetugasList(newList);
  };

  const addPetugas = () => {
    if (petugasList.length < 10) {
      setPetugasList([...petugasList, { nama: '', peran: '', ttd: '' }]);
    }
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validasi
    const isDetailRequired = jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Survailen';
    
    if (!jenisKegiatan || (isDetailRequired && !detailKegiatan) || !namaPerusahaan || !tanggal) {
      alert('Mohon lengkapi data wajib.');
      setIsSubmitting(false);
      return;
    }

    // Gabungkan petugas
    const petugasString = petugasList
      .filter(p => p.nama.trim() !== '')
      .map(p => `${p.nama}${p.peran ? ` (${p.peran})` : ''}`)
      .join('|');

    // --- LOGIKA BARU: TANPA PRIMER/PASCA ---
    let fullJenisKegiatan = '';
    
    if (jenisKegiatan === 'Inspeksi') {
      fullJenisKegiatan = `Inspeksi ${detailKegiatan}`; 
    } 
    else if (jenisKegiatan === 'Survailen') {
      fullJenisKegiatan = `Survailen ${detailKegiatan}`; 
    }
    else {
      fullJenisKegiatan = jenisKegiatan; 
    }

    const formData = new FormData();
    formData.append('namaPerusahaan', namaPerusahaan);
    formData.append('alamatPerusahaan', alamatPerusahaan);
    formData.append('jenisKegiatan', fullJenisKegiatan); 
    formData.append('tanggal', tanggal);
    formData.append('noSurat', noSurat);
    formData.append('petugasPelaksana', petugasString);
    
    // KIRIM HASIL & KENDALA KE SERVER
    formData.append('hasilKegiatan', hasilKegiatan);
    formData.append('kendala', kendala);
    
    fotoFiles.forEach(file => {
      formData.append('foto', file); 
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Laporan berhasil diunggah!');
        // Reset form
        setJenisKegiatan('');
        setDetailKegiatan('');
        setNamaPerusahaan('');
        setTanggal('');
        setNoSurat('');
        setHasilKegiatan('');
        setKendala('');
        setPetugasList([{ nama: '', peran: '', ttd: '' }]);
        setFotoFiles([]);
      } else {
        alert('Gagal mengunggah laporan.');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- OPSI DROPDOWN ---
  const opsiJenisKegiatan = ['Inspeksi', 'Survailen', 'Inpres', 'Selfdeclare Kapal'];
  
  const getOpsiDetail = () => {
    if (jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Survailen') {
      return ['CPIB Kapal', 'CBIB', 'CPIB', 'HACCP', 'SKP', 'SPDI'];
    }
    return [];
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Upload Laporan</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Unggah data perjalanan dinas beserta dokumentasi.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. BAGIAN PETUGAS PELAKSANA */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Petugas Pelaksana (Maks. 10 Orang)</label>
            {petugasList.map((petugas, index) => {
              const getTtdUrl = (nama: string) => {
                if (!nama) return "";
                const namaTanpaGelar = nama.split(',')[0];
                const namaFile = namaTanpaGelar.toLowerCase().replace(/[.]/g, '').trim().replace(/\s+/g, '-');
                return `/tanda-tangan/${namaFile}.png`;
              };

              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 border border-slate-100 rounded-lg bg-slate-50">
                  
                  {/* Dropdown Nama Petugas (Bisa Diketik) */}
                  <div>
                    <label className="text-xs text-slate-500">Nama Petugas</label>
                    <input 
                      type="text"
                      list={`pegawai-list-${index}`}
                      value={petugas.nama}
                      onChange={(e) => handlePetugasChange(index, 'nama', e.target.value)}
                      placeholder="Ketik nama atau pilih..."
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1 bg-white"
                    />
                    <datalist id={`pegawai-list-${index}`}>
                      {daftarPegawai.map((namaPegawai: string, idx: number) => (
                        <option key={idx} value={namaPegawai} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-500">Tanda Tangan</label>
                    <div className="w-full h-[38px] mt-1 border border-slate-200 rounded bg-white flex items-center justify-center overflow-hidden">
                      {petugas.nama ? (
                        <img 
                          src={getTtdUrl(petugas.nama)} 
                          alt="TTD" 
                          className="h-10 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-slate-400 italic">TTD belum ada</span>';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pilih nama dulu</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Peran / Tugas</label>
                    <select 
                      value={petugas.peran}
                      onChange={(e) => handlePetugasChange(index, 'peran', e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1 bg-white"
                    >
                      <option value="">-- Pilih Peran --</option>
                      <option value="Ketua">Ketua</option>
                      <option value="Anggota">Anggota</option>
                      <option value="Observer">Observer</option>
                    </select>
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={addPetugas} className="text-sm text-blue-600 hover:underline font-semibold">
              + Tambah Petugas
            </button>
          </div>

          {/* 2. BAGIAN JENIS KEGIATAN */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Jenis Kegiatan</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Jenis</label>
                <select 
                  value={jenisKegiatan}
                  onChange={(e) => {
                    setJenisKegiatan(e.target.value);
                    setDetailKegiatan(''); 
                  }}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" 
                  required
                >
                  <option value="">-- Pilih Jenis --</option>
                  {opsiJenisKegiatan.map(jenis => (
                    <option key={jenis} value={jenis}>{jenis}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Detail Kegiatan</label>
                <select 
                  value={detailKegiatan}
                  onChange={(e) => setDetailKegiatan(e.target.value)}
                  className={`w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white ${(!jenisKegiatan || jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!jenisKegiatan || jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal'}
                  required={jenisKegiatan !== 'Inpres' && jenisKegiatan !== 'Selfdeclare Kapal'}
                >
                  <option value="">
                    {jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal' 
                      ? '-- Tidak ada detail --' 
                      : '-- Pilih Detail --'}
                  </option>
                  {getOpsiDetail().map(detail => (
                    <option key={detail} value={detail}>{detail}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. BAGIAN DATA PERUSAHAAN & TANGGAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Perusahaan</label>
              <select 
                value={namaPerusahaan}
                onChange={(e) => setNamaPerusahaan(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                required
              >
                <option value="">-- Pilih Perusahaan --</option>
                {[...perusahaanHACCP, ...perusahaanSKP].map((p, idx) => (
                  <option key={idx} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Perusahaan</label>
              <input 
                type="text" 
                value={alamatPerusahaan}
                readOnly
                placeholder="Alamat otomatis terisi"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
              <input 
                type="date" 
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">No Surat</label>
              <input 
                type="text" 
                value={noSurat}
                onChange={(e) => setNoSurat(e.target.value)}
                placeholder="Contoh: 123/BPPMHKP/2026"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm" 
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAMBAHAN BARU: HASIL KEGIATAN & KENDALA */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hasil Kegiatan</label>
              <textarea 
                value={hasilKegiatan}
                onChange={(e) => setHasilKegiatan(e.target.value)}
                placeholder="Jelaskan hasil kegiatan yang telah dilaksanakan..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kendala</label>
              <textarea 
                value={kendala}
                onChange={(e) => setKendala(e.target.value)}
                placeholder="Jelaskan kendala yang dihadapi (jika ada)..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              ></textarea>
            </div>
          </div>
          {/* ======================================================== */}

          {/* 4. BAGIAN FOTO DOKUMENTASI */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Foto Kegiatan (Maks. 5 file, 5MB/file)</label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-3xl mb-2">📸</span>
              <p className="text-sm font-semibold text-slate-700">Klik untuk tambah foto kegiatan ({fotoFiles.length}/5)</p>
              <p className="text-xs text-slate-500 mt-1">Bisa pilih satu per satu</p>
            </div>

            <input 
              type="file" 
              multiple 
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files) {
                  const files = Array.from(e.target.files);
                  const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
                  
                  if (validFiles.length !== files.length) {
                    alert("Beberapa file melebihi 5MB dan tidak akan diunggah.");
                  }
                  
                  const combinedFiles = [...fotoFiles, ...validFiles].slice(0, 5);
                  setFotoFiles(combinedFiles);
                  e.target.value = ''; 
                }
              }}
            />

            {fotoFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {fotoFiles.map((file, idx) => (
                  <div key={idx} className="text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-lg flex justify-between items-center border border-slate-200">
                    <span className="truncate max-w-[80%] font-medium">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFotoFiles(fotoFiles.filter((_, i) => i !== idx));
                      }}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 bg-red-50 px-2 py-0.5 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Mengunggah...' : 'Simpan Laporan'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}