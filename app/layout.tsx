// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✅ 1. IMPORT KOMPONEN FCM MANAGER DI SINI
import FCMManager from "@/app/components/misc/FCMManager"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LCO SuperApps", 
  description: "Aplikasi Monitoring Produksi Sablon LCO.", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ 2. PASANG KOMPONEN DI SINI AGAR BERJALAN OTOMATIS */}
        <FCMManager />
        
        {children}
      </body>
    </html>
  );
}