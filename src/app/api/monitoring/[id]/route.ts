import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id); 
    
    if (isNaN(id)) return Response.json({ status: "error", message: "ID tidak valid" }, { status: 400 });

    const formData = await request.formData();
    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const safeName = file.name.replace(/\s+/g, '_');
      const key = `reports/${prefix}/${Date.now()}-${safeName}`;
      await bucket.put(key, file.slice(), { httpMetadata: { contentType: file.type } });
      return key;
    };

    const db = getDb();
    
    const existingData = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (existingData.length === 0) return Response.json({ status: "error", message: "Laporan tidak ditemukan." }, { status: 404 });
    
    const currentReport = existingData[0];
    const updateData: any = {};

    // 1. SURAT TUGAS
    const newSuratTugas = formData.getAll('suratTugas') as File[];
    if (newSuratTugas.length > 0 && newSuratTugas[0].size > 0) {
      updateData.suratTugas = await uploadToR2(newSuratTugas[0], 'surat-tugas');
    } else { updateData.suratTugas = currentReport.suratTugas; }

    // 2. BERKAS KEGIATAN
    const newBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    if (newBerkasKegiatan.length > 0 && newBerkasKegiatan[0].size > 0) {
      const keys = [];
      for (const file of newBerkasKegiatan) { if (file.size > 0) keys.push(await uploadToR2(file, 'berkas-kegiatan')); }
      updateData.berkasKegiatan = JSON.stringify(keys);
    } else { updateData.berkasKegiatan = currentReport.berkasKegiatan; }

    // 3. BERKAS PERBAIKAN
    const newBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    if (newBerkasPerbaikan.length > 0 && newBerkasPerbaikan[0].size > 0) {
      const keys = [];
      for (const file of newBerkasPerbaikan) { if (file.size > 0) keys.push(await uploadToR2(file, 'berkas-perbaikan')); }
      updateData.berkasPerbaikan = JSON.stringify(keys);
    } else { updateData.berkasPerbaikan = currentReport.berkasPerbaikan; }

    // 4. PEMERIKSAAN TINDAKAN PERBAIKAN
    const newPemeriksaan = formData.getAll('berkasPemeriksaanTindakanPerbaikan') as File[];
    if (newPemeriksaan.length > 0 && newPemeriksaan[0].size > 0) {
      updateData.berkasPemeriksaanTindakanPerbaikan = await uploadToR2(newPemeriksaan[0], 'pemeriksaan-perbaikan');
    } else { updateData.berkasPemeriksaanTindakanPerbaikan = currentReport.berkasPemeriksaanTindakanPerbaikan; }

    // ==========================================================
    // 5. PROSES FOTO KEGIATAN (HAPUS & TAMBAH)
    // ==========================================================
    const fotoToDeleteStr = formData.get('fotoToDelete') as string;
    let fotoToDelete: string[] = [];
    if (fotoToDeleteStr) {
      try { fotoToDelete = JSON.parse(fotoToDeleteStr); } catch (e) {}
    }

    let existingFoto: string[] = [];
    if (currentReport.fotoKegiatan) {
      try {
        const parsed = JSON.parse(currentReport.fotoKegiatan);
        if (Array.isArray(parsed)) existingFoto = parsed;
      } catch (e) {}
    }

    // Filter foto lama: buang yang ada di daftar fotoToDelete
    const fotoSetelahDihapus = existingFoto.filter(key => !fotoToDelete.includes(key));

    // Upload foto baru
    const newFotoFiles = formData.getAll('foto') as File[];
    const newFotoKeys: string[] = [];
    for (const file of newFotoFiles) {
      if (file.size > 0) {
        newFotoKeys.push(await uploadToR2(file, 'foto-kegiatan'));
      }
    }

    // Gabungkan foto yang tersisa + foto baru
    if (fotoSetelahDihapus.length > 0 || newFotoKeys.length > 0) {
      updateData.fotoKegiatan = JSON.stringify([...fotoSetelahDihapus, ...newFotoKeys]);
    } else {
      updateData.fotoKegiatan = '[]';
    }
    // ==========================================================

    // EKSEKUSI UPDATE
    const result = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning({ id: reports.id });

    if (result.length === 0) {
      return Response.json({ 
        status: "error", 
        message: "Gagal menyimpan ke database. Data tidak ditemukan atau D1 timeout." 
      }, { status: 500 });
    }

    return Response.json({ status: "success", message: "Berhasil diperbarui" });
    
  } catch (error: any) {
    console.error("Error update monitoring:", error);
    return Response.json({ status: "error", message: `Error Database: ${error.message}` }, { status: 500 });
  }
}