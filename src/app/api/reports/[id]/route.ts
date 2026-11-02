import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Menunggu parameter ID dibaca oleh Next.js
    const resolvedParams = await params; 
    const id = resolvedParams.id;

    if (!id) {
      return Response.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const db = await getDb(process.env.DATABASE_URL!);
    
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

    const { title, tanggal } = await request.json();
    const db = await getDb(process.env.DATABASE_URL!);
    
    await db.update(reports)
      .set({ title, tanggal })
      .where(eq(reports.id, Number(id)));

    return Response.json({ status: "success", message: "Laporan berhasil diupdate" });
  } catch (error: any) {
    console.error("Gagal mengedit:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}