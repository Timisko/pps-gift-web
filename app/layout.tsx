import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIFT karticky",
  description: "Ucenie a testovanie otazok z GIFT suborov",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
