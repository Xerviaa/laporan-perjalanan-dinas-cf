import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MONICA IMUT - Sistem Informasi Pelaporan",
  description: "Monitoring Capaian Sertifikasi Mutu Terpadu BPPMHKP Denpasar",
  manifest: "/manifest.json",
  // TAMBAHKAN KONFIGURASI IKON DI SINI
  icons: {
    icon: "/logo-monica.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a252f" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}