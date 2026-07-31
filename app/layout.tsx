import type { Metadata, Viewport } from "next";
import { Audiowide, Exo_2 } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "./components/cookie-banner";

const audiowide = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const exo = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anqiqu.com"),
  title: "Anqi Intelligence",
  description:
    "Anqi Qu: a multimodal human model for research, conversation, and real-world interaction.",
  applicationName: "Anqi Intelligence",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://anqiqu.com",
    siteName: "Anqi Intelligence",
    title: "Anqi Intelligence",
    description: "Our most advanced multimodal human model yet.",
    images: [
      {
        url: "/og.png",
        width: 1729,
        height: 910,
        alt: "Anqi Intelligence — our most advanced multimodal human model yet.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anqi Intelligence",
    description: "Our most advanced multimodal human model yet.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${audiowide.variable} ${exo.variable}`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
