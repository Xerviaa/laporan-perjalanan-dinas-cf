import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { zipSync } from "fflate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const type = searchParams.get("type"); // 'berkas' atau 'foto'

  if (!id) return new Response("ID tidak valid", { status: 400 });

  try {
    const db = getDb();
    const result = await db.select().from(reports).where(eq(reports.id, id));
    const report = result[0];

    if (!report) return new Response("Laporan tidak ditemukan", { status: 404 });

    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;

    const filesToDownload: string[] = [];

    if (type === 'foto' && report.fotoKegiatan) {
      const parsed = JSON.parse(report.fotoKegiatan);
      if (Array.isArray(parsed)) filesToDownload.push(...parsed);
    } else if (type === 'berkas') {
      if (report.suratTugas) filesToDownload.push(report.suratTugas);
      if (report.berkasKegiatan) {
        const parsed = JSON.parse(report.berkasKegiatan);
        if (Array.isArray(parsed)) filesToDownload.push(...parsed);
      }
      if (report.berkasPerbaikan) {
        const parsed = JSON.parse(report.berkasPerbaikan);
        if (Array.isArray(parsed)) filesToDownload.push(...parsed);
      }
      if (report.berkasPemeriksaanTindakanPerbaikan) filesToDownload.push(report.berkasPemeriksaanTindakanPerbaikan);
    }

    if (filesToDownload.length === 0) {
      return new Response("Tidak ada file untuk diunduh", { status: 404 });
    }

    const zipData: Record<string, Uint8Array> = {};
    for (const key of filesToDownload) {
      const object = await bucket.get(key);
      if (object) {
        const arrayBuffer = await object.arrayBuffer();
        zipData[key.split('/').pop() || key] = new Uint8Array(arrayBuffer);
      }
    }

    const zipped = zipSync(zipData);

    return new Response(zipped, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Laporan_${id}_${type}.zip"`,
      },
    });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}