'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import UserLandingPage from '../login/user/userLanding';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login/user');
      return;
    }
    if (user.roles.includes('PENDING') && !user.roles.includes('ANALYST')) {
      router.push('/dashboard/pending');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;
  if (user.roles.includes('PENDING') && !user.roles.includes('ANALYST')) return null;

  return <UserLandingPage />;
}
