import type { Metadata } from "next";
import { Cinzel, Outfit } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://viajes.gardariam.com"),
  title: "Imperio Gardariam — Nuestro fuego, nuestro amor",
  description: "El diario de conquistas de Javi y Mariam. Cada país, un territorio del Imperio.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://viajes.gardariam.com",
    siteName: "Gardariam",
    title: "Imperio Gardariam — Nuestro fuego, nuestro amor",
    description: "El diario de conquistas de Javi y Mariam. Cada país, un territorio del Imperio.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Gardariam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Imperio Gardariam — Nuestro fuego, nuestro amor",
    description: "El diario de conquistas de Javi y Mariam. Cada país, un territorio del Imperio.",
    images: ["/og.jpg"],
  },
};

export const viewport = {
  themeColor: "#070b17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-imperial-charcoal text-parchment">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
