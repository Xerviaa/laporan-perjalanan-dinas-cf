import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Ambil foto kegiatan (bisa banyak)
    const filesKegiatan = formData.getAll('fotoKegiatan') as File[];

    // Ambil data teks & pastikan tidak ada yang undefined
    const pembuatLaporan = (formData.get('pembuatLaporan') as string) || "";
    const jenisKegiatan = (formData.get('jenisKegiatan') as string) || "";
    const noSurat = (formData.get('noSurat') as string) || "";
    const namaPerusahaan = (formData.get('namaPerusahaan') as string) || "";
    const alamatPerusahaan = (formData.get('alamatPerusahaan') as string) || "";
    const tanggal = (formData.get('tanggal') as string) || "";
    const petugasPelaksana = (formData.get('petugasPelaksana') as string) || "";

    // VALIDASI
    if (!pembuatLaporan || !jenisKegiatan || !namaPerusahaan) {
      return Response.json({ status: "error", message: "Data wajib belum lengkap" }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const key = `reports/${prefix}/${Date.now()}-${file.name}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    // Upload Foto Kegiatan
    const keysKegiatan: string[] = [];
    for (const file of filesKegiatan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'foto-kegiatan');
        keysKegiatan.push(key);
      }
    }

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3);

    // Simpan ke Database
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
    });

    return Response.json({ status: "success", message: "Berhasil diunggah" });
  } catch (error: any) {
    console.error("Error upload:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}