import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import { MusicProvider } from "@/providers/music-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SiteSettingsProvider } from "@/contexts/site-settings-context";
import { MusicPlayer } from "@/components/media/music-player";
import { CMSWrapper } from "@/components/cms/cms-wrapper";
import { JsonLd, churchSchema, websiteSchema } from "@/components/seo/json-ld";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.thefriendshipbaptist.com"),
  title: {
    default: "The Friendship Baptist Church — The Church That Christ Built",
    template: "%s | Friendship Baptist Church",
  },
  description:
    "Welcome to The Friendship Baptist Church in Beaufort, SC. Led by Pastor Isiah Smalls, we are a faith-filled community rooted in love, worship, and the Lowcountry Gullah Geechee tradition. Join us for Sunday worship, Bible study, and fellowship.",
  keywords: [
    "Friendship Baptist Church",
    "Beaufort SC church",
    "Pastor Isiah Smalls",
    "Baptist church",
    "Gullah Geechee",
    "Lowcountry church",
    "Black church Beaufort",
    "Sunday worship",
    "Bible study",
  ],
  authors: [{ name: "The Friendship Baptist Church" }],
  icons: {
    icon: "/images/logos/fbc-icon.png",
    apple: "/images/logos/fbc-icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "The Friendship Baptist Church",
    title: "The Friendship Baptist Church — The Church That Christ Built",
    description:
      "A faith-filled community in Beaufort, SC. Join us for worship, fellowship, and spiritual growth.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9FB" },
    { media: "(prefers-color-scheme: dark)", color: "#13111A" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          defer
          src="https://analytics.integritywebcreations.com/script.js"
          data-website-id="0ecb8961-97b0-4a4f-9ba1-3e438bd0d04d"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} font-body antialiased`}
      >
        <JsonLd data={[churchSchema, websiteSchema]} />
        <ThemeProvider>
          <AuthProvider>
            <SiteSettingsProvider>
              <MusicProvider>
                <CMSWrapper>
                  {children}
                </CMSWrapper>
                <MusicPlayer />
              </MusicProvider>
            </SiteSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
