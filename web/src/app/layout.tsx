import type { Metadata } from "next";
import { Geist_Mono, Public_Sans, Space_Grotesk } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

// Body: a plain, highly legible sans. Headings: Space Grotesk (brand brief).
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PactVault — Sign the pact. Lock the vault. Get paid.",
    template: "%s · PactVault",
  },
  description:
    "Freelancers and clients agree a contract, lock the payment in a Solana vault, and the freelancer gets paid on submission. Devnet preview.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${publicSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
