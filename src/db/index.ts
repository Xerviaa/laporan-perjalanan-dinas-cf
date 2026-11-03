import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { cache } from "react";

// Gunakan cache agar koneksi hanya dibuat sekali per request
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  
  // Hyperdrive menyediakan connectionString yang sudah dioptimasi
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString,
    maxUses: 1, // Jangan gunakan ulang koneksi antar request
  });

  return drizzle({ client: pool, schema });
});