
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientWrapper } from "@/components/ClientWrapper";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mindful Tracker",
  description: "Industry Standard SO Program Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black">Mindful...</div>}>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </Suspense>
      </body>
    </html>
  );
}
