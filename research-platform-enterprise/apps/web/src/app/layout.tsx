import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Platform Enterprise',
  description: 'Pipeline dashboard starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
