import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
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

    // =============================================
    // FUNGSI PEMBERSIH DATA (SUPPORT STRING & ARRAY)
    // =============================================
    const extractCleanFiles = (data: any): string[] => {
      if (!data) return [];
      
      let str = String(data).trim();
      
      // Jika formatnya JSON Array (mengandung [ dan ])
      if (str.startsWith('[') && str.endsWith(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
          }
        } catch (e) { }
      }
      
      // Jika formatnya string biasa (hanya 1 file)
      // Hapus sisa karakter [, ], " jika ada
      str = str.replace(/[\[\]"]/g, '').trim();
      
      // Pisahkan berdasarkan koma (jika ada lebih dari 1)
      return str.split(',').map(s => s.trim()).filter(Boolean);
    };

    // =============================================
    // 1. AMBIL DATA LAMA
    // =============================================
    const oldSuratTugas = extractCleanFiles(formData.get('oldSuratTugas'));
    const oldBerkasKegiatan = extractCleanFiles(formData.get('oldBerkasKegiatan'));
    const oldBerkasPerbaikan = extractCleanFiles(formData.get('oldBerkasPerbaikan'));
    const oldBerkasPemeriksaan = extractCleanFiles(formData.get('oldBerkasPemeriksaan'));

    // =============================================
    // 2. AMBIL DAFTAR FILE YANG AKAN DIHAPUS
    // =============================================
    const filesToDeleteStr = formData.get('filesToDelete') as string;
    const filesToDelete: string[] = filesToDeleteStr ? extractCleanFiles(filesToDeleteStr) : [];

    // =============================================
    // 3. PROSES SURAT TUGAS
    // =============================================
    const filesSuratTugas = formData.getAll('suratTugas') as File[];
    let finalSuratTugas: string[] = oldSuratTugas.filter((key) => !filesToDelete.includes(key));
    
    for (const file of filesSuratTugas) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'surat-tugas');
        finalSuratTugas.push(key);
      }
    }
    // Simpan sebagai JSON Array
    updateData.suratTugas = finalSuratTugas.length > 0 ? JSON.stringify(finalSuratTugas) : null;

    // =============================================
    // 4. PROSES BERKAS KEGIATAN
    // =============================================
    let finalBerkasKegiatan: string[] = oldBerkasKegiatan.filter((key) => !filesToDelete.includes(key));
    
    const filesBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    for (const file of filesBerkasKegiatan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-kegiatan');
        finalBerkasKegiatan.push(key);
      }
    }
    updateData.berkasKegiatan = finalBerkasKegiatan.length > 0 ? JSON.stringify(finalBerkasKegiatan) : null;

    // =============================================
    // 5. PROSES BERKAS PERBAIKAN
    // =============================================
    let finalBerkasPerbaikan: string[] = oldBerkasPerbaikan.filter((key) => !filesToDelete.includes(key));
    
    const filesBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    for (const file of filesBerkasPerbaikan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-perbaikan');
        finalBerkasPerbaikan.push(key);
      }
    }
    updateData.berkasPerbaikan = finalBerkasPerbaikan.length > 0 ? JSON.stringify(finalBerkasPerbaikan) : null;

    // =============================================
    // 6. PROSES PEMERIKSAAN TINDAKAN PERBAIKAN
    // =============================================
    let finalBerkasPemeriksaan: string[] = oldBerkasPemeriksaan.filter((key) => !filesToDelete.includes(key));
    
    const filesPemeriksaan = formData.getAll('berkasPemeriksaanTindakanPerbaikan') as File[];
    for (const file of filesPemeriksaan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'pemeriksaan-perbaikan');
        finalBerkasPemeriksaan.push(key);
      }
    }
    updateData.berkasPemeriksaanTindakanPerbaikan = finalBerkasPemeriksaan.length > 0 ? JSON.stringify(finalBerkasPemeriksaan) : null;

    // =============================================
    // 7. UPDATE DATABASE
    // =============================================
    await db.update(reports)
      .set(updateData)
      .where(eq(reports.id, id));

    return Response.json({ status: "success", message: "Berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error update monitoring:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}