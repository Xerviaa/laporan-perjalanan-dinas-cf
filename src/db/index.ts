import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getDb = cache(() => {
  let connectionString;

  try {
    const { env } = getCloudflareContext() as { env: any };
    // Cek apakah Hyperdrive terbaca di env Cloudflare
    if (env?.HYPERDRIVE?.connectionString) {
      connectionString = env.HYPERDRIVE.connectionString;
      console.log("Menggunakan koneksi: HYPERDRIVE");
    }
  } catch (e) {
    console.log("Gagal memuat Cloudflare context, fallback ke lokal/env");
  }

  // Jika tidak ada dari Hyperdrive (atau sedang di lokal), gunakan DIRECT_URL / .env
  if (!connectionString) {
    connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log("Menggunakan koneksi: DIRECT_URL / Environment");
  }

  if (!connectionString) {
    throw new Error("Connection string database tidak ditemukan sama sekali!");
  }

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  return drizzle({ client: pool, schema });
});