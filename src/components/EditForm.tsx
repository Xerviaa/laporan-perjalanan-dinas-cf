'use client';

import { useEffect, useState } from 'react';
import { perusahaanHACCP, perusahaanSKP } from '@/data/perusahaan';

export default function EditForm({ id, onSuccess }: { id: number, onSuccess: () => void }) {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State form
  const [jenisKegiatan, setJenisKegiatan] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [hasilKegiatan, setHasilKegiatan] = useState('');
  const [kendala, setKendala] = useState('');
  // TAMBAHAN: State untuk petugas pelaksana
  const [petugasPelaksana, setPetugasPelaksana] = useState('');
  
  // State untuk file lama
  const [existingSuratTugas, setExistingSuratTugas] = useState<string | null>(null);
  const [existingBerkasKegiatan, setExistingBerkasKegiatan] = useState<string[]>([]);
  const [existingBerkasPerbaikan, setExistingBerkasPerbaikan] = useState<string[]>([]);
  const [existingPemeriksaan, setExistingPemeriksaan] = useState<string | null>(null);

  // State file baru
  const [suratTugas, setSuratTugas] = useState<File | null>(null);
  const [berkasKegiatan, setBerkasKegiatan] = useState<File[]>([]);
  const [berkasPerbaikan, setBerkasPerbaikan] = useState<File[]>([]);
  const [berkasPemeriksaanTindakanPerbaikan, setBerkasPemeriksaanTindakanPerbaikan] = useState<File | null>(null);

  // --- STATE UNTUK PRATINJAU FILE ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Ambil data
  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const r = data.data;
          setJenisKegiatan(r.jenisKegiatan?.split(' ')[0] || '');
          setDetailKegiatan(r.jenisKegiatan?.split(' ').slice(1).join(' ') || '');
          setNamaPerusahaan(r.namaPerusahaan || '');
          setAlamatPerusahaan(r.alamatPerusahaan || '');
          setTanggal(r.tanggal || '');
          setNoSurat(r.noSurat || '');
          setHasilKegiatan(r.hasilKegiatan || '');
          setKendala(r.kendala || '');
          
          // TAMBAHAN: Isi state petugasPelaksana
          setPetugasPelaksana(r.petugasPelaksana || '');

          // Ambil data file lama
          setExistingSuratTugas(r.suratTugas);
          
          if (r.berkasKegiatan) {
            try {
              setExistingBerkasKegiatan(JSON.parse(r.berkasKegiatan));
            } catch (e) {}
          }
          if (r.berkasPerbaikan) {
            try {
              setExistingBerkasPerbaikan(JSON.parse(r.berkasPerbaikan));
            } catch (e) {}
          }
          setExistingPemeriksaan(r.berkasPemeriksaanTindakanPerbaikan);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let fullJenisKegiatan = jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Survailen' 
      ? `${jenisKegiatan} ${detailKegiatan}` 
      : jenisKegiatan;

    const formData = new FormData();
    formData.append('namaPerusahaan', namaPerusahaan);
    formData.append('alamatPerusahaan', alamatPerusahaan);
    formData.append('jenisKegiatan', fullJenisKegiatan); 
    formData.append('tanggal', tanggal);
    formData.append('noSurat', noSurat);
    formData.append('hasilKegiatan', hasilKegiatan);
    formData.append('kendala', kendala);
    // TAMBAHAN: Kirim petugasPelaksana
    formData.append('petugasPelaksana', petugasPelaksana);
    
    if (suratTugas) formData.append('suratTugas', suratTugas);
    berkasKegiatan.forEach(file => formData.append('berkasKegiatan', file));
    berkasPerbaikan.forEach(file => formData.append('berkasPerbaikan', file));
    if (berkasPemeriksaanTindakanPerbaikan) formData.append('berkasPemeriksaanTindakanPerbaikan', berkasPemeriksaanTindakanPerbaikan);

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('Gagal memperbarui laporan.');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi membuka pratinjau (Kembali ke iframe)
  const handlePreview = (url: string, title: string) => {
    const isPdf = url.toLowerCase().endsWith('.pdf');
    const finalUrl = isPdf 
      ? `https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + url)}&embedded=true`
      : url;
    
    setPreviewUrl(finalUrl);
    setPreviewTitle(title);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Memuat data...</div>;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6 overflow-y-auto flex-1 relative">
      
      {/* JENIS KEGIATAN */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Jenis Kegiatan</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Jenis</label>
            <select value={jenisKegiatan} onChange={(e) => setJenisKegiatan(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required>
              <option value="">-- Pilih --</option>
              {['Inspeksi', 'Survailen', 'Inpres', 'Selfdeclare Kapal'].map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Detail</label>
            <select value={detailKegiatan} onChange={(e) => setDetailKegiatan(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" disabled={!jenisKegiatan || jenisKegiatan === 'Inpres' || jenisKegiatan === 'Selfdeclare Kapal'}>
              <option value="">-- Pilih --</option>
              {(jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Survailen') && ['CPIB Kapal', 'CBIB', 'CPIB', 'HACCP', 'SKP', 'SPDI'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* PERUSAHAAN & TANGGAL */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Perusahaan</label>
          <select value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required>
            <option value="">-- Pilih --</option>
            {[...perusahaanHACCP, ...perusahaanSKP].map((p, idx) => <option key={idx} value={p.nama}>{p.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">No Surat</label>
          <input type="text" value={noSurat} onChange={(e) => setNoSurat(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat</label>
          <input type="text" value={alamatPerusahaan} readOnly className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100" />
        </div>
      </div>

      {/* HASIL & KENDALA */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Hasil Kegiatan</label>
          <textarea value={hasilKegiatan} onChange={(e) => setHasilKegiatan(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"></textarea>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Kendala</label>
          <textarea value={kendala} onChange={(e) => setKendala(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"></textarea>
        </div>
      </div>

      {/* BAGIAN BERKAS (DENGAN KLIK PRATINJAU) */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b">Berkas Lampiran</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Surat Tugas */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Surat Tugas (PDF)</label>
            {existingSuratTugas && (
              <div 
                onClick={() => handlePreview(`/api/r2/${existingSuratTugas}`, existingSuratTugas)}
                className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors"
                title="Klik untuk melihat file"
              >
                <span className="text-blue-500">📄</span>
                <span className="truncate flex-1 text-blue-700 font-medium underline">
                  {existingSuratTugas.split('/').pop()}
                </span>
              </div>
            )}
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => { if (e.target.files) setSuratTugas(e.target.files[0]); }} 
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" 
            />
            {suratTugas && <p className="text-[10px] text-emerald-600 mt-1">Ganti dengan: {suratTugas.name}</p>}
          </div>

          {/* Berkas Kegiatan */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Berkas Kegiatan</label>
            {existingBerkasKegiatan.length > 0 && (
              <div className="mb-2 max-h-20 overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded text-xs flex flex-col gap-1">
                {existingBerkasKegiatan.map((key, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handlePreview(`/api/r2/${key}`, key)}
                    className="flex items-center gap-1 text-slate-600 truncate cursor-pointer hover:text-blue-600 hover:underline"
                    title={key}
                  >
                    <span>📎</span> {key.split('/').pop()}
                  </div>
                ))}
              </div>
            )}
            <input 
              type="file" 
              multiple 
              onChange={(e) => { if (e.target.files) setBerkasKegiatan(Array.from(e.target.files)); }} 
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" 
            />
            {berkasKegiatan.length > 0 && <p className="text-[10px] text-emerald-600 mt-1">{berkasKegiatan.length} file baru dipilih</p>}
          </div>

          {/* Berkas Perbaikan */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Berkas Tindakan Perbaikan</label>
            {existingBerkasPerbaikan.length > 0 && (
              <div className="mb-2 max-h-20 overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded text-xs flex flex-col gap-1">
                {existingBerkasPerbaikan.map((key, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handlePreview(`/api/r2/${key}`, key)}
                    className="flex items-center gap-1 text-slate-600 truncate cursor-pointer hover:text-blue-600 hover:underline"
                    title={key}
                  >
                    <span>📎</span> {key.split('/').pop()}
                  </div>
                ))}
              </div>
            )}
            <input 
              type="file" 
              multiple 
              onChange={(e) => { if (e.target.files) setBerkasPerbaikan(Array.from(e.target.files)); }} 
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" 
            />
            {berkasPerbaikan.length > 0 && <p className="text-[10px] text-emerald-600 mt-1">{berkasPerbaikan.length} file baru dipilih</p>}
          </div>

          {/* Pemeriksaan Tindakan */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Pemeriksaan Tindakan</label>
            {existingPemeriksaan && (
              <div 
                onClick={() => handlePreview(`/api/r2/${existingPemeriksaan}`, existingPemeriksaan)}
                className="mb-2 p-2 bg-slate-50 border border-slate-100 rounded text-xs flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
                title="Klik untuk melihat file"
              >
                <span className="text-slate-500">📎</span>
                <span className="truncate flex-1 text-slate-600 underline">
                  {existingPemeriksaan.split('/').pop()}
                </span>
              </div>
            )}
            <input 
              type="file" 
              onChange={(e) => { if (e.target.files) setBerkasPemeriksaanTindakanPerbaikan(e.target.files[0]); }} 
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" 
            />
            {berkasPemeriksaanTindakanPerbaikan && <p className="text-[10px] text-emerald-600 mt-1">Ganti dengan: {berkasPemeriksaanTindakanPerbaikan.name}</p>}
          </div>

        </div>
      </div>

      {/* TOMBOL SIMPAN */}
      <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
        <button type="button" onClick={onSuccess} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50">
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* MODAL PRATINJAU FILE */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 truncate">{previewTitle}</h3>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 bg-gray-100">
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-0"
                title="Preview File"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}