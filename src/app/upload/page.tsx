'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { perusahaanHACCP, perusahaanSKP } from '@/data/perusahaan'; 
import { daftarPegawai } from '@/data/pegawai'; 

// ==========================================
// KOMPONEN TTD PREVIEW
// ==========================================
const TtdPreview = ({ nama }: { nama: string }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!nama) {
      setImgSrc(null);
      setHasError(false);
      return;
    }

    let namaDasar = nama.split(',')[0].trim().toLowerCase();
    namaDasar = namaDasar.replace(/[^a-z0-9\s-]/g, '');

    const namaTanpaGelar = namaDasar.replace(/^drh\s+/, '').replace(/\s+/g, '-');
    const urlTanpaGelar = `/tanda-tangan/${namaTanpaGelar}.png`;

    const namaDenganGelar = namaDasar.replace(/\s+/g, '-');
    const urlDenganGelar = `/tanda-tangan/${namaDenganGelar}.png`;

    const checkImage = (url: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject();
        img.src = url;
      });
    };

    const primaryUrl = nama.toLowerCase().includes('drh') ? urlDenganGelar : urlTanpaGelar;
    const fallbackUrl = nama.toLowerCase().includes('drh') ? urlTanpaGelar : urlDenganGelar;

    checkImage(primaryUrl)
      .then((validUrl) => {
        setImgSrc(validUrl);
        setHasError(false);
      })
      .catch(() => {
        checkImage(fallbackUrl)
          .then((validUrl) => {
            setImgSrc(validUrl);
            setHasError(false);
          })
          .catch(() => {
            setImgSrc(null);
            setHasError(true);
          });
      });

  }, [nama]);

  if (!nama) return <span className="text-xs text-slate-400 italic">Pilih nama dulu</span>;
  if (hasError) return <span className="text-xs text-slate-400 italic">TTD belum ada</span>;
  if (!imgSrc) return <span className="text-xs text-slate-400 italic">Memuat...</span>;

  return <img src={imgSrc} alt="TTD" className="h-10 object-contain" />;
};

export default function UploadPage() {
  // State Data
  const [jenisKegiatan, setJenisKegiatan] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [noSurat, setNoSurat] = useState('');
  
  const [hasilKegiatan, setHasilKegiatan] = useState('');
  const [kendala, setKendala] = useState('');

  const [petugasList, setPetugasList] = useState([{ nama: '', peran: '', customPeran: '', ttd: '' }]);
  
  const [searchQuery, setSearchQuery] = useState<{ [key: number]: string }>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // State Foto (Tetap Multiple)
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  
  // ==========================================
  // STATE BERKAS (SEKARANG SEMUA FILE TUNGGAL)
  // ==========================================
  const [suratTugas, setSuratTugas] = useState<File | null>(null);
  const [berkasKegiatan, setBerkasKegiatan] = useState<File | null>(null);
  const [berkasPerbaikan, setBerkasPerbaikan] = useState<File | null>(null);
  const [berkasPemeriksaanTindakanPerbaikan, setBerkasPemeriksaanTindakanPerbaikan] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs untuk Custom File Input
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const suratTugasInputRef = useRef<HTMLInputElement>(null);
  const berkasKegiatanInputRef = useRef<HTMLInputElement>(null);
  const berkasPerbaikanInputRef = useRef<HTMLInputElement>(null);
  const pemeriksaanInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000); 
  };

  useEffect(() => {
    if (namaPerusahaan) {
      const allPerusahaan = [...perusahaanHACCP, ...perusahaanSKP];
      const found = allPerusahaan.find(p => p.nama === namaPerusahaan);
      if (found) setAlamatPerusahaan(found.alamat);
    } else {
      setAlamatPerusahaan('');
    }
  }, [namaPerusahaan]);

  const handlePetugasChange = (index: number, field: string, value: string) => {
    const newList = [...petugasList];
    newList[index] = { ...newList[index], [field]: value };
    setPetugasList(newList);
  };

  const addPetugas = () => {
    if (petugasList.length < 10) setPetugasList([...petugasList, { nama: '', peran: '', customPeran: '', ttd: '' }]);
  };

  const removePetugas = (index: number) => {
    if (petugasList.length > 1) setPetugasList(petugasList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // PERUBAHAN: 'Survailen' -> 'Surveilan'
    const isDetailRequired = jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Surveilan';
    
    if (!jenisKegiatan || (isDetailRequired && !detailKegiatan) || !namaPerusahaan || !tanggal) {
      showToast('Mohon lengkapi data wajib (Jenis, Detail, Perusahaan, Tanggal).', 'error');
      setIsSubmitting(false);
      return;
    }

    const petugasString = petugasList
      .filter(p => p.nama.trim() !== '')
      .map(p => {
        const finalPeran = p.peran === 'Lainnya' ? p.customPeran : p.peran;
        return `${p.nama}${finalPeran ? ` (${finalPeran})` : ''}`;
      })
      .join('|');

    // PERUBAHAN: 'Survailen' -> 'Surveilan'
    let fullJenisKegiatan = jenisKegiatan === 'Inspeksi' ? `Inspeksi ${detailKegiatan}` : jenisKegiatan === 'Surveilan' ? `Surveilan ${detailKegiatan}` : jenisKegiatan;

    const formData = new FormData();
    formData.append('namaPerusahaan', namaPerusahaan);
    formData.append('alamatPerusahaan', alamatPerusahaan);
    formData.append('jenisKegiatan', fullJenisKegiatan); 
    formData.append('tanggal', tanggal);
    formData.append('noSurat', noSurat);
    formData.append('petugasPelaksana', petugasString);
    formData.append('hasilKegiatan', hasilKegiatan);
    formData.append('kendala', kendala);
    
    fotoFiles.forEach(file => formData.append('foto', file));

    // ==========================================
    // APPEND BERKAS (SEKARANG TUNGGAL)
    // ==========================================
    if (suratTugas) formData.append('suratTugas', suratTugas);
    if (berkasKegiatan) formData.append('berkasKegiatan', berkasKegiatan);
    if (berkasPerbaikan) formData.append('berkasPerbaikan', berkasPerbaikan);
    if (berkasPemeriksaanTindakanPerbaikan) formData.append('berkasPemeriksaanTindakanPerbaikan', berkasPemeriksaanTindakanPerbaikan);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (res.ok) {
        showToast('Laporan berhasil diunggah!', 'success');
        
        // Reset form
        setJenisKegiatan(''); setDetailKegiatan(''); setNamaPerusahaan(''); setTanggal(''); setNoSurat('');
        setHasilKegiatan(''); setKendala(''); setPetugasList([{ nama: '', peran: '', customPeran: '', ttd: '' }]);
        setFotoFiles([]);
        setSuratTugas(null); setBerkasKegiatan(null); setBerkasPerbaikan(null); setBerkasPemeriksaanTindakanPerbaikan(null);
      } else {
        showToast('Gagal mengunggah laporan. Silakan coba lagi.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PERUBAHAN: 'Survailen' -> 'Surveilan'
  const opsiJenisKegiatan = ['Inspeksi', 'Surveilan', 'Inpres', 'Selfdeclare Kapal'];
  
  const getOpsiDetail = () => (jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Surveilan') 
    ? ['CPIB Kapal', 'CBIB', 'CPIB', 'HACCP', 'SKP', 'SPDI'] 
    : [];

  return (
    <Layout>
      {/* TOAST NOTIFIKASI */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : 'bg-white border-red-500 text-slate-800'}`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {toast.type === 'success' ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
          </div>
          <div><p className="font-bold text-sm">{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p><p className="text-xs text-slate-500">{toast.message}</p></div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Upload Laporan</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Unggah data perjalanan dinas beserta dokumentasi.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. BAGIAN PETUGAS */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Petugas Pelaksana (Maks. 10 Orang)</label>
            {petugasList.map((petugas, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 border border-slate-100 rounded-lg bg-slate-50 relative">
                {petugasList.length > 1 && <button type="button" onClick={() => removePetugas(index)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-200 shadow-sm" title="Hapus Petugas">✕</button>}
                <div className="relative">
                  <label className="text-xs text-slate-500">Nama Petugas</label>
                  <div className="relative mt-1">
                    <input type="text" placeholder="Klik atau ketik nama..." value={activeDropdown === index ? (searchQuery[index] || '') : petugas.nama} onChange={(e) => { setSearchQuery({ ...searchQuery, [index]: e.target.value }); setActiveDropdown(index); if (e.target.value === '') handlePetugasChange(index, 'nama', ''); }} onFocus={() => { setActiveDropdown(index); setSearchQuery({ ...searchQuery, [index]: '' }); }} onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white cursor-pointer" readOnly={activeDropdown !== index && petugas.nama !== ''} />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                  </div>
                  {activeDropdown === index && <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {daftarPegawai.filter((nama: string) => nama.toLowerCase().includes((searchQuery[index] || '').toLowerCase())).map((namaPegawai: string, idx: number) => <div key={idx} onMouseDown={(e) => { e.preventDefault(); handlePetugasChange(index, 'nama', namaPegawai); setActiveDropdown(null); }} className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">{namaPegawai}</div>)}
                      {daftarPegawai.filter((nama: string) => nama.toLowerCase().includes((searchQuery[index] || '').toLowerCase())).length === 0 && <div className="px-3 py-2 text-sm text-slate-400 italic text-center">Nama tidak ditemukan</div>}
                  </div>}
                </div>
                <div><label className="text-xs text-slate-500">Tanda Tangan</label><div className="w-full h-[38px] mt-1 border border-slate-200 rounded bg-white flex items-center justify-center overflow-hidden"><TtdPreview nama={petugas.nama} /></div></div>
                <div>
                  <label className="text-xs text-slate-500">Peran / Tugas</label>
                  <select value={petugas.peran} onChange={(e) => { const newValue = e.target.value; const newList = [...petugasList]; newList[index] = { ...newList[index], peran: newValue, customPeran: newValue === 'Lainnya' ? newList[index].customPeran : '' }; setPetugasList(newList); }} className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1 bg-white">
                    <option value="">-- Pilih Peran --</option><option value="Ketua">Ketua</option><option value="Anggota">Anggota</option><option value="Observer">Observer</option><option value="Lainnya">Lainnya...</option>
                  </select>
                  {petugas.peran === 'Lainnya' && <input type="text" placeholder="Ketik peran manual..." value={petugas.customPeran || ''} onChange={(e) => handlePetugasChange(index, 'customPeran', e.target.value)} className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs mt-1 bg-yellow-50 focus:ring-1 focus:ring-blue-500 outline-none" required />}
                </div>
              </div>
            ))}
            <button type="button" onClick={addPetugas} className="text-sm text-blue-600 hover:underline font-semibold">+ Tambah Petugas</button>
          </div>

          {/* 2. JENIS KEGIATAN */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Jenis Kegiatan</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-500 mb-1 block">Jenis</label><select value={jenisKegiatan} onChange={(e) => { setJenisKegiatan(e.target.value); setDetailKegiatan(''); }} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" required><option value="">-- Pilih Jenis --</option>{opsiJenisKegiatan.map(jenis => <option key={jenis} value={jenis}>{jenis}</option>)}</select></div>
              <div><label className="text-xs text-slate-500 mb-1 block">Detail Kegiatan</label><select value={detailKegiatan} onChange={(e) => setDetailKegiatan(e.target.value)} className={`w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white ${(!jenisKegiatan || jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal') ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!jenisKegiatan || jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal'} required={jenisKegiatan !== 'Inpres' && jenisKegiatan !== 'Selfdeclare Kapal'}><option value="">{jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal' ? '-- Tidak ada detail --' : '-- Pilih Detail --'}</option>{getOpsiDetail().map(detail => <option key={detail} value={detail}>{detail}</option>)}</select></div>
            </div>
          </div>

          {/* 3. DATA PERUSAHAAN & TANGGAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Nama Perusahaan</label><select value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required><option value="">-- Pilih Perusahaan --</option>{[...perusahaanHACCP, ...perusahaanSKP].map((p, idx) => <option key={idx} value={p.nama}>{p.nama}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Perusahaan</label><input type="text" value={alamatPerusahaan} readOnly placeholder="Alamat otomatis terisi" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">No Surat</label><input type="text" value={noSurat} onChange={(e) => setNoSurat(e.target.value)} placeholder="Contoh: 123/BPPMHKP/2026" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
          </div>

          {/* HASIL & KENDALA */}
          <div className="space-y-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Hasil Kegiatan</label><textarea value={hasilKegiatan} onChange={(e) => setHasilKegiatan(e.target.value)} placeholder="Jelaskan hasil kegiatan..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"></textarea></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Kendala</label><textarea value={kendala} onChange={(e) => setKendala(e.target.value)} placeholder="Jelaskan kendala..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"></textarea></div>
          </div>

          {/* 4. FOTO DOKUMENTASI */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Foto Kegiatan (Maks. 5 file, 5MB/file)</label>
            <div onClick={() => fotoInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"><span className="text-3xl mb-2">📸</span><p className="text-sm font-semibold text-slate-700">Klik untuk tambah foto kegiatan ({fotoFiles.length}/5)</p><p className="text-xs text-slate-500 mt-1">Bisa pilih satu per satu</p></div>
            <input type="file" multiple accept="image/*" ref={fotoInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files) { const files = Array.from(e.target.files); const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024); if (validFiles.length !== files.length) showToast("Beberapa file melebihi 5MB.", 'error'); const combinedFiles = [...fotoFiles, ...validFiles].slice(0, 5); setFotoFiles(combinedFiles); e.target.value = ''; } }} />
            {fotoFiles.length > 0 && <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">{fotoFiles.map((file, idx) => <div key={idx} className="relative bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col items-center"><img src={URL.createObjectURL(file)} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-md mb-2 border border-slate-200" /><div className="w-full flex justify-between items-center"><span className="text-[10px] text-slate-600 truncate max-w-[80%]">{file.name}</span><button type="button" onClick={(e) => { e.stopPropagation(); setFotoFiles(fotoFiles.filter((_, i) => i !== idx)); }} className="text-red-500 hover:text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded text-xs" title="Hapus Foto">✕</button></div></div>)}</div>}
          </div>

          {/* ========================================================= */}
          {/* 5. BAGIAN BERKAS (SEMUA JADI 1 FILE)                      */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            
            {/* 1. Surat Tugas */}
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
              <label className="block text-sm font-semibold text-blue-800 mb-2">Surat Tugas (PDF)</label>
              <button type="button" onClick={() => suratTugasInputRef.current?.click()} className="w-full text-sm text-left text-slate-500 border border-slate-300 rounded-lg cursor-pointer bg-white px-3 py-2 hover:bg-blue-100">
                {suratTugas ? suratTugas.name : 'Pilih file PDF...'}
              </button>
              <input type="file" accept=".pdf" ref={suratTugasInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setSuratTugas(e.target.files[0]); }} />
              {suratTugas && <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 p-2 rounded"><span className="truncate">✔ {suratTugas.name}</span><button type="button" onClick={() => setSuratTugas(null)} className="text-red-500 font-bold ml-2">✕</button></div>}
            </div>

            {/* 2. Berkas Kegiatan */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Berkas Kegiatan</label>
              <button type="button" onClick={() => berkasKegiatanInputRef.current?.click()} className="w-full text-sm text-left text-slate-500 border border-slate-300 rounded-lg cursor-pointer bg-white px-3 py-2 hover:bg-slate-100">
                {berkasKegiatan ? berkasKegiatan.name : 'Pilih file...'}
              </button>
              <input type="file" ref={berkasKegiatanInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setBerkasKegiatan(e.target.files[0]); }} />
              {berkasKegiatan && <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 p-2 rounded"><span className="truncate">✔ {berkasKegiatan.name}</span><button type="button" onClick={() => setBerkasKegiatan(null)} className="text-red-500 font-bold ml-2">✕</button></div>}
            </div>

            {/* 3. Berkas Perbaikan */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Berkas Tindakan Perbaikan</label>
              <button type="button" onClick={() => berkasPerbaikanInputRef.current?.click()} className="w-full text-sm text-left text-slate-500 border border-slate-300 rounded-lg cursor-pointer bg-white px-3 py-2 hover:bg-slate-100">
                {berkasPerbaikan ? berkasPerbaikan.name : 'Pilih file...'}
              </button>
              <input type="file" ref={berkasPerbaikanInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setBerkasPerbaikan(e.target.files[0]); }} />
              {berkasPerbaikan && <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 p-2 rounded"><span className="truncate">✔ {berkasPerbaikan.name}</span><button type="button" onClick={() => setBerkasPerbaikan(null)} className="text-red-500 font-bold ml-2">✕</button></div>}
            </div>

            {/* 4. Pemeriksaan Tindakan Perbaikan */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pemeriksaan Tindakan Perbaikan</label>
              <button type="button" onClick={() => pemeriksaanInputRef.current?.click()} className="w-full text-sm text-left text-slate-500 border border-slate-300 rounded-lg cursor-pointer bg-white px-3 py-2 hover:bg-slate-100">
                {berkasPemeriksaanTindakanPerbaikan ? berkasPemeriksaanTindakanPerbaikan.name : 'Pilih file...'}
              </button>
              <input type="file" ref={pemeriksaanInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setBerkasPemeriksaanTindakanPerbaikan(e.target.files[0]); }} />
              {berkasPemeriksaanTindakanPerbaikan && <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 p-2 rounded"><span className="truncate">✔ {berkasPemeriksaanTindakanPerbaikan.name}</span><button type="button" onClick={() => setBerkasPemeriksaanTindakanPerbaikan(null)} className="text-red-500 font-bold ml-2">✕</button></div>}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Mengunggah...' : 'Simpan Laporan'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}