import { pgTable, integer, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const keepalive = pgTable("keepalive", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  lastPing: timestamp("last_ping").defaultNow(),
});

export const reports = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
  fotoKegiatan: text("foto_kegiatan"),
  fotoLokasi: text("foto_lokasi"),
  
  // Kolom lama untuk deadline & reward
  tanggal: varchar("tanggal", { length: 50 }),
  deadline: timestamp("deadline"),
  isRewarded: boolean("is_rewarded").default(false),

  // ==========================================
  // TAMBAHAN BARU: HASIL KEGIATAN & KENDALA
  // ==========================================
  hasilKegiatan: text("hasil_kegiatan"),
  kendala: text("kendala"),

  // ==========================================
  // TAMBAHAN BARU: BERKAS & STATUS MONITORING
  // ==========================================
  berkasKegiatan: text("berkas_kegiatan"),
  berkasPerbaikan: text("berkas_perbaikan"),
  statusMonitoring: varchar("status_monitoring", { length: 50 }).default('Berkas belum upload'),

  // ==========================================
  // TAMBAHAN BARU: SURAT TUGAS & PEMERIKSAAN TINDAKAN PERBAIKAN
  // ==========================================
  suratTugas: text("surat_tugas"),
  berkasPemeriksaanTindakanPerbaikan: text("berkas_pemeriksaan_tindakan_perbaikan"),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  logoUrl: text("logo_url"),
});