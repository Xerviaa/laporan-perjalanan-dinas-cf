import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Fungsi ini menerima connection string dari .env
export function getDb(connectionString: string) {
  // Gunakan prepare: false untuk kompatibilitas dengan Supabase Pooler (PgBouncer)
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}