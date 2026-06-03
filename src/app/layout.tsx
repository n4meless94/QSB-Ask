import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QSB Ask",
  description: "Internal event Q&A and survey operations tool.",
};

function publicRuntimeConfigScript() {
  const readRuntimeValue = (key: string) => process.env[key]?.trim() ?? "";
  const config = {
    supabaseAnonKey: readRuntimeValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseUrl: readRuntimeValue("NEXT_PUBLIC_SUPABASE_URL"),
  };
  const serializedConfig = JSON.stringify(config).replace(/</g, "\\u003c");

  return `window.__QSB_ASK_PUBLIC_CONFIG__=${serializedConfig};`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: publicRuntimeConfigScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
