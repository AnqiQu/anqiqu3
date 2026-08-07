import type { Metadata, Viewport } from "next";
import { Audiowide, Exo_2, Philosopher, Plus_Jakarta_Sans } from "next/font/google";
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

// The sandbox runs on its own pair: Philosopher for headings, Plus Jakarta
// Sans for body copy.
const philosopher = Philosopher({
  variable: "--font-philosopher",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anqiqu.com"),
  title: "Anqi Qu",
  description:
    "Anqi Qu: a multimodal human model for research, conversation, and real-world interaction.",
  applicationName: "Anqi Qu",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://anqiqu.com",
    siteName: "Anqi Qu",
    title: "Anqi Qu",
    description: "Our most advanced multimodal human model yet.",
    images: [
      {
        url: "/og.png",
        width: 1729,
        height: 910,
        alt: "Anqi Qu — our most advanced multimodal human model yet.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anqi Qu",
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
      <body
        className={`${audiowide.variable} ${exo.variable} ${philosopher.variable} ${jakarta.variable}`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
