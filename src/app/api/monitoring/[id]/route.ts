import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const formData = await request.formData();

    const statusMonitoring = formData.get('statusMonitoring') as string;
    const filesPerbaikan = formData.getAll('berkasPerbaikan') as File[];

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const uploadToR2 = async (file: File, prefix: string) => {
      const key = `reports/${prefix}/${Date.now()}-${file.name}`;
      await bucket.put(key, file.slice(), {
        httpMetadata: { contentType: file.type },
      });
      return key;
    };

    // Upload berkas perbaikan jika ada file baru
    const keysBerkasPerbaikan: string[] = [];
    for (const file of filesPerbaikan) {
      if (file.size > 0) {
        const key = await uploadToR2(file, 'berkas-perbaikan');
        keysBerkasPerbaikan.push(key);
      }
    }

    const db = getDb();
    
    // Siapkan data yang akan diupdate
    const updateData: any = { statusMonitoring: statusMonitoring };
    
    // Jika ada file baru, timpa array berkas_perbaikan
    if (keysBerkasPerbaikan.length > 0) {
      updateData.berkasPerbaikan = JSON.stringify(keysBerkasPerbaikan);
    }

    await db.update(reports)
      .set(updateData)
      .where(eq(reports.id, id));

    return Response.json({ status: "success", message: "Berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error update monitoring:", error);
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
}