import Link from 'next/link';
import { SupportRequestForm } from '@/components/support/support-request-form';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-6 py-16">
      <div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">Return to Login Page</Link>
        </Button>
      </div>
      <SupportRequestForm />
    </div>
  );
}
