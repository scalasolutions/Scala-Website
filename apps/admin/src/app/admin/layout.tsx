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
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  User, 
  ExternalLink,
  Settings,
  Sun,
  Moon,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  LogOut
} from 'lucide-react';
import { 
  getClients, 
  getInvoices, 
  getTickets 
} from '@/lib/db/queries';
import { getSubscriptionRemainingMonths } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function SidebarItem({ href, icon, label, active }: SidebarItemProps) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active-press group relative ${
        active 
          ? 'bg-primary/10 text-primary font-medium nav-active-indicator' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
      {active && (
        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ boxShadow: '0 0 8px #CEF84E' }}></span>
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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, []);

  // Fetch alerts for notifications dropdown
  useEffect(() => {
    async function loadNotifications() {
      try {
        const c = await getClients();
        const inv = await getInvoices();
        const t = await getTickets();
        
        const list: NotificationItem[] = [];
        
        // 1. Subscription Expiry alerts (< 3 months)
        c.forEach(client => {
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
        t.forEach(ticket => {
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
        inv.forEach(invoice => {
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
        
        setNotifications(list);
      } catch (err) {
        console.error("Failed to load notifications panel", err);
      }
    }
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // refresh every 15s
    
    return () => clearInterval(interval);
  }, []);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
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
    { href: '/admin/clients', icon: <Users size={18} />, label: 'Clients' },
    { href: '/admin/invoices', icon: <Receipt size={18} />, label: 'Invoices' },
    { href: '/admin/tickets', icon: <Ticket size={18} />, label: 'Support Tickets' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0">
        
        {/* Brand/Logo Area */}
        <div className="flex items-center gap-2.5 px-6 py-6 border-b border-sidebar-border">
          {/* SVG Scala Full Logo */}
          <svg width="120" height="40" viewBox="0 0 1312 539" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-9 w-auto">
            <path d="M364 71C392.167 71 415 156.514 415 262C415 367.486 392.167 453 364 453C343.793 453 326.332 408.99 318.076 345.168C317.638 341.778 312.326 341.44 311.44 344.741C294.178 409.036 265.384 454.256 241.682 450.393C231.539 448.739 223.734 438.327 218.653 421.783C217.773 418.916 213.386 418.598 212.097 421.305C202.798 440.82 189.618 453 175 453C146.833 453 124 407.781 124 352C124 296.219 146.833 251 175 251C192.351 251 207.678 268.16 216.89 294.379C217.215 295.302 218.595 295.208 218.772 294.246C233.834 212.527 268.511 149.942 296.225 154.46C302.758 155.525 308.32 160.224 312.81 167.855C314.412 170.578 319.292 169.952 319.772 166.829C328.578 109.558 345.087 71 364 71Z" fill={theme === 'dark' ? '#CEF84E' : '#6fa100'}/>
            <path d="M563 365.5C519 365.5 492 342.5 492 306.25H531C531 323 543.5 332.75 562.75 332.75C579.25 332.75 589.75 326 589.75 314.25C589.75 302 578.5 294.75 553.75 289.5C512.75 280.75 493.5 263.75 493.5 235.25C493.5 203.25 518.5 183.5 558.75 183.5C600.25 183.5 626.75 206 626.75 241.25H588.5C588.5 225.5 577.5 216 559.25 216C542.5 216 532.25 223 532.25 234.5C532.25 245.25 541.5 252 568.25 258.25C611.75 268.5 630 285 630 312.75C630 345.75 604.5 365.5 563 365.5ZM722.656 365.5C680.406 365.5 650.906 336.75 650.906 296.25C650.906 256 680.656 227.25 722.656 227.25C759.156 227.25 787.156 248.5 793.156 281H756.656C750.406 267.75 738.156 259.75 723.156 259.75C702.656 259.75 688.406 274.75 688.406 296.25C688.406 317.75 702.656 332.75 723.156 332.75C739.156 332.75 752.156 323.5 757.406 309.25H794.406C787.406 343.75 759.656 365.5 722.656 365.5ZM865.283 364.5C834.283 364.5 815.033 349 815.033 323.75C815.033 299.5 832.533 283.75 859.783 283.75H907.283V277.75C907.283 264.75 897.033 256.25 882.033 256.25C869.783 256.25 860.283 262.5 858.033 271.75H821.533C826.283 243.25 848.283 227.25 881.783 227.25C921.033 227.25 944.533 248.25 944.533 283V362H916.283L912.033 346.75C900.783 358.25 884.783 364.5 865.283 364.5ZM852.533 322.25C852.533 331.25 861.033 337.25 874.033 337.25C893.033 337.25 906.783 325.25 907.533 307.5H871.533C860.033 307.5 852.533 313.25 852.533 322.25ZM979.98 362V177H1017.98V362H979.98ZM1099.66 364.5C1068.66 364.5 1049.41 349 1049.41 323.75C1049.41 299.5 1066.91 283.75 1094.16 283.75H1141.66V277.75C1141.66 264.75 1131.41 256.25 1116.41 256.25C1104.16 256.25 1094.66 262.5 1092.41 271.75H1055.91C1060.66 243.25 1082.66 227.25 1116.16 227.25C1155.41 227.25 1178.91 248.25 1178.91 283V362H1150.66L1146.41 346.75C1135.16 358.25 1119.16 364.5 1099.66 364.5ZM1086.91 322.25C1086.91 331.25 1095.41 337.25 1108.41 337.25C1127.41 337.25 1141.16 325.25 1141.91 307.5H1105.91C1094.41 307.5 1086.91 313.25 1086.91 322.25Z" fill={theme === 'dark' ? 'white' : '#0f172a'}/>
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary border border-primary/20 px-1.5 py-0.5 rounded" style={{ textShadow: '0 0 5px rgba(206, 248, 78, 0.3)' }}>
            Admin
          </span>
        </div>

        {/* Sidebar Items */}
        <nav className="flex-1 flex flex-col gap-1.5 px-4 py-6 overflow-y-auto">
          {navigation.map((item) => (
            <SidebarItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              active={pathname.startsWith(item.href)} 
            />
          ))}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
              FY
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Fredrick Yang</p>
              <p className="text-xs text-muted-foreground truncate">Anak Web Owner</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
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
              <svg width="90" height="30" viewBox="0 0 1312 539" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
                <path d="M364 71C392.167 71 415 156.514 415 262C415 367.486 392.167 453 364 453C343.793 453 326.332 408.99 318.076 345.168C317.638 341.778 312.326 341.44 311.44 344.741C294.178 409.036 265.384 454.256 241.682 450.393C231.539 448.739 223.734 438.327 218.653 421.783C217.773 418.916 213.386 418.598 212.097 421.305C202.798 440.82 189.618 453 175 453C146.833 453 124 407.781 124 352C124 296.219 146.833 251 175 251C192.351 251 207.678 268.16 216.89 294.379C217.215 295.302 218.595 295.208 218.772 294.246C233.834 212.527 268.511 149.942 296.225 154.46C302.758 155.525 308.32 160.224 312.81 167.855C314.412 170.578 319.292 169.952 319.772 166.829C328.578 109.558 345.087 71 364 71Z" fill={theme === 'dark' ? '#CEF84E' : '#6fa100'}/>
                <path d="M563 365.5C519 365.5 492 342.5 492 306.25H531C531 323 543.5 332.75 562.75 332.75C579.25 332.75 589.75 326 589.75 314.25C589.75 302 578.5 294.75 553.75 289.5C512.75 280.75 493.5 263.75 493.5 235.25C493.5 203.25 518.5 183.5 558.75 183.5C600.25 183.5 626.75 206 626.75 241.25H588.5C588.5 225.5 577.5 216 559.25 216C542.5 216 532.25 223 532.25 234.5C532.25 245.25 541.5 252 568.25 258.25C611.75 268.5 630 285 630 312.75C630 345.75 604.5 365.5 563 365.5ZM722.656 365.5C680.406 365.5 650.906 336.75 650.906 296.25C650.906 256 680.656 227.25 722.656 227.25C759.156 227.25 787.156 248.5 793.156 281H756.656C750.406 267.75 738.156 259.75 723.156 259.75C702.656 259.75 688.406 274.75 688.406 296.25C688.406 317.75 702.656 332.75 723.156 332.75C739.156 332.75 752.156 323.5 757.406 309.25H794.406C787.406 343.75 759.656 365.5 722.656 365.5ZM865.283 364.5C834.283 364.5 815.033 349 815.033 323.75C815.033 299.5 832.533 283.75 859.783 283.75H907.283V277.75C907.283 264.75 897.033 256.25 882.033 256.25C869.783 256.25 860.283 262.5 858.033 271.75H821.533C826.283 243.25 848.283 227.25 881.783 227.25C921.033 227.25 944.533 248.25 944.533 283V362H916.283L912.033 346.75C900.783 358.25 884.783 364.5 865.283 364.5ZM852.533 322.25C852.533 331.25 861.033 337.25 874.033 337.25C893.033 337.25 906.783 325.25 907.533 307.5H871.533C860.033 307.5 852.533 313.25 852.533 322.25ZM979.98 362V177H1017.98V362H979.98ZM1099.66 364.5C1068.66 364.5 1049.41 349 1049.41 323.75C1049.41 299.5 1066.91 283.75 1094.16 283.75H1141.66V277.75C1141.66 264.75 1131.41 256.25 1116.41 256.25C1104.16 256.25 1094.66 262.5 1092.41 271.75H1055.91C1060.66 243.25 1082.66 227.25 1116.16 227.25C1155.41 227.25 1178.91 248.25 1178.91 283V362H1150.66L1146.41 346.75C1135.16 358.25 1119.16 364.5 1099.66 364.5ZM1086.91 322.25C1086.91 331.25 1095.41 337.25 1108.41 337.25C1127.41 337.25 1141.16 325.25 1141.91 307.5H1105.91C1094.41 307.5 1086.91 313.25 1086.91 322.25Z" fill={theme === 'dark' ? 'white' : '#0f172a'}/>
              </svg>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 flex flex-col gap-1.5 px-4 py-6 overflow-y-auto">
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
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  FY
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Fredrick Yang</p>
                  <p className="text-xs text-muted-foreground truncate">Anak Web Owner</p>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sign Out"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
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
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active-press cursor-pointer"
            >
              <Menu size={20} />
            </button>

            {/* Quick Context Path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Scala solutions</span>
              <ChevronRight size={12} />
              <span className="text-primary capitalize">{pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer active-press"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Fixed Notifications Bell Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer active-press relative ${
                  notificationsOpen ? 'bg-muted text-foreground' : ''
                }`}
                title="System Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span 
                    className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-background shadow-md shadow-red-500/20 animate-pulse"
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown Container */}
              {notificationsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden animate-fade-in-scale"
                  style={{ transformOrigin: 'top right' }}
                >
                  {/* Header */}
                  <div className="px-4 py-3 bg-muted/20 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Hub</span>
                    {notifications.length > 0 && (
                      <span className="text-[10px] bg-red-500/10 text-red-400 font-extrabold px-1.5 py-0.5 rounded border border-red-500/20">
                        {notifications.length} action item{notifications.length > 1 ? 's' : ''}
                      </span>
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
                          className="p-3.5 hover:bg-muted/30 cursor-pointer transition-all flex gap-3 group text-left"
                        >
                          <div className="shrink-0 mt-0.5">
                            {item.type === 'expiry' && (
                              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <AlertTriangle size={14} />
                              </div>
                            )}
                            {item.type === 'ticket' && (
                              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                                <AlertCircle size={14} />
                              </div>
                            )}
                            {item.type === 'invoice' && (
                              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <Receipt size={14} />
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-card">
                        <CheckCircle2 size={28} className="text-primary opacity-40 mb-2 animate-bounce-subtle" />
                        <h5 className="text-xs font-bold text-foreground">All Clear!</h5>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          No outstanding hosting expiries, urgent tickets, or past-due invoices.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-border bg-muted/10 text-center">
                    <span className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                      <Clock size={10} />
                      Real-time SLA tracking
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-sidebar-border hidden sm:block"></div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold border border-primary/10">
                FY
              </div>
              <span className="text-xs font-medium hidden sm:block font-semibold">Fredrick Yang</span>
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background relative">
          {/* Subtle decorative glow in top right */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/3 blur-[120px] pointer-events-none"></div>
          {/* Subtle decorative glow in bottom left */}
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-blue-500/2 blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto animate-fade-in-scale">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}
