'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import { 
  Sun, 
  Moon, 
  LogOut, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Receipt, 
  Ticket, 
  Eye, 
  EyeOff,
  Plus, 
  Send, 
  MessageSquare,
  AlertCircle,
  Loader2, 
  FileText,
  UserCheck,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { 
  getClients, 
  getInvoices, 
  getTickets, 
  getTicketDetails,
  createTicket, 
  createTicketMessage,
  updateClient
} from '@/lib/db/queries';
import Link from 'next/link';

// ─────────────────────────────────────────────
// Toast notification system
// ─────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium animate-fade-in-scale ${
            t.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : t.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {t.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> :
           t.type === 'warning' ? <AlertTriangle size={16} className="shrink-0" /> :
           <AlertCircle size={16} className="shrink-0" />}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Confirmation dialog (replaces browser confirm())
// ─────────────────────────────────────────────
interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'dark' | 'light';
}

function ConfirmDialog({ message, onConfirm, onCancel, theme }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative w-full max-w-xs border rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-left z-10 animate-fade-in-scale ${
        theme === 'dark' ? 'bg-[#11131E]/95 border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              theme === 'dark'
                ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            Keep editing
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Portal Page
// ─────────────────────────────────────────────
export default function ClientPortal() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [session, setSession] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Ticketing state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // New Ticket Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTicketTitle, setNewTicketTitle] = useState<string>('');
  const [newTicketDesc, setNewTicketDesc] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<'billing' | 'technical' | 'general'>('technical');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);
  const [ticketTitleError, setTicketTitleError] = useState<string>('');
  const [ticketDescError, setTicketDescError] = useState<string>('');

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [newPortalPassword, setNewPortalPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  // Confirmation dialogs
  const [ticketConfirmDiscard, setTicketConfirmDiscard] = useState<boolean>(false);
  const [passwordConfirmDiscard, setPasswordConfirmDiscard] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Field refs for scroll-to-error anchoring
  const ticketTitleRef = useRef<HTMLInputElement>(null);
  const ticketDescRef = useRef<HTMLTextAreaElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Toast helpers
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check if ticket modal has unsaved content
  const ticketModalHasContent = newTicketTitle.trim() !== '' || newTicketDesc.trim() !== '';

  // Check if password modal has content
  const passwordModalHasContent = newPortalPassword.trim() !== '';

  // ── Theme initialization ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // ── Load portal data ──
  const loadPortalData = async () => {
    try {
      const sess = await getSession();
      if (sess && sess.user) {
        setSession(sess);
        const clientId = (sess.user as any).id;
        
        const clients = await getClients();
        const activeClient = clients.find(c => c.id === clientId);
        setClient(activeClient);

        const allInvoices = await getInvoices();
        const clientInvoices = allInvoices.filter(inv => inv.clientId === clientId);
        setInvoices(clientInvoices);

        const allTickets = await getTickets();
        const clientTickets = allTickets.filter(t => t.clientId === clientId);
        setTickets(clientTickets);
        
        // Auto-select first ticket if none selected
        if (clientTickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(clientTickets[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load client portal data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // ── Poll for new messages every 8 seconds ──
  useEffect(() => {
    if (!selectedTicketId) return;

    const fetchTicketData = async () => {
      try {
        const details = await getTicketDetails(selectedTicketId);
        if (details) {
          setActiveTicket(details);
          const sorted = [...(details.messages || [])].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setTicketMessages(sorted);
        }
      } catch (e) {
        console.error("Failed to sync ticket messages:", e);
      }
    };

    fetchTicketData();
    const interval = setInterval(fetchTicketData, 8000);
    return () => clearInterval(interval);
  }, [selectedTicketId]);

  // ── Scroll to bottom of chat ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketMessages]);

  // ── Send a message in a ticket thread ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId || !client) return;

    setSendingMessage(true);
    try {
      await createTicketMessage({
        ticketId: selectedTicketId,
        senderType: 'client',
        senderName: client.name,
        message: newMessage.trim(),
      });
      setNewMessage('');
      
      const details = await getTicketDetails(selectedTicketId);
      if (details) {
        const sorted = [...(details.messages || [])].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setTicketMessages(sorted);
      }
    } catch (err) {
      console.error("Failed to post response ticket message:", err);
      addToast('error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Create a new ticket ──
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation with field anchoring
    let hasError = false;

    if (!newTicketTitle.trim()) {
      setTicketTitleError('Please enter a ticket subject.');
      ticketTitleRef.current?.focus();
      ticketTitleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    } else {
      setTicketTitleError('');
    }

    if (!newTicketDesc.trim()) {
      setTicketDescError('Please describe your issue.');
      if (!hasError) {
        ticketDescRef.current?.focus();
        ticketDescRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      hasError = true;
    } else {
      setTicketDescError('');
    }

    if (hasError || !client) return;

    setCreatingTicket(true);
    try {
      const newT = await createTicket({
        clientId: client.id,
        title: newTicketTitle.trim(),
        description: newTicketDesc.trim(),
        category: newTicketCategory,
        priority: newTicketPriority,
        status: 'open',
      });
      
      setNewTicketTitle('');
      setNewTicketDesc('');
      setIsModalOpen(false);
      addToast('success', 'Support ticket created successfully!');
      
      const allTickets = await getTickets();
      const clientTickets = allTickets.filter(t => t.clientId === client.id);
      setTickets(clientTickets);
      if (newT) {
        setSelectedTicketId(newT.id);
      }
    } catch (err) {
      console.error("Failed to submit support ticket request:", err);
      addToast('error', 'Failed to create ticket. Please try again.');
    } finally {
      setCreatingTicket(false);
    }
  };

  // ── Change portal password ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPortalPassword.trim()) {
      setPasswordError('Please enter a new password.');
      passwordRef.current?.focus();
      return;
    }
    if (newPortalPassword.trim().length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      passwordRef.current?.focus();
      return;
    }
    setPasswordError('');

    if (!client) return;

    setIsSavingPassword(true);
    try {
      const updated = await updateClient(client.id, {
        portalPassword: newPortalPassword.trim(),
        portalPasswordIsPrivate: true,
      });
      if (updated) {
        setClient(updated);
        setIsPasswordModalOpen(false);
        setNewPortalPassword('');
        setShowNewPassword(false);
        addToast('success', 'Password changed successfully! Use your new password on next login.');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      addToast('error', 'Failed to change password. Please try again.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // ── Backdrop click handlers with confirmation ──
  const handleTicketBackdropClick = () => {
    if (ticketModalHasContent) {
      setTicketConfirmDiscard(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handlePasswordBackdropClick = () => {
    if (passwordModalHasContent) {
      setPasswordConfirmDiscard(true);
    } else {
      setIsPasswordModalOpen(false);
      setPasswordError('');
    }
  };

  const handleCloseTicketModal = () => {
    if (ticketModalHasContent) {
      setTicketConfirmDiscard(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleClosePasswordModal = () => {
    if (passwordModalHasContent) {
      setPasswordConfirmDiscard(true);
    } else {
      setIsPasswordModalOpen(false);
      setPasswordError('');
    }
  };

  const discardTicketModal = () => {
    setTicketConfirmDiscard(false);
    setIsModalOpen(false);
    setNewTicketTitle('');
    setNewTicketDesc('');
    setTicketTitleError('');
    setTicketDescError('');
  };

  const discardPasswordModal = () => {
    setPasswordConfirmDiscard(false);
    setIsPasswordModalOpen(false);
    setNewPortalPassword('');
    setPasswordError('');
    setShowNewPassword(false);
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#090A0F]' : 'bg-slate-50'
      }`}>
        <Loader2 size={32} className="animate-spin text-primary mb-3" />
        <p className="text-xs font-bold tracking-widest uppercase opacity-60">Synchronizing Workspace...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 pb-12 ${
      theme === 'dark' ? 'bg-[#090A0F] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>

      {/* ── TOAST NOTIFICATIONS ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── CONFIRMATION DIALOGS ── */}
      {ticketConfirmDiscard && (
        <ConfirmDialog
          message="You have unsaved ticket content. Are you sure you want to discard it?"
          onConfirm={discardTicketModal}
          onCancel={() => setTicketConfirmDiscard(false)}
          theme={theme}
        />
      )}
      {passwordConfirmDiscard && (
        <ConfirmDialog
          message="You have an unsaved password. Are you sure you want to discard it?"
          onConfirm={discardPasswordModal}
          onCancel={() => setPasswordConfirmDiscard(false)}
          theme={theme}
        />
      )}

      {/* ── TOP HEADER ── */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#11131E]/70 border-white/5' 
          : 'bg-white/80 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Scala Logo SVG */}
            <svg width="100" height="35" viewBox="0 0 1312 539" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
              <path d="M364 71C392.167 71 415 156.514 415 262C415 367.486 392.167 453 364 453C343.793 453 326.332 408.99 318.076 345.168C317.638 341.778 312.326 341.44 311.44 344.741C294.178 409.036 265.384 454.256 241.682 450.393C231.539 448.739 223.734 438.327 218.653 421.783C217.773 418.916 213.386 418.598 212.097 421.305C202.798 440.82 189.618 453 175 453C146.833 453 124 407.781 124 352C124 296.219 146.833 251 175 251C192.351 251 207.678 268.16 216.89 294.379C217.215 295.302 218.595 295.208 218.772 294.246C233.834 212.527 268.511 149.942 296.225 154.46C302.758 155.525 308.32 160.224 312.81 167.855C314.412 170.578 319.292 169.952 319.772 166.829C328.578 109.558 345.087 71 364 71Z" fill="#CEF84E"/>
              <path d="M563 365.5C519 365.5 492 342.5 492 306.25H531C531 323 543.5 332.75 562.75 332.75C579.25 332.75 589.75 326 589.75 314.25C589.75 302 578.5 294.75 553.75 289.5C512.75 280.75 493.5 263.75 493.5 235.25C493.5 203.25 518.5 183.5 558.75 183.5C600.25 183.5 626.75 206 626.75 241.25H588.5C588.5 225.5 577.5 216 559.25 216C542.5 216 532.25 223 532.25 234.5C532.25 245.25 541.5 252 568.25 258.25C611.75 268.5 630 285 630 312.75C630 345.75 604.5 365.5 563 365.5ZM722.656 365.5C680.406 365.5 650.906 336.75 650.906 296.25C650.906 256 680.656 227.25 722.656 227.25C759.156 227.25 787.156 248.5 793.156 281H756.656C750.406 267.75 738.156 259.75 723.156 259.75C702.656 259.75 688.406 274.75 688.406 296.25C688.406 317.75 702.656 332.75 722.656 332.75C739.156 332.75 752.156 323.5 757.406 309.25H794.406C787.406 343.75 759.656 365.5 722.656 365.5ZM865.283 364.5C834.283 364.5 815.033 349 815.033 323.75C815.033 299.5 832.533 283.75 859.783 283.75H907.283V277.75C907.283 264.75 897.033 256.25 882.033 256.25C869.783 256.25 860.283 262.5 858.033 271.75H821.533C826.283 243.25 848.283 227.25 881.783 227.25C921.033 227.25 944.533 248.25 944.533 283V362H916.283L912.033 346.75C900.783 358.25 884.783 364.5 865.283 364.5ZM852.533 322.25C852.533 331.25 861.033 337.25 874.033 337.25C893.033 337.25 906.783 325.25 907.533 307.5H871.533C860.033 307.5 852.533 313.25 852.533 322.25ZM979.98 362V177H1017.98V362H979.98ZM1099.66 364.5C1068.66 364.5 1049.41 349 1049.41 323.75C1049.41 299.5 1066.91 283.75 1094.16 283.75H1141.66V277.75C1141.66 264.75 1131.41 256.25 1116.41 256.25C1104.16 256.25 1094.66 262.5 1092.41 271.75H1055.91C1060.66 243.25 1082.66 227.25 1116.16 227.25C1155.41 227.25 1178.91 248.25 1178.91 283V362H1150.66L1146.41 346.75C1135.16 358.25 1119.16 364.5 1099.66 364.5ZM1086.91 322.25C1086.91 331.25 1095.41 337.25 1108.41 337.25C1127.41 337.25 1141.16 325.25 1141.91 307.5H1105.91C1094.41 307.5 1086.91 313.25 1086.91 322.25Z" fill={theme === 'dark' ? 'white' : '#0f172a'}/>
            </svg>
            <span className={`text-[10px] uppercase font-bold tracking-widest border px-1.5 py-0.5 rounded transition-all duration-300 ${
              theme === 'dark' ? 'text-[#CEF84E] border-[#CEF84E]/20' : 'text-slate-900 border-[#CEF84E] bg-[#CEF84E]/20'
            }`}>
              Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-2 text-xs font-semibold opacity-70">
              <UserCheck size={14} className="text-primary" />
              Logged in as: <strong className="text-foreground">{client?.name}</strong>
            </span>

            <div className="h-5 w-px bg-sidebar-border hidden md:block"></div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm active-press ${
                theme === 'dark' 
                  ? 'bg-muted/50 border-white/5 text-slate-300 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Change Password button */}
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active-press ${
                theme === 'dark'
                  ? 'bg-muted/50 border-white/5 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Change Password</span>
            </button>

            {/* Logout button */}
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active-press ${
                theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25'
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              }`}
            >
              <LogOut size={13} />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 animate-fade-in-scale">
        
        {/* Decorative ambiance */}
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-primary/4 blur-[130px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-blue-500/3 blur-[130px] pointer-events-none -z-10"></div>

        {/* LEFT COLUMN: SLA + Ticketing */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* SLA & Subscription Details Card */}
          <section className={`border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-[#11131E]/60 border-white/5 shadow-2xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-100'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
              theme === 'dark' ? 'from-primary/40 to-blue-500/20' : 'from-primary/90 to-blue-500/80'
            }`}></div>

            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Service Level Agreement</p>
                <h3 className="text-lg font-black tracking-tight mt-0.5">Static &amp; Dynamic Hosting SLA</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border animate-pulse ${
                client?.status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {client?.status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#151824]/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <Activity size={18} className="text-primary mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Hosting Tier</span>
                <p className="text-sm font-bold capitalize mt-0.5">
                  {client?.subscriptionType ? `${client.subscriptionType} Engine` : 'N/A'}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#151824]/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <Clock size={18} className="text-blue-400 mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Period</span>
                <p className="text-sm font-bold mt-0.5">
                  {client?.subscriptionMonths ? `${client.subscriptionMonths} Months` : 'N/A'}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#151824]/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <ShieldCheck size={18} className="text-primary mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">SLA Start Date</span>
                <p className="text-sm font-bold mt-0.5">
                  {client?.subscriptionStartDate ? formatDate(client.subscriptionStartDate) : 'N/A'}
                </p>
              </div>
            </div>

            {/* SLA bullet details */}
            <div className={`p-4 rounded-xl text-xs space-y-2 border ${
              theme === 'dark' ? 'bg-[#151824]/20 border-white/5 text-slate-400' : 'bg-slate-50/50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex gap-2.5">
                <span className="text-primary shrink-0">✔</span>
                <span><strong>Premium CDN Node caching</strong> enabled globally for low-latency delivery.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="text-primary shrink-0">✔</span>
                <span><strong>Uptime Guarantee</strong> of 99.99% with automated active backend failover routing.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="text-primary shrink-0">✔</span>
                <span><strong>Secure daily offsite database backups</strong> retained in multiple regional zones.</span>
              </div>
            </div>
          </section>

          {/* Interactive Ticketing Workspace */}
          <section className={`border rounded-2xl p-6 relative flex-1 flex flex-col min-h-[500px] transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-[#11131E]/60 border-white/5 shadow-2xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-100'
          }`}>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Developer Support Desk</p>
                <h3 className="text-lg font-black tracking-tight mt-0.5">Secure Conversation Threads</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 active-press transition-all duration-200 cursor-pointer shadow-md"
                style={{ boxShadow: theme === 'dark' ? '0 4px 15px rgba(206, 248, 78, 0.2)' : 'none' }}
              >
                <Plus size={14} />
                <span>Raise Ticket</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-stretch">
              
              {/* Ticket selector list */}
              <div className="md:col-span-5 flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-1.5 border-r border-sidebar-border/10">
                {tickets.length > 0 ? (
                  tickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer relative group ${
                        selectedTicketId === t.id
                          ? theme === 'dark'
                            ? 'bg-[#151824]/60 border-[#CEF84E]/30 text-white'
                            : 'bg-slate-100 border-[#CEF84E] text-slate-900'
                          : theme === 'dark'
                            ? 'bg-[#151824]/20 border-white/5 hover:bg-[#151824]/40 text-slate-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-muted/40 px-1.5 py-0.5 rounded border border-border/20 text-muted-foreground truncate max-w-[80px]">
                          {t.category}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-1 rounded ${
                          t.status === 'open'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : t.status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {t.status === 'in_progress' ? 'active' : t.status}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-black truncate leading-tight group-hover:text-primary transition-colors">
                        {t.title}
                      </h4>
                      
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} />
                        {formatDate(t.createdAt)}
                      </span>

                      {selectedTicketId === t.id && (
                        <span className="absolute left-0 top-1/3 bottom-1/3 w-1.5 rounded-r bg-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed border-border/20 rounded-xl h-[280px]">
                    <Ticket size={24} className="text-muted-foreground opacity-30 mb-2" />
                    <h5 className="text-xs font-bold">No Support Tickets</h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      Need development modifications or hosting support? Click the button above to open a ticket.
                    </p>
                  </div>
                )}
              </div>

              {/* Message thread column */}
              <div className="md:col-span-7 flex flex-col border border-border/20 rounded-xl overflow-hidden min-h-[380px]">
                {selectedTicketId && activeTicket ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-4 py-3 bg-muted/20 border-b border-border/30 flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate text-foreground">{activeTicket.title}</h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{activeTicket.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Ticket Status Badge */}
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                          activeTicket.status === 'open'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : activeTicket.status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : activeTicket.status === 'resolved'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {activeTicket.status === 'in_progress' ? 'In Progress' : activeTicket.status}
                        </span>
                        {/* Priority Badge */}
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          activeTicket.priority === 'urgent' || activeTicket.priority === 'high'
                            ? 'bg-red-500/10 text-red-400 border-red-500/25'
                            : 'bg-muted/40 text-muted-foreground border-border/20'
                        }`}>
                          {activeTicket.priority}
                        </span>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[260px] bg-muted/5">
                      
                      {/* Original ticket description — client always on right */}
                      <div className="flex gap-2 justify-end">
                        <div className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                          theme === 'dark'
                            ? 'bg-[#CEF84E]/10 border border-[#CEF84E]/15 text-[#CEF84E]'
                            : 'bg-[#CEF84E]/30 border border-[#CEF84E]/60 text-slate-900'
                        }`}>
                          <p className="font-extrabold text-[9px] opacity-50 mb-1 uppercase text-right">TICKET INITIATION — {client?.name}</p>
                          <p className="whitespace-pre-wrap">{activeTicket.description}</p>
                          <span className="block text-[8px] opacity-50 mt-1.5 text-right">{formatDate(activeTicket.createdAt)}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-[#CEF84E]/25 text-primary flex items-center justify-center font-black text-[9px] border border-primary/20 shrink-0">
                          {client?.name ? client.name[0].toUpperCase() : 'C'}
                        </div>
                      </div>

                      {/* Conversation thread — client on RIGHT, admin on LEFT */}
                      {ticketMessages.map((msg) => {
                        const isAdmin = msg.senderType === 'admin';
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                          >
                            {/* Admin avatar — LEFT side */}
                            {isAdmin && (
                              <div className="w-6 h-6 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center font-black text-[9px] border border-border/30 shrink-0">
                                S
                              </div>
                            )}

                            <div className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                              isAdmin
                                ? theme === 'dark'
                                  ? 'bg-[#151824]/50 border border-white/5 text-slate-300'
                                  : 'bg-slate-100 border border-slate-200 text-slate-800'
                                : theme === 'dark'
                                  ? 'bg-[#CEF84E]/10 border border-[#CEF84E]/15 text-[#CEF84E]'
                                  : 'bg-[#CEF84E]/30 border border-[#CEF84E]/60 text-slate-900'
                            }`}>
                              <p className={`font-extrabold text-[9px] opacity-50 mb-1 uppercase ${
                                isAdmin ? 'text-left' : 'text-right'
                              }`}>
                                {isAdmin ? 'Scala Engineering Core' : client?.name}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                              <span className="block text-[8px] opacity-50 mt-1.5 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Client avatar — RIGHT side */}
                            {!isAdmin && (
                              <div className="w-6 h-6 rounded-full bg-[#CEF84E]/25 text-primary flex items-center justify-center font-black text-[9px] border border-primary/20 shrink-0">
                                {client?.name ? client.name[0].toUpperCase() : 'C'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-2 bg-muted/20 border-t border-border/30 flex gap-2">
                      <input
                        type="text"
                        placeholder="Type response back to support staff..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sendingMessage}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none transition-all ${
                          theme === 'dark'
                            ? 'bg-muted/10 border border-white/5 text-white focus:border-primary/45 placeholder:text-slate-500'
                            : 'bg-white border border-slate-200 text-slate-900 focus:border-primary/60 placeholder:text-slate-400'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active-press transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center shrink-0"
                      >
                        {sendingMessage ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                    <MessageSquare size={28} className="text-muted-foreground opacity-30 mb-2" />
                    <h5 className="text-xs font-bold text-muted-foreground">
                      {tickets.length > 0 ? 'Select a Support Thread' : 'No Active Threads'}
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      {tickets.length > 0
                        ? 'Select a ticket from the left panel to open your active message session.'
                        : 'Raise a new ticket using the button above to get started.'}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Billing & Invoices */}
        <div className="lg:col-span-5 flex flex-col">
          
          <section className={`border rounded-2xl p-6 relative flex flex-col min-h-[500px] transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-[#11131E]/60 border-white/5 shadow-2xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-100'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
              theme === 'dark' ? 'from-blue-500/20 to-primary/40' : 'from-blue-500/80 to-primary/95'
            }`}></div>

            <div className="mb-6 text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Financial Accounts</p>
              <h3 className="text-lg font-black tracking-tight mt-0.5">SLA Billing Invoice History</h3>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[640px]">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-200 text-left hover:scale-[1.01] ${
                      theme === 'dark'
                        ? 'bg-[#151824]/30 border-white/5 hover:bg-[#151824]/50'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-black tracking-tight text-foreground flex items-center gap-1.5">
                        <FileText size={14} className="text-primary" />
                        {inv.invoiceNumber}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : inv.status === 'issued'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-1">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Due Billing Date</span>
                        <span className="text-xs font-bold">{formatDate(inv.dueDate)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Total SLA Charge</span>
                        <span className="text-sm font-black text-primary">{formatCurrency(inv.total)}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 pt-2 border-t border-sidebar-border/10 w-full mt-1">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        target="_blank"
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 active-press cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-200 hover:text-white'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Eye size={12} />
                        <span>View Document</span>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed border-border/20 rounded-xl flex-1 min-h-[300px]">
                  <Receipt size={28} className="text-muted-foreground opacity-30 mb-2" />
                  <h5 className="text-xs font-bold">No Billing Invoices</h5>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    Any future static setup, dynamically scaled cloud charges, or retainer bills will display here.
                  </p>
                </div>
              )}
            </div>

          </section>

        </div>

      </main>

      {/* ── MODAL: CREATE SUPPORT TICKET ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleTicketBackdropClick}
          />

          {/* Modal */}
          <div className={`relative w-full max-w-md border rounded-2xl p-6 shadow-2xl backdrop-blur-xl animate-fade-in-scale text-left z-10 transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#11131E]/95 border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black tracking-tight">Raise Secure Support Ticket</h3>
              <button
                type="button"
                onClick={handleCloseTicketModal}
                disabled={creatingTicket}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="space-y-4" noValidate>
              {/* Ticket Title */}
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
                }`}>
                  Ticket Subject / Title <span className="text-red-400">*</span>
                </label>
                <input
                  ref={ticketTitleRef}
                  type="text"
                  placeholder="e.g. Memory leak on CMS dashboard"
                  value={newTicketTitle}
                  onChange={(e) => { setNewTicketTitle(e.target.value); if (e.target.value) setTicketTitleError(''); }}
                  disabled={creatingTicket}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                    ticketTitleError
                      ? 'border border-red-400 bg-red-500/5'
                      : theme === 'dark'
                        ? 'bg-muted/20 border border-white/5 text-white focus:border-primary/45'
                        : 'bg-slate-100/50 border border-slate-200 text-slate-900 focus:border-primary/60'
                  }`}
                />
                {ticketTitleError && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {ticketTitleError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
                  }`}>
                    Category
                  </label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    disabled={creatingTicket}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#151824] border border-white/5 text-white focus:border-primary/45'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-primary/60'
                    }`}
                  >
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Inquiry</option>
                    <option value="general">General Request</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
                  }`}>
                    Priority
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    disabled={creatingTicket}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#151824] border border-white/5 text-white focus:border-primary/45'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-primary/60'
                    }`}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
                }`}>
                  Describe Your Issue <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={ticketDescRef}
                  rows={4}
                  placeholder="Provide precise details, steps to reproduce, or billing inquiries..."
                  value={newTicketDesc}
                  onChange={(e) => { setNewTicketDesc(e.target.value); if (e.target.value) setTicketDescError(''); }}
                  disabled={creatingTicket}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all leading-relaxed ${
                    ticketDescError
                      ? 'border border-red-400 bg-red-500/5'
                      : theme === 'dark'
                        ? 'bg-muted/20 border border-white/5 text-white focus:border-primary/45'
                        : 'bg-slate-100/50 border border-slate-200 text-slate-900 focus:border-primary/60'
                  }`}
                />
                {ticketDescError && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {ticketDescError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseTicketModal}
                  disabled={creatingTicket}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer active-press transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 active-press transition-all duration-200 cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {creatingTicket ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHANGE PORTAL PASSWORD ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handlePasswordBackdropClick}
          />

          {/* Modal */}
          <div className={`relative w-full max-w-sm border rounded-2xl p-6 shadow-2xl backdrop-blur-xl animate-fade-in-scale text-left z-10 transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#11131E]/95 border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black tracking-tight">Change Portal Password</h3>
              <button 
                type="button" 
                onClick={handleClosePasswordModal}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1.5 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'
                }`}>
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new secure password"
                    value={newPortalPassword}
                    onChange={(e) => { setNewPortalPassword(e.target.value); if (e.target.value) setPasswordError(''); }}
                    disabled={isSavingPassword}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs font-mono focus:outline-none transition-all ${
                      passwordError
                        ? 'border border-red-400 bg-red-500/5'
                        : theme === 'dark'
                          ? 'bg-muted/20 border border-white/5 text-white focus:border-primary/45'
                          : 'bg-slate-100/50 border border-slate-200 text-slate-900 focus:border-primary/60'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {passwordError}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground mt-1.5">Minimum 6 characters. You will use this password on your next login.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={isSavingPassword}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer active-press transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPortalPassword.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 active-press transition-all duration-200 cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
