import "./globals.css";
import { Space_Grotesk, Newsreader, JetBrains_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SupportWidget from "@/components/SupportWidget";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display", weight: ["500","600","700"] });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--font-body", weight: ["400","500","600"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500"] });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://peeyashstudy.vercel.app";
const TITLE = "PeeyashStudy — Understand it. Don't just submit it.";
const DESCRIPTION = "Upload your MIVA or NOUN assignment PDF and get it explained, broken down, and drilled into you — so you actually pass.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32.png",
    apple: "/icons/apple-touch-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PeeyashStudy"
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "PeeyashStudy",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PeeyashStudy" }],
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15214B"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-body antialiased">
        <ServiceWorkerRegister />
        {children}
        <SupportWidget />
      </body>
    </html>
  );
}
