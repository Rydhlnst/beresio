import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { Scales, Toaster } from "@repo/ui";
import { LayoutProvider } from "./_components/LayoutProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "beres.io | Solusi Bisnis Digital Terpadu",
  description: "Kelola bisnis Anda dengan mudah menggunakan beres.io. Kasir digital, inventori, dan laporan keuangan dalam satu platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} font-sans antialiased bg-muted/20 relative overflow-x-hidden`}>
        <LayoutProvider>
          <div className="fixed inset-0 pointer-events-none opacity-40">
            <Scales orientation="diagonal" size={20} />
          </div>
          <Navbar />
          <main className="mx-auto max-w-[1400px] min-h-screen border-x border-border/50 bg-background relative z-10">
            {children}
          </main>
          <Footer />
          <Toaster />
        </LayoutProvider>
      </body>
    </html>
  );
}
