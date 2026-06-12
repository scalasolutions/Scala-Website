'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Ticket,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronsLeft,
  Sun,
  Moon,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  LogOut,
  Coins,
  ClipboardList
} from 'lucide-react';
import {
  useAdminData,
  CACHE_KEYS,
} from '@/lib/data-cache';
import { getClients, getInvoices, getTickets, MockClient, MockInvoice } from '@/lib/db/queries';
import { getSubscriptionRemainingMonths, cn } from '@/lib/utils';
import ScalaLogo from '@/components/ui/ScalaLogo';
import Badge from '@/components/ui/Badge';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: React.ReactNode;
  collapsed?: boolean;
}

function SidebarItem({ href, icon, label, active, badge, collapsed = false }: SidebarItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center rounded-xl transition-[gap,padding,background-color,color] duration-300 ease-out',
        collapsed ? 'gap-0 px-3 py-3 justify-center' : 'gap-3 px-4 py-2.5',
        active
          ? 'text-primary-foreground bg-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
      )}
    >
      <span className={cn('shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
        {icon}
      </span>
      {/* Label uses max-width + opacity for a clean fade-out without reflow. */}
      <span
        className={cn(
          'text-sm whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300 ease-out',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
        )}
      >
        {label}
      </span>
      {badge && (
        <span
          className={cn(
            'ml-auto shrink-0 z-10 flex items-center transition-opacity duration-200',
            collapsed ? 'opacity-0 pointer-events-none w-0 ml-0' : 'opacity-100'
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

interface NotificationItem {
  id: string;
  type: 'expiry' | 'ticket' | 'invoice';
  title: string;
  description: string;
  link: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Notifications, Profile, & Cache State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const { data: clientsData } = useAdminData<MockClient[]>(CACHE_KEYS.CLIENTS, getClients);
  const { data: invoicesData } = useAdminData<(MockInvoice & { client?: MockClient })[]>(CACHE_KEYS.INVOICES, getInvoices as any);
  const { data: ticketsData } = useAdminData<any[]>(CACHE_KEYS.TICKETS, getTickets);

  const notifications = React.useMemo(() => {
    if (!clientsData || !invoicesData || !ticketsData) return [];

    const list: NotificationItem[] = [];

    // 1. Subscription Expiry alerts (< 3 months)
    clientsData.forEach(client => {
      if (client.status === 'active' && client.subscriptionType) {
        const rem = getSubscriptionRemainingMonths(client);
        if (rem !== null && rem < 3) {
          list.push({
            id: `expiry-${client.id}`,
            type: 'expiry',
            title: `${client.name} Subscription Quota`,
            description: rem === 0 ? 'Hosting subscription has fully expired!' : `Only ${rem} month${rem > 1 ? 's' : ''} left on static/dynamic hosting SLA.`,
            link: `/admin/clients/${client.id}`
          });
        }
      }
    });

    // 2. Urgent or High priority support tickets
    ticketsData.forEach(ticket => {
      if (ticket.status !== 'resolved' && ticket.status !== 'closed' && (ticket.priority === 'urgent' || ticket.priority === 'high')) {
        list.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          title: `Urgent Ticket: ${ticket.title}`,
          description: `Client support request requires prompt attention.`,
          link: `/admin/tickets`
        });
      }
    });

    // 3. Past due invoices
    invoicesData.forEach(invoice => {
      if (invoice.status === 'past_due') {
        const clientName = invoice.client?.name || 'Partner Account';
        list.push({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: `Invoice Past Due`,
          description: `Billing past due for ${clientName} (${invoice.invoiceNumber}).`,
          link: `/admin/invoices`
        });
      }
    });

    return list;
  }, [clientsData, invoicesData, ticketsData]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
    // Restore collapsed sidebar preference.
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navigation = [
    { href: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/admin/board', icon: <ClipboardList size={18} />, label: 'Client Board' },
    { href: '/admin/clients', icon: <Users size={18} />, label: 'Clients' },
    { href: '/admin/invoices', icon: <Receipt size={18} />, label: 'Invoices' },
    { href: '/admin/finance', icon: <Coins size={18} />, label: 'Finance' },
    {
      href: '/admin/tickets',
      icon: <Ticket size={18} />,
      label: 'Support Tickets',
    },
  ];

  // Breadcrumb segments
  const segmentLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    board: 'Client Board',
    clients: 'Clients',
    invoices: 'Invoices',
    finance: 'Finance',
    tickets: 'Support Tickets'
  };
  const segments = pathname.split('/').filter(Boolean);
  const pathSegments = segments.slice(1).length > 0 ? segments.slice(1) : ['dashboard'];

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-[width] duration-300 ease-out',
          sidebarCollapsed ? 'w-[64px]' : 'w-64'
        )}
      >

        {/* Brand/Logo Area — logo centered; collapse button floats on the right
            when expanded, stacks below when collapsed. */}
        <div
          className={cn(
            'relative border-b border-sidebar-border transition-[padding] duration-300 ease-out',
            sidebarCollapsed
              ? 'px-2 py-3 flex flex-col items-center gap-2'
              : 'px-4 py-3.5 flex items-center justify-center'
          )}
        >
          <ScalaLogo
            variant={sidebarCollapsed ? 'mark-only' : 'full'}
            className={cn(
              'w-auto transition-[height] duration-300 ease-out',
              sidebarCollapsed ? 'h-7' : 'h-8'
            )}
          />
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer',
              !sidebarCollapsed && 'absolute right-3 top-1/2 -translate-y-1/2'
            )}
          >
            <ChevronsLeft
              size={14}
              className={cn(
                'transition-transform duration-300 ease-out',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Sidebar Items */}
        <nav
          className={cn(
            'flex-1 flex flex-col gap-1 py-6 overflow-y-auto transition-[padding] duration-300 ease-out',
            sidebarCollapsed ? 'px-2' : 'px-3'
          )}
        >
          {navigation.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname.startsWith(item.href)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* User profile section */}
        <div
          className={cn(
            'border-t border-sidebar-border transition-[padding] duration-300 ease-out',
            sidebarCollapsed ? 'p-2' : 'p-4'
          )}
        >
          <div
            className={cn(
              'flex items-center rounded-xl transition-[gap,padding] duration-300 ease-out',
              sidebarCollapsed ? 'gap-0 p-1 justify-center' : 'gap-2 p-1.5'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-muted/60 text-foreground flex items-center justify-center text-sm font-medium border border-border shrink-0">
              S
            </div>
            {/* Detail block collapses to zero width with a fade. */}
            <div
              className={cn(
                'min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-out',
                sidebarCollapsed ? 'max-w-0 opacity-0' : 'flex-1 max-w-[180px] opacity-100'
              )}
            >
              <p className="text-sm font-medium text-foreground truncate" title="Scala Solutions">Scala Solutions</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="brand" className="text-[9px] tracking-[0.12em] uppercase px-1.5 py-0 shrink-0">
                  Admin
                </Badge>
                <span className="text-[10px] text-muted-foreground select-none">•</span>
                <p className="text-xs text-muted-foreground truncate">Scala</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className={cn(
                'p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-[opacity,color,background-color,width,padding] duration-300 ease-out cursor-pointer shrink-0',
                sidebarCollapsed && 'opacity-0 pointer-events-none w-0 p-0 overflow-hidden'
              )}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </aside>

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop mask */}
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>

          {/* Sidebar Drawer container */}
          <aside className="relative flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border animate-fade-in-scale">

            {/* Header / Brand */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
              <ScalaLogo variant="full" className="h-10 w-auto" />
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer" aria-label="Close sidebar menu">
                <X size={20} />
              </button>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto">
              {navigation.map((item) => (
                <div key={item.href} onClick={() => setMobileSidebarOpen(false)}>
                  <SidebarItem
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={pathname.startsWith(item.href)}
                  />
                </div>
              ))}
            </nav>

            {/* Profile bottom */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 p-2.5 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-muted/60 text-foreground flex items-center justify-center text-sm font-medium border border-border">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">Scala Solutions</p>
                    <Badge variant="brand" className="text-[9px] tracking-[0.14em] uppercase px-1.5 py-0 shrink-0">
                      Admin
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Scala</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sign Out"
                  className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

          </aside>
        </div>
      )}

      {/* --- MAIN CONTENT CANVAS --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header Bar */}
        <header id="admin-top-header" className="flex items-center justify-between h-16 px-6 bg-sidebar/50 border-b border-sidebar-border backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>

            {/* Quick Context Path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">
                Scala solutions
              </Link>
              {pathSegments.map((segment, index) => {
                let label = segmentLabels[segment] || segment;
                let isClientName = false;
                if (clientsData) {
                  const matchedClient = clientsData.find((c) => c.id === segment);
                  if (matchedClient) {
                    label = matchedClient.name;
                    isClientName = true;
                  }
                }
                const href = '/admin/' + pathSegments.slice(0, index + 1).join('/');
                const isLast = index === pathSegments.length - 1;

                return (
                  <React.Fragment key={segment}>
                    <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
                    {isLast ? (
                      <span className={cn("text-foreground font-medium truncate max-w-[200px]", !isClientName && "capitalize")}>
                        {label}
                      </span>
                    ) : (
                      <Link href={href} className={cn("hover:text-foreground transition-colors", !isClientName && "capitalize")}>
                        {label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Bell Dropdown */}
            <div ref={notificationsDropdownRef} className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={cn(
                  'p-2 rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer relative',
                  notificationsOpen && 'bg-muted/40 text-foreground'
                )}
                title="System Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-medium min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-background">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown Container */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-sm z-50 overflow-hidden animate-fade-in-scale"
                  style={{ transformOrigin: 'top right' }}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Alert Hub
                    </span>
                    {notifications.length > 0 && (
                      <Badge variant="danger">
                        {notifications.length} action item{notifications.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            router.push(item.link);
                          }}
                          className="p-3.5 hover:bg-muted/30 cursor-pointer transition-colors flex gap-3 group text-left"
                        >
                          <div className="shrink-0 mt-0.5">
                            {item.type === 'expiry' && (
                              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertTriangle size={14} />
                              </div>
                            )}
                            {item.type === 'ticket' && (
                              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                <AlertCircle size={14} />
                              </div>
                            )}
                            {item.type === 'invoice' && (
                              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                <Receipt size={14} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-medium text-foreground group-hover:text-foreground truncate">
                              {item.title}
                            </h5>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center px-6 py-10 text-center bg-card gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                          <CheckCircle2 size={18} />
                        </div>
                        <h5 className="text-sm font-medium text-foreground">All Clear</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[14rem]">
                          No outstanding hosting expiries, urgent tickets, or past-due invoices.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-border text-center">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                      <Clock size={10} />
                      Real-time SLA tracking
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-sidebar-border hidden sm:block mx-1"></div>

            {/* Profile Dropdown */}
            <div ref={profileDropdownRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={cn(
                  "flex items-center gap-2.5 p-1 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer text-left focus:outline-none",
                  profileOpen && "bg-muted/40"
                )}
                title="Admin Account"
              >
                <div className="w-8 h-8 rounded-full bg-muted/60 text-foreground flex items-center justify-center text-xs font-medium border border-border shrink-0">
                  S
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-semibold text-foreground leading-none">Scala Solutions</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">Admin</span>
                </div>
              </button>
              
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-md z-50 overflow-hidden animate-fade-in-scale py-1"
                  style={{ transformOrigin: 'top right' }}
                >
                  {/* User details */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-semibold text-foreground truncate mt-0.5">scalasolutions.dev@gmail.com</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-1">
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <LayoutDashboard size={14} />
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/tickets"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Ticket size={14} />
                      Support Desk
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        toggleTheme();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left cursor-pointer"
                    >
                      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                  
                  <div className="border-t border-border my-1" />
                  
                  {/* Sign out */}
                  <div className="p-1">
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors text-left cursor-pointer"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-8 md:p-10 bg-background relative">
          {/* One subtle lime glow — punctuation, not decoration. */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/3 blur-[120px] pointer-events-none"></div>

          <div className="max-w-6xl mx-auto animate-fade-in-scale">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}
