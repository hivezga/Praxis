import type { Metadata } from "next";
import { Crimson_Pro, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { WasmBootstrap } from "./_components/WasmBootstrap";

const sans = IBM_Plex_Sans({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Crimson_Pro({
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Praxis — Hegemony companion tracker",
  description:
    "An unofficial fan-made tracker for resources, taxes, payments, population and policies in the Hegemony tabletop game.",
  applicationName: "Praxis",
  keywords: ["Hegemony", "board game", "tracker", "companion", "tabletop"],
  authors: [{ name: "Praxis" }],
  creator: "Praxis",
  openGraph: {
    type: "website",
    title: "Praxis — Hegemony companion tracker",
    description:
      "Resources, taxes, payments, population and policies — kept in order so the evening is spent playing, not doing arithmetic.",
    siteName: "Praxis",
  },
  twitter: {
    card: "summary_large_image",
    title: "Praxis — Hegemony companion tracker",
    description:
      "Resources, taxes, payments, population and policies — kept in order so the evening is spent playing, not doing arithmetic.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Praxis",
  },
};

export const viewport = {
  themeColor: "#0c1019",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${serif.variable} font-sans min-h-full`}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <WasmBootstrap />
        <div className="min-h-screen">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
