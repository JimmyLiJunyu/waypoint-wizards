import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WayPoint Wizards",
  description: "Collaborative trip planning with AI itineraries and budget tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden antialiased">
      <body className={`${inter.className} h-full overflow-hidden flex flex-col`}>{children}</body>
    </html>
  );
}
