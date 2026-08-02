import type { Metadata } from "next";
import { Bricolage_Grotesque, Bungee, Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "@/components/InlineScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The display face for headlines, big numbers, and the arcade skin's
// oversized labels — Geist Sans stays the workhorse for body copy and
// tables, where a chunkier face would hurt legibility.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Reserved for exactly two spots: the "FundSim" wordmark and the campaign
// grade reveal ("Top decile" etc.) — its single heavy weight is a poster
// face, not something to run every heading in.
const bungee = Bungee({
  variable: "--font-bungee-google",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "FundSim",
  description: "A venture fund simulator for learning VC fund math.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} ${bungee.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html="(function(){try{var t=localStorage.theme;if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');if(localStorage.fundChart==='hidden')document.documentElement.classList.add('chart-hidden')}catch(e){}})()" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
