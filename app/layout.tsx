import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AreaIQ — Everything about your area you need to know",
  description:
    "Get a comprehensive neighbourhood report card covering infrastructure, safety, air quality, cleanliness, property rates and more — before you decide where to live or work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
