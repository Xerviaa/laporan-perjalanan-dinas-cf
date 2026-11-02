import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const forceDownload = searchParams.get("download") === "true";

  if (!key) return new Response("Key tidak ditemukan", { status: 400 });

  try {
    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;
    const object = await bucket.get(key);
    
    if (!object) return new Response("File tidak ditemukan di R2", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    const contentType = headers.get("content-type") || "";
    const isViewable = contentType.includes("pdf") || contentType.includes("image/");

    // Logika: Paksa unduh jika dipanggil dengan &download=true
    if (forceDownload || !isViewable) {
      headers.set("Content-Disposition", `attachment; filename="${key.split('/').pop()}"`);
    } else {
      headers.set("Content-Disposition", `inline; filename="${key.split('/').pop()}"`);
    }

    return new Response(object.body, { headers });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}