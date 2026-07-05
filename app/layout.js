import "./globals.css";
import { Space_Grotesk, Newsreader, JetBrains_Mono } from "next/font/google";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display", weight: ["500","600","700"] });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--font-body", weight: ["400","500","600"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500"] });

export const metadata = {
  title: "PeeyashStudy — Understand it. Don't just submit it.",
  description: "Upload your MIVA or NOUN assignment PDF and get it explained, broken down, and drilled into you — so you actually pass."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBFAF6"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-body antialiased">{children}</body>
    </html>
  );
}
