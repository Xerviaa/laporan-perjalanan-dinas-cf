import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { cache } from "react";

export const getDb = cache(() => {
  // Jika di lokal, kita ambil dari .env. Jika di Cloudflare, dari Hyperdrive
  let connectionString;
  
  try {
    const { env } = getCloudflareContext();
    connectionString = env.HYPERDRIVE?.connectionString;
  } catch (e) {
    // Abaikan error ini saat berjalan di lokal
  }

  // Fallback ke .env jika Hyperdrive tidak tersedia (saat lokal)
  if (!connectionString) {
    connectionString = process.env.DIRECT_URL;
  }

  if (!connectionString) {
    throw new Error("Connection string tidak ditemukan (DIRECT_URL atau Hyperdrive)");
  }

  const pool = new Pool({ connectionString, maxUses: 1 });
  return drizzle({ client: pool, schema });
});