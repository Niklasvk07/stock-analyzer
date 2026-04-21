import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TopMover — Aktien-Scanner',
  description: 'Kurzfristige Top-Aktien finden — KI-gestützte Analyse',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#0d1117] text-[#e6edf3] antialiased">{children}</body>
    </html>
  );
}
