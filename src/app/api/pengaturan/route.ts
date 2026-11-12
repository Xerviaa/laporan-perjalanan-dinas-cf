import { getDb } from "@/db";
import { pengaturanForm } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: Mengambil semua pengaturan form
export async function GET() {
  try {
    const db = getDb();
    const data = await db.select().from(pengaturanForm);
    return Response.json({ status: "success", data });
  } catch (error: any) {
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}

// PUT: Mengubah pengaturan (bisa banyak sekaligus)
export async function PUT(request: Request) {
  try {
    const body = await request.json(); // Array of { tipe, nilai }
    const db = getDb();
    
    for (const item of body) {
      await db.update(pengaturanForm)
        .set({ nilai: item.nilai })
        .where(eq(pengaturanForm.tipe, item.tipe));
    }
    return Response.json({ status: "success", message: "Pengaturan diperbarui" });
  } catch (error: any) {
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}