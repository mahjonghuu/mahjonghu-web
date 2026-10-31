import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Shared search and social metadata; only the homepage declares a canonical. */
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "MahjongHu | Book Mahjong Tables & Venues",
    template: "%s | MahjongHu",
  },
  description:
    "Find a MahjongHu venue, check mahjong table availability, and book a time to play with friends. Choose your outlet and plan your next mahjong session.",
  applicationName: "MahjongHu",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "MahjongHu",
    title: "MahjongHu | Book Mahjong Tables & Venues",
    description:
      "Find a MahjongHu venue, check table availability, and book your next mahjong session with friends.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MahjongHu — Book a mahjong table. Bring your friends.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MahjongHu | Book Mahjong Tables & Venues",
    description:
      "Find a MahjongHu venue, check table availability, and book your next mahjong session with friends.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MahjongHu — Book a mahjong table. Bring your friends.",
      },
    ],
  },
  icons: {
    icon: [{ url: "/logo-transparent.webp", type: "image/webp" }],
    shortcut: [{ url: "/logo-transparent.webp", type: "image/webp" }],
  },
};

/** Renders the shared English-language document and application fonts. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
