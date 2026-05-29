'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { getInvoices, getClients } from '@/lib/db/queries';
import { InvoicePreview } from '@/app/admin/invoices/components/InvoicePreview';
import Link from 'next/link';

export default function ClientInvoicePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadInvoiceData() {
      try {
        const sess = await getSession();
        if (!sess || !sess.user) {
          router.push('/login');
          return;
        }
        setSession(sess);
        const clientId = (sess.user as any).id;

        // 1. Fetch all clients and active client invoices
        const allClients = await getClients();
        setClients(allClients);

        const allInvoices = await getInvoices();
        const activeInvoice = allInvoices.find(inv => inv.id === invoiceId);

        if (!activeInvoice) {
          setError('Invoice not found.');
          setLoading(false);
          return;
        }

        // 2. Strict tenancy isolation: Ensure the invoice belongs to this logged-in client
        if (activeInvoice.clientId !== clientId) {
          setError('Access Denied. You do not have permissions to view this document.');
          setLoading(false);
          return;
        }

        setInvoice(activeInvoice);
      } catch (err) {
        console.error("Failed to load invoice preview for client portal:", err);
        setError('Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    }

    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#090A0F] text-slate-400">
        <Loader2 size={32} className="animate-spin text-[#CEF84E] mb-3" />
        <p className="text-xs font-bold tracking-widest uppercase opacity-60">Rendering Invoice Canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#090A0F] text-slate-100 p-6 text-center">
        <div className="max-w-md p-8 border border-white/5 rounded-2xl bg-[#11131E]/60 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute top-0 left-6 right-6 h-0.5 bg-red-500/50 blur-[2px]"></div>
          <ShieldAlert size={40} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-base font-black tracking-tight mb-2">Workspace Document Alert</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">{error}</p>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all duration-200 active-press cursor-pointer text-slate-200 hover:text-white"
          >
            <ArrowLeft size={14} />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#090A0F] relative overflow-y-auto">
      {/* 
        Re-use the beautiful, complete admin InvoicePreview component.
        Set onClose to route cleanly back to the client portal page (/portal).
      */}
      <InvoicePreview
        invoice={invoice}
        clients={clients}
        onClose={() => router.push('/portal')}
      />
    </div>
  );
}
