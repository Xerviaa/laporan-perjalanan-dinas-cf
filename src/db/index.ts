import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getDb = cache(() => {
  let connectionString: string | undefined;

  try {
    const { env } = getCloudflareContext() as { env: any };
    const hdConn: string | undefined = env?.HYPERDRIVE?.connectionString;

    // Gunakan HYPERDRIVE hanya jika bukan dummy lokal (127.0.0.1 / localhost)
    if (hdConn && !hdConn.includes("127.0.0.1") && !hdConn.includes("localhost")) {
      connectionString = hdConn;
      console.log("Menggunakan koneksi: HYPERDRIVE");
    }
  } catch (e) {
    console.log("Gagal memuat Cloudflare context, fallback ke lokal/env");
  }

  // Fallback ke DIRECT_URL / DATABASE_URL dari .env (Supabase)
  if (!connectionString) {
    connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log("Menggunakan koneksi: DIRECT_URL / Environment");
  }

  if (!connectionString) {
    throw new Error("Connection string database tidak ditemukan sama sekali!");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  return drizzle({ client: pool, schema });
});