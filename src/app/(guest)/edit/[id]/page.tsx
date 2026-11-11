'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { perusahaanHACCP, perusahaanSKP } from '@/data/perusahaan'; 
import { daftarPegawai } from '@/data/pegawai'; 

// Komponen TtdPreview (sama seperti di upload)
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
      .then((validUrl) => { setImgSrc(validUrl); setHasError(false); })
      .catch(() => {
        checkImage(fallbackUrl)
          .then((validUrl) => { setImgSrc(validUrl); setHasError(false); })
          .catch(() => { setImgSrc(null); setHasError(true); });
      });
  }, [nama]);

  if (!nama) return <span className="text-xs text-slate-400 italic">Pilih nama dulu</span>;
  if (hasError) return <span className="text-xs text-slate-400 italic">TTD belum ada</span>;
  if (!imgSrc) return <span className="text-xs text-slate-400 italic">Memuat...</span>;
  return <img src={imgSrc} alt="TTD" className="h-10 object-contain" />;
};

export default function EditLaporanPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // State form (sama seperti upload)
  const [jenisKegiatan, setJenisKegiatan] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [hasilKegiatan, setHasilKegiatan] = useState('');
  const [kendala, setKendala] = useState('');
  const [petugasList, setPetugasList] = useState<any[]>([]);
  
  // State file (kosong di awal edit)
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const [suratTugas, setSuratTugas] = useState<File | null>(null);
  const [berkasKegiatan, setBerkasKegiatan] = useState<File[]>([]);
  const [berkasPerbaikan, setBerkasPerbaikan] = useState<File[]>([]);
  const [berkasPemeriksaanTindakanPerbaikan, setBerkasPemeriksaanTindakanPerbaikan] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000); 
  };

  // Ambil data laporan
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
          
          if (r.petugasPelaksana) {
             setPetugasList(r.petugasPelaksana.split('|').map((p: string) => {
               const match = p.match(/(.*)\((.*)\)/);
               return { nama: match ? match[1].trim() : p.trim(), peran: match ? match[2].trim() : 'Anggota', customPeran: '' };
             }));
          } else {
            setPetugasList([{ nama: '', peran: '', customPeran: '', ttd: '' }]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const petugasString = petugasList
      .filter(p => p.nama.trim() !== '')
      .map(p => {
        const finalPeran = p.peran === 'Lainnya' ? p.customPeran : p.peran;
        return `${p.nama}${finalPeran ? ` (${finalPeran})` : ''}`;
      })
      .join('|');

    let fullJenisKegiatan = jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Survailen' 
      ? `${jenisKegiatan} ${detailKegiatan}` 
      : jenisKegiatan;

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
        showToast('Laporan berhasil diperbarui!', 'success');
        setTimeout(() => router.push('/arsip'), 1500);
      } else {
        showToast('Gagal memperbarui laporan.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="p-10 text-center">Memuat data...</div></Layout>;

  return (
    <Layout>
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 ${toast.type === 'success' ? 'bg-white border-emerald-500' : 'bg-white border-red-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {toast.type === 'success' ? '✓' : '✕'}
          </div>
          <p className="text-sm font-bold text-slate-800">{toast.message}</p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Edit Laporan</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Perbarui data perjalanan dinas.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. BAGIAN JENIS KEGIATAN */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Jenis Kegiatan</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Jenis</label>
                <select value={jenisKegiatan} onChange={(e) => setJenisKegiatan(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white" required>
                  <option value="">-- Pilih Jenis --</option>
                  {['Inspeksi', 'Survailen', 'Inpres', 'Selfdeclare Kapal'].map(jenis => (
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
                >
                  <option value="">-- Pilih Detail --</option>
                  {(jenisKegiatan === 'Inspeksi' || jenisKegiatan === 'Survailen') && ['CPIB Kapal', 'CBIB', 'CPIB', 'HACCP', 'SKP', 'SPDI'].map(detail => (
                    <option key={detail} value={detail}>{detail}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. BAGIAN DATA PERUSAHAAN & TANGGAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Perusahaan</label>
              <select value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required>
                <option value="">-- Pilih Perusahaan --</option>
                {[...perusahaanHACCP, ...perusahaanSKP].map((p, idx) => (
                  <option key={idx} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Perusahaan</label>
              <input type="text" value={alamatPerusahaan} readOnly className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">No Surat</label>
              <input type="text" value={noSurat} onChange={(e) => setNoSurat(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>

          {/* 3. BAGIAN HASIL & KENDALA */}
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

          {/* 4. BAGIAN BERKAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
              <label className="block text-sm font-semibold text-blue-800 mb-2">Surat Tugas (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => { if (e.target.files) setSuratTugas(e.target.files[0]); }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300 border border-slate-300 rounded-lg cursor-pointer bg-white" />
              {suratTugas && <p className="text-xs text-emerald-600 mt-2">File baru: {suratTugas.name}</p>}
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Berkas Kegiatan</label>
              <input type="file" multiple onChange={(e) => { if (e.target.files) setBerkasKegiatan(Array.from(e.target.files)); }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-lg cursor-pointer bg-white" />
              {berkasKegiatan.length > 0 && <p className="text-xs text-emerald-600 mt-2">{berkasKegiatan.length} file baru dipilih</p>}
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Berkas Tindakan Perbaikan</label>
              <input type="file" multiple onChange={(e) => { if (e.target.files) setBerkasPerbaikan(Array.from(e.target.files)); }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-lg cursor-pointer bg-white" />
              {berkasPerbaikan.length > 0 && <p className="text-xs text-emerald-600 mt-2">{berkasPerbaikan.length} file baru dipilih</p>}
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pemeriksaan Tindakan Perbaikan</label>
              <input type="file" onChange={(e) => { if (e.target.files) setBerkasPemeriksaanTindakanPerbaikan(e.target.files[0]); }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-lg cursor-pointer bg-white" />
              {berkasPemeriksaanTindakanPerbaikan && <p className="text-xs text-emerald-600 mt-2">File baru: {berkasPemeriksaanTindakanPerbaikan.name}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}