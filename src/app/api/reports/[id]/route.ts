import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// GET: Mengambil data berdasarkan ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) return Response.json({ error: "ID tidak valid" }, { status: 400 });

    const db = getDb();
    const result = await db.select().from(reports).where(eq(reports.id, Number(id)));

    if (result.length === 0) {
      return Response.json({ status: "error", message: "Laporan tidak ditemukan" }, { status: 404 });
    }
    return Response.json({ status: "success", data: result[0] });
  } catch (error: any) {
    console.error("Gagal mengambil data:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Menghapus data berdasarkan ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    const id = resolvedParams.id;
    if (!id) return Response.json({ error: "ID tidak valid" }, { status: 400 });

    const db = getDb();
    await db.delete(reports).where(eq(reports.id, Number(id)));
    return Response.json({ status: "success", message: "Laporan berhasil dihapus" });
  } catch (error: any) {
    console.error("Gagal menghapus:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Mengupdate data berdasarkan ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    const id = resolvedParams.id;
    if (!id) return Response.json({ error: "ID tidak valid" }, { status: 400 });

    const formData = await request.formData();
    
    // Ambil SEMUA data teks, termasuk petugasPelaksana
    const namaPerusahaan = (formData.get('namaPerusahaan') as string) || "";
    const alamatPerusahaan = (formData.get('alamatPerusahaan') as string) || "";
    const jenisKegiatan = (formData.get('jenisKegiatan') as string) || "";
    const tanggal = (formData.get('tanggal') as string) || "";
    const noSurat = (formData.get('noSurat') as string) || "";
    const petugasPelaksana = (formData.get('petugasPelaksana') as string) || "";
    const hasilKegiatan = (formData.get('hasilKegiatan') as string) || "";
    const kendala = (formData.get('kendala') as string) || "";

    const updateData: any = {
      namaPerusahaan,
      alamatPerusahaan,
      jenisKegiatan,
      tanggal,
      noSurat,
      petugasPelaksana, // Pastikan ini masuk
      hasilKegiatan,
      kendala,
    };

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const key = `reports/${prefix}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    // Update file hanya jika ada file baru
    const fileSuratTugas = formData.get('suratTugas') as File | null;
    if (fileSuratTugas && fileSuratTugas.size > 0) {
      updateData.suratTugas = await uploadToR2(fileSuratTugas, 'surat-tugas');
    }

    const filesBerkasKegiatan = formData.getAll('berkasKegiatan') as File[];
    if (filesBerkasKegiatan.length > 0 && filesBerkasKegiatan[0].size > 0) {
      const keys = [];
      for (const file of filesBerkasKegiatan) {
        keys.push(await uploadToR2(file, 'berkas-kegiatan'));
      }
      updateData.berkasKegiatan = JSON.stringify(keys);
    }

    const filesBerkasPerbaikan = formData.getAll('berkasPerbaikan') as File[];
    if (filesBerkasPerbaikan.length > 0 && filesBerkasPerbaikan[0].size > 0) {
      const keys = [];
      for (const file of filesBerkasPerbaikan) {
        keys.push(await uploadToR2(file, 'berkas-perbaikan'));
      }
      updateData.berkasPerbaikan = JSON.stringify(keys);
    }

    const filePemeriksaan = formData.get('berkasPemeriksaanTindakanPerbaikan') as File | null;
    if (filePemeriksaan && filePemeriksaan.size > 0) {
      updateData.berkasPemeriksaanTindakanPerbaikan = await uploadToR2(filePemeriksaan, 'pemeriksaan-tindakan-perbaikan');
    }

    const db = getDb();
    await db.update(reports).set(updateData).where(eq(reports.id, Number(id)));

    return Response.json({ status: "success", message: "Laporan berhasil diupdate" });
  } catch (error: any) {
    console.error("Gagal mengedit:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}