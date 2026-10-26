import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
export const metadata: Metadata = {
  title: { default: 'CaptaFlow · CRM inteligente de leads', template: '%s · CaptaFlow' },
  description: 'Capture oportunidades. Organize seus leads. Converta mais.',
  icons: { icon: '/brand/symbol.svg' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B1020',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={geist.variable}>
        {children}
        <Toaster richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
