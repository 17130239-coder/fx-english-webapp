import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="vi" className="dark">
      <body className="bg-[#0A0A0B] text-[#F4F4F6] selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
