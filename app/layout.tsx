import type { Metadata } from "next";

import localFont from "next/font/local";
import "./globals.css";

const proximaNova = localFont({
  src: "./fonts/ProximaNova.otf",
  variable: "--font-proxima-nova",
  weight: "500",
});

export const metadata: Metadata = {
  title: "Crypta",
  description: "Crypta AI Chat",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${proximaNova.variable} antialiased`}>{children}</body>
    </html>
  );
}
