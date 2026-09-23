import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KANABA',
  description: 'Platform Operasional, Produksi, Persediaan, dan Kendali Biaya',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}