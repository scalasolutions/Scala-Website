'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoicesPresetsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/invoices?tab=presets');
  }, [router]);

  return null;
}
