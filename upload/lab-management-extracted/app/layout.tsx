import type { Metadata } from 'next';
import { Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { Shell } from '@/components/Shell';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ThemeProvider } from '@/components/ThemeProvider';

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-sans-arabic',
});

export const metadata: Metadata = {
  title: 'Lab Management System',
  description: 'کمپیوٹر لیب مینجمنٹ سسٹم - جامعہ اشرفیہ نیلا گنبد مبینہ',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ur" dir="rtl" className={notoSansArabic.variable} suppressHydrationWarning>
      <body className="font-sans antialiased text-text-primary selection:bg-accent/30 selection:text-white" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Shell>
            {children}
          </Shell>
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
