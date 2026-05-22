import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QSB Ask",
  description: "Internal event Q&A and survey operations tool.",
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
