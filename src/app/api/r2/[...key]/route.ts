import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.key.join('/');
    
    const { env } = getCloudflareContext();
    const bucket = (env as any).MY_BUCKET as R2Bucket;
    
    if (!bucket) {
      console.error("R2 Bucket MY_BUCKET tidak ditemukan!");
      return new Response("Konfigurasi server error", { status: 500 });
    }

    const object = await bucket.get(key);
    
    if (!object) {
      console.warn(`File tidak ditemukan di R2: ${key}`);
      return new Response("File not found", { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    // Tambahkan header cache agar lebih cepat
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    
    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error("Error R2 API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}