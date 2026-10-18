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
    <html lang="vi" className={`dark ${plusJakartaSans.variable}`}>
      <body className={plusJakartaSans.className}>
        {children}
      </body>
    </html>
  );
}
