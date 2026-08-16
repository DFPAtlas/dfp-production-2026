import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import "./brand.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ScrollToTop from "@/components/ScrollToTop";
import ThemeProvider from "@/components/ThemeProvider";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://digital-footprint.uk'),
  title: {
    default: "Digital Footprint | Digital Systems for Independent UK Businesses",
    template: "%s | Digital Footprint"
  },
  description: "Websites, client portals, automation and AI-powered tools that help independent UK businesses launch, grow and operate more efficiently.",
  keywords: ["digital business", "SaaS platform", "AI agents", "business automation", "technology venture studio", "operational portals", "secure infrastructure", "digital transformation", "UK tech company"],
  authors: [{ name: "Digital Footprint", url: "https://digital-footprint.uk" }],
  creator: "Digital Footprint",
  publisher: "Digital Footprint",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "Digital Footprint",
    title: "Digital Footprint | Digital Systems for Independent UK Businesses",
    description: "Websites, client portals, automation and AI-powered tools that help independent UK businesses launch, grow and operate more efficiently.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Digital Footprint — SaaS, AI Automation and Digital Business Systems" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Footprint | Digital Systems for Independent UK Businesses",
    description: "Websites, client portals, automation and AI-powered tools that help independent UK businesses launch, grow and operate more efficiently.",
    images: ["/og-image.jpg"],
    creator: "@digitalfootprint"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true} className={inter.variable}>
      <body className="antialiased bg-white" suppressHydrationWarning={true}>
        <ThemeProvider>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#2563EB] focus:text-white focus:rounded-lg"
          >
            Skip to main content
          </a>
          <GoogleAnalytics />
          <PerformanceMonitor />
          <ScrollToTop />
          {children}
          <CookieBanner />
        </ThemeProvider>

      </body>
    </html>
  );
}