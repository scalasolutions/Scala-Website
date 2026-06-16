'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/invoices?tab=quotations');
  }, [router]);

  return null;
}
