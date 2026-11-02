import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Ambil file utama (dokumen)
    const fileDokumen = formData.get('fileDokumen') as File;
    
    // Ambil file foto (bisa banyak)
    const filesKegiatan = formData.getAll('fotoKegiatan') as File[];
    const filesLokasi = formData.getAll('fotoLokasi') as File[];

    // Ambil data teks
    const pembuatLaporan = formData.get('pembuatLaporan') as string;
    const jenisKegiatan = formData.get('jenisKegiatan') as string;
    const noSurat = formData.get('noSurat') as string;
    const namaPerusahaan = formData.get('namaPerusahaan') as string;
    const alamatPerusahaan = formData.get('alamatPerusahaan') as string;
    const tanggal = formData.get('tanggal') as string;
    const petugasPelaksana = formData.get('petugasPelaksana') as string;

    if (!fileDokumen || !pembuatLaporan || !jenisKegiatan || !namaPerusahaan) {
      return Response.json({ status: "error", message: "Data wajib belum lengkap" }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    // --- FUNGSI BANTU UPLOAD KE R2 ---
    const uploadToR2 = async (file: File, prefix: string) => {
      const key = `reports/${prefix}/${Date.now()}-${file.name}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    // 1. Upload Dokumen Utama
    const keyDokumen = await uploadToR2(fileDokumen, 'dokumen');

    // 2. Upload Foto Kegiatan (Loop)
    const keysKegiatan: string[] = [];
    for (const file of filesKegiatan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'foto-kegiatan');
        keysKegiatan.push(key);
      }
    }

    // 3. Upload Foto Lokasi (Loop)
    const keysLokasi: string[] = [];
    for (const file of filesLokasi) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'foto-lokasi');
        keysLokasi.push(key);
      }
    }

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3);

    const db = await getDb(process.env.DATABASE_URL!);
    await db.insert(reports).values({
      title: `${jenisKegiatan} - ${namaPerusahaan}`,
      fileKey: keyDokumen,
      uploadedBy: pembuatLaporan,
      jenisKegiatan: jenisKegiatan,
      noSurat: noSurat,
      petugasPelaksana: petugasPelaksana,
      namaPerusahaan: namaPerusahaan,
      alamatPerusahaan: alamatPerusahaan,
      tanggal: tanggal,
      deadline: deadlineDate,
      isRewarded: false,
      // Simpan array keys sebagai JSON string
      fotoKegiatan: JSON.stringify(keysKegiatan),
      fotoLokasi: JSON.stringify(keysLokasi),
    });

    return Response.json({ status: "success", message: "Berhasil diunggah" });
  } catch (error: any) {
    console.error("Error upload:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}