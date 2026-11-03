import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getDb = cache(() => {
  let connectionString;

  // Paksa pakai .env jika di lokal
  if (process.env.NODE_ENV === "development") {
    connectionString = process.env.DIRECT_URL;
  } else {
    // Jika di Cloudflare (production)
    const { env } = getCloudflareContext();
    connectionString = env.HYPERDRIVE?.connectionString;
  }

  if (!connectionString) {
    throw new Error("Connection string tidak ditemukan!");
  }

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  return drizzle({ client: pool, schema });
});