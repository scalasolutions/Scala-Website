'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Search, 
  X,
  Ticket,
  Clock,
  CheckCircle,
  MessageSquare,
  Send,
  User,
  Building,
  AlertOctagon,
  HelpCircle,
  FileText,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { 
  getTickets, 
  getClients, 
  getTicketDetails, 
  createTicket, 
  createTicketMessage, 
  updateTicketStatus, 
  MockTicket, 
  MockClient, 
  MockTicketMessage 
} from '@/lib/db/queries';

export default function TicketsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<MockClient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  // New Ticket State
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newCategory, setNewCategory] = useState<'billing' | 'technical' | 'general' | 'feature_request'>('technical');

  // Message Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if new=true exists in URL to open modal
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        setModalOpen(true);
      }
      
      const targetClient = params.get('client');
      if (targetClient) {
        setNewClientId(targetClient);
        setModalOpen(true);
      }

      const idParam = params.get('id');
      if (idParam) {
        setSelectedTicketId(idParam);
      }
    }

    async function loadData() {
      const t = await getTickets();
      const c = await getClients();
      setTickets(t);
      setClients(c);
      setLoading(false);
    }
    loadData();
  }, []);

  // Fetch ticket details whenever a ticket is selected
  useEffect(() => {
    if (!selectedTicketId) {
      setActiveTicket(null);
      return;
    }

    async function loadThread() {
      if (!selectedTicketId) return;
      setThreadLoading(true);
      try {
        const details = await getTicketDetails(selectedTicketId);
        setActiveTicket(details);
        // Scroll to bottom
        setTimeout(() => {
          threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err) {
        console.error("Failed to load ticket details", err);
      } finally {
        setThreadLoading(false);
      }
    }
    loadThread();
  }, [selectedTicketId]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newClientId) return;

    startTransition(async () => {
      try {
        const t = await createTicket({
          clientId: newClientId,
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          category: newCategory,
          status: 'open'
        });

        if (t) {
          // Immediately seed initial message inside the thread in database/mock state
          await createTicketMessage({
            ticketId: t.id,
            senderType: 'client',
            senderName: clients.find(c => c.id === newClientId)?.name || 'Client',
            message: newDescription
          });

          // Fetch full tickets list again
          const updatedList = await getTickets();
          setTickets(updatedList);

          // Reset form fields
          setModalOpen(false);
          setNewTitle('');
          setNewDescription('');
          setNewClientId('');
          setNewPriority('medium');
          setNewCategory('technical');

          // Open the newly created ticket thread
          setSelectedTicketId(t.id);

          // Clear query strings
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/admin/tickets');
          }
        }
      } catch (err) {
        console.error("Failed to create ticket", err);
      }
    });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    setSendingReply(true);
    try {
      const msg = await createTicketMessage({
        ticketId: selectedTicketId,
        senderType: 'admin',
        senderName: 'Scala Support',
        message: replyText.trim()
      });

      if (msg) {
        // Update active ticket state locally
        setActiveTicket((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...(prev.messages || []), msg]
          };
        });
        
        // Clear input field
        setReplyText('');
        
        // Refresh list in sidebar
        const updatedList = await getTickets();
        setTickets(updatedList);

        // Scroll to bottom
        setTimeout(() => {
          threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedTicketId) return;
    try {
      const updated = await updateTicketStatus(selectedTicketId, status);
      if (updated) {
        // Update active ticket locally
        setActiveTicket((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            status
          };
        });
        
        // Refresh list in sidebar
        const updatedList = await getTickets();
        setTickets(updatedList);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'low':
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'billing':
        return <FileText size={12} className="text-amber-400 shrink-0" />;
      case 'technical':
        return <AlertOctagon size={12} className="text-red-400 shrink-0" />;
      case 'feature_request':
        return <MessageSquare size={12} className="text-primary shrink-0" />;
      case 'general':
      default:
        return <HelpCircle size={12} className="text-blue-400 shrink-0" />;
    }
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case 'open':
        return 'bg-red-500/10 text-red-400';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'closed':
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.client?.name && t.client.name.toLowerCase().includes(search.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col overflow-hidden animate-fade-up relative">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Support Tickets</h1>
            <div className="relative overflow-hidden px-2.5 py-0.5 rounded border border-yellow-500/40 flex items-center justify-center select-none bg-[repeating-linear-gradient(-45deg,#eab308,#eab308_6px,#000_6px,#000_12px)] shadow-[0_2px_8px_rgba(0,0,0,0.3)] shrink-0 transform -rotate-2">
              <span className="bg-black px-2 py-0.5 text-[9px] font-black tracking-widest font-mono text-yellow-400 rounded border border-yellow-500/20 uppercase shadow-sm">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Review, assign, and respond to clients support tickets.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active-press transition-all duration-200 cursor-pointer self-start"
          style={{ boxShadow: '0 0 15px rgba(206, 248, 78, 0.25)' }}
        >
          <Plus size={16} />
          Create Support Ticket
        </button>
      </div>

      {/* Main Grid: Ticket List Sidebar & Thread Panel */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: TICKETS QUEUE */}
        <div className={`w-full lg:w-96 flex flex-col gap-4 overflow-hidden shrink-0 ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search tickets queue..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all"
            />
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-2">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] text-muted-foreground">Gathering queue details...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
                <Ticket className="mx-auto text-muted-foreground opacity-30 mb-2" size={24} />
                <p className="text-xs font-semibold">No Tickets Found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    selectedTicketId === ticket.id 
                      ? 'bg-primary/5 border-primary/40 shadow-sm' 
                      : 'bg-card border-border hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                      Ticket #{ticket.id.substring(0, 6)}
                    </span>
                    <span className={`text-[8px] uppercase font-black px-1.5 py-0.25 rounded ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold truncate mt-1.5 group-hover:text-primary transition-colors ${
                    selectedTicketId === ticket.id ? 'text-primary' : 'text-foreground'
                  }`}>
                    {ticket.title}
                  </h3>

                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{ticket.description}</p>
                  
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50 text-[9px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(ticket.category)}
                      <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                    </div>
                    <span className={`px-1.5 py-0.25 rounded uppercase font-black text-[8px] ${getStatusBadge(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT THREAD PANEL */}
        <div className={`flex-1 flex flex-col rounded-2xl border border-border bg-card overflow-hidden min-w-0 ${!selectedTicketId ? 'hidden lg:flex items-center justify-center p-12 text-center' : 'flex'}`}>
          {selectedTicketId ? (
            threadLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xs text-muted-foreground">Pulling communications log...</p>
              </div>
            ) : activeTicket ? (
              <React.Fragment>
                {/* Thread Header */}
                <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between shrink-0">
                  <div className="min-w-0 flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedTicketId(null)}
                      className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer shrink-0"
                    >
                      <X size={16} />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">Ticket #{activeTicket.id.substring(0, 8)}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 rounded ${getPriorityBadge(activeTicket.priority)}`}>
                          {activeTicket.priority}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-foreground truncate mt-0.5">{activeTicket.title}</h3>
                    </div>
                  </div>

                  {/* Status update selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Status:</span>
                    <div className="relative">
                      <select
                        value={activeTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="px-2.5 py-1 pr-6 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-primary/40 font-semibold appearance-none cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Profile details */}
                <div className="px-5 py-3 bg-muted/10 border-b border-border/80 text-xs flex flex-wrap gap-4 items-center shrink-0">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" />
                    <span className="font-semibold">{activeTicket.client?.name || 'Loading client...'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building size={13} className="text-muted-foreground" />
                    <span className="text-muted-foreground">{activeTicket.client?.companyName || 'No Company'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Created: {new Date(activeTicket.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* Scrollable messages log */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  
                  {/* Original ticket issue */}
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50 max-w-2xl">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wide block">Original Ticket Issue Description</span>
                    <p className="text-xs font-semibold text-foreground mt-1.5">{activeTicket.description}</p>
                  </div>

                  <div className="h-px bg-border my-6"></div>

                  {/* Chat bubbles */}
                  {activeTicket.messages?.map((message: MockTicketMessage) => {
                    const isAdmin = message.senderType === 'admin';
                    return (
                      <div 
                        key={message.id}
                        className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mb-1">
                          <span className="font-bold">{message.senderName}</span>
                          <span>•</span>
                          <span>{new Date(message.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdmin 
                            ? 'bg-primary text-primary-foreground font-semibold rounded-tr-none' 
                            : 'bg-muted border border-border rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>

                {/* Reply Box input panel */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-border bg-muted/10 flex gap-3 shrink-0 items-end">
                  <textarea
                    rows={1}
                    required
                    placeholder="Write support reply or technical feedback here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary/40 transition-all text-foreground resize-none max-h-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer active-press"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </React.Fragment>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <AlertTriangle size={32} className="text-red-400 mb-2 opacity-50" />
                <p className="text-sm font-semibold">Error Loading Thread</p>
                <p className="text-xs text-muted-foreground">The ticket thread could not be loaded.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <MessageSquare size={36} className="text-primary/40 mb-3 animate-bounce" style={{ filter: 'drop-shadow(0 0 10px rgba(206, 248, 78, 0.15))' }} />
              <h3 className="font-bold text-sm">No Thread Selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Select a ticket from the left panel queue to review client logs and reply.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* --- CREATE SUPPORT TICKET MODAL --- */}
      {mounted && modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md" onClick={() => setModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl animate-fade-in-scale max-h-[82vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-primary" />
                <h3 className="text-lg font-bold">Raise Support Ticket</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Select Client Account *</label>
                <div className="relative">
                  <select
                    required
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-card">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-card">{c.name} ({c.companyName || 'No Company'})</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Ticket Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Brief summary of the issue..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Category *</label>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="technical" className="bg-card">Technical Issue</option>
                      <option value="billing" className="bg-card">Billing / Invoice Query</option>
                      <option value="general" className="bg-card">General Query</option>
                      <option value="feature_request" className="bg-card">Feature Request</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Priority Level</label>
                  <div className="relative">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="low" className="bg-card">Low (Non-urgent)</option>
                      <option value="medium" className="bg-card">Medium</option>
                      <option value="high" className="bg-card">High (Urgently pending)</option>
                      <option value="urgent" className="bg-card">Urgent (Production down!)</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Issue Description *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Provide precise details, steps to reproduce, or invoice reference numbers..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-sm focus:border-primary/40 focus:outline-none transition-all text-foreground"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  {isPending ? 'Submitting...' : 'Raise Ticket'}
                  <Plus size={14} />
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
