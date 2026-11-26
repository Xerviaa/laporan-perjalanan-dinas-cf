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

  return <img src={imgSrc} alt="TTD" className="h-9 object-contain" />;
};

const ASPEK_SANITASI_INPRES = [
  'Saluran Air',
  'Penerangan',
  'Fasilitas Sanitasi',
  'Fasilitas Pendukung (Air dan Es)',
  'Peralatan',
  'Distribusi dan transportasi',
  'Pencegahan Kontaminasi Silang',
  'Tingkah laku penjual/pekerja',
];

interface LokusPasarInpres {
  namaPasar: string;
  sampel: string[];
}

interface SlotFotoInpres {
  id: string;
  pasarIndex: number;
  kelompok: 'umum' | 'sampel' | 'aspek' | 'tambahan';
  labelKolom: 'Kolom Kiri' | 'Kolom Kanan';
  caption: string;
  pasarHeader: string;
  file: File | null;
  preview: string | null;
}

const createSlotsForPasar = (pasarIndex: number, jumlahSampel = 5): SlotFotoInpres[] => {
  const nomorPasar = pasarIndex + 1;
  const slots: SlotFotoInpres[] = [
    {
      id: `pasar-${nomorPasar}-umum-1`,
      pasarIndex,
      kelompok: 'umum',
      labelKolom: 'Kolom Kiri',
      caption: 'Foto bangunan tampak luar secara keseluruhan',
      pasarHeader: '',
      file: null,
      preview: null,
    },
    {
      id: `pasar-${nomorPasar}-umum-2`,
      pasarIndex,
      kelompok: 'umum',
      labelKolom: 'Kolom Kanan',
      caption: 'Foto lingkungan bangunan secara keseluruhan',
      pasarHeader: '',
      file: null,
      preview: null,
    },
  ];

  for (let i = 1; i <= jumlahSampel; i++) {
    slots.push(
      {
        id: `pasar-${nomorPasar}-sampel-${i}-kiri`,
        pasarIndex,
        kelompok: 'sampel',
        labelKolom: 'Kolom Kiri',
        caption: `Foto Close up sampel Ikan ${i} & Pengecekan Suhu`,
        pasarHeader: '',
        file: null,
        preview: null,
      },
      {
        id: `pasar-${nomorPasar}-sampel-${i}-kanan`,
        pasarIndex,
        kelompok: 'sampel',
        labelKolom: 'Kolom Kanan',
        caption: `Foto lapak pedagang yang diambil sebagai sampel Ikan ${i}`,
        pasarHeader: '',
        file: null,
        preview: null,
      }
    );
  }

  ASPEK_SANITASI_INPRES.forEach((aspek, idx) => {
    slots.push(
      {
        id: `pasar-${nomorPasar}-aspek-${idx + 1}-kiri`,
        pasarIndex,
        kelompok: 'aspek',
        labelKolom: 'Kolom Kiri',
        caption: aspek,
        pasarHeader: '',
        file: null,
        preview: null,
      },
      {
        id: `pasar-${nomorPasar}-aspek-${idx + 1}-kanan`,
        pasarIndex,
        kelompok: 'aspek',
        labelKolom: 'Kolom Kanan',
        caption: aspek,
        pasarHeader: '',
        file: null,
        preview: null,
      }
    );
  });

  return slots;
};

const createInitialSlotsInpres = (jumlahPasar = 1): SlotFotoInpres[] => {
  const totalPasar = Math.max(1, jumlahPasar);
  const allSlots: SlotFotoInpres[] = [];
  for (let p = 0; p < totalPasar; p++) {
    allSlots.push(...createSlotsForPasar(p, 5));
  }
  return allSlots;
};

const HURUF_SAMPEL = 'abcdefghijklmnopqrstuvwxyz';

const getHurufSampel = (idx: number) => {
  if (idx < HURUF_SAMPEL.length) return HURUF_SAMPEL[idx];
  return `${HURUF_SAMPEL[Math.floor(idx / HURUF_SAMPEL.length) - 1]}${
    HURUF_SAMPEL[idx % HURUF_SAMPEL.length]
  }`;
};

const formatDaftarPasarSingkat = (lokusList: LokusPasarInpres[]) => {
  const terisi = lokusList.map((l) => l.namaPasar.trim()).filter((p) => p !== '');
  if (terisi.length === 0) return '...';
  if (terisi.length === 1) return terisi[0];
  if (terisi.length === 2) return `${terisi[0]} dan ${terisi[1]}`;
  return `${terisi.slice(0, -1).join(', ')} dan ${terisi[terisi.length - 1]}`;
};

const buildTemplateNarasiInpres = (
  lokusList: LokusPasarInpres[],
  lokasi = 'Kota/Kab. ... – Provinsi ...'
) => {
  const ringkasanPasar = formatDaftarPasarSingkat(lokusList);
  const labelLokasi = lokasi.trim() !== '' ? lokasi.trim() : 'Kota/Kab. ... – Provinsi ...';

  const blokSampel = lokusList
    .map((lokus, idx) => {
      const namaPasarItem = lokus.namaPasar.trim() ? lokus.namaPasar.trim() : 'Pasar ...';
      const barisSampel = (lokus.sampel.length > 0 ? lokus.sampel : [''])
        .map((itemSampel, sIdx) => {
          const huruf = getHurufSampel(sIdx);
          const nilai = itemSampel.trim() !== '' ? itemSampel.trim() : '...';
          return `${huruf}. ${nilai}`;
        })
        .join('\n');

      return `${idx + 1}. ${namaPasarItem}, dengan sampel:\n${barisSampel}`;
    })
    .join('\n\n');

  return `Pengawasan Mutu dan Keamanan Hasil Perikanan Domestik merupakan implementasi dari Instruksi Presiden (Inpres) Nomor 01 Tahun 2017 tentang Gerakan Masyarakat Hidup Sehat (GERMAS).

Kegiatan ini dilaksanakan pada sentra-sentra penyedia pangan sehat di pasar modern dan/atau pasar tradisional; tempat pendaratan ikan/pelabuhan perikanan (${ringkasanPasar}) di ${labelLokasi}

Salah satu lokus kegiatan pengawasan mutu dan keamanan hasil perikanan domestik adalah :

${blokSampel}`;
};

const normalizeJenisLabel = (val: string) =>
  val
    .replace(/Selfdecare\s+Kapal/gi, 'Selfdeclare Kapal')
    .replace(/Self\s+Declare\s+Kapal/gi, 'Selfdeclare Kapal')
    .trim();

const getAutoDetailValue = (val: string): string | null => {
  const lower = normalizeJenisLabel(val).toLowerCase();
  if (lower === 'inpres') return 'Inpres';
  if (lower === 'selfdeclare kapal') return 'Selfdeclare Kapal';
  return null;
};

export default function AdminUploadPage() {
  // State Data
  const [jenisKegiatan, setJenisKegiatan] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');

  // State Nama & Alamat Perusahaan (Non-Inpres)
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState('');

  // State khusus Daftar Nama Pasar & Sampel Ikan Inpres (Default 1 Pasar = 28 kotak)
  const [lokusPasarInpres, setLokusPasarInpres] = useState<LokusPasarInpres[]>([
    { namaPasar: '', sampel: ['', '', '', '', ''] },
  ]);

  const [tanggal, setTanggal] = useState('');
  const [waktuInpres, setWaktuInpres] = useState('07.00 WITA');
  const [noSurat, setNoSurat] = useState('');

  const [hasilKegiatan, setHasilKegiatan] = useState('');
  const [kendala, setKendala] = useState('');

  // STATE UNTUK CATATAN BAB V SPDI (DIKOSONGKAN DEFAULT-NYA)
  const [catatanBabV, setCatatanBabV] = useState('');

  const [narasiManualDiedit, setNarasiManualDiedit] = useState(false);

  // State khusus Unit Kerja Terlibat (Inpres)
  const [unitKerjaList, setUnitKerjaList] = useState<string[]>([
    'Dinas Kelautan dan Perikanan Provinsi Bali',
    'Dinas Kelautan dan Perikanan Kab. ',
    '',
  ]);

  const [petugasList, setPetugasList] = useState([
    { nama: '', peran: '', customPeran: '', ttd: '' },
  ]);

  const [searchQuery, setSearchQuery] = useState<{ [key: number]: string }>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // State Foto Standar (Non-Inpres)
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);

  // State Slot Foto Terarah Model Tabel Word (Khusus Inpres, default 1 pasar = 28 kotak, maks. 70 foto terisi)
  const [inpresSlots, setInpresSlots] = useState<SlotFotoInpres[]>(() =>
    createInitialSlotsInpres(1)
  );

  // State untuk data perusahaan dari database
  const [dbPerusahaan, setDbPerusahaan] = useState<any[]>([]);

  // State Berkas
  const [suratTugas, setSuratTugas] = useState<File | null>(null);
  const [berkasKegiatan, setBerkasKegiatan] = useState<File | null>(null);
  const [berkasPerbaikan, setBerkasPerbaikan] = useState<File | null>(null);
  const [berkasPemeriksaanTindakanPerbaikan, setBerkasPemeriksaanTindakanPerbaikan] =
    useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs untuk Custom File Input
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const slotFotoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const suratTugasInputRef = useRef<HTMLInputElement>(null);
  const berkasKegiatanInputRef = useRef<HTMLInputElement>(null);
  const berkasPerbaikanInputRef = useRef<HTMLInputElement>(null);
  const pemeriksaanInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // ==========================================
  // STATE & FUNGSI UNTUK PENGATURAN DINAMIS
  // ==========================================
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [listJenis, setListJenis] = useState<string[]>([]);
  const [listDetail, setListDetail] = useState<string[]>([]);
  const [aturanUpload, setAturanUpload] = useState({ maksFoto: 5, maksMb: 5 });

  // State untuk form edit pengaturan
  const [editJenisText, setEditJenisText] = useState('');
  const [editDetailText, setEditDetailText] = useState('');
  const [editMaksFoto, setEditMaksFoto] = useState(5);
  const [editMaksMb, setEditMaksMb] = useState(5);
  const [isSavingSetting, setIsSavingSetting] = useState(false);

  const autoDetailValue = getAutoDetailValue(jenisKegiatan);
  const isInpres = autoDetailValue === 'Inpres';
  const isAutoDetailJenis = Boolean(autoDetailValue);
  const jumlahFotoInpresTerisi = inpresSlots.filter((s) => s.file !== null).length;

  const fetchPengaturan = async () => {
    try {
      const res = await fetch('/api/pengaturan');
      const data = await res.json();
      if (data.status === 'success') {
        const jenis = data.data.find((d: any) => d.tipe === 'jenis_kegiatan');
        const detail = data.data.find((d: any) => d.tipe === 'detail_kegiatan');
        const aturan = data.data.find((d: any) => d.tipe === 'aturan_upload');

        if (jenis) {
          const parsed = JSON.parse(jenis.nilai).map((item: string) =>
            normalizeJenisLabel(item)
          );
          setListJenis(parsed);
          setEditJenisText(parsed.join(', '));
        }
        if (detail) {
          const parsed = JSON.parse(detail.nilai).map((item: string) =>
            normalizeJenisLabel(item)
          );
          setListDetail(parsed);
          setEditDetailText(parsed.join(', '));
        }
        if (aturan) {
          const parsed = JSON.parse(aturan.nilai);
          setAturanUpload(parsed);
          setEditMaksFoto(parsed.maksFoto);
          setEditMaksMb(parsed.maksMb);
        }
      }
    } catch (error) {
      console.error('Gagal load pengaturan:', error);
    }
  };

  const handleSavePengaturan = async () => {
    setIsSavingSetting(true);
    try {
      const newJenis = editJenisText
        .split(',')
        .map((s) => normalizeJenisLabel(s))
        .filter((s) => s !== '');
      const newDetail = editDetailText
        .split(',')
        .map((s) => normalizeJenisLabel(s))
        .filter((s) => s !== '');
      const newAturan = { maksFoto: Number(editMaksFoto), maksMb: Number(editMaksMb) };

      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { tipe: 'jenis_kegiatan', nilai: JSON.stringify(newJenis) },
          { tipe: 'detail_kegiatan', nilai: JSON.stringify(newDetail) },
          { tipe: 'aturan_upload', nilai: JSON.stringify(newAturan) },
        ]),
      });

      if (res.ok) {
        showToast('Pengaturan berhasil disimpan!', 'success');
        setListJenis(newJenis);
        setListDetail(newDetail);
        setAturanUpload(newAturan);
        setIsSettingOpen(false);
      } else {
        showToast('Gagal menyimpan pengaturan.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Ambil data perusahaan & pengaturan saat halaman dimuat
  useEffect(() => {
    fetch('/api/perusahaan')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setDbPerusahaan(data.data);
        }
      })
      .catch((err) => console.error('Gagal load perusahaan:', err));

    fetchPengaturan();
  }, []);

  // Logika Pencarian Alamat Otomatis (Hanya untuk Non-Inpres)
  useEffect(() => {
    if (isInpres) return;
    if (namaPerusahaan) {
      const allPerusahaan = [...perusahaanHACCP, ...perusahaanSKP, ...dbPerusahaan];
      const found = allPerusahaan.find(
        (p) => p.nama.toLowerCase() === namaPerusahaan.toLowerCase()
      );

      if (found) {
        setAlamatPerusahaan(found.alamat);
      }
    } else {
      setAlamatPerusahaan('');
    }
  }, [namaPerusahaan, dbPerusahaan, isInpres]);

  // Sinkronkan template narasi Inpres dengan Lokus Pasar, Sampel Ikan & Lokasi jika belum diubah manual
  useEffect(() => {
    if (isInpres && !narasiManualDiedit) {
      setHasilKegiatan(buildTemplateNarasiInpres(lokusPasarInpres, alamatPerusahaan));
    }
  }, [isInpres, lokusPasarInpres, alamatPerusahaan, narasiManualDiedit]);

  const handlePasarInpresChange = (pasarIdx: number, value: string) => {
    setLokusPasarInpres((prev) => {
      const copy = [...prev];
      copy[pasarIdx] = { ...copy[pasarIdx], namaPasar: value };
      return copy;
    });
  };

  const addPasarInpres = () => {
    const nextIndex = lokusPasarInpres.length;
    setLokusPasarInpres((prev) => [
      ...prev,
      { namaPasar: '', sampel: ['', '', '', '', ''] },
    ]);
    setInpresSlots((prev) => [...prev, ...createSlotsForPasar(nextIndex, 5)]);
  };

  const removePasarInpres = (pasarIdx: number) => {
    if (lokusPasarInpres.length > 1) {
      setLokusPasarInpres((prev) => prev.filter((_, i) => i !== pasarIdx));
      setInpresSlots((prev) =>
        prev
          .filter((slot) => slot.pasarIndex !== pasarIdx)
          .map((slot) => ({
            ...slot,
            pasarIndex: slot.pasarIndex > pasarIdx ? slot.pasarIndex - 1 : slot.pasarIndex,
          }))
      );
    }
  };

  const handleSampelChange = (pasarIdx: number, sampelIdx: number, value: string) => {
    setLokusPasarInpres((prev) => {
      const copy = [...prev];
      const updatedSampel = [...copy[pasarIdx].sampel];
      updatedSampel[sampelIdx] = value;
      copy[pasarIdx] = { ...copy[pasarIdx], sampel: updatedSampel };
      return copy;
    });
  };

  const addSampelItem = (pasarIdx: number) => {
    setLokusPasarInpres((prev) => {
      const copy = [...prev];
      copy[pasarIdx] = { ...copy[pasarIdx], sampel: [...copy[pasarIdx].sampel, ''] };
      return copy;
    });
  };

  const removeSampelItem = (pasarIdx: number, sampelIdx: number) => {
    setLokusPasarInpres((prev) => {
      const copy = [...prev];
      if (copy[pasarIdx].sampel.length > 1) {
        copy[pasarIdx] = {
          ...copy[pasarIdx],
          sampel: copy[pasarIdx].sampel.filter((_, i) => i !== sampelIdx),
        };
      }
      return copy;
    });
  };

  const handlePetugasChange = (index: number, field: string, value: string) => {
    const newList = [...petugasList];
    newList[index] = { ...newList[index], [field]: value };
    setPetugasList(newList);
  };

  const addPetugas = () => {
    if (petugasList.length < 10) {
      setPetugasList([...petugasList, { nama: '', peran: '', customPeran: '', ttd: '' }]);
    }
  };

  const removePetugas = (index: number) => {
    if (petugasList.length > 1) setPetugasList(petugasList.filter((_, i) => i !== index));
  };

  const handleUnitKerjaChange = (index: number, value: string) => {
    const updated = [...unitKerjaList];
    updated[index] = value;
    setUnitKerjaList(updated);
  };

  const addUnitKerja = () => {
    setUnitKerjaList([...unitKerjaList, '']);
  };

  const removeUnitKerja = (index: number) => {
    if (unitKerjaList.length > 1) {
      setUnitKerjaList(unitKerjaList.filter((_, i) => i !== index));
    }
  };

  const handleSelectSlotFoto = (slotId: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > aturanUpload.maksMb * 1024 * 1024) {
      showToast(`Ukuran foto melebihi batas ${aturanUpload.maksMb}MB.`, 'error');
      return;
    }

    setInpresSlots((prev) => {
      const sudahAdaFile = prev.find((s) => s.id === slotId)?.file !== null;
      const jumlahTerisiSaatIni = prev.filter((s) => s.file !== null).length;
      if (!sudahAdaFile && jumlahTerisiSaatIni >= 70) {
        showToast('Maksimal 70 foto dokumentasi untuk laporan Inpres.', 'error');
        return prev;
      }

      return prev.map((slot) =>
        slot.id === slotId ? { ...slot, file, preview: URL.createObjectURL(file) } : slot
      );
    });
  };

  const handleClearSlotFoto = (slotId: string) => {
    setInpresSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, file: null, preview: null } : slot))
    );
  };

  const handleUpdateSlotField = (
    slotId: string,
    field: 'caption' | 'pasarHeader',
    value: string
  ) => {
    setInpresSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot))
    );
  };

  const addPasanganSampelSlot = (pasarIdx: number) => {
    const nomorPasar = pasarIdx + 1;
    const nomorSampelBaru =
      inpresSlots.filter(
        (s) => s.pasarIndex === pasarIdx && s.kelompok === 'sampel' && s.labelKolom === 'Kolom Kiri'
      ).length + 1;

    setInpresSlots((prev) => {
      const idxAkhirSampel = [...prev]
        .map((s, idx) => ({ pasarIndex: s.pasarIndex, kelompok: s.kelompok, idx }))
        .filter((item) => item.pasarIndex === pasarIdx && item.kelompok === 'sampel')
        .pop()?.idx;

      const pasanganBaru: SlotFotoInpres[] = [
        {
          id: `pasar-${nomorPasar}-sampel-${nomorSampelBaru}-kiri-${Date.now()}`,
          pasarIndex: pasarIdx,
          kelompok: 'sampel',
          labelKolom: 'Kolom Kiri',
          caption: `Foto Close up sampel Ikan ${nomorSampelBaru} & Pengecekan Suhu`,
          pasarHeader: '',
          file: null,
          preview: null,
        },
        {
          id: `pasar-${nomorPasar}-sampel-${nomorSampelBaru}-kanan-${Date.now()}`,
          pasarIndex: pasarIdx,
          kelompok: 'sampel',
          labelKolom: 'Kolom Kanan',
          caption: `Foto lapak pedagang yang diambil sebagai sampel Ikan ${nomorSampelBaru}`,
          pasarHeader: '',
          file: null,
          preview: null,
        },
      ];

      if (idxAkhirSampel === undefined) {
        return [...prev, ...pasanganBaru];
      }

      return [
        ...prev.slice(0, idxAkhirSampel + 1),
        ...pasanganBaru,
        ...prev.slice(idxAkhirSampel + 1),
      ];
    });
  };

  const addTambahanSlot = (pasarIdx: number) => {
    const nomorPasar = pasarIdx + 1;
    setInpresSlots((prev) => {
      const jumlahTambahan = prev.filter(
        (s) => s.pasarIndex === pasarIdx && s.kelompok === 'tambahan'
      ).length;
      const nomorUrut = jumlahTambahan + 1;

      const idxAkhirPasar = [...prev]
        .map((s, idx) => ({ pasarIndex: s.pasarIndex, idx }))
        .filter((item) => item.pasarIndex === pasarIdx)
        .pop()?.idx;

      const slotBaru: SlotFotoInpres = {
        id: `pasar-${nomorPasar}-tambahan-${nomorUrut}-${Date.now()}`,
        pasarIndex: pasarIdx,
        kelompok: 'tambahan',
        labelKolom: nomorUrut % 2 === 1 ? 'Kolom Kiri' : 'Kolom Kanan',
        caption: `Dokumentasi Tambahan Pasar ${nomorPasar} - ${nomorUrut}`,
        pasarHeader: '',
        file: null,
        preview: null,
      };

      if (idxAkhirPasar === undefined) {
        return [...prev, slotBaru];
      }

      return [
        ...prev.slice(0, idxAkhirPasar + 1),
        slotBaru,
        ...prev.slice(idxAkhirPasar + 1),
      ];
    });
  };

  const removeCustomSlot = (slotId: string) => {
    setInpresSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const lowerJenis = normalizeJenisLabel(jenisKegiatan).toLowerCase();
    const isDetailRequired = lowerJenis === 'inspeksi' || lowerJenis === 'surveilan';
    const pasarTerisi = lokusPasarInpres.map((l) => l.namaPasar.trim()).filter((p) => p !== '');
    const namaPerusahaanFinal = isInpres
      ? formatDaftarPasarSingkat(lokusPasarInpres)
      : namaPerusahaan;
    const slotInpresTerisi = inpresSlots.filter((item) => item.file !== null);

    if (
      !jenisKegiatan ||
      (isDetailRequired && !detailKegiatan) ||
      (!isInpres && !namaPerusahaan) ||
      (isInpres && pasarTerisi.length === 0) ||
      !tanggal
    ) {
      showToast('Mohon lengkapi data wajib yang tersedia.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (isInpres && (!suratTugas || !berkasKegiatan)) {
      showToast(
        'Untuk kegiatan Inpres, wajib menyertakan Surat Tugas dan Berkas Kegiatan.',
        'error'
      );
      setIsSubmitting(false);
      return;
    }

    const petugasString = petugasList
      .filter((p) => p.nama.trim() !== '')
      .map((p) => {
        const finalPeran = p.peran === 'Lainnya' ? p.customPeran : p.peran;
        return `${p.nama}${finalPeran ? ` (${finalPeran})` : ''}`;
      })
      .join('|');

    const normalizedJenis = normalizeJenisLabel(jenisKegiatan);
    const fullJenisKegiatan = isAutoDetailJenis
      ? autoDetailValue || normalizedJenis
      : detailKegiatan
      ? `${normalizedJenis} ${detailKegiatan}`
      : normalizedJenis;

    const formData = new FormData();
    formData.append('namaPerusahaan', namaPerusahaanFinal === '...' ? '' : namaPerusahaanFinal);
    formData.append('alamatPerusahaan', alamatPerusahaan);
    formData.append('jenisKegiatan', fullJenisKegiatan);
    formData.append('tanggal', tanggal);
    formData.append('noSurat', noSurat);
    formData.append('petugasPelaksana', petugasString);
    formData.append('hasilKegiatan', hasilKegiatan);
    formData.append('catatanBabV', catatanBabV);

    if (isInpres) {
      const inpresPayload = {
        isInpresMeta: true,
        pukul: waktuInpres,
        lokusPasar: lokusPasarInpres,
        unitKerja: unitKerjaList.filter((u) => u.trim() !== ''),
        fotoMeta: slotInpresTerisi.map((item, idx) => ({
          caption: item.caption || `Dokumentasi Kegiatan ${idx + 1}`,
          pasarHeader:
            item.pasarHeader ||
            (idx === 0 || slotInpresTerisi[idx - 1]?.pasarIndex !== item.pasarIndex
              ? lokusPasarInpres[item.pasarIndex]?.namaPasar.trim() ||
                `Pasar ${item.pasarIndex + 1}`
              : ''),
          kelompok: item.kelompok,
          kolom: idx % 2 === 0 ? 'kiri' : 'kanan',
        })),
      };
      formData.append('kendala', JSON.stringify(inpresPayload));
      slotInpresTerisi.forEach((item) => {
        if (item.file) formData.append('foto', item.file);
      });
      if (suratTugas) formData.append('suratTugas', suratTugas);
      if (berkasKegiatan) formData.append('berkasKegiatan', berkasKegiatan);
    } else {
      formData.append('kendala', kendala);
      fotoFiles.forEach((file) => formData.append('foto', file));
      if (suratTugas) formData.append('suratTugas', suratTugas);
      if (berkasKegiatan) formData.append('berkasKegiatan', berkasKegiatan);
      if (berkasPerbaikan) formData.append('berkasPerbaikan', berkasPerbaikan);
      if (berkasPemeriksaanTindakanPerbaikan)
        formData.append('berkasPemeriksaanTindakanPerbaikan', berkasPemeriksaanTindakanPerbaikan);
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (res.ok) {
        showToast('Laporan berhasil diunggah!', 'success');

        fetch('/api/perusahaan')
          .then((res) => res.json())
          .then((data) => {
            if (data.status === 'success') setDbPerusahaan(data.data);
          });

        setJenisKegiatan('');
        setDetailKegiatan('');
        setNamaPerusahaan('');
        setAlamatPerusahaan('');
        setLokusPasarInpres([{ namaPasar: '', sampel: ['', '', '', '', ''] }]);
        setTanggal('');
        setWaktuInpres('07.00 WITA');
        setNoSurat('');
        setHasilKegiatan('');
        setKendala('');
        setNarasiManualDiedit(false);
        setCatatanBabV('');

        setUnitKerjaList([
          'Dinas Kelautan dan Perikanan Provinsi Bali',
          'Dinas Kelautan dan Perikanan Kab. ',
          '',
        ]);
        setPetugasList([{ nama: '', peran: '', customPeran: '', ttd: '' }]);
        setFotoFiles([]);
        setInpresSlots(createInitialSlotsInpres(1));
        setSuratTugas(null);
        setBerkasKegiatan(null);
        setBerkasPerbaikan(null);
        setBerkasPemeriksaanTindakanPerbaikan(null);
      } else {
        showToast('Gagal mengunggah laporan. Silakan coba lagi.', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOpsiDetail = () => {
    if (autoDetailValue) {
      return [autoDetailValue];
    }
    const lowerJenis = normalizeJenisLabel(jenisKegiatan).toLowerCase();
    if (lowerJenis === 'inspeksi' || lowerJenis === 'surveilan') {
      return listDetail;
    }
    return [];
  };

  const allPerusahaan = [...perusahaanHACCP, ...perusahaanSKP, ...dbPerusahaan];
  const perusahaanUnik = allPerusahaan.filter(
    (v, i, a) => a.findIndex((t) => t.nama.toLowerCase() === v.nama.toLowerCase()) === i
  );

  const petugasTerisiCount = petugasList.filter((p) => p.nama.trim() !== '').length;
  const jumlahBerkasTerlampir = isInpres
    ? [suratTugas, berkasKegiatan].filter(Boolean).length
    : [
        suratTugas,
        berkasKegiatan,
        berkasPerbaikan,
        berkasPemeriksaanTindakanPerbaikan,
      ].filter(Boolean).length;

  const renderSlotCard = (
    slot: SlotFotoInpres,
    nomorGlobal: number,
    allowRemoveCustom = false
  ) => (
    <div
      key={`${slot.id}-${nomorGlobal}`}
      className="border border-slate-200/90 rounded-xl bg-white overflow-hidden flex flex-col justify-between shadow-2xs"
    >
      <div className="bg-slate-50/90 border-b border-slate-200/80 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-indigo-700">
            <span>
              Kotak #{nomorGlobal} • {slot.labelKolom}
            </span>
            <span className="text-slate-500">Pasar {slot.pasarIndex + 1}</span>
          </div>
          <input
            type="text"
            value={slot.caption}
            onChange={(e) => handleUpdateSlotField(slot.id, 'caption', e.target.value)}
            placeholder="Judul / keterangan kotak foto..."
            className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>
        {allowRemoveCustom && (
          <button
            type="button"
            onClick={() => removeCustomSlot(slot.id)}
            className="text-rose-600 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 shrink-0 cursor-pointer"
            title="Hapus Kotak"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-3 space-y-2">
        <input
          type="text"
          value={slot.pasarHeader}
          onChange={(e) => handleUpdateSlotField(slot.id, 'pasarHeader', e.target.value)}
          placeholder="Judul Pasar Baru jika pindah pasar (opsional)..."
          className="w-full border border-dashed border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 bg-slate-50/70 focus:bg-white focus:border-indigo-500 outline-none"
        />

        <input
          type="file"
          accept="image/*"
          ref={(el) => {
            slotFotoInputRefs.current[slot.id] = el;
          }}
          style={{ display: 'none' }}
          onChange={(e) => {
            handleSelectSlotFoto(slot.id, e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {slot.preview ? (
          <div className="space-y-2">
            <div className="border border-slate-200/80 rounded-xl p-2 bg-slate-50 flex items-center justify-center">
              <img
                src={slot.preview}
                alt={slot.caption || 'Preview Foto'}
                className="w-full h-36 object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 truncate">{slot.file?.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => slotFotoInputRefs.current[slot.id]?.click()}
                  className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={() => handleClearSlotFoto(slot.id)}
                  className="text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => slotFotoInputRefs.current[slot.id]?.click()}
            className="w-full h-36 border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 rounded-xl flex flex-col items-center justify-center px-3 text-center transition-colors cursor-pointer"
          >
            <span className="text-xl mb-1">📸</span>
            <span className="text-xs font-semibold text-slate-700 line-clamp-2">
              Upload: {slot.caption || 'Foto Dokumentasi'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Maks. {aturanUpload.maksMb}MB (JPG/PNG)
            </span>
          </button>
        )}
      </div>
    </div>
  );

  let nomorKotakBerjalan = 0;

  return (
    <Layout>
      {/* TOAST NOTIFIKASI */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white ${
            toast.type === 'success'
              ? 'border-emerald-200 text-slate-800'
              : 'border-rose-200 text-slate-800'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <div>
            <p className="font-bold text-xs">{toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}</p>
            <p className="text-xs text-slate-500">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast({ ...toast, show: false })}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-5 max-w-5xl">
        {/* HEADER HALAMAN */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              Workspace Input Admin
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Upload Laporan
              </h1>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                {petugasTerisiCount} petugas · {jumlahBerkasTerlampir} berkas
              </span>
            </div>
            <p className="text-slate-500 mt-1 text-xs md:text-sm">
              Unggah data perjalanan dinas, pelaksana, dokumentasi foto, dan berkas pendukung.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingOpen(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <span>⚙️</span>
            <span>Pengaturan Form</span>
          </button>
        </div>

        {/* FORM UTAMA */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. PETUGAS PELAKSANA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-bold text-slate-900">
                    Petugas Pelaksana
                  </label>
                  <p className="text-xs text-slate-500">Maksimal 10 orang beserta peran & tanda tangan.</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                  {petugasList.length}/10 baris
                </span>
              </div>

              {petugasList.map((petugas, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3.5 border border-slate-200/80 rounded-2xl bg-slate-50/70 relative"
                >
                  {petugasList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePetugas(index)}
                      className="absolute -top-2 -right-2 bg-rose-50 text-rose-600 border border-rose-200/80 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-rose-100 shadow-2xs cursor-pointer"
                      title="Hapus Petugas"
                    >
                      ✕
                    </button>
                  )}

                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nama Petugas
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Klik atau ketik nama..."
                        value={
                          activeDropdown === index
                            ? searchQuery[index] || ''
                            : petugas.nama
                        }
                        onChange={(e) => {
                          setSearchQuery({ ...searchQuery, [index]: e.target.value });
                          setActiveDropdown(index);
                          if (e.target.value === '') handlePetugasChange(index, 'nama', '');
                        }}
                        onFocus={() => {
                          setActiveDropdown(index);
                          setSearchQuery({ ...searchQuery, [index]: '' });
                        }}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                        readOnly={activeDropdown !== index && petugas.nama !== ''}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {activeDropdown === index && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {daftarPegawai
                          .filter((nama: string) =>
                            nama.toLowerCase().includes((searchQuery[index] || '').toLowerCase())
                          )
                          .map((namaPegawai: string, idx: number) => (
                            <div
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handlePetugasChange(index, 'nama', namaPegawai);
                                setActiveDropdown(null);
                              }}
                              className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 last:border-0"
                            >
                              {namaPegawai}
                            </div>
                          ))}
                        {daftarPegawai.filter((nama: string) =>
                          nama.toLowerCase().includes((searchQuery[index] || '').toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                            Nama tidak ditemukan
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tanda Tangan
                    </label>
                    <div className="w-full h-[38px] border border-slate-200 rounded-xl bg-white flex items-center justify-center overflow-hidden px-2">
                      <TtdPreview nama={petugas.nama} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Peran / Tugas
                    </label>
                    <select
                      value={petugas.peran}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const newList = [...petugasList];
                        newList[index] = {
                          ...newList[index],
                          peran: newValue,
                          customPeran: newValue === 'Lainnya' ? newList[index].customPeran : '',
                        };
                        setPetugasList(newList);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                    >
                      <option value="">-- Pilih Peran --</option>
                      <option value="Ketua">Ketua</option>
                      <option value="Anggota">Anggota</option>
                      <option value="Observer">Observer</option>
                      <option value="Lainnya">Lainnya...</option>
                    </select>
                    {petugas.peran === 'Lainnya' && (
                      <input
                        type="text"
                        placeholder="Ketik peran manual..."
                        value={petugas.customPeran || ''}
                        onChange={(e) => handlePetugasChange(index, 'customPeran', e.target.value)}
                        className="w-full border border-amber-200 rounded-xl px-3 py-1.5 text-xs mt-1.5 bg-amber-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        required
                      />
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPetugas}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>+ Tambah Petugas</span>
              </button>
            </div>

            {/* 2. JENIS KEGIATAN */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Jenis Kegiatan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jenis
                  </label>
                  <select
                    value={jenisKegiatan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setJenisKegiatan(val);
                      setCatatanBabV('');

                      const nextAutoDetail = getAutoDetailValue(val);
                      setDetailKegiatan(nextAutoDetail || '');

                      if (nextAutoDetail === 'Inpres') {
                        setNarasiManualDiedit(false);
                        setHasilKegiatan(
                          buildTemplateNarasiInpres(lokusPasarInpres, alamatPerusahaan)
                        );
                      } else {
                        setHasilKegiatan('');
                        setNarasiManualDiedit(false);
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
                    required
                  >
                    <option value="">-- Pilih Jenis --</option>
                    {jenisKegiatan &&
                      !listJenis.some(
                        (j) => j.toLowerCase() === jenisKegiatan.toLowerCase()
                      ) && <option value={jenisKegiatan}>{jenisKegiatan}</option>}
                    {listJenis.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Detail Kegiatan
                  </label>
                  <select
                    value={autoDetailValue || detailKegiatan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDetailKegiatan(val);
                      setCatatanBabV('');
                    }}
                    className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all ${
                      !jenisKegiatan || isAutoDetailJenis
                        ? 'opacity-80 cursor-not-allowed bg-slate-100'
                        : 'cursor-pointer'
                    }`}
                    disabled={!jenisKegiatan || isAutoDetailJenis}
                    required={!isAutoDetailJenis}
                  >
                    {!jenisKegiatan && <option value="">-- Pilih Jenis Dulu --</option>}
                    {jenisKegiatan && !isAutoDetailJenis && (
                      <option value="">-- Pilih Detail --</option>
                    )}
                    {getOpsiDetail().map((detail) => (
                      <option key={detail} value={detail}>
                        {detail}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. FORM KHUSUS INPRES VS FORM STANDAR */}
            {isInpres ? (
              <div className="space-y-5 border border-indigo-200/80 bg-indigo-50/25 rounded-2xl p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Detail Resume Kegiatan Inpres 01 Tahun 2017
                    </h2>
                    <p className="text-xs text-slate-500">
                      Seluruh isian dapat diubah sesuai laporan
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
                    Mode Inpres
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lokasi Kegiatan (Kab./Kota – Provinsi)
                    </label>
                    <input
                      type="text"
                      value={alamatPerusahaan}
                      onChange={(e) => setAlamatPerusahaan(e.target.value)}
                      placeholder="Contoh: Kota/Kab. Badung – Provinsi Bali"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Pasar / Lokus (Judul Dokumentasi)
                    </label>
                    <div className="space-y-2">
                      {lokusPasarInpres.map((lokus, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lokus.namaPasar}
                            onChange={(e) => handlePasarInpresChange(idx, e.target.value)}
                            placeholder={
                              idx === 0
                                ? 'Contoh: Pasar Ikan Kedonganan'
                                : `Nama pasar ke-${idx + 1}...`
                            }
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            required={idx === 0}
                          />
                          {lokusPasarInpres.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePasarInpres(idx)}
                              className="text-rose-600 hover:text-rose-700 px-2.5 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
                              title="Hapus Nama Pasar"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addPasarInpres}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
                    >
                      + Tambah Nama Pasar
                    </button>
                  </div>
                </div>

                {/* INPUT KOLOM SAMPEL IKAN PER PASAR */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Sampel Ikan per Pasar
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lokusPasarInpres.map((lokus, pIdx) => (
                      <div
                        key={pIdx}
                        className="border border-slate-200/90 rounded-2xl bg-white p-3.5 space-y-2 shadow-2xs"
                      >
                        <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                          {pIdx + 1}. {lokus.namaPasar.trim() || `Pasar ${pIdx + 1}`} — Sampel:
                        </div>
                        <div className="space-y-1.5">
                          {lokus.sampel.map((itemSampel, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 w-5">
                                {getHurufSampel(sIdx)}.
                              </span>
                              <input
                                type="text"
                                value={itemSampel}
                                onChange={(e) => handleSampelChange(pIdx, sIdx, e.target.value)}
                                placeholder={`Jenis sampel ${getHurufSampel(
                                  sIdx
                                )} (mis. Ikan Tongkol)...`}
                                className="flex-1 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              />
                              {lokus.sampel.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSampelItem(pIdx, sIdx)}
                                  className="text-rose-600 hover:text-rose-700 px-1.5 py-1 text-xs font-bold cursor-pointer"
                                  title="Hapus Baris Sampel"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addSampelItem(pIdx)}
                          className="text-xs text-indigo-700 hover:underline font-semibold pt-0.5 cursor-pointer"
                        >
                          + Tambah Sampel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NARASI KEGIATAN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Narasi Kegiatan
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNarasiManualDiedit(false);
                        setHasilKegiatan(
                          buildTemplateNarasiInpres(lokusPasarInpres, alamatPerusahaan)
                        );
                      }}
                      className="text-xs text-indigo-700 hover:underline font-semibold cursor-pointer"
                    >
                      Reset ke Teks Standar
                    </button>
                  </div>
                  <textarea
                    value={hasilKegiatan}
                    onChange={(e) => {
                      setNarasiManualDiedit(true);
                      setHasilKegiatan(e.target.value);
                    }}
                    placeholder="Isi narasi kegiatan beserta daftar pasar dan sampel ikan..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-56"
                  />
                </div>

                {/* UNIT KERJA YANG TERLIBAT */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Unit Kerja yang Terlibat
                  </label>
                  <div className="space-y-2">
                    {unitKerjaList.map((unit, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-6">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={unit}
                          onChange={(e) => handleUnitKerjaChange(idx, e.target.value)}
                          placeholder={`Nama instansi / dinas ke-${idx + 1}...`}
                          className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                        {unitKerjaList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUnitKerja(idx)}
                            className="text-rose-600 hover:text-rose-700 px-2 py-1 text-xs font-bold cursor-pointer"
                            title="Hapus Baris"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addUnitKerja}
                    className="mt-2 text-xs text-indigo-700 hover:underline font-semibold cursor-pointer"
                  >
                    + Tambah Unit Kerja
                  </button>
                </div>

                {/* WAKTU & DASAR PELAKSANAAN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pukul Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={waktuInpres}
                      onChange={(e) => setWaktuInpres(e.target.value)}
                      placeholder="Contoh: 07.00 WITA"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dasar Pelaksanaan (No. Surat Tugas)
                    </label>
                    <input
                      type="text"
                      value={noSurat}
                      onChange={(e) => setNoSurat(e.target.value)}
                      placeholder="Contoh: B.1123/BKIPM.DPS/KP.440/IX/2024"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Perusahaan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik Nama Perusahaan Jika Tidak Terdapat di Daftar"
                        value={namaPerusahaan}
                        onChange={(e) => {
                          setNamaPerusahaan(e.target.value);
                          setActiveDropdown(-1);
                        }}
                        onFocus={() => setActiveDropdown(-1)}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      {activeDropdown === -1 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {perusahaanUnik
                            .filter((p) =>
                              p.nama.toLowerCase().includes(namaPerusahaan.toLowerCase())
                            )
                            .map((p, idx) => (
                              <div
                                key={idx}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setNamaPerusahaan(p.nama);
                                  setAlamatPerusahaan(p.alamat);
                                  setActiveDropdown(null);
                                }}
                                className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 last:border-0"
                              >
                                {p.nama}
                              </div>
                            ))}
                          {perusahaanUnik.filter((p) =>
                            p.nama.toLowerCase().includes(namaPerusahaan.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                              Perusahaan baru akan ditambahkan
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Perusahaan
                    </label>
                    <input
                      type="text"
                      value={alamatPerusahaan}
                      onChange={(e) => setAlamatPerusahaan(e.target.value)}
                      placeholder="Ketik Alamat Perusahaan..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      No Surat
                    </label>
                    <input
                      type="text"
                      value={noSurat}
                      onChange={(e) => setNoSurat(e.target.value)}
                      placeholder="Contoh: 123/BPPMHKP/2026"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* --- TAMBAHAN KOLOM KHUSUS SPDI --- */}
                {normalizeJenisLabel(jenisKegiatan).toLowerCase() === 'inspeksi' &&
                  detailKegiatan === 'SPDI' && (
                    <div className="p-4 border border-indigo-200/80 bg-indigo-50/30 rounded-2xl">
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                        Catatan Pelaksanaan Kegiatan (Bab V SPDI)
                      </label>
                      <p className="text-xs text-slate-500 mb-2 italic">
                        *Teks ini akan tercetak di Bab V. Silakan isi atau sesuaikan sesuai laporan.
                      </p>
                      <textarea
                        value={catatanBabV}
                        onChange={(e) => setCatatanBabV(e.target.value)}
                        placeholder="Contoh: menghasilkan laporan hasil inspeksi berupa temuan ketidaksesuaian dari pemenuhan standar kelayakan mutu, higiene dan sanitasi fasilitas, dan sistem ketertelusuran dokumen (traceability) sehingga dapat dijadikan perbaikan secara berkelanjutan..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-32 resize-y"
                      />
                    </div>
                  )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hasil Kegiatan
                    </label>
                    <textarea
                      value={hasilKegiatan}
                      onChange={(e) => setHasilKegiatan(e.target.value)}
                      placeholder="Jelaskan hasil kegiatan..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 resize-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kendala
                    </label>
                    <textarea
                      value={kendala}
                      onChange={(e) => setKendala(e.target.value)}
                      placeholder="Jelaskan kendala..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 resize-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 4. FOTO KEGIATAN */}
            {isInpres ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-900">
                      Dokumentasi Kegiatan per Kolom / Kotak Word ({inpresSlots.length} Kotak
                      Tersedia • {jumlahFotoInpresTerisi}/70 Foto Terisi, Maks.{' '}
                      {aturanUpload.maksMb}MB/file)
                    </label>
                    <p className="text-xs text-slate-500">
                      Ditampilkan per pasar (28 kotak per pasar: bangunan, 5 sampel ikan & lapak, 8
                      aspek sanitasi). Tambah pasar baru untuk memunculkan blok kotaknya lagi.
                    </p>
                  </div>
                  {jumlahFotoInpresTerisi > 0 && (
                    <button
                      type="button"
                      onClick={() => setInpresSlots(createInitialSlotsInpres(lokusPasarInpres.length))}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Reset Semua Foto ({inpresSlots.length} Kotak)
                    </button>
                  )}
                </div>

                <div className="max-h-[760px] overflow-y-auto space-y-5 pr-1">
                  {lokusPasarInpres.map((lokus, pIdx) => {
                    const slotsPasar = inpresSlots.filter((s) => s.pasarIndex === pIdx);
                    const slotUmumPasar = slotsPasar.filter((s) => s.kelompok === 'umum');
                    const slotSampelPasar = slotsPasar.filter((s) => s.kelompok === 'sampel');
                    const slotAspekPasar = slotsPasar.filter((s) => s.kelompok === 'aspek');
                    const slotTambahanPasar = slotsPasar.filter((s) => s.kelompok === 'tambahan');

                    return (
                      <div
                        key={pIdx}
                        className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                            Pasar {pIdx + 1}: {lokus.namaPasar.trim() || `Pasar ${pIdx + 1}`} (
                            {slotsPasar.length} Kotak)
                          </h3>
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                            {slotsPasar.filter((s) => s.file !== null).length}/{slotsPasar.length}{' '}
                            kotak terisi
                          </span>
                        </div>

                        {/* A. KONDISI UMUM LOKASI */}
                        <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white space-y-2.5">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            A. Kondisi Bangunan & Lingkungan (2 Kolom)
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {slotUmumPasar.map((slot) => {
                              nomorKotakBerjalan += 1;
                              return renderSlotCard(slot, nomorKotakBerjalan, false);
                            })}
                          </div>
                        </div>

                        {/* B. SAMPEL IKAN & PENGECEKAN SUHU */}
                        <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              B. Sampel Ikan & Lapak Pedagang (Berpasangan Kiri – Kanan)
                            </div>
                            <button
                              type="button"
                              onClick={() => addPasanganSampelSlot(pIdx)}
                              className="text-xs text-indigo-700 hover:underline font-semibold cursor-pointer"
                            >
                              + Tambah Sampel Ikan
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {slotSampelPasar.map((slot) => {
                              nomorKotakBerjalan += 1;
                              return renderSlotCard(slot, nomorKotakBerjalan, false);
                            })}
                          </div>
                        </div>

                        {/* C. ASPEK SANITASI, HIGIENE & DOKUMENTASI LAINNYA */}
                        <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              C. Sanitasi, Fasilitas & Perilaku Penjual / Pekerja
                            </div>
                            <button
                              type="button"
                              onClick={() => addTambahanSlot(pIdx)}
                              className="text-xs text-indigo-700 hover:underline font-semibold cursor-pointer"
                            >
                              + Tambah Kotak Dokumentasi
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {slotAspekPasar.map((slot) => {
                              nomorKotakBerjalan += 1;
                              return renderSlotCard(slot, nomorKotakBerjalan, false);
                            })}
                            {slotTambahanPasar.map((slot) => {
                              nomorKotakBerjalan += 1;
                              return renderSlotCard(slot, nomorKotakBerjalan, true);
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Foto Kegiatan (Maks. {aturanUpload.maksFoto} file, {aturanUpload.maksMb}MB/file)
                </label>
                <div
                  onClick={() => fotoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/25 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="text-3xl mb-2">📸</span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    Klik untuk tambah foto kegiatan ({fotoFiles.length}/{aturanUpload.maksFoto})
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Bisa pilih satu per satu</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fotoInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files);
                      const validFiles = files.filter(
                        (f) => f.size <= aturanUpload.maksMb * 1024 * 1024
                      );
                      if (validFiles.length !== files.length) {
                        showToast(`Beberapa file melebihi ${aturanUpload.maksMb}MB.`, 'error');
                      }
                      const combinedFiles = [...fotoFiles, ...validFiles].slice(
                        0,
                        aturanUpload.maksFoto
                      );
                      setFotoFiles(combinedFiles);
                      e.target.value = '';
                    }
                  }}
                />
                {fotoFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fotoFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative bg-slate-50/80 border border-slate-200/80 rounded-xl p-2 flex flex-col items-center"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx}`}
                          className="w-full h-32 object-cover rounded-lg mb-2 border border-slate-200/60"
                        />
                        <div className="w-full flex justify-between items-center gap-1">
                          <span className="text-[11px] text-slate-600 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFotoFiles(fotoFiles.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md text-xs cursor-pointer shrink-0"
                            title="Hapus Foto"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. LAMPIRAN BERKAS */}
            {isInpres ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Surat Tugas (PDF) <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => suratTugasInputRef.current?.click()}
                    className="w-full text-xs sm:text-sm text-left text-slate-600 border border-slate-200 rounded-xl cursor-pointer bg-white px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    {suratTugas ? suratTugas.name : 'Pilih file PDF...'}
                  </button>
                  <input
                    type="file"
                    accept=".pdf"
                    ref={suratTugasInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setSuratTugas(e.target.files[0]);
                    }}
                  />
                  {suratTugas && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
                      <span className="truncate font-medium">✔ {suratTugas.name}</span>
                      <button
                        type="button"
                        onClick={() => setSuratTugas(null)}
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Berkas Kegiatan <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => berkasKegiatanInputRef.current?.click()}
                    className="w-full text-xs sm:text-sm text-left text-slate-600 border border-slate-200 rounded-xl cursor-pointer bg-white px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    {berkasKegiatan ? berkasKegiatan.name : 'Pilih file...'}
                  </button>
                  <input
                    type="file"
                    ref={berkasKegiatanInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        setBerkasKegiatan(e.target.files[0]);
                    }}
                  />
                  {berkasKegiatan && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
                      <span className="truncate font-medium">✔ {berkasKegiatan.name}</span>
                      <button
                        type="button"
                        onClick={() => setBerkasKegiatan(null)}
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Surat Tugas (PDF)
                  </label>
                  <button
                    type="button"
                    onClick={() => suratTugasInputRef.current?.click()}
                    className="w-full text-xs sm:text-sm text-left text-slate-600 border border-slate-200 rounded-xl cursor-pointer bg-white px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    {suratTugas ? suratTugas.name : 'Pilih file PDF...'}
                  </button>
                  <input
                    type="file"
                    accept=".pdf"
                    ref={suratTugasInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setSuratTugas(e.target.files[0]);
                    }}
                  />
                  {suratTugas && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
                      <span className="truncate font-medium">✔ {suratTugas.name}</span>
                      <button
                        type="button"
                        onClick={() => setSuratTugas(null)}
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Berkas Kegiatan
                  </label>
                  <button
                    type="button"
                    onClick={() => berkasKegiatanInputRef.current?.click()}
                    className="w-full text-xs sm:text-sm text-left text-slate-600 border border-slate-200 rounded-xl cursor-pointer bg-white px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    {berkasKegiatan ? berkasKegiatan.name : 'Pilih file...'}
                  </button>
                  <input
                    type="file"
                    ref={berkasKegiatanInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setBerkasKegiatan(e.target.files[0]);
                    }}
                  />
                  {berkasKegiatan && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
                      <span className="truncate font-medium">✔ {berkasKegiatan.name}</span>
                      <button
                        type="button"
                        onClick={() => setBerkasKegiatan(null)}
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Berkas Tindakan Perbaikan
                  </label>
                  <button
                    type="button"
                    onClick={() => berkasPerbaikanInputRef.current?.click()}
                    className="w-full text-xs sm:text-sm text-left text-slate-600 border border-slate-200 rounded-xl cursor-pointer bg-white px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    {berkasPerbaikan ? berkasPerbaikan.name : 'Pilih file...'}
                  </button>
                  <input
                    type="file"
                    ref={berkasPerbaikanInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        setBerkasPerbaikan(e.target.files[0]);
                    }}
                  />
                  {berkasPerbaikan && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
                      <span className="truncate font-medium">✔ {berkasPerbaikan.name}</span>
                      <button
                        type="button"
                        onClick={() => setBerkasPerbaikan(null)}
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Pemeriksaan Tindakan Perbaikan
                  </label>
                  <button
                    type="button"
                    onClick={() => pemeriksaanInputRef.current?.click()}
                    className="w-full text-xs sm:text-sm text-left text-slate-600 border border-slate-200 rounded-xl cursor-pointer bg-white px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    {berkasPemeriksaanTindakanPerbaikan
                      ? berkasPemeriksaanTindakanPerbaikan.name
                      : 'Pilih file...'}
                  </button>
                  <input
                    type="file"
                    ref={pemeriksaanInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        setBerkasPemeriksaanTindakanPerbaikan(e.target.files[0]);
                    }}
                  />
                  {berkasPemeriksaanTindakanPerbaikan && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
                      <span className="truncate font-medium">
                        ✔ {berkasPemeriksaanTindakanPerbaikan.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBerkasPemeriksaanTindakanPerbaikan(null)}
                        className="text-rose-600 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Mengunggah...' : 'Simpan Laporan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL PENGATURAN FORM */}
      {isSettingOpen && (
        <div
          onClick={() => setIsSettingOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>⚙️</span>
                <span>Pengaturan Form Upload</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daftar Jenis Kegiatan (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={editJenisText}
                  onChange={(e) => setEditJenisText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="Inspeksi, Surveilan, Inpres, Selfdeclare Kapal"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daftar Detail Kegiatan (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={editDetailText}
                  onChange={(e) => setEditDetailText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="CPIB Kapal, CBIB, CPIB"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maks. Foto (Non-Inpres)
                  </label>
                  <input
                    type="number"
                    value={editMaksFoto}
                    onChange={(e) => setEditMaksFoto(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maks. Ukuran (MB)
                  </label>
                  <input
                    type="number"
                    value={editMaksMb}
                    onChange={(e) => setEditMaksMb(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePengaturan}
                disabled={isSavingSetting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingSetting ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}