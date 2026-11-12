import { getDb } from "@/db";
import { targets } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: Mengambil semua target
export async function GET() {
  try {
    const db = getDb();
    const data = await db.select().from(targets);
    return Response.json({ status: "success", data });
  } catch (error: any) {
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}

// PUT: Mengubah target berdasarkan ID
export async function PUT(request: Request) {
  try {
    const { id, target } = await request.json();
    
    // Paksa konversi ke angka murni
    const targetId = parseInt(id, 10);
    const targetValue = parseInt(target, 10);

    if (isNaN(targetId) || isNaN(targetValue)) {
      return Response.json({ status: "error", message: "Format angka tidak valid" }, { status: 400 });
    }

    const db = getDb();
    
    // Lakukan update dan minta database mengembalikan data yang terupdate
    const result = await db.update(targets)
      .set({ target: targetValue })
      .where(eq(targets.id, targetId))
      .returning({ id: targets.id, newTarget: targets.target });

    // Jika array kosong, berarti ID tidak ditemukan atau gagal update
    if (result.length === 0) {
      return Response.json({ status: "error", message: "Gagal update. ID tidak ditemukan." }, { status: 404 });
    }

    return Response.json({ 
      status: "success", 
      message: "Target diperbarui", 
      updatedData: result[0] 
    });
  } catch (error: any) {
    console.error("Error update target:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}