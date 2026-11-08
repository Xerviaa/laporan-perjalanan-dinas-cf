import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    // KEMBALIKAN KE NUMBER KARENA DATABASE ANDA INTEGER
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
    const updateData: any = {};

    const extractCleanFiles = (data: any): string[] => {
      if (!data) return [];
      let str = String(data).trim();
      if (str.startsWith('[') && str.endsWith(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
          }
        } catch (e) { }
      }
      str = str.replace(/[\[\]"]/g, '').trim();
      return str.split(',').map(s => s.trim()).filter(Boolean);
    };

    const oldSuratTugas = extractCleanFiles(formData.get('oldSuratTugas'));
    const oldBerkasKegiatan = extractCleanFiles(formData.get('oldBerkasKegiatan'));
    const oldBerkasPerbaikan = extractCleanFiles(formData.get('oldBerkasPerbaikan'));
    const oldBerkasPemeriksaan = extractCleanFiles(formData.get('oldBerkasPemeriksaan'));

    const filesToDeleteStr = formData.get('filesToDelete') as string;
    const filesToDelete: string[] = filesToDeleteStr ? extractCleanFiles(filesToDeleteStr) : [];

    // 1. SURAT TUGAS
    const filesSuratTugas = formData.getAll('suratTugas') as File[];
    let finalSuratTugas: string[] = oldSuratTugas.filter((key) => !filesToDelete.includes(key));
    for (const file of filesSuratTugas) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'surat-tugas');
        finalSuratTugas.push(key);
      }
    }
    updateData.suratTugas = finalSuratTugas.length > 0 ? JSON.stringify(finalSuratTugas) : null;

    // 2. BERKAS KEGIATAN
    let finalBerkasKegiatan: string[] = oldBerkasKegiatan.filter((key) => !filesToDelete.includes(key));
    const filesBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    for (const file of filesBerkasKegiatan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-kegiatan');
        finalBerkasKegiatan.push(key);
      }
    }
    updateData.berkasKegiatan = finalBerkasKegiatan.length > 0 ? JSON.stringify(finalBerkasKegiatan) : null;

    // 3. BERKAS PERBAIKAN
    let finalBerkasPerbaikan: string[] = oldBerkasPerbaikan.filter((key) => !filesToDelete.includes(key));
    const filesBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    for (const file of filesBerkasPerbaikan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-perbaikan');
        finalBerkasPerbaikan.push(key);
      }
    }
    updateData.berkasPerbaikan = finalBerkasPerbaikan.length > 0 ? JSON.stringify(finalBerkasPerbaikan) : null;

    // 4. PEMERIKSAAN
    let finalBerkasPemeriksaan: string[] = oldBerkasPemeriksaan.filter((key) => !filesToDelete.includes(key));
    const filesPemeriksaan = formData.getAll('berkasPemeriksaanTindakanPerbaikan') as File[];
    for (const file of filesPemeriksaan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'pemeriksaan-perbaikan');
        finalBerkasPemeriksaan.push(key);
      }
    }
    updateData.berkasPemeriksaanTindakanPerbaikan = finalBerkasPemeriksaan.length > 0 ? JSON.stringify(finalBerkasPemeriksaan) : null;

    // --- PROSES UPDATE DATABASE ---
    const updatedData = await db.update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning({ id: reports.id });

    if (updatedData.length === 0) {
      return Response.json({ 
        status: "error", 
        message: `Gagal menyimpan. Laporan dengan ID ${id} tidak ditemukan.` 
      }, { status: 404 });
    }

    return Response.json({ status: "success", message: "Berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error update monitoring:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}