import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. Ambil semua file
    const filesKegiatan = formData.getAll('foto') as File[];
    const filesBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    const filesBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    
    // AMBIL FILE BARU
    const fileSuratTugas = formData.get('suratTugas') as File | null;
    const filePemeriksaan = formData.get('berkasPemeriksaanTindakanPerbaikan') as File | null;

    // 2. Ambil data teks & pastikan tidak ada yang undefined
    const pembuatLaporan = (formData.get('pembuatLaporan') as string) || "";
    const jenisKegiatan = (formData.get('jenisKegiatan') as string) || "";
    const noSurat = (formData.get('noSurat') as string) || "";
    const namaPerusahaan = (formData.get('namaPerusahaan') as string) || "";
    const alamatPerusahaan = (formData.get('alamatPerusahaan') as string) || "";
    const tanggal = (formData.get('tanggal') as string) || "";
    const petugasPelaksana = (formData.get('petugasPelaksana') as string) || "";
    const hasilKegiatan = (formData.get('hasilKegiatan') as string) || "";
    const kendala = (formData.get('kendala') as string) || "";

    // VALIDASI
    if (!jenisKegiatan || !namaPerusahaan) {
      return Response.json({ status: "error", message: "Data wajib belum lengkap" }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const key = `reports/${prefix}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    // 3. Upload Foto Kegiatan
    const keysKegiatan: string[] = [];
    for (const file of filesKegiatan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'foto-kegiatan');
        keysKegiatan.push(key);
      }
    }

    // 4. Upload Berkas Kegiatan
    const keysBerkasKegiatan: string[] = [];
    for (const file of filesBerkasKegiatan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-kegiatan');
        keysBerkasKegiatan.push(key);
      }
    }

    // 5. Upload Berkas Perbaikan
    const keysBerkasPerbaikan: string[] = [];
    for (const file of filesBerkasPerbaikan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-perbaikan');
        keysBerkasPerbaikan.push(key);
      }
    }

    // 6. Upload Surat Tugas (BARU)
    let keySuratTugas = null;
    if (fileSuratTugas && fileSuratTugas.size > 0) {
      keySuratTugas = await uploadToR2(fileSuratTugas, 'surat-tugas');
    }

    // 7. Upload Pemeriksaan Tindakan Perbaikan (BARU)
    let keyPemeriksaan = null;
    if (filePemeriksaan && filePemeriksaan.size > 0) {
      keyPemeriksaan = await uploadToR2(filePemeriksaan, 'pemeriksaan-tindakan-perbaikan');
    }

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3);

    // 8. Simpan ke Database
    const db = getDb();
    await db.insert(reports).values({
      title: `${jenisKegiatan} - ${namaPerusahaan}`,
      fileKey: "-", 
      uploadedBy: pembuatLaporan, 
      jenisKegiatan: jenisKegiatan,
      noSurat: noSurat,
      petugasPelaksana: petugasPelaksana,
      namaPerusahaan: namaPerusahaan,
      alamatPerusahaan: alamatPerusahaan,
      tanggal: tanggal,
      deadline: deadlineDate,
      isRewarded: false,
      fotoKegiatan: JSON.stringify(keysKegiatan),
      fotoLokasi: JSON.stringify([]), 
      hasilKegiatan: hasilKegiatan,
      kendala: kendala,
      berkasKegiatan: JSON.stringify(keysBerkasKegiatan),
      berkasPerbaikan: JSON.stringify(keysBerkasPerbaikan),
      statusMonitoring: 'Berkas belum upload',
      
      // SIMPAN KEY FILE BARU DI SINI
      suratTugas: keySuratTugas,
      berkasPemeriksaanTindakanPerbaikan: keyPemeriksaan,
    });

    return Response.json({ status: "success", message: "Berhasil diunggah" });
  } catch (error: any) {
    console.error("Error upload:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}