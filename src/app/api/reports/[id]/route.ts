import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    const id = resolvedParams.id;

    if (!id) {
      return Response.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // Panggil getDb tanpa parameter (menggunakan Hyperdrive)
    const db = getDb();
    
    // Hapus dari database
    await db.delete(reports).where(eq(reports.id, Number(id)));

    return Response.json({ status: "success", message: "Laporan berhasil dihapus" });
  } catch (error: any) {
    console.error("Gagal menghapus:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    const id = resolvedParams.id;

    if (!id) {
      return Response.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // Ambil data yang dikirim dari form edit (namaPerusahaan dan tanggal)
    const { namaPerusahaan, tanggal } = await request.json();
    
    const db = getDb();
    
    // Update namaPerusahaan dan tanggal
    await db.update(reports)
      .set({ namaPerusahaan, tanggal })
      .where(eq(reports.id, Number(id)));

    return Response.json({ status: "success", message: "Laporan berhasil diupdate" });
  } catch (error: any) {
    console.error("Gagal mengedit:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}