import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { inArray } from "drizzle-orm";
import { zipSync } from "fflate";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!ids || ids.length === 0) {
      return Response.json({ error: "Tidak ada file yang dipilih" }, { status: 400 });
    }

    const db = await getDb(process.env.DATABASE_URL!);
    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    // Ambil data dari database berdasarkan ID yang dipilih
    const selectedReports = await db.select().from(reports).where(inArray(reports.id, ids));

    const zipData: Record<string, Uint8Array> = {};

    // Loop setiap laporan, ambil dari R2, masukkan ke dalam ZIP
    for (const report of selectedReports) {
      const object = await bucket.get(report.fileKey);
      if (object) {
        const arrayBuffer = await object.arrayBuffer();
        // Beri nama file di dalam ZIP
        const fileName = `${report.title.replace(/[^a-z0-9]/gi, '_')}.${report.fileKey.split('.').pop()}`;
        zipData[fileName] = new Uint8Array(arrayBuffer);
      }
    }

    // Buat file ZIP
    const zipped = zipSync(zipData);

    // Kembalikan sebagai file unduhan
    return new Response(zipped, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Laporan_Dinas_Terpilih.zip"`,
      },
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}