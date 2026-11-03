// Deklarasi tipe untuk environment Cloudflare
type R2Bucket = any; 
type Hyperdrive = any;

interface CloudflareEnv {
  MY_BUCKET: R2Bucket;
  HYPERDRIVE: Hyperdrive;
}