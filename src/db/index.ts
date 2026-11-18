import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
    connectionString = (env as any)?.HYPERDRIVE?.connectionString || process.env.DIRECT_URL;
  }

  if (!connectionString) {
    throw new Error("Connection string tidak ditemukan!");
  }

  // Gunakan postgres-js dengan opsi ssl dan non-prepared statements (aman untuk pooler/edge)
  const client = postgres(connectionString, { ssl: 'require', prepare: false });

  return drizzle(client, { schema });
});