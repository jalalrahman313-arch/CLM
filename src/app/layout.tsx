import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0d9488" },
  ],
};

export const metadata: Metadata = {
  title: "لیب مینجمنٹ سسٹم",
  description: "شعبہ علوم جدیدہ کا لیب مینجمنٹ سسٹم - حاضری، طلباء، کورسز اور سرٹیفکیٹ کا نظام",
  manifest: "/manifest.json",
  applicationName: "لیب مینجمنٹ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "لیب مینجمنٹ",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "لیب مینجمنٹ سسٹم",
    description: "شعبہ علوم جدیدہ کا لیب مینجمنٹ سسٹم",
    type: "website",
    locale: "ur_PK",
    siteName: "لیب مینجمنٹ",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="لیب مینجمنٹ" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-TileImage" content="/icon-144.png" />
      </head>
      <body className={`${notoArabic.variable} antialiased bg-background text-foreground font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
