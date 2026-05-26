'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  ExternalLink,
  Edit,
  Layers,
  Calendar,
  Receipt,
  Ticket,
  AlertTriangle,
  CheckCircle,
  X,
  Check,
  Sparkles,
  Clock,
  User
} from 'lucide-react';
import { 
  getClientById, 
  getInvoices, 
  getTickets, 
  updateClient, 
  MockClient, 
  MockInvoice, 
  MockTicket 
} from '@/lib/db/queries';
import { getSubscriptionRemainingMonths } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [client, setClient] = useState<MockClient | null>(null);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [tickets, setTickets] = useState<MockTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteAddress, setWebsiteAddress] = useState('');
  const [status, setStatus] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [subscriptionType, setSubscriptionType] = useState<'static' | 'dynamic' | ''>('');
  const [subscriptionMonths, setSubscriptionMonths] = useState<number>(12);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadClientData() {
      if (!id) return;
      try {
        const c = await getClientById(id);
        if (!c) {
          setLoading(false);
          return;
        }
        setClient(c);
        
        // Load Invoices & Tickets to filter for this client
        const allInvoices = await getInvoices();
        const allTickets = await getTickets();
        
        setInvoices(allInvoices.filter(inv => inv.clientId === id) as MockInvoice[]);
        setTickets(allTickets.filter(t => t.clientId === id));
        
        // Initialize form fields
        setName(c.name);
        setEmail(c.email);
        setPhone(c.phone || '');
        setCompanyName(c.companyName || '');
        setWebsiteAddress(c.websiteAddress || '');
        setStatus(c.status);
        setSubscriptionType(c.subscriptionType || '');
        setSubscriptionMonths(c.subscriptionMonths || 12);
        setSubscriptionStartDate(
          c.subscriptionStartDate 
            ? new Date(c.subscriptionStartDate).toISOString().substring(0, 10) 
            : new Date().toISOString().substring(0, 10)
        );
        setPortalPassword(c.portalPassword || '');
      } catch (err) {
        console.error("Failed to load client profile details", err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [id]);

  // Prevent background scrolling when Edit modal is open (prevent double scrollbar)
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (editModalOpen) {
      if (mainEl) mainEl.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      if (mainEl) mainEl.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      if (mainEl) mainEl.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [editModalOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Retrieving client record...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center p-12 rounded-2xl bg-card border border-border">
        <AlertTriangle className="mx-auto text-red-400 mb-3" size={32} />
        <h3 className="font-bold text-lg text-foreground">Client Record Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
          The requested client record does not exist or may have been deleted.
        </p>
        <button 
          onClick={() => router.push('/admin/clients')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted border border-border text-xs font-semibold hover:text-foreground cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Directory
        </button>
      </div>
    );
  }

  // Calculate subscription math
  const remaining = getSubscriptionRemainingMonths(client);
  const isExpiring = remaining !== null && remaining < 3;
  
  // Calculate Expiry Date
  let expiryDateString = 'N/A';
  if (client.subscriptionStartDate && client.subscriptionMonths) {
    const start = new Date(client.subscriptionStartDate);
    const expiry = new Date(start);
    expiry.setMonth(start.getMonth() + client.subscriptionMonths);
    expiryDateString = expiry.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const formatCurrencyIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const updated = await updateClient(client.id, {
          name,
          email,
          phone: phone || null,
          companyName: companyName || null,
          websiteAddress: websiteAddress || null,
          status,
          subscriptionType: subscriptionType || null,
          subscriptionMonths: subscriptionType ? Number(subscriptionMonths) : null,
          subscriptionStartDate: subscriptionType ? new Date(subscriptionStartDate) : null,
          portalPassword: portalPassword || null
        });

        if (updated) {
          setClient(updated as MockClient);
          setEditModalOpen(false);
        }
      } catch (err) {
        console.error("Failed to update client", err);
      }
    });
  };

  const hasUrl = client.websiteAddress && client.websiteAddress !== '';
  const domain = hasUrl ? client.websiteAddress!.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : '';
  const faviconUrl = hasUrl ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  return (
    <div className="space-y-8 animate-fade-up pb-20">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/clients">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 rounded-xl bg-muted/40 border border-border cursor-pointer transition-all">
            <ArrowLeft size={14} />
            Back to Directory
          </button>
        </Link>

        <button 
          onClick={() => setEditModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer transition-all"
        >
          <Edit size={14} />
          Edit Profile Details
        </button>
      </div>

      {/* --- CLIENT HEADER CARD --- */}
      <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/2 blur-[80px] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {faviconUrl ? (
              <img 
                src={faviconUrl} 
                alt={client.name} 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-16 h-16 rounded-2xl border border-border object-contain bg-white p-2 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                {client.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{client.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                <Building size={14} className="shrink-0" />
                {client.companyName || 'Freelance / Individual'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs uppercase font-extrabold px-3 py-1 rounded-md border tracking-wider font-mono ${
              client.status === 'active' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                : client.status === 'pending'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              {client.status} Account
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout for details */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Contact info & Details */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">Contact Information</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="text-muted-foreground shrink-0 mt-0.5" size={16} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email Address</p>
                  <a href={`mailto:${client.email}`} className="text-foreground hover:text-primary transition-colors font-medium break-all">{client.email}</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-muted-foreground shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Phone Connection</p>
                  <span className="font-medium text-foreground">{client.phone || 'No Phone Record'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="text-muted-foreground shrink-0 mt-0.5" size={16} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Client Website</p>
                  {client.websiteAddress ? (
                    <a 
                      href={client.websiteAddress} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1 min-w-0 break-all"
                    >
                      <span className="truncate">{client.websiteAddress}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic font-medium">No Domain Associated</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Portal Credentials Access Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-1.5">
              <User size={16} className="text-primary" />
              <span>Client Portal Access</span>
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Portal Login Link</p>
                <Link href="/portal" target="_blank" className="text-primary hover:underline font-semibold flex items-center gap-1 mt-1">
                  <span>Open Client Portal</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Portal Username (Email)</p>
                <p className="font-medium text-foreground mt-1 select-all">{client.email}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Portal Password</p>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    readOnly
                    value={client.portalPassword || 'No password assigned'}
                    className="bg-muted/40 border border-border px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex-1 focus:outline-none select-all"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {/* Police Hazard Warning Tape Overlay */}
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 select-none">
              <div className="w-[140%] py-2.5 bg-[repeating-linear-gradient(-45deg,#eab308,#eab308_12px,#000_12px,#000_24px)] border-y-2 border-yellow-500 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] transform -rotate-12 flex items-center justify-center shrink-0">
                <span className="bg-black px-4 py-1 text-[10px] font-black tracking-widest font-mono text-yellow-400 shadow-md border border-yellow-500/40 rounded animate-pulse-subtle">
                  ⚠️ CLIENT PORTAL COMING SOON ⚠️
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Columns: Subscription Details & Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subscription SLA Details */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Layers className="text-primary" size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Hosting SLA & Subscription Quota</h3>
              </div>
              
              {client.subscriptionType && (
                <span className={`text-[10px] uppercase font-black px-2.5 py-0.75 rounded-md border tracking-wider font-mono ${
                  client.subscriptionType === 'dynamic' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                }`}>
                  {client.subscriptionType} Hosting
                </span>
              )}
            </div>

            {client.subscriptionType ? (
              <div className="space-y-6">
                
                {/* Expiring warnings alert banner */}
                {isExpiring && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 animate-pulse-subtle">
                    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                    <div className="text-xs">
                      <span className="font-bold text-amber-200">Renewal Alert:</span>
                      <p className="text-muted-foreground mt-0.5">
                        This account is expiring within 3 months (Remaining Quota: <strong className="text-amber-400">{remaining} months</strong>). Plan renewal is recommended.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Monthly Hosting Billing</p>
                    <p className="text-lg font-black text-foreground mt-1.5">
                      {client.subscriptionType === 'static' ? formatCurrencyIDR(150000) : formatCurrencyIDR(350000)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{client.subscriptionType} Plan active rate</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Remaining Quota</p>
                    <p className={`text-lg font-black mt-1.5 ${isExpiring ? 'text-amber-400' : 'text-primary'}`}>
                      {remaining} / {client.subscriptionMonths} Months
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Based on purchased yearly SLA</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Expiry / Renewal Date</p>
                    <p className="text-xs font-bold text-foreground mt-2.5 flex items-center gap-1.5">
                      <Calendar size={13} className="text-muted-foreground" />
                      <span>{expiryDateString}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Calculated from start date</p>
                  </div>
                </div>

                {/* Big Progress Bar utilization */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                    <span>SLA Quota Elapsed Status</span>
                    <span className="text-foreground">
                      {client.subscriptionMonths ? Math.round((remaining! / client.subscriptionMonths) * 100) : 0}% Quota Active
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-muted border border-border rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        remaining === 0 
                          ? 'bg-red-500' 
                          : isExpiring 
                          ? 'bg-amber-400' 
                          : 'bg-primary'
                      }`} 
                      style={{ width: `${Math.min(100, (remaining! / (client.subscriptionMonths || 12)) * 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Start: {client.subscriptionStartDate ? new Date(client.subscriptionStartDate).toLocaleDateString('id-ID') : 'N/A'}</span>
                    <span>End: {expiryDateString}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed border-border rounded-xl">
                <Layers className="text-muted-foreground opacity-30 mb-2" size={24} />
                <h4 className="font-semibold text-sm">No Active Subscription Plan</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  This client does not have an active monthly hosting subscription. Edit details to assign dynamic or static plans.
                </p>
              </div>
            )}
          </div>

          {/* Connected Invoices & Support Tickets Panels */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Connected Invoices */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Receipt size={14} className="text-primary" />
                  <span>Recent Billing ({invoices.length})</span>
                </h3>
                <Link href={`/admin/invoices?client=${client.id}`} className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5">
                  <span>View All</span>
                  <ExternalLink size={8} />
                </Link>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {invoices.length > 0 ? (
                  invoices.slice(0, 3).map(inv => (
                    <Link key={inv.id} href={`/admin/invoices?id=${inv.id}`} className="block">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border hover:border-primary/20 cursor-pointer transition-all flex justify-between items-center text-xs">
                        <div className="min-w-0">
                          <p className="font-bold truncate">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-foreground">{formatCurrencyIDR(inv.total)}</p>
                          <span className={`text-[9px] uppercase font-black px-1.5 py-0.25 rounded inline-block mt-0.5 ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : inv.status === 'past_due'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground italic">No invoice history found</div>
                )}
              </div>
            </div>

            {/* Connected Support Tickets */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Ticket size={14} className="text-primary" />
                  <span>Support Tickets ({tickets.length})</span>
                </h3>
                <Link href={`/admin/tickets?client=${client.id}`} className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5">
                  <span>View All</span>
                  <ExternalLink size={8} />
                </Link>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {tickets.length > 0 ? (
                  tickets.slice(0, 3).map(t => (
                    <Link key={t.id} href={`/admin/tickets?id=${t.id}`} className="block">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border hover:border-primary/20 cursor-pointer transition-all text-xs">
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-bold truncate text-foreground flex-1">{t.title}</p>
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.25 rounded shrink-0 ${
                            t.priority === 'urgent' 
                              ? 'bg-red-500/10 text-red-400' 
                              : t.priority === 'high' 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mt-2">
                          <Clock size={10} />
                          <span>{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                          <span>•</span>
                          <span className="capitalize">{t.status}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground italic flex flex-col items-center justify-center h-full">
                    <CheckCircle size={18} className="text-primary opacity-40 mb-1" />
                    <span>No unresolved issues</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* --- EDIT CLIENT MODAL --- */}
      {mounted && editModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/85 backdrop-blur-md" onClick={() => setEditModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale max-h-[82vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <h3 className="text-lg font-bold">Edit Account Profile</h3>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Client Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Fredrick Yang"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. fredrick@anakweb.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Anak Web Solutions"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +628123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Website Address</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://anakweb.com"
                  value={websiteAddress}
                  onChange={(e) => setWebsiteAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Portal Password</label>
                <input 
                  type="text" 
                  placeholder="Set custom portal password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground font-mono font-bold"
                />
              </div>

              {/* Subscriptions Area */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hosting Subscription Details</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Subscription Hosting Type</label>
                  <div className="flex gap-2">
                    {[
                      { key: '', label: 'No Active Sub' },
                      { key: 'static', label: 'Static (150k/mo)' },
                      { key: 'dynamic', label: 'Dynamic (350k/mo)' }
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setSubscriptionType(type.key as 'static' | 'dynamic' | '')}
                        className={`flex-1 py-2 border text-xs capitalize transition-all cursor-pointer font-bold rounded-lg ${
                          subscriptionType === type.key
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {subscriptionType !== '' && (
                  <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-scale">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Purchased Months Quota</label>
                      <input 
                        type="number" 
                        min="1"
                        max="120"
                        required
                        value={subscriptionMonths}
                        onChange={(e) => setSubscriptionMonths(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subscription Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={subscriptionStartDate}
                        onChange={(e) => setSubscriptionStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Initial Account Status</label>
                <div className="flex gap-2">
                  {(['pending', 'active', 'inactive'] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setStatus(stat)}
                      className={`flex-1 py-2 rounded-xl border text-xs capitalize transition-all cursor-pointer font-bold ${
                        status === stat 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <button 
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active-press transition-all cursor-pointer"
                  style={{ boxShadow: '0 0 10px rgba(206, 248, 78, 0.15)' }}
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                  <Check size={14} />
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
