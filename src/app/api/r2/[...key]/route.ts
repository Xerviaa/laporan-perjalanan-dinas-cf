import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const resolvedParams = await params;
  const key = resolvedParams.key.join('/');
  
  const { env } = getCloudflareContext();
  const bucket = (env as any).MY_BUCKET as R2Bucket;
  
  const object = await bucket.get(key);
  
  if (!object) {
    return new Response("File not found", { status: 404 });
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  
  return new Response(object.body, { headers });
}