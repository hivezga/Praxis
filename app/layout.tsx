import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Praxis — Hegemony companion tracker",
  description:
    "An unofficial fan-made tracker for resources, taxes, payments, population and policies in the Hegemony tabletop game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
