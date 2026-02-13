
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientWrapper } from "@/components/ClientWrapper";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mindful Tracker",
  description: "Industry Standard SO Program Management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mindful Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brain-circuit.png" },
      { url: "/brain-circuit.png", sizes: "192x192", type: "image/png" },
      { url: "/brain-circuit.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brain-circuit.png" },
      { url: "/brain-circuit.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Force mobile browsers to see this icon immediately */}
        <link rel="icon" href="/brain-circuit.png" sizes="any" />
        <link rel="apple-touch-icon" href="/brain-circuit.png" />
      </head>
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
