import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MahjongHu — Good Tiles. Great Company.",
  description:
    "Temukan outlet MahjongHu favoritmu, pilih waktu bermain, dan jelajahi pengalaman booking mahjong bersama teman. Pratinjau dengan data demo.",
  icons: {
    icon: [{ url: "/logo-transparent.webp", type: "image/webp" }],
    shortcut: [{ url: "/logo-transparent.webp", type: "image/webp" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
