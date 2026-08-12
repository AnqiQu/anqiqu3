import type { Metadata, Viewport } from "next";
import { Audiowide, Exo_2, Open_Sans, Philosopher, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "./components/analytics";
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

// The writing section reads as plain prose on paper: Philosopher headings over
// Open Sans body copy.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

// The single share card used everywhere a link preview appears — iMessage and
// other OpenGraph readers, and X/Twitter. Defined once so the Twitter card is
// identical to the one shown in texts by construction.
const shareTitle = "Anqi Qu";
const shareDescription = "Our most advanced multimodal human model yet.";
const shareImage = {
  url: "/og.png",
  width: 1727,
  height: 911,
  type: "image/png",
  alt: "Anqi Qu — our most advanced multimodal human model yet.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://anqiqu.com"),
  title: "Anqi Qu",
  description:
    "Hello! This is Anqi Qu's personal website",
  applicationName: "Anqi Qu",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://anqiqu.com",
    siteName: "Anqi Qu",
    locale: "en_US",
    title: shareTitle,
    description: shareDescription,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Anqinator",
    creator: "@Anqinator",
    title: shareTitle,
    description: shareDescription,
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

// Structured data so search engines can identify the site (WebSite) and the
// person behind it (Person), which powers richer results and knowledge panels.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://anqiqu.com/#website",
      url: "https://anqiqu.com",
      name: "Anqi Qu",
      description:
        "Hello! This is Anqi Qu's personal website",
      publisher: { "@id": "https://anqiqu.com/#person" },
      inLanguage: "en",
    },
    {
      "@type": "Person",
      "@id": "https://anqiqu.com/#person",
      name: "Anqi Qu",
      url: "https://anqiqu.com",
      image: "https://anqiqu.com/og.png",
      sameAs: [
        "https://www.linkedin.com/in/anqiqu/",
        "https://x.com/Anqinator",
        "https://www.instagram.com/anqi._.thewateraddict",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${audiowide.variable} ${exo.variable} ${philosopher.variable} ${jakarta.variable} ${openSans.variable}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
