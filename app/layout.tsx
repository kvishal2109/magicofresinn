import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import ConsoleFilter from "@/components/ConsoleFilter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "magi.cofresin",
  description: "Shop the latest products with easy checkout and UPI payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} antialiased`}>
        <ConsoleFilter />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
