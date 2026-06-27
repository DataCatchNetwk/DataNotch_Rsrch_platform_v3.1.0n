'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import UserLandingPage from './user-landing';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (user.accountStatus !== 'ACTIVE') {
      router.push('/dashboard/pending');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;
  if (user.accountStatus !== 'ACTIVE') return null;

  return <UserLandingPage />;
}
