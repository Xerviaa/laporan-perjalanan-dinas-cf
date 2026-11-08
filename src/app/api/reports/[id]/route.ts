import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: Mengambil data berdasarkan ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // KEMBALIKAN KE NUMBER
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

// DELETE: Menghapus data berdasarkan ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; 
    // KEMBALIKAN KE NUMBER
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