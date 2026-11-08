import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id); 
    
    if (isNaN(id)) {
      return Response.json({ status: "error", message: "ID tidak valid" }, { status: 400 });
    }

    const formData = await request.formData();
    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const safeName = file.name.replace(/\s+/g, '_');
      const key = `reports/${prefix}/${Date.now()}-${safeName}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    const db = getDb();
    
    // 1. AMBIL DATA LAMA LANGSUNG DARI DATABASE (Anti-Gagal)
    const existingData = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (existingData.length === 0) {
      return Response.json({ status: "error", message: "Laporan tidak ditemukan di DB." }, { status: 404 });
    }
    const currentReport = existingData[0];

    const updateData: any = {};

    // 2. PROSES SURAT TUGAS (Tunggal)
    const newSuratTugas = formData.getAll('suratTugas') as File[];
    if (newSuratTugas.length > 0 && newSuratTugas[0].size > 0) {
      updateData.suratTugas = await uploadToR2(newSuratTugas[0], 'surat-tugas');
    } else {
      // Jika tidak ada file baru, gunakan data lama dari DB
      updateData.suratTugas = currentReport.suratTugas; 
    }

    // 3. PROSES BERKAS KEGIATAN (Array/JSON)
    const newBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    if (newBerkasKegiatan.length > 0 && newBerkasKegiatan[0].size > 0) {
      const keys = [];
      for (const file of newBerkasKegiatan) {
        if (file.size > 0) keys.push(await uploadToR2(file, 'berkas-kegiatan'));
      }
      updateData.berkasKegiatan = JSON.stringify(keys);
    } else {
      updateData.berkasKegiatan = currentReport.berkasKegiatan;
    }

    // 4. PROSES BERKAS PERBAIKAN (Array/JSON)
    const newBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    if (newBerkasPerbaikan.length > 0 && newBerkasPerbaikan[0].size > 0) {
      const keys = [];
      for (const file of newBerkasPerbaikan) {
        if (file.size > 0) keys.push(await uploadToR2(file, 'berkas-perbaikan'));
      }
      updateData.berkasPerbaikan = JSON.stringify(keys);
    } else {
      updateData.berkasPerbaikan = currentReport.berkasPerbaikan;
    }

    // 5. PROSES PEMERIKSAAN TINDAKAN PERBAIKAN (Tunggal)
    const newPemeriksaan = formData.getAll('berkasPemeriksaanTindakanPerbaikan') as File[];
    if (newPemeriksaan.length > 0 && newPemeriksaan[0].size > 0) {
      updateData.berkasPemeriksaanTindakanPerbaikan = await uploadToR2(newPemeriksaan[0], 'pemeriksaan-perbaikan');
    } else {
      updateData.berkasPemeriksaanTindakanPerbaikan = currentReport.berkasPemeriksaanTindakanPerbaikan;
    }

    // 6. UPDATE DATABASE
    await db.update(reports).set(updateData).where(eq(reports.id, id));

    return Response.json({ status: "success", message: "Berhasil diperbarui" });
    
  } catch (error: any) {
    console.error("Error update monitoring:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}