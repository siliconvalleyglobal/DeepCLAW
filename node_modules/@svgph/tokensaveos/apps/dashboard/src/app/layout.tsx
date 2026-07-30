import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenSaveOS Dashboard — SILICON VALLEY GLOBAL PH INC",
  description: "Enterprise AI Agent Optimization & Context Intelligence Analytics Dashboard",
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
