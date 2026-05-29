'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  X,
  Ticket,
  Clock,
  MessageSquare,
  Send,
  User,
  Building,
  AlertOctagon,
  HelpCircle,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  getTickets,
  getClients,
  getTicketDetails,
  createTicket,
  createTicketMessage,
  updateTicketStatus,
  MockClient,
  MockTicketMessage,
} from '@/lib/db/queries';
import { invalidateCache, CACHE_KEYS } from '@/lib/data-cache';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeading from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// Map ticket status/priority to our shared Badge variants. No raw hex.
const statusToBadgeVariant = (
  status: string
): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'resolved':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'open':
      return 'danger';
    case 'closed':
    default:
      return 'neutral';
  }
};

const priorityToBadgeVariant = (
  priority: string
): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'neutral';
    case 'low':
    default:
      return 'neutral';
  }
};

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'billing':
      return <FileText size={12} className="shrink-0" />;
    case 'technical':
      return <AlertOctagon size={12} className="shrink-0" />;
    case 'feature_request':
      return <MessageSquare size={12} className="shrink-0" />;
    case 'general':
    default:
      return <HelpCircle size={12} className="shrink-0" />;
  }
};

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
      // Parallel fetch — clients and tickets load concurrently.
      const [t, c] = await Promise.all([getTickets(), getClients()]);
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
        console.error('Failed to load ticket details', err);
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
          status: 'open',
        });

        if (t) {
          // Immediately seed initial message inside the thread in database/mock state
          await createTicketMessage({
            ticketId: t.id,
            senderType: 'client',
            senderName: clients.find((c) => c.id === newClientId)?.name || 'Client',
            message: newDescription,
          });

          // Fetch full tickets list again — also invalidate cache so notifications bell is fresh.
          invalidateCache(CACHE_KEYS.TICKETS);
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
        console.error('Failed to create ticket', err);
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
        message: replyText.trim(),
      });

      if (msg) {
        // Update active ticket state locally
        setActiveTicket((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...(prev.messages || []), msg],
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
      console.error('Failed to send reply', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicketId) return;
    try {
      const updated = await updateTicketStatus(selectedTicketId, status);
      if (updated) {
        invalidateCache(CACHE_KEYS.TICKETS);
        // Update active ticket locally
        setActiveTicket((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            status,
          };
        });

        // Refresh list in sidebar
        const updatedList = await getTickets();
        setTickets(updatedList);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.client?.name && t.client.name.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-up">
      {/* Page header — calm, dialed-down from the old extrabold heading */}
      <PageHeader
        title="Support Tickets"
        description="Review, assign, and respond to client support tickets."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() => setModalOpen(true)}
          >
            Create Ticket
          </Button>
        }
      />

      {/* Main split: list + thread */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* LEFT COLUMN: TICKETS QUEUE */}
        <div
          className={cn(
            'w-full lg:w-96 flex-col gap-4 overflow-hidden shrink-0',
            selectedTicketId ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* Search bar */}
          <div className="shrink-0">
            <Input
              placeholder="Search tickets queue…"
              leftIcon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
                <p className="text-xs text-muted-foreground">Loading tickets…</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card padding="md">
                <EmptyState
                  icon={<Ticket size={20} />}
                  title="No tickets found"
                  description="Try adjusting your search, or create a new ticket."
                />
              </Card>
            ) : (
              filteredTickets.map((ticket) => {
                const isActive = selectedTicketId === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-colors cursor-pointer block',
                      isActive
                        ? 'bg-card border-foreground/20'
                        : 'bg-card border-border hover:border-foreground/15'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-[0.1em]">
                        #{ticket.id.substring(0, 6)}
                      </span>
                      <Badge variant={priorityToBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>

                    <h3
                      className={cn(
                        'text-sm font-medium truncate mt-2',
                        isActive ? 'text-foreground' : 'text-foreground'
                      )}
                    >
                      {ticket.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5 capitalize">
                        {getCategoryIcon(ticket.category)}
                        {ticket.category.replace('_', ' ')}
                      </span>
                      <Badge variant={statusToBadgeVariant(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT THREAD PANEL */}
        <Card
          padding="sm"
          className={cn(
            'flex-1 flex flex-col overflow-hidden min-w-0 !p-0',
            !selectedTicketId && 'hidden lg:flex items-center justify-center'
          )}
        >
          {selectedTicketId ? (
            threadLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
                <p className="text-xs text-muted-foreground">Loading thread…</p>
              </div>
            ) : activeTicket ? (
              <React.Fragment>
                {/* Thread Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
                  <div className="min-w-0 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTicketId(null)}
                      className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer shrink-0"
                      aria-label="Back to list"
                    >
                      <X size={16} />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.1em]">
                          #{activeTicket.id.substring(0, 8)}
                        </span>
                        <Badge variant={priorityToBadgeVariant(activeTicket.priority)}>
                          {activeTicket.priority}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-medium text-foreground truncate mt-1">
                        {activeTicket.title}
                      </h3>
                    </div>
                  </div>

                  {/* Status update selector */}
                  <div className="shrink-0 w-44">
                    <Select
                      value={activeTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                      aria-label="Update ticket status"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Select>
                  </div>
                </div>

                {/* Client meta strip */}
                <div className="px-5 py-3 border-b border-border text-xs flex flex-wrap gap-x-5 gap-y-1.5 items-center shrink-0">
                  <span className="inline-flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {activeTicket.client?.name || 'Loading…'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building size={13} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {activeTicket.client?.companyName || 'No company'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(activeTicket.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                </div>

                {/* Scrollable messages log */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Original ticket issue */}
                  <div className="rounded-xl bg-muted/30 border border-border p-4 max-w-2xl">
                    <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-[0.1em]">
                      Original issue
                    </p>
                    <p className="text-sm text-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                      {activeTicket.description}
                    </p>
                  </div>

                  {/* Chat bubbles */}
                  {activeTicket.messages?.map((message: MockTicketMessage) => {
                    const isAdmin = message.senderType === 'admin';
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex flex-col max-w-[80%]',
                          isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5">
                          <span className="font-medium text-foreground">
                            {message.senderName}
                          </span>
                          <span>·</span>
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={cn(
                            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                            isAdmin
                              ? 'bg-primary text-primary-foreground rounded-tr-md'
                              : 'bg-muted/40 border border-border text-foreground rounded-tl-md'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>

                {/* Reply Box */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-border flex gap-3 shrink-0 items-end"
                >
                  <Textarea
                    rows={1}
                    required
                    placeholder="Write a reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    containerClassName="flex-1"
                    className="max-h-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={sendingReply || !replyText.trim()}
                    className="!px-3"
                    aria-label="Send reply"
                  >
                    <Send size={14} />
                  </Button>
                </form>
              </React.Fragment>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <AlertTriangle size={28} className="text-red-500/70 mb-3" />
                <p className="text-sm font-medium text-foreground">Error loading thread</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The ticket thread could not be loaded.
                </p>
              </div>
            )
          ) : (
            <EmptyState
              icon={<MessageSquare size={20} />}
              title="No thread selected"
              description="Select a ticket from the left to review the conversation and reply."
            />
          )}
        </Card>
      </div>

      {/* --- CREATE SUPPORT TICKET MODAL --- */}
      {mounted &&
        modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title="New support ticket"
                  description="Raise a ticket on behalf of a client."
                  action={
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleCreateTicket} className="space-y-5">
                  <Select
                    label="Client *"
                    required
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                  >
                    <option value="">— Select client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyName || 'No company'})
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Ticket title *"
                    required
                    placeholder="Brief summary of the issue…"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="Category *"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                    >
                      <option value="technical">Technical issue</option>
                      <option value="billing">Billing / invoice query</option>
                      <option value="general">General query</option>
                      <option value="feature_request">Feature request</option>
                    </Select>

                    <Select
                      label="Priority"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                  </div>

                  <Textarea
                    label="Issue description *"
                    required
                    rows={4}
                    placeholder="Provide details, steps to reproduce, or invoice references…"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? 'Submitting…' : 'Create ticket'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
