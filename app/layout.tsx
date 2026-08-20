import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kelvi — Aarla Play",
    template: "%s — Aarla Play",
  },
  description: "Kelvi is a live community game from Aarla Play. A question drops. Answer fast. Protect the streak.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F3EDE2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
