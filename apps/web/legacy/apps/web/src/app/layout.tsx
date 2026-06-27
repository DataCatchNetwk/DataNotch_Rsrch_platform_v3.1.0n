import { AuthProvider } from '@/context/AuthContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Data Platform',
  description: 'Centralized health data management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f5f7fb' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
