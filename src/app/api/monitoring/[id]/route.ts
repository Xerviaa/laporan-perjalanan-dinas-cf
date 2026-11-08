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

    // Fungsi upload ke R2
    const uploadToR2 = async (file: File, prefix: string) => {
      const safeName = file.name.replace(/\s+/g, '_');
      const key = `reports/${prefix}/${Date.now()}-${safeName}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    const db = getDb();
    const updateData: any = {};

    // Kita ambil data lama dari database dulu untuk berjaga-jaga
    const existingData = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (existingData.length === 0) {
      return Response.json({ status: "error", message: "Data laporan tidak ditemukan di DB." }, { status: 404 });
    }
    const currentReport = existingData[0];

    // Helper untuk memproses file (Tunggal maupun Array)
    const processFiles = async (formDataKey: string, prefix: string, existingValue: string | null) => {
      const newFiles = formData.getAll(formDataKey) as File[];
      const validNewFiles = newFiles.filter(f => f.size > 0);

      // Jika TIDAK ADA file baru yang diupload, kembalikan nilai lama (Jangan diapa-apakan)
      if (validNewFiles.length === 0) {
        return existingValue;
      }

      // Jika ada file baru, upload ke R2
      const newKeys = [];
      for (const file of validNewFiles) {
        newKeys.push(await uploadToR2(file, prefix));
      }

      // Karena input di frontend biasanya menimpa (bukan menambah), kita ganti dengan file baru
      // Jika field ini menggunakan array (JSON), kita simpan sebagai JSON array
      return newKeys.length === 1 ? newKeys[0] : JSON.stringify(newKeys);
    };

    // Proses ke-4 file
    updateData.suratTugas = await processFiles('suratTugas', 'surat-tugas', currentReport.suratTugas);
    
    // Untuk berkas kegiatan & perbaikan biasanya multi-file (disimpan sebagai JSON string)
    const newBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    if (newBerkasKegiatan.some(f => f.size > 0)) {
        const keys = [];
        for (const file of newBerkasKegiatan) {
            if (file.size > 0) keys.push(await uploadToR2(file, 'berkas-kegiatan'));
        }
        updateData.berkasKegiatan = JSON.stringify(keys);
    } else {
        updateData.berkasKegiatan = currentReport.berkasKegiatan;
    }

    const newBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    if (newBerkasPerbaikan.some(f => f.size > 0)) {
        const keys = [];
        for (const file of newBerkasPerbaikan) {
            if (file.size > 0) keys.push(await uploadToR2(file, 'berkas-perbaikan'));
        }
        updateData.berkasPerbaikan = JSON.stringify(keys);
    } else {
        updateData.berkasPerbaikan = currentReport.berkasPerbaikan;
    }

    updateData.berkasPemeriksaanTindakanPerbaikan = await processFiles('berkasPemeriksaanTindakanPerbaikan', 'pemeriksaan-perbaikan', currentReport.berkasPemeriksaanTindakanPerbaikan);

    // Lakukan Update ke Database
    const updatedData = await db.update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning({ id: reports.id });

    if (updatedData.length === 0) {
      return Response.json({ status: "error", message: "Gagal update database." }, { status: 500 });
    }

    return Response.json({ status: "success", message: "Berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error update monitoring:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}