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
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) return Response.json({ error: "ID tidak valid" }, { status: 400 });

    const db = getDb();
    const result = await db.select().from(reports).where(eq(reports.id, id));

    if (result.length === 0) {
      return Response.json({ status: "error", message: "Laporan tidak ditemukan" }, { status: 404 });
    }
    return Response.json({ status: "success", data: result[0] });
  } catch (error: any) {
    console.error("Gagal mengambil data:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Memperbarui data laporan (termasuk upload berkas)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) return Response.json({ status: "error", message: "ID tidak valid" }, { status: 400 });

    const formData = await request.formData();
    
    // Ambil data teks
    const jenisKegiatan = formData.get('jenisKegiatan') as string || '';
    const noSurat = formData.get('noSurat') as string || '';
    const namaPerusahaan = formData.get('namaPerusahaan') as string || '';
    const alamatPerusahaan = formData.get('alamatPerusahaan') as string || '';
    const tanggal = formData.get('tanggal') as string || '';
    const petugasPelaksana = formData.get('petugasPelaksana') as string || '';
    const hasilKegiatan = formData.get('hasilKegiatan') as string || '';
    const kendala = formData.get('kendala') as string || '';

    // Ambil file (jika ada yang di-upload)
    const fileSuratTugas = formData.get('suratTugas') as File | null;
    const fileBerkasKegiatan = formData.get('berkasKegiatan') as File | null;
    const fileBerkasPerbaikan = formData.get('berkasPerbaikan') as File | null;
    const filePemeriksaan = formData.get('berkasPemeriksaanTindakanPerbaikan') as File | null;

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const key = `reports/${prefix}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await bucket.put(key, file.slice(), { httpMetadata: { contentType: file.type } });
      return key;
    };

    const db = getDb();
    const existingData = await db.select().from(reports).where(eq(reports.id, id));
    
    if (existingData.length === 0) {
      return Response.json({ status: "error", message: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const currentReport = existingData[0];
    const updateData: any = {
      jenisKegiatan: jenisKegiatan || currentReport.jenisKegiatan,
      noSurat: noSurat || currentReport.noSurat,
      namaPerusahaan: namaPerusahaan || currentReport.namaPerusahaan,
      alamatPerusahaan: alamatPerusahaan || currentReport.alamatPerusahaan,
      tanggal: tanggal || currentReport.tanggal,
      petugasPelaksana: petugasPelaksana || currentReport.petugasPelaksana,
      hasilKegiatan: hasilKegiatan || currentReport.hasilKegiatan,
      kendala: kendala || currentReport.kendala,
    };

    // Proses upload file jika ada file baru
    if (fileSuratTugas && fileSuratTugas.size > 0) {
      updateData.suratTugas = await uploadToR2(fileSuratTugas, 'surat-tugas');
    }
    if (fileBerkasKegiatan && fileBerkasKegiatan.size > 0) {
      updateData.berkasKegiatan = JSON.stringify([await uploadToR2(fileBerkasKegiatan, 'berkas-kegiatan')]);
    }
    if (fileBerkasPerbaikan && fileBerkasPerbaikan.size > 0) {
      updateData.berkasPerbaikan = JSON.stringify([await uploadToR2(fileBerkasPerbaikan, 'berkas-perbaikan')]);
    }
    if (filePemeriksaan && filePemeriksaan.size > 0) {
      updateData.berkasPemeriksaanTindakanPerbaikan = await uploadToR2(filePemeriksaan, 'pemeriksaan-tindakan-perbaikan');
    }

    await db.update(reports).set(updateData).where(eq(reports.id, id));
    
    return Response.json({ status: "success", message: "Laporan berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error update report:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}

// DELETE: Menghapus data berdasarkan ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) return Response.json({ error: "ID tidak valid" }, { status: 400 });

    const db = getDb();
    
    const deletedData = await db
      .delete(reports)
      .where(eq(reports.id, id))
      .returning({ id: reports.id });

    if (deletedData.length === 0) {
      return Response.json({ 
        status: "error", 
        message: `Gagal menghapus. Data laporan dengan ID ${id} tidak ditemukan.` 
      }, { status: 404 });
    }

    return Response.json({ status: "success", message: "Laporan berhasil dihapus" });
  } catch (error: any) {
    console.error("Gagal menghapus:", error);
    return Response.json({ 
      status: "error", 
      message: `Gagal menghapus: ${error.message}` 
    }, { status: 500 });
  }
}