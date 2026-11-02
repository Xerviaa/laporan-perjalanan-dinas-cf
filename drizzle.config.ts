import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Gunakan Session Pooler (port 5432)
    url: "postgresql://postgres.vjmcxvxmuprsuvwgvgtd:c8QcrZ2kM5X8ezcu@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
  },
});