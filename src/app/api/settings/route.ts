import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const db = await getDb(process.env.DATABASE_URL!);
    const data = await db.select().from(settings).limit(1);
    return Response.json({ logoUrl: data[0]?.logoUrl || null });
  } catch (error: any) {
    return Response.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      return Response.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const key = `logo-instansi-${Date.now()}-${safeFileName}`;
    
    // --- TRIK AGAR TIDAK ERROR DI LOKAL ---
    try {
      const { env } = getCloudflareContext();
      const bucket = (env as any).MY_BUCKET as R2Bucket;
      
      if (bucket) {
        await bucket.put(key, file.slice(), { httpMetadata: { contentType: file.type } });
      } else {
        console.warn("R2 Bucket tidak ditemukan di lokal. Melewati proses upload file.");
      }
    } catch (e) {
      console.warn("Gagal akses R2 (mungkin sedang di lokal). Lanjut simpan ke DB.");
    }

    // Simpan URL/Key ke Database
    const db = await getDb(process.env.DATABASE_URL!);
    const existing = await db.select().from(settings).limit(1);
    
    if (existing.length > 0) {
      await db.update(settings).set({ logoUrl: key }).where(eq(settings.id, existing[0].id));
    } else {
      await db.insert(settings).values({ logoUrl: key });
    }

    return Response.json({ status: "success", key });
  } catch (error: any) {
    console.error("DETAIL ERROR:", error); 
    return Response.json({ error: error.message || "Gagal upload" }, { status: 500 });
  }
}