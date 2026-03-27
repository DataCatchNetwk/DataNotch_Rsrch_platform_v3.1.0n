import './globals.css';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Research Platform V3',
  description: 'Starter portal for research data upload, approval, and analytics',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
