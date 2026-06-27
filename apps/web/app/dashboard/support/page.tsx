'use client';

import { useAuth } from '@/lib/auth-context';
import { MySupportTickets } from '@/components/support/my-support-tickets';
import { SupportRequestForm } from '@/components/support/support-request-form';

export default function DashboardSupportPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SupportRequestForm
          defaultName={[user?.firstname, user?.surname].filter(Boolean).join(' ')}
          defaultEmail={user?.email ?? ''}
        />
        <MySupportTickets />
      </div>
    </div>
  );
}
