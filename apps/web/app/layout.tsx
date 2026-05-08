import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

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

export const metadata: Metadata = {
  title: "Praxis — Hegemony companion tracker",
  description:
    "An unofficial fan-made tracker for resources, taxes, payments, population and policies in the Hegemony tabletop game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} font-sans min-h-full`}>
        <WasmBootstrap />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
