import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "LineupComps",
  description:
    "AI-assisted sports matchup comparison for basketball and football.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
