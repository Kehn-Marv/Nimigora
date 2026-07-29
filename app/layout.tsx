import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NimiqProvider } from './components/NimiqProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#FDFBF7',
};

export const metadata: Metadata = {
  title: 'Nimigora AI-Powered Newsroom',
  description:
    'Real journalism, produced by AI. Nimigora delivers in-depth reporting across technology, geopolitics, climate, finance, health, and culture with complete editorial transparency. Powered by Nimiq.',
  keywords: ['AI news', 'AI journalism', 'automated reporting', 'Nimigora', 'AI newsroom', 'Nimiq', 'NIM'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nimigora',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NimiqProvider>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </NimiqProvider>
      </body>
    </html>
  );
}
