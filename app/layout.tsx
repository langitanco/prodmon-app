// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✅ IMPORT THEME PROVIDER (BARU)
import { ThemeProvider } from "next-themes";

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
    // ✅ TAMBAHKAN suppressHydrationWarning (WAJIB UNTUK NEXT-THEMES)
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ BUNGKUS KONTEN DENGAN THEME PROVIDER */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          
          {/* ✅ 2. PASANG KOMPONEN DI SINI AGAR BERJALAN OTOMATIS */}
          <FCMManager />
          
          {children}
          
        </ThemeProvider>
      </body>
    </html>
  );
}