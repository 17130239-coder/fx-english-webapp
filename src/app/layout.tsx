import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { FX_APPLE_TOUCH_ICON_DATA_URI } from '@/lib/brandIcons';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--fx-font-main',
});

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const RAW_GITHUB_APPLE_ICON =
  'https://raw.githubusercontent.com/17130239-coder/fx-english-webapp/main/public/apple-touch-icon.png';

export const metadata: Metadata = {
  title: 'FX English - Subtitle & Vocabulary Studio',
  description: 'FX English Subtitle & Vocabulary Studio. Synchronized with Neon Serverless Postgres.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FX English',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: RAW_GITHUB_APPLE_ICON, sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`dark ${plusJakartaSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/* Base64 Data URI Apple Touch Icon for instant DOM extraction without network requests */}
        <link rel="apple-touch-icon" href={FX_APPLE_TOUCH_ICON_DATA_URI} />
        <link rel="apple-touch-icon-precomposed" href={FX_APPLE_TOUCH_ICON_DATA_URI} />
        {/* Fallback CDN URL (raw.githubusercontent.com bypasses Vercel bot challenge) */}
        <link rel="apple-touch-icon" sizes="180x180" href={RAW_GITHUB_APPLE_ICON} />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href={RAW_GITHUB_APPLE_ICON} />
        {/* Local fallback URLs */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="FX English" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('fx-theme');
                var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                var theme = saved ? saved : (prefersLight ? 'light' : 'dark');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}

              // PWA Service Worker Registration
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('[PWA] SW register notice:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={plusJakartaSans.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
