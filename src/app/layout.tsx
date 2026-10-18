import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--fx-font-main',
});

export const metadata: Metadata = {
  title: 'FX English — Web Dashboard',
  description: 'FX English Subtitle & Vocabulary Studio Web Dashboard. Synchronized with Neon Serverless Postgres.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`dark ${plusJakartaSans.variable}`}>
      <head>
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
            `,
          }}
        />
      </head>
      <body className={plusJakartaSans.className}>
        {children}
      </body>
    </html>
  );
}
