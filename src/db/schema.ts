import { pgTable, serial, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  fileKey: text("file_key").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // --- KOLOM SESUAI REVISI PEMBIMBING ---
  jenisKegiatan: varchar("jenis_kegiatan", { length: 255 }),
  noSurat: varchar("no_surat", { length: 100 }),
  petugasPelaksana: text("petugas_pelaksana"),
  namaPerusahaan: varchar("nama_perusahaan", { length: 255 }),
  alamatPerusahaan: text("alamat_perusahaan"),
  
  // --- KOLOM BARU UNTUK FOTO ---
  fotoKegiatan: text("foto_kegiatan"), // Menyimpan JSON Array of strings
  fotoLokasi: text("foto_lokasi"),     // Menyimpan JSON Array of strings
  
  // Kolom lama untuk deadline & reward
  tanggal: varchar("tanggal", { length: 50 }),
  deadline: timestamp("deadline"),
  isRewarded: boolean("is_rewarded").default(false),

  // ==========================================
  // TAMBAHAN BARU: HASIL KEGIATAN & KENDALA
  // ==========================================
  hasilKegiatan: text("hasil_kegiatan"),
  kendala: text("kendala"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
});