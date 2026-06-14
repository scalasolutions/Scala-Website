'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
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
  Clock,
  User,
  Loader2,
  FileText,
  Check,
  RotateCcw,
  Settings,
  Printer,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  Trash2,
  ClipboardList
} from 'lucide-react';
import { ClientAgreementPreview } from '../components/ClientAgreementPreview';
import {
  updateClient,
  deleteClient,
  createTicket,
  createTicketMessage,
  MockClient,
  MockInvoice,
  MockTicket,
  MockPartner,
  getClientTasks,
  createClientTask,
  updateClientTask,
  deleteClientTask
} from '@/lib/db/queries';
import {
  invalidateCache,
  CACHE_KEYS,
  getCachedClients,
  getCachedInvoices,
  getCachedTickets,
  getCachedPartners,
  getCachedSync,
  useAdminData
} from '@/lib/data-cache';
import { getSubscriptionRemainingMonths, generateStrongPassword, formatCurrencyIDR, isTaskUrgent, cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [client, setClient] = useState<MockClient | null>(() => {
    const allClients = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS);
    return allClients?.find(c => c.id === id) || null;
  });
  const [invoices, setInvoices] = useState<MockInvoice[]>(() => {
    const allInvoices = getCachedSync<any[]>(CACHE_KEYS.INVOICES);
    return allInvoices ? allInvoices.filter(inv => inv.clientId === id) as MockInvoice[] : [];
  });
  const [tickets, setTickets] = useState<MockTicket[]>(() => {
    const allTickets = getCachedSync<any[]>(CACHE_KEYS.TICKETS);
    return allTickets ? allTickets.filter(t => t.clientId === id) as MockTicket[] : [];
  });
  const [partners, setPartners] = useState<MockPartner[]>(() => {
    return getCachedSync<MockPartner[]>(CACHE_KEYS.PARTNERS) || [];
  });
  const [loading, setLoading] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return !cachedClient;
  });
  const [isPending, startTransition] = useTransition();

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.name || '';
  });
  const [email, setEmail] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.email || '';
  });
  const [phone, setPhone] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.phone || '';
  });
  const [companyName, setCompanyName] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.companyName || '';
  });
  const [websiteAddress, setWebsiteAddress] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.websiteAddress || '';
  });
  const [status, setStatus] = useState<'pending' | 'active' | 'inactive'>(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return (cachedClient?.status as 'pending' | 'active' | 'inactive') || 'pending';
  });
  const [subscriptionType, setSubscriptionType] = useState<'static' | 'dynamic' | ''>(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return (cachedClient?.subscriptionType as 'static' | 'dynamic' | '') || '';
  });
  const [subscriptionMonths, setSubscriptionMonths] = useState<number>(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.subscriptionMonths || 12;
  });
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.subscriptionStartDate
      ? new Date(cachedClient.subscriptionStartDate).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10);
  });
  const [portalPassword, setPortalPassword] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.portalPassword || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [modalPasswordCopied, setModalPasswordCopied] = useState(false);
  const [modalEmailCopied, setModalEmailCopied] = useState(false);
  const [sourcedBy, setSourcedBy] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    const loadedSourcedBy = cachedClient?.sourcedBy || 'organic';
    return loadedSourcedBy === 'fredrick' || loadedSourcedBy === 'nicholas' ? 'organic' : loadedSourcedBy;
  });

  // Password Management States
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [regeneratedState, setRegeneratedState] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [pwActionsOpen, setPwActionsOpen] = useState(false);
  const pwActionsRef = useRef<HTMLDivElement>(null);

  // SLA & T&C States
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [tcStatus, setTcStatus] = useState<'pending' | 'signed'>(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return (cachedClient?.tcStatus as 'pending' | 'signed') || 'pending';
  });
  const [tcCustomTerms, setTcCustomTerms] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.tcCustomTerms || '';
  });
  const [slaCustomTerms, setSlaCustomTerms] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.slaCustomTerms || '';
  });
  const [agreementPreviewOpen, setAgreementPreviewOpen] = useState(false);

  // Client tasks state & queries
  const { data: tasksData, mutate: mutateTasks } = useAdminData<any[]>(CACHE_KEYS.CLIENT_TASKS, getClientTasks);
  const clientTasks = (tasksData || []).filter(t => t.clientId === id);

  // Group achieved tasks by day for the log
  const clientAchievedTasks = clientTasks
    .filter(t => t.status === 'achieved' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const groupedClientAchievements = clientAchievedTasks.reduce((groups: Record<string, any[]>, task) => {
    const completedDate = new Date(task.completedAt!);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let dateKey = completedDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    if (completedDate.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (completedDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
    return groups;
  }, {});

  // Task Board States
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<'to_prepare' | 'in_progress' | 'achieved'>('to_prepare');
  const [taskTargetDate, setTaskTargetDate] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<'to_prepare' | 'in_progress' | 'achieved' | null>(null);
  const [activeTaskTab, setActiveTaskTab] = useState<'board' | 'timeline'>('board');

  // Main Navigation Tab State
  const [activeMainTab, setActiveMainTab] = useState<'board' | 'maintenance' | 'hosting' | 'billing' | 'tickets'>('board');

  // Form Refs & Error States for validation focus / anchoring
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const taskTitleInputRef = useRef<HTMLInputElement>(null);
  const [taskTitleError, setTaskTitleError] = useState('');

  // Dirty state checks to prevent accidental modal discard/close
  const isEditModalDirty = () => {
    if (!client) return false;
    const clientStartDateStr = client.subscriptionStartDate
      ? new Date(client.subscriptionStartDate).toISOString().split('T')[0]
      : '';
    const formStartDateStr = subscriptionStartDate
      ? new Date(subscriptionStartDate).toISOString().split('T')[0]
      : '';

    return (
      name !== (client.name || '') ||
      email !== (client.email || '') ||
      phone !== (client.phone || '') ||
      companyName !== (client.companyName || '') ||
      websiteAddress !== (client.websiteAddress || '') ||
      status !== (client.status || 'pending') ||
      subscriptionType !== (client.subscriptionType || '') ||
      Number(subscriptionMonths) !== (client.subscriptionMonths || 12) ||
      formStartDateStr !== clientStartDateStr ||
      sourcedBy !== (client.sourcedBy || 'organic')
    );
  };

  const isAgreementModalDirty = () => {
    if (!client) return false;
    return (
      tcStatus !== (client.tcStatus || 'pending') ||
      tcCustomTerms !== (client.tcCustomTerms || '') ||
      slaCustomTerms !== (client.slaCustomTerms || '')
    );
  };

  const isMaintenanceModalDirty = () => {
    if (!client) return false;
    return (
      envRotationInterval !== (client.envRotationInterval || 6) ||
      stabilityCheckInterval !== (client.stabilityCheckInterval || 6) ||
      expectationsCheckInterval !== (client.expectationsCheckInterval || 12)
    );
  };

  const isTaskModalDirty = () => {
    if (editingTask) {
      const originalTargetDateStr = editingTask.targetDate
        ? new Date(editingTask.targetDate).toISOString().split('T')[0]
        : '';
      const formTargetDateStr = taskTargetDate
        ? new Date(taskTargetDate).toISOString().split('T')[0]
        : '';
      return (
        taskTitle !== (editingTask.title || '') ||
        taskDescription !== (editingTask.description || '') ||
        taskStatus !== (editingTask.status || 'to_prepare') ||
        formTargetDateStr !== originalTargetDateStr
      );
    } else {
      return (
        taskTitle !== '' ||
        taskDescription !== '' ||
        taskStatus !== 'to_prepare' ||
        taskTargetDate !== ''
      );
    }
  };

  const handleCancelEdit = () => {
    if (isEditModalDirty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmClose) return;
    }
    setNameError('');
    setEmailError('');
    setEditModalOpen(false);
  };

  const handleCancelAgreement = () => {
    if (isAgreementModalDirty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmClose) return;
    }
    setAgreementModalOpen(false);
  };

  const handleCancelMaintenance = () => {
    if (isMaintenanceModalDirty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmClose) return;
    }
    setMaintenanceModalOpen(false);
  };

  const handleCancelTask = () => {
    if (isTaskModalDirty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmClose) return;
    }
    setTaskTitleError('');
    setTaskModalOpen(false);
  };

  // Context Menu State for Kanban Tasks
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    task: any;
  } | null>(null);

  // Close context menu on scroll or escape
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // Handle Right-click Context Menu
  const handleContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;
    
    // Quick boundary adjustment if close to right/bottom of screen
    const menuWidth = 160;
    const menuHeight = 90;
    if (x + menuWidth > window.innerWidth) {
      x -= menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      y -= menuHeight;
    }
    
    setContextMenu({ x, y, task });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]')
    ) {
      e.preventDefault();
      return;
    }
    if (contextMenu || taskModalOpen) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, column: 'to_prepare' | 'in_progress' | 'achieved') => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDrop = async (e: React.DragEvent, nextStatus: 'to_prepare' | 'in_progress' | 'achieved') => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = clientTasks.find(t => t.id === taskId);
    if (!task || task.status === nextStatus) return;

    // Optimistic Update
    const updatedTasks = (tasksData || []).map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: nextStatus,
            completedAt: nextStatus === 'achieved' ? new Date() : (t.status === 'achieved' ? null : t.completedAt),
            updatedAt: new Date()
          } 
        : t
    );
    mutateTasks(updatedTasks);

    // Persist Update
    try {
      await updateClientTask(taskId, { status: nextStatus });
      invalidateCache(CACHE_KEYS.CLIENTS);
      mutateTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
      mutateTasks();
    }
  };

  const handleStatusChange = async (taskId: string, nextStatus: 'to_prepare' | 'in_progress' | 'achieved') => {
    const task = clientTasks.find(t => t.id === taskId);
    if (!task || task.status === nextStatus) return;

    // Optimistic Update
    const updatedTasks = (tasksData || []).map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: nextStatus,
            completedAt: nextStatus === 'achieved' ? new Date() : (t.status === 'achieved' ? null : t.completedAt),
            updatedAt: new Date()
          } 
        : t
    );
    mutateTasks(updatedTasks);

    try {
      await updateClientTask(taskId, { status: nextStatus });
      invalidateCache(CACHE_KEYS.CLIENTS);
      mutateTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
      mutateTasks(); // rollback on error
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskTitleError('');

    if (!taskTitle.trim()) {
      setTaskTitleError('Task title is required');
      taskTitleInputRef.current?.focus();
      taskTitleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    startTransition(async () => {
      try {
        if (editingTask) {
          await updateClientTask(editingTask.id, {
            title: taskTitle,
            description: taskDescription || null,
            status: taskStatus,
            targetDate: taskTargetDate ? new Date(taskTargetDate) : null,
          });
        } else {
          await createClientTask({
            clientId: id,
            title: taskTitle,
            description: taskDescription || null,
            status: taskStatus,
            targetDate: taskTargetDate ? new Date(taskTargetDate) : null,
          });
        }
        
        invalidateCache(CACHE_KEYS.CLIENTS);
        mutateTasks();
        
        // Reset
        setTaskTitle('');
        setTaskDescription('');
        setTaskStatus('to_prepare');
        setTaskTargetDate('');
        setEditingTask(null);
        setTaskModalOpen(false);
      } catch (err) {
        console.error('Failed to save task', err);
      }
    });
  };

  const handleEditTaskClick = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskStatus(task.status);
    setTaskTargetDate(task.targetDate ? new Date(task.targetDate).toISOString().substring(0, 10) : '');
    setTaskModalOpen(true);
  };

  const handleDeleteTaskClick = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteClientTask(taskId);
      invalidateCache(CACHE_KEYS.CLIENTS);
      mutateTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Operations & Maintenance States
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [envRotationInterval, setEnvRotationInterval] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.envRotationInterval !== undefined ? cachedClient.envRotationInterval : 6;
  });
  const [stabilityCheckInterval, setStabilityCheckInterval] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.stabilityCheckInterval !== undefined ? cachedClient.stabilityCheckInterval : 1;
  });
  const [expectationsCheckInterval, setExpectationsCheckInterval] = useState(() => {
    const cachedClient = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS)?.find(c => c.id === id);
    return cachedClient?.expectationsCheckInterval !== undefined ? cachedClient.expectationsCheckInterval : 3;
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteConfirmNameInput, setDeleteConfirmNameInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    async function loadClientData() {
      if (!id) return;

      // 1. Try to load from cache synchronously first to prevent loading flash
      const allClientsCached = getCachedSync<MockClient[]>(CACHE_KEYS.CLIENTS);
      const cCached = allClientsCached?.find(client => client.id === id);
      if (cCached) {
        setClient(cCached);
        
        const allInvoicesCached = getCachedSync<any[]>(CACHE_KEYS.INVOICES) || [];
        setInvoices(allInvoicesCached.filter((inv) => inv.clientId === id) as MockInvoice[]);
        
        const allTicketsCached = getCachedSync<any[]>(CACHE_KEYS.TICKETS) || [];
        setTickets(allTicketsCached.filter((t) => t.clientId === id));
        
        const allPartnersCached = getCachedSync<MockPartner[]>(CACHE_KEYS.PARTNERS) || [];
        setPartners(allPartnersCached);
        
        // Form states
        setName(cCached.name);
        setEmail(cCached.email);
        setPhone(cCached.phone || '');
        setCompanyName(cCached.companyName || '');
        setWebsiteAddress(cCached.websiteAddress || '');
        setStatus(cCached.status);
        setSubscriptionType(cCached.subscriptionType || '');
        setSubscriptionMonths(cCached.subscriptionMonths || 12);
        setSubscriptionStartDate(
          cCached.subscriptionStartDate
            ? new Date(cCached.subscriptionStartDate).toISOString().substring(0, 10)
            : new Date().toISOString().substring(0, 10)
        );
        setPortalPassword(cCached.portalPassword || '');
        const loadedSourcedBy = cCached.sourcedBy || 'organic';
        setSourcedBy(
          loadedSourcedBy === 'fredrick' || loadedSourcedBy === 'nicholas'
            ? 'organic'
            : loadedSourcedBy
        );
        setTcStatus((cCached.tcStatus as 'pending' | 'signed') || 'pending');
        setTcCustomTerms(cCached.tcCustomTerms || '');
        setSlaCustomTerms(cCached.slaCustomTerms || '');
        setEnvRotationInterval(cCached.envRotationInterval !== undefined ? cCached.envRotationInterval : 6);
        setStabilityCheckInterval(cCached.stabilityCheckInterval !== undefined ? cCached.stabilityCheckInterval : 1);
        setExpectationsCheckInterval(cCached.expectationsCheckInterval !== undefined ? cCached.expectationsCheckInterval : 3);
        
        setLoading(false);
      } else {
        setLoading(true);
      }

      // 2. Refresh from cache layer (Server Actions) in background
      try {
        const allClients = await getCachedClients();
        const c = allClients.find(client => client.id === id);
        if (!c) {
          setLoading(false);
          return;
        }
        setClient(c);

        // Load Invoices, Tickets, Partners to filter for this client from the cache layer
        const [allInvoices, allTickets, allPartners] = await Promise.all([
          getCachedInvoices(),
          getCachedTickets(),
          getCachedPartners(),
        ]);

        setInvoices(allInvoices.filter((inv) => inv.clientId === id) as MockInvoice[]);
        setTickets(allTickets.filter((t) => t.clientId === id));
        setPartners(allPartners as MockPartner[]);

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
        const loadedSourcedBy = c.sourcedBy || 'organic';
        setSourcedBy(
          loadedSourcedBy === 'fredrick' || loadedSourcedBy === 'nicholas'
            ? 'organic'
            : loadedSourcedBy
        );

        // Load custom terms & interval states
        setTcStatus((c.tcStatus as 'pending' | 'signed') || 'pending');
        setTcCustomTerms(c.tcCustomTerms || '');
        setSlaCustomTerms(c.slaCustomTerms || '');
        setEnvRotationInterval(c.envRotationInterval !== undefined ? c.envRotationInterval : 6);
        setStabilityCheckInterval(c.stabilityCheckInterval !== undefined ? c.stabilityCheckInterval : 1);
        setExpectationsCheckInterval(c.expectationsCheckInterval !== undefined ? c.expectationsCheckInterval : 3);
      } catch (err) {
        console.error('Failed to load client profile details', err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [id]);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (editModalOpen || deleteModalOpen || agreementModalOpen || maintenanceModalOpen || agreementPreviewOpen || taskModalOpen) {
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
  }, [editModalOpen, deleteModalOpen, agreementModalOpen, maintenanceModalOpen, agreementPreviewOpen, taskModalOpen]);

  // Click-outside handler for password actions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pwActionsRef.current && !pwActionsRef.current.contains(event.target as Node)) {
        setPwActionsOpen(false);
      }
    }
    if (pwActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pwActionsOpen]);

  // Auto-generate support tickets for checklist items due within 14 days
  useEffect(() => {
    if (!client || tickets.length === 0 && loading) return;
    const now = new Date();

    const checkAndCreateTicket = async (taskName: string, due: Date) => {
      const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue > 14) return;

      const autoTitle = `[Automated] Maintenance Due: ${taskName}`;
      const alreadyExists = tickets.some(
        (t) =>
          t.clientId === client.id &&
          t.title === autoTitle &&
          t.status !== 'closed' &&
          t.status !== 'resolved'
      );
      if (alreadyExists) return;

      try {
        const newT = await createTicket({
          clientId: client.id,
          title: autoTitle,
          description: `System alert: "${taskName}" maintenance task is due in ${daysUntilDue <= 0 ? 'OVERDUE' : `${daysUntilDue} day(s)`}. Please action this before the deadline.`,
          priority: daysUntilDue <= 7 ? 'urgent' : 'high',
          category: 'technical',
          status: 'open',
        });
        if (newT) {
          await createTicketMessage({
            ticketId: newT.id,
            senderType: 'client',
            senderName: client.name,
            message: `Automated maintenance alert: "${taskName}" is due on ${due.toLocaleDateString('id-ID')}. This ticket was automatically generated by the system.`,
          });
          invalidateCache(CACHE_KEYS.TICKETS);
          setTickets((prev) => [...prev, newT as MockTicket]);
        }
      } catch (err) {
        console.error('Failed to auto-create maintenance ticket', err);
      }
    };

    const getDueDateLocal = (lastDateStr: Date | null, createdAtStr: Date, intervalMonths: number) => {
      const baseDate = lastDateStr ? new Date(lastDateStr) : new Date(createdAtStr);
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + intervalMonths);
      return dueDate;
    };

    const envDueDate = getDueDateLocal(client.envRotationLastAt, client.createdAt, client.envRotationInterval || 6);
    const stabDueDate = getDueDateLocal(client.stabilityCheckLastAt, client.createdAt, client.stabilityCheckInterval || 1);
    const expDueDate = getDueDateLocal(client.expectationsCheckLastAt, client.createdAt, client.expectationsCheckInterval || 3);

    if (client.status === 'active') {
      checkAndCreateTicket('Environment Variables Rotation', envDueDate);
      checkAndCreateTicket('Stability & Dependency Checkup', stabDueDate);
      checkAndCreateTicket('Client Expectations Checkup', expDueDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
        <p className="text-sm text-muted-foreground">Loading client…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <Card padding="lg" className="max-w-xl mx-auto mt-12">
        <EmptyState
          icon={<AlertTriangle size={20} />}
          title="Client not found"
          description="The requested client record does not exist or may have been deleted."
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => router.push('/admin/clients')}
            >
              Back to directory
            </Button>
          }
        />
      </Card>
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
    expiryDateString = expiry.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const generateSuggestedEmail = (company: string, clientName: string) => {
    const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    
    const nameParts = clientName.trim().split(/\s+/);
    const firstName = nameParts[0] ? nameParts[0].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const lastName = nameParts[1] ? nameParts[1].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    const cleanCompany = cleanString(company);
    
    // 1. If we have both name and business name
    if (firstName && cleanCompany) {
      return `${firstName}@${cleanCompany}.com`;
    }
    
    // 2. If we only have name, use surname as domain + random suffix to prevent clashes
    if (firstName) {
      const rand = Math.floor(Math.random() * 900) + 100; // 3-digit random number
      const domain = lastName || 'client';
      return `${firstName}${rand}@${domain}.com`;
    }
    
    // 3. Fallback: fully random email
    const randVal = Math.floor(Math.random() * 9000) + 1000;
    return `client${randVal}@example.com`;
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    setNameError('');
    setEmailError('');

    if (!name.trim()) {
      setNameError('Full name is required');
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      if (!hasError) {
        emailInputRef.current?.focus();
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      hasError = true;
    }
    if (hasError) return;

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
          portalPassword: portalPassword || null,
          sourcedBy: sourcedBy || 'organic',
        });

        if (updated) {
          // Invalidate clients cache so next list view is fresh.
          invalidateCache(CACHE_KEYS.CLIENTS);
          setClient(updated as MockClient);
          setEditModalOpen(false);
        }
      } catch (err) {
        console.error('Failed to update client', err);
      }
    });
  };

  const handleDeleteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmInput !== 'CONFIRM' || deleteConfirmNameInput !== client.name) return;

    setIsDeleting(true);
    try {
      await deleteClient(client.id);
      // Invalidate all related caches after deletion.
      invalidateCache(CACHE_KEYS.CLIENTS, CACHE_KEYS.INVOICES, CACHE_KEYS.TICKETS);
      setDeleteModalOpen(false);
      router.push('/admin/clients');
    } catch (err) {
      console.error('Failed to delete client account', err);
      setIsDeleting(false);
    }
  };

  const handleCopyPassword = (pw: string) => {
    if (!pw || pw === 'No password assigned') return;
    navigator.clipboard.writeText(pw);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleRegeneratePassword = async () => {
    const newPw = generateStrongPassword();
    setIsUpdatingPassword(true);
    try {
      const updated = await updateClient(client.id, {
        portalPassword: newPw,
        portalPasswordIsPrivate: false,
      });
      if (updated) {
        invalidateCache(CACHE_KEYS.CLIENTS);
        setClient(updated as MockClient);
        setPortalPassword(newPw);
        navigator.clipboard.writeText(newPw);
        setCopiedState(true);
        setRegeneratedState(true);
        setTimeout(() => {
          setCopiedState(false);
          setRegeneratedState(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to regenerate password', err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSavePassword = async () => {
    setIsUpdatingPassword(true);
    try {
      const updated = await updateClient(client.id, {
        portalPassword: newPasswordValue || null,
        portalPasswordIsPrivate: false,
      });
      if (updated) {
        invalidateCache(CACHE_KEYS.CLIENTS);
        setClient(updated as MockClient);
        setPortalPassword(newPasswordValue);
        setIsEditingPassword(false);
      }
    } catch (err) {
      console.error('Failed to save password', err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  const getSourcedByLabel = (sourcedByVal: string | null) => {
    if (
      !sourcedByVal ||
      sourcedByVal === 'organic' ||
      sourcedByVal === 'fredrick' ||
      sourcedByVal === 'nicholas'
    ) {
      return 'Organic';
    }
    const partner = partners.find((p) => p.id === sourcedByVal);
    if (partner) {
      return partner.name;
    }
    if (sourcedByVal === 'affiliate') {
      return 'Affiliate';
    }
    return sourcedByVal || 'Organic';
  };

  const hasUrl = client.websiteAddress && client.websiteAddress !== '';
  const domain = hasUrl
    ? client.websiteAddress!.replace(/https?:\/\/(www\.)?/, '').split('/')[0]
    : '';
  const faviconUrl = hasUrl
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  const sourcedLabel = getSourcedByLabel(client.sourcedBy);
  const isOrganic = sourcedLabel === 'Organic';

  // Helper to calculate non-mutating due dates
  const getDueDate = (lastDateStr: Date | null, createdAtStr: Date, intervalMonths: number) => {
    const baseDate = lastDateStr ? new Date(lastDateStr) : new Date(createdAtStr);
    const dueDate = new Date(baseDate);
    dueDate.setMonth(baseDate.getMonth() + intervalMonths);
    return dueDate;
  };

  // Helper: get color class + label for remaining days counter
  const getRemainingDaysInfo = (due: Date): { colorClass: string; bgClass: string; label: string } => {
    const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { colorClass: 'text-red-500 dark:text-red-400', bgClass: 'bg-red-500/10 border-red-500/30', label: `Overdue by ${Math.abs(days)}d` };
    if (days <= 3) return { colorClass: 'text-red-500 dark:text-red-400', bgClass: 'bg-red-500/10 border-red-500/30', label: `${days}d remaining` };
    if (days <= 7) return { colorClass: 'text-orange-500 dark:text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/30', label: `${days}d remaining` };
    if (days <= 14) return { colorClass: 'text-amber-500 dark:text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/30', label: `${days}d remaining` };
    return { colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/30', label: `${days}d remaining` };
  };

  const now = new Date();
  
  const envDue = getDueDate(client.envRotationLastAt, client.createdAt, client.envRotationInterval || 6);
  const isEnvOverdue = client.status === 'active' && now > envDue;
  const envOverdueDays = Math.ceil((now.getTime() - envDue.getTime()) / (1000 * 60 * 60 * 24));
  const envRemainingInfo = getRemainingDaysInfo(envDue);

  const stabDue = getDueDate(client.stabilityCheckLastAt, client.createdAt, client.stabilityCheckInterval || 1);
  const isStabOverdue = client.status === 'active' && now > stabDue;
  const stabOverdueDays = Math.ceil((now.getTime() - stabDue.getTime()) / (1000 * 60 * 60 * 24));
  const stabRemainingInfo = getRemainingDaysInfo(stabDue);

  const expDue = getDueDate(client.expectationsCheckLastAt, client.createdAt, client.expectationsCheckInterval || 3);
  const isExpOverdue = client.status === 'active' && now > expDue;
  const expOverdueDays = Math.ceil((now.getTime() - expDue.getTime()) / (1000 * 60 * 60 * 24));
  const expRemainingInfo = getRemainingDaysInfo(expDue);

  const handleMarkTaskComplete = async (task: 'env' | 'stability' | 'expectations') => {
    try {
      const updateData: any = {};
      if (task === 'env') {
        updateData.envRotationLastAt = new Date();
      } else if (task === 'stability') {
        updateData.stabilityCheckLastAt = new Date();
      } else if (task === 'expectations') {
        updateData.expectationsCheckLastAt = new Date();
      }

      const updated = await updateClient(client.id, updateData);
      if (updated) {
        invalidateCache(CACHE_KEYS.CLIENTS);
        setClient(updated as MockClient);
      }
    } catch (e) {
      console.error('Failed to complete maintenance task', e);
    }
  };

  const handleSaveIntervals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateClient(client.id, {
        envRotationInterval: Number(envRotationInterval),
        stabilityCheckInterval: Number(stabilityCheckInterval),
        expectationsCheckInterval: Number(expectationsCheckInterval),
      });
      if (updated) {
        setClient(updated as MockClient);
        setMaintenanceModalOpen(false);
      }
    } catch (e) {
      console.error('Failed to update maintenance intervals', e);
    }
  };

  const handleSaveAgreementTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateClient(client.id, {
        tcStatus: tcStatus,
        tcSignedAt: tcStatus === 'signed' ? new Date() : null,
        tcCustomTerms: tcCustomTerms || null,
        slaCustomTerms: slaCustomTerms || null,
      });
      if (updated) {
        setClient(updated as MockClient);
        setAgreementModalOpen(false);
      }
    } catch (e) {
      console.error('Failed to update agreement terms', e);
    }
  };

  const statusVariant: 'success' | 'warning' | 'neutral' =
    client.status === 'active'
      ? 'success'
      : client.status === 'pending'
      ? 'warning'
      : 'neutral';

  // Helper: map invoice status to Badge variant
  const invoiceStatusVariant = (
    s: string
  ): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (s === 'paid') return 'success';
    if (s === 'past_due') return 'danger';
    if (s === 'issued') return 'warning';
    return 'neutral';
  };

  const ticketPriorityVariant = (
    p: string
  ): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (p === 'urgent') return 'danger';
    if (p === 'high') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-8 animate-fade-up pb-20">
      {/* Back link (sits above PageHeader for clear breadcrumb intent) */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
      >
        <ArrowLeft size={14} />
        Back to directory
      </Link>

      {/* Page header */}
      <PageHeader
        eyebrow="Client profile"
        title={client.name}
        description={client.companyName || 'Freelance / individual'}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Edit size={14} />}
            onClick={() => setEditModalOpen(true)}
          >
            Edit profile
          </Button>
        }
      />

      {/* Identity card — favicon, name, status pills */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {faviconUrl && !logoFailed ? (
              <img
                src={faviconUrl}
                alt={client.name}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.naturalWidth <= 16) {
                    setLogoFailed(true);
                  }
                }}
                onError={() => {
                  setLogoFailed(true);
                }}
                className="w-14 h-14 rounded-xl border border-border object-contain bg-white p-2"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border flex items-center justify-center text-foreground font-semibold text-lg shrink-0">
                {client.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                <Building size={12} className="shrink-0" />
                <span className="truncate">
                  {client.companyName || 'Freelance / individual'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isOrganic ? (
              <Badge variant="brand">
                via {sourcedLabel}
              </Badge>
            ) : (
              <Badge variant="neutral">Organic</Badge>
            )}
            <Badge variant={statusVariant} className="capitalize">
              {client.status === 'pending'
                ? `Pending | ${Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))}D`
                : client.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Grid Layout for details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Contact info & Portal access */}
        <div className="space-y-6">
          <Card padding="md">
            <SectionHeading title="Contact" />

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={16}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-foreground hover:text-foreground/70 transition-colors break-all"
                  >
                    {client.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={16}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <span className="text-foreground">
                    {client.phone || (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={16}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Website</p>
                  {client.websiteAddress ? (
                    <a
                      href={client.websiteAddress}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground hover:text-foreground/70 transition-colors inline-flex items-center gap-1 min-w-0 break-all"
                    >
                      <span className="truncate">{client.websiteAddress}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">No domain</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Client Portal Access Card */}
          <Card padding="md" className="relative overflow-hidden">
            <SectionHeading
              title="Portal access"
              icon={<User size={16} />}
            />

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Portal link</p>
                <Link
                  href="/portal"
                  target="_blank"
                  className="text-foreground hover:text-foreground/70 transition-colors inline-flex items-center gap-1"
                >
                  <span>Open client portal</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="text-foreground select-all">{client.email}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <div className="relative flex items-center">
                  <input
                    type={client.portalPasswordIsPrivate ? 'password' : (showPassword ? 'text' : (client.portalPassword ? 'password' : 'text'))}
                    readOnly={!isEditingPassword}
                    value={isEditingPassword ? newPasswordValue : (client.portalPasswordIsPrivate ? '••••••••••••' : (client.portalPassword || 'No password assigned'))}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Enter custom password"
                    className={`w-full bg-background border pl-3 pr-16 py-2 rounded-xl text-xs font-mono focus:outline-none select-all text-foreground ${
                      isEditingPassword ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                    }`}
                  />
                  
                  {/* Inline Icon Actions wrapper */}
                  <div className="absolute right-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm pl-1 py-0.5 rounded-lg">
                    {isEditingPassword ? (
                      <>
                        {/* Eye toggle in edit mode */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted/50"
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        {/* Generate button inside input */}
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateStrongPassword();
                            setNewPasswordValue(generated);
                          }}
                          title="Generate strong password"
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted/50"
                        >
                          <RotateCcw size={13} />
                        </button>
                        {/* Save button inside input */}
                        <button
                          type="button"
                          onClick={handleSavePassword}
                          disabled={isUpdatingPassword}
                          title="Save password"
                          className="p-1 text-primary hover:text-primary-ink transition-colors cursor-pointer rounded-lg hover:bg-primary/10 disabled:opacity-50"
                        >
                          {isUpdatingPassword ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        </button>
                        {/* Cancel button inside input */}
                        <button
                          type="button"
                          onClick={() => setIsEditingPassword(false)}
                          title="Cancel"
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Show/Hide visibility toggle — always visible */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={client.portalPasswordIsPrivate || !client.portalPassword}
                          title={client.portalPasswordIsPrivate ? 'Private password' : (showPassword ? 'Hide password' : 'Show password')}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>

                        {/* More Actions dropdown trigger */}
                        <div ref={pwActionsRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setPwActionsOpen(!pwActionsOpen)}
                            title="More password actions"
                            className={`p-1 transition-colors cursor-pointer rounded-lg hover:bg-muted/50 ${pwActionsOpen ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <MoreHorizontal size={13} />
                          </button>

                          {pwActionsOpen && (
                            <div className="absolute bottom-7 right-0 bg-card border border-border rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 min-w-[150px] z-20 animate-fade-in text-foreground text-[11px] font-semibold"
                              style={{ boxShadow: '0 8px 30px -4px rgba(0,0,0,0.25)' }}
                            >
                              <button
                                type="button"
                                onClick={() => { handleCopyPassword(client.portalPassword || ''); setPwActionsOpen(false); }}
                                disabled={!client.portalPassword || client.portalPasswordIsPrivate}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              >
                                {copiedState && !regeneratedState ? <CheckCircle size={12} className="text-emerald-500 shrink-0" /> : <Copy size={12} className="text-muted-foreground shrink-0" />}
                                {copiedState && !regeneratedState ? 'Copied!' : 'Copy Password'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { handleRegeneratePassword(); setPwActionsOpen(false); }}
                                disabled={isUpdatingPassword}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40"
                              >
                                {isUpdatingPassword ? <Loader2 size={12} className="animate-spin text-muted-foreground shrink-0" /> : <RotateCcw size={12} className="text-muted-foreground shrink-0" />}
                                Regenerate
                              </button>
                              <div className="my-0.5 border-t border-border/60" />
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingPassword(true);
                                  setNewPasswordValue(client.portalPasswordIsPrivate ? '' : (client.portalPassword || ''));
                                  setShowPassword(true);
                                  setPwActionsOpen(false);
                                }}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Edit size={12} className="text-muted-foreground shrink-0" />
                                Edit Custom
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Notice labels under the field */}
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  {regeneratedState && (
                    <span className="text-emerald-500 animate-fade-in font-medium flex items-center gap-1">
                      <CheckCircle size={12} />
                      Regenerated & copied!
                    </span>
                  )}
                  {client.portalPasswordIsPrivate && !regeneratedState && (
                    <span className="text-amber-500 font-medium flex items-center gap-1">
                      🔒 Changed by client (Private)
                    </span>
                  )}
                </div>
              </div>
            </div>

          </Card>

          {/* SLA & T&C Agreement Card */}
          <Card padding="md" className="relative">
            <div className="flex items-start gap-3 mb-5">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-muted/50 text-muted-foreground border border-border flex items-center justify-center mt-0.5">
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground leading-tight">
                  SLA &amp; T&amp;C Agreement
                </h2>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Badge variant={client.tcStatus === 'signed' ? 'success' : 'warning'} className="capitalize">
                    {client.tcStatus === 'signed' ? 'Signed' : 'Pending Signature'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm mt-3">
              {client.tcStatus === 'signed' ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Agreement fully executed</p>
                    <p className="text-muted-foreground mt-0.5">
                      Signed & executed on{' '}
                      <span className="font-medium text-foreground">
                        {new Date(client.tcSignedAt!).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                  <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Awaiting client signature</p>
                    <p className="mt-0.5 leading-relaxed">
                      This client's Master SLA & T&C document is pending signature sign-off.
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs space-y-2 border-t border-border/60 pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hosting Tier:</span>
                  <span className="font-semibold capitalize text-foreground">{client.subscriptionType || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Target:</span>
                  <span className="font-semibold text-foreground">
                    {client.subscriptionType === 'dynamic' ? '99.99% Uptime' : client.subscriptionType === 'static' ? '99.90% Uptime' : 'N/A'}
                  </span>
                </div>
                {client.tcCustomTerms && (
                  <div className="bg-muted/30 border border-border rounded-lg p-2.5 text-[11px] text-muted-foreground italic mt-2">
                    <span className="font-bold block normal-case text-foreground/80 not-italic mb-0.5">★ Custom Rider Attached:</span>
                    "{client.tcCustomTerms.substring(0, 80)}..."
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Printer size={13} />}
                  onClick={() => setAgreementPreviewOpen(true)}
                  className="w-full text-center flex justify-center items-center"
                >
                  View / Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit size={13} />}
                  onClick={() => {
                    setTcStatus((client.tcStatus as 'pending' | 'signed') || 'pending');
                    setTcCustomTerms(client.tcCustomTerms || '');
                    setSlaCustomTerms(client.slaCustomTerms || '');
                    setAgreementModalOpen(true);
                  }}
                  className="w-full text-center flex justify-center items-center"
                >
                  Edit Terms
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Columns: Subscription Details & Linked records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Navigation Tabs */}
          <div className="flex flex-wrap gap-1 bg-muted/30 border border-border/60 p-1 rounded-2xl select-none">
            {(
              [
                { key: 'board', label: 'Tasks & Board', icon: <ClipboardList size={14} />, badge: clientTasks.filter(t => t.status !== 'achieved' || (t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString())).length, alert: false },
                { key: 'maintenance', label: 'Maintenance', icon: <RotateCcw size={14} />, badge: undefined as number | undefined, alert: isEnvOverdue || isStabOverdue || isExpOverdue },
                { key: 'hosting', label: 'Hosting Plan', icon: <Layers size={14} />, badge: undefined as number | undefined, alert: false },
                { key: 'billing', label: 'Invoices', icon: <Receipt size={14} />, badge: invoices.length, alert: false },
                { key: 'tickets', label: 'Tickets', icon: <Ticket size={14} />, badge: tickets.length, alert: false }
              ]
            ).map((tab) => {
              const isActive = activeMainTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveMainTab(tab.key as any)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer focus:outline-none",
                    isActive
                      ? "bg-card text-foreground border border-border/80 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Operations & Client Tasks Kanban Card with Tabbed Navigation */}
          {activeMainTab === 'board' && (
            <Card padding="md">
              <SectionHeading
                title="Client Board & Updates Tracker"
                icon={<ClipboardList size={16} />}
                action={
                  activeTaskTab === 'board' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus size={12} />}
                      onClick={() => {
                        setEditingTask(null);
                        setTaskTitle('');
                        setTaskDescription('');
                        setTaskStatus('to_prepare');
                        setTaskTargetDate('');
                        setTaskModalOpen(true);
                      }}
                      className="!h-8 text-xs flex justify-center items-center animate-fade-in-scale"
                    >
                      Add Task
                    </Button>
                  )
                }
              />

              {/* Pill Tabs Switcher */}
              <div className="flex border-b border-border/60 mt-4 mb-5 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('board')}
                  className={cn(
                    "pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer focus:outline-none",
                    activeTaskTab === 'board'
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground font-semibold"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList size={14} />
                    Kanban Board
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold tabular-nums">
                      {clientTasks.filter(t => t.status !== 'achieved' || (t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString())).length}
                    </span>
                  </span>
                  {activeTaskTab === 'board' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('timeline')}
                  className={cn(
                    "pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer focus:outline-none",
                    activeTaskTab === 'timeline'
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground font-semibold"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle size={14} className={activeTaskTab === 'timeline' ? "text-primary" : "text-muted-foreground"} />
                    Achievement Timeline
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-bold tabular-nums">
                      {Object.values(groupedClientAchievements).reduce((acc, curr) => acc + curr.length, 0)}
                    </span>
                  </span>
                  {activeTaskTab === 'timeline' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
                  )}
                </button>
              </div>

              {activeTaskTab === 'board' ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {(['to_prepare', 'in_progress', 'achieved'] as const).map((colStatus) => {
                    const colTasks = clientTasks.filter(t => {
                      if (t.status !== colStatus) return false;
                      if (colStatus === 'achieved') {
                        if (!t.completedAt) return false;
                        const completedDate = new Date(t.completedAt);
                        const today = new Date();
                        return completedDate.toDateString() === today.toDateString();
                      }
                      return true;
                    });
                    const colLabel = colStatus === 'to_prepare' ? 'To Prepare' : colStatus === 'in_progress' ? 'In Progress' : 'Achieved Today';
                    const colColor = colStatus === 'to_prepare' ? 'border-t-zinc-400 bg-zinc-500/[0.02]' : colStatus === 'in_progress' ? 'border-t-blue-500 bg-blue-500/[0.02]' : 'border-t-emerald-500 bg-emerald-500/[0.02]';
                    const isOver = dragOverColumn === colStatus;

                    return (
                      <div
                        key={colStatus}
                        onDragOver={(e) => handleDragOver(e, colStatus)}
                        onDrop={(e) => handleDrop(e, colStatus)}
                        onDragLeave={() => setDragOverColumn(null)}
                        className={cn(
                          'rounded-xl border border-border p-3 transition-all duration-300 min-h-[220px] flex flex-col',
                          isOver && 'border-primary ring-2 ring-primary/10 bg-primary/5',
                          colColor
                        )}
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-border/60 mb-2 shrink-0">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {colLabel}
                            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full font-bold tabular-nums">
                              {colTasks.length}
                            </span>
                          </span>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px]">
                          {colTasks.length === 0 ? (
                            <div className="h-full flex items-center justify-center py-6 border border-dashed border-border/40 rounded-lg bg-muted/5">
                              <p className="text-[10px] text-muted-foreground italic">Empty</p>
                            </div>
                          ) : (
                            colTasks.map(task => {
                              const urgent = isTaskUrgent(task);
                              let dateLabel = '';
                              if (task.targetDate) {
                                const now = new Date();
                                const due = new Date(task.targetDate);
                                const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                dateLabel = days < 0 ? `Overdue by ${Math.abs(days)}d` : days === 0 ? 'Due Today' : `Due in ${days}d`;
                              }

                              const isContextMenuOpen = contextMenu?.task.id === task.id;

                              return (
                                <div
                                  key={task.id}
                                  draggable={!contextMenu && !taskModalOpen}
                                  onDragStart={(e) => handleDragStart(e, task.id)}
                                  onContextMenu={(e) => handleContextMenu(e, task)}
                                  className={cn(
                                    'relative bg-card border border-border rounded-lg p-2.5 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-foreground/15 select-none',
                                    urgent && 'border-red-500/20 dark:border-red-500/30 ring-1 ring-red-500/10 dark:ring-red-500/20 bg-red-500/[0.01]',
                                    isContextMenuOpen && 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]'
                                  )}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <h5 className="text-[11px] font-semibold text-foreground leading-snug truncate flex-1" title={task.title}>
                                      {task.title}
                                    </h5>
                                    {urgent && (
                                      <span className="text-[8px] font-black text-red-500 uppercase shrink-0 animate-pulse-subtle">
                                        ⚠️ Urgent
                                      </span>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 leading-normal">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-border/40 text-[9px] text-muted-foreground">
                                    <span className={cn(
                                      task.targetDate && (new Date(task.targetDate) < new Date() ? 'text-red-500 font-medium' : '')
                                    )}>
                                      {dateLabel || 'No due date'}
                                    </span>
                                    
                                    <div className="flex items-center gap-1">
                                      {colStatus !== 'achieved' && (
                                        <button
                                          onClick={() => handleStatusChange(task.id, 'achieved')}
                                          className="p-0.5 rounded text-muted-foreground hover:text-emerald-500 transition-colors"
                                          title="Mark Achieved"
                                        >
                                          <Check size={9} />
                                        </button>
                                      )}
                                      {/* ⋮ More button — opens same popup as right-click */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                          const menuWidth = 160;
                                          const menuHeight = 90;
                                          let x = rect.right + 4;
                                          let y = rect.top;
                                          if (x + menuWidth > window.innerWidth) x = rect.left - menuWidth - 4;
                                          if (y + menuHeight > window.innerHeight) y = rect.bottom - menuHeight;
                                          setContextMenu({ x, y, task });
                                        }}
                                        className={cn(
                                          'p-0.5 rounded transition-colors',
                                          isContextMenuOpen
                                            ? 'text-primary bg-primary/10'
                                            : 'text-muted-foreground hover:text-foreground'
                                        )}
                                        title="More options"
                                      >
                                        <MoreHorizontal size={10} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(groupedClientAchievements).length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-1">
                      <Clock size={14} className="text-muted-foreground/60" />
                      <span>No updates achieved yet. Start moving items to 'Achieved Today'!</span>
                    </div>
                  ) : (
                    Object.keys(groupedClientAchievements).map((dateKey) => (
                      <div key={dateKey} className="relative pl-4 border-l border-border/80 space-y-2">
                        {/* Timeline dot */}
                        <span className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-emerald-500 border border-background ring-4 ring-emerald-500/10" />

                        {/* Group header */}
                        <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                          {dateKey}
                        </h4>

                        {/* Tasks in group */}
                        <div className="grid gap-2">
                          {groupedClientAchievements[dateKey].map((task) => (
                            <div
                              key={task.id}
                              className="p-2.5 bg-muted/20 border border-border/60 hover:border-border rounded-lg text-xs flex items-start justify-between gap-3 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{task.title}</p>
                                {task.description && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <Badge variant="success" className="text-[8px] uppercase tracking-wider px-1">
                                  Achieved
                                </Badge>
                                {task.completedAt && (
                                  <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                    {new Date(task.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Operations & Maintenance Checklist Card */}
          {activeMainTab === 'maintenance' && (
            <Card padding="md">
              <SectionHeading
                title="Operations & Maintenance Checklist"
                icon={<RotateCcw size={16} />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Settings size={13} />}
                    onClick={() => {
                      setEnvRotationInterval(client.envRotationInterval || 6);
                      setStabilityCheckInterval(client.stabilityCheckInterval || 1);
                      setExpectationsCheckInterval(client.expectationsCheckInterval || 3);
                      setMaintenanceModalOpen(true);
                    }}
                    className="!h-8 !px-2 text-xs flex justify-center items-center"
                  >
                    Configure Intervals
                  </Button>
                }
              />

              <div className="space-y-0 mt-5">
                {/* Row 1: Env Rotation */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 mb-6 border-b border-border/40">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isEnvOverdue ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <h4 className="text-sm font-semibold text-foreground">Environment Variables Rotation</h4>
                      <Badge variant="neutral">Every {client.envRotationInterval || 6} mo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                      Rotate sensitive client keys, database passwords, and API credentials to maintain peak security.
                    </p>
                    <div className="flex items-center gap-2 pl-4 flex-wrap">
                      <div className="text-[11px] font-mono text-muted-foreground flex gap-2">
                        <span>Last Rotated: {client.envRotationLastAt ? new Date(client.envRotationLastAt).toLocaleDateString('id-ID') : 'Never'}</span>
                        <span>•</span>
                        <span>Next Due: {envDue.toLocaleDateString('id-ID')}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${envRemainingInfo.bgClass} ${envRemainingInfo.colorClass}`}>
                        <Clock size={9} />
                        {envRemainingInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 self-start">
                    <Button
                      variant={isEnvOverdue ? 'primary' : 'secondary'}
                      size="sm"
                      leftIcon={<Check size={12} />}
                      onClick={() => handleMarkTaskComplete('env')}
                      className="h-8 text-xs shrink-0 flex items-center justify-center"
                    >
                      Mark Done
                    </Button>
                  </div>
                </div>

                {/* Row 2: Stability Checks */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 mb-6 border-b border-border/40">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isStabOverdue ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <h4 className="text-sm font-semibold text-foreground">Stability &amp; Dependency Checkup</h4>
                      <Badge variant="neutral">Every {client.stabilityCheckInterval || 1} mo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                      Verify server logs, check NPM dependency vulnerabilities, run speed/Lighthouse tests, and verify backups.
                    </p>
                    <div className="flex items-center gap-2 pl-4 flex-wrap">
                      <div className="text-[11px] font-mono text-muted-foreground flex gap-2">
                        <span>Last Checked: {client.stabilityCheckLastAt ? new Date(client.stabilityCheckLastAt).toLocaleDateString('id-ID') : 'Never'}</span>
                        <span>•</span>
                        <span>Next Due: {stabDue.toLocaleDateString('id-ID')}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${stabRemainingInfo.bgClass} ${stabRemainingInfo.colorClass}`}>
                        <Clock size={9} />
                        {stabRemainingInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 self-start">
                    <Button
                      variant={isStabOverdue ? 'primary' : 'secondary'}
                      size="sm"
                      leftIcon={<Check size={12} />}
                      onClick={() => handleMarkTaskComplete('stability')}
                      className="h-8 text-xs shrink-0 flex items-center justify-center"
                    >
                      Mark Done
                    </Button>
                  </div>
                </div>

                {/* Row 3: Client Expectations Checkup */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isExpOverdue ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <h4 className="text-sm font-semibold text-foreground">Client Expectations Checkup</h4>
                      <Badge variant="neutral">Every {client.expectationsCheckInterval || 3} mo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                      Reach out directly to the client, confirm if hosting expectations and SLA response targets are fully met.
                    </p>
                    <div className="flex items-center gap-2 pl-4 flex-wrap">
                      <div className="text-[11px] font-mono text-muted-foreground flex gap-2">
                        <span>Last Checked: {client.expectationsCheckLastAt ? new Date(client.expectationsCheckLastAt).toLocaleDateString('id-ID') : 'Never'}</span>
                        <span>•</span>
                        <span>Next Due: {expDue.toLocaleDateString('id-ID')}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${expRemainingInfo.bgClass} ${expRemainingInfo.colorClass}`}>
                        <Clock size={9} />
                        {expRemainingInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 self-start">
                    <Button
                      variant={isExpOverdue ? 'primary' : 'secondary'}
                      size="sm"
                      leftIcon={<Check size={12} />}
                      onClick={() => handleMarkTaskComplete('expectations')}
                      className="h-8 text-xs shrink-0 flex items-center justify-center"
                    >
                      Mark Done
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Subscription / Hosting Details */}
          {activeMainTab === 'hosting' && (
            <Card padding="md">
              <SectionHeading
                title="Hosting subscription"
                icon={<Layers size={16} />}
                action={
                  client.subscriptionType ? (
                    <Badge variant="neutral" className="capitalize">
                      {client.subscriptionType}
                    </Badge>
                  ) : undefined
                }
              />

              {client.subscriptionType ? (
                <div className="space-y-6">
                  {/* Expiring warning */}
                  {isExpiring && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle
                        className="text-amber-500 shrink-0 mt-0.5"
                        size={15}
                      />
                      <div className="text-xs leading-relaxed">
                        <span className="font-medium text-foreground">Renewal alert</span>
                        <p className="text-muted-foreground mt-0.5">
                          Expires in{' '}
                          <span className="text-foreground font-medium">
                            {remaining} {remaining === 1 ? 'month' : 'months'}
                          </span>
                          . Plan renewal is recommended.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Monthly rate</p>
                      <p className="text-lg font-semibold text-foreground mt-1 tabular-nums">
                        {client.subscriptionType === 'static'
                          ? formatCurrencyIDR(200000)
                          : formatCurrencyIDR(350000)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                        {client.subscriptionType} hosting
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Quota remaining</p>
                      <p className="text-lg font-semibold text-foreground mt-1 tabular-nums">
                        {remaining}
                        <span className="text-muted-foreground font-normal text-sm">
                          {' '}/ {client.subscriptionMonths} mo
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Based on contracted SLA
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Expiry</p>
                      <p className="text-sm font-medium text-foreground mt-1 inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-muted-foreground" />
                        <span>{expiryDateString}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Calculated from start date
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Quota elapsed</span>
                      <span className="text-foreground tabular-nums">
                        {client.subscriptionMonths
                          ? Math.round((remaining! / client.subscriptionMonths) * 100)
                          : 0}
                        % remaining
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          remaining === 0
                            ? 'bg-red-500'
                            : isExpiring
                            ? 'bg-amber-500'
                            : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (remaining! / (client.subscriptionMonths || 12)) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        Start:{' '}
                        {client.subscriptionStartDate
                          ? new Date(client.subscriptionStartDate).toLocaleDateString(
                              'id-ID'
                            )
                          : 'N/A'}
                      </span>
                      <span>End: {expiryDateString}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Layers size={20} />}
                  title="No active subscription"
                  description="This client has no hosting plan. Edit profile to assign a static or dynamic plan."
                />
              )}
            </Card>
          )}

          {/* Connected Invoices */}
          {activeMainTab === 'billing' && (
            <Card padding="md">
              <SectionHeading
                title={`Invoices (${invoices.length})`}
                icon={<Receipt size={16} />}
                action={
                  <Link
                    href={`/admin/invoices?client=${client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    View all
                    <ExternalLink size={11} />
                  </Link>
                }
              />

              <div className="space-y-2 max-h-[400px] overflow-y-auto -mr-1 pr-1">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/admin/invoices?id=${inv.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-xl border border-border bg-muted/10 hover:border-foreground/15 transition-colors flex justify-between items-center text-xs">
                        <div className="min-w-0">
                          <p className="font-mono text-foreground truncate">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Due {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-medium text-foreground tabular-nums">
                            {formatCurrencyIDR(inv.total)}
                          </p>
                          <Badge
                            variant={invoiceStatusVariant(inv.status)}
                            className="mt-1 capitalize"
                          >
                            {inv.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground italic">
                    No invoice history
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Connected Support Tickets */}
          {activeMainTab === 'tickets' && (
            <Card padding="md">
              <SectionHeading
                title={`Tickets (${tickets.length})`}
                icon={<Ticket size={16} />}
                action={
                  <Link
                    href={`/admin/tickets?client=${client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    View all
                    <ExternalLink size={11} />
                  </Link>
                }
              />

              <div className="space-y-2 max-h-[400px] overflow-y-auto -mr-1 pr-1">
                {tickets.length > 0 ? (
                  tickets.map((t) => (
                    <Link key={t.id} href={`/admin/tickets?id=${t.id}`} className="block">
                      <div className="p-3 rounded-xl border border-border bg-muted/10 hover:border-foreground/15 transition-colors text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium truncate text-foreground flex-1">
                            {t.title}
                          </p>
                          <Badge
                            variant={ticketPriorityVariant(t.priority)}
                            className="shrink-0 capitalize"
                          >
                            {t.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2">
                          <Clock size={11} />
                          <span>{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                          <span>·</span>
                          <span className="capitalize">{t.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-1.5">
                    <CheckCircle size={16} className="text-muted-foreground/60" />
                    <span>No open issues</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <Card padding="md" className="border-red-500/15 bg-red-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-500" />
              Danger zone
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              Permanently delete this client account, portal access, and revoke all
              active SLAs. This action is irreversible.
            </p>
          </div>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setDeleteConfirmInput('');
              setDeleteConfirmNameInput('');
              setDeleteModalOpen(true);
            }}
          >
            Delete account
          </Button>
        </div>
      </Card>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {mounted &&
        deleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setDeleteModalOpen(false)}
            />

            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6">
                <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Delete client account
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-foreground">{client.name}</span>?
                  Portal credentials, active SLAs, all invoices, billing history, and
                  support tickets will be permanently removed.
                </p>

                <form onSubmit={handleDeleteClient} className="space-y-4">
                  <Input
                    label={`Type the client's name (${client.name}) to confirm`}
                    required
                    placeholder={client.name}
                    value={deleteConfirmNameInput}
                    onChange={(e) => setDeleteConfirmNameInput(e.target.value)}
                  />

                  <Input
                    label="Type CONFIRM to authorize deletion"
                    required
                    placeholder="CONFIRM"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    className="font-mono uppercase tracking-wider text-center"
                  />

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setDeleteModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="danger"
                      size="md"
                      disabled={
                        deleteConfirmInput !== 'CONFIRM' ||
                        deleteConfirmNameInput !== client.name ||
                        isDeleting
                      }
                    >
                      {isDeleting ? 'Deleting…' : 'Delete permanently'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- EDIT CLIENT MODAL --- */}
      {mounted &&
        editModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={handleCancelEdit}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title="Edit profile"
                  description="Update client account details and subscription."
                  action={
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleUpdateClient} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      ref={nameInputRef}
                      label="Full name *"
                      required
                      placeholder="e.g. Fredrick Yang"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      error={nameError || undefined}
                    />
                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Email *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          ref={emailInputRef}
                          type="email"
                          required
                          placeholder="e.g. fredrick@anakweb.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError('');
                          }}
                          className={cn(
                            "h-10 w-full rounded-xl bg-muted border pl-3.5 pr-20 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 transition-colors",
                            emailError
                              ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/25"
                              : "border-border focus-visible:border-primary focus-visible:ring-primary/35"
                          )}
                        />
                        <div className="absolute right-2 flex items-center gap-1 bg-muted/80 backdrop-blur-sm pl-1 py-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(email);
                              setModalEmailCopied(true);
                              setTimeout(() => setModalEmailCopied(false), 2000);
                            }}
                            disabled={!email}
                            title="Copy email"
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                          >
                            {modalEmailCopied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmail(generateSuggestedEmail(companyName, name));
                              if (emailError) setEmailError('');
                            }}
                            title="Suggest email username"
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-card flex items-center justify-center"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      </div>
                      {emailError && (
                        <p className="text-xs text-red-500 mt-1">
                          {emailError}
                        </p>
                      )}
                      {modalEmailCopied && (
                        <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 animate-fade-in font-medium">
                          <CheckCircle size={12} />
                          Email copied!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Company name"
                      placeholder="e.g. Anak Web"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <Input
                      label="Phone number"
                      placeholder="e.g. +628123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Website address"
                    type="url"
                    placeholder="https://anakweb.com"
                    value={websiteAddress}
                    onChange={(e) => setWebsiteAddress(e.target.value)}
                  />
                  <div className="space-y-1.5 w-full">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Portal password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={modalShowPassword ? 'text' : 'password'}
                        placeholder="Custom portal password"
                        value={portalPassword}
                        onChange={(e) => setPortalPassword(e.target.value)}
                        className="h-10 w-full rounded-xl bg-muted border border-border pl-3.5 pr-24 text-sm text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:border-primary focus-visible:ring-primary/35 transition-colors"
                      />
                      <div className="absolute right-2 flex items-center gap-1 bg-muted/80 backdrop-blur-sm pl-1 py-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setModalShowPassword(!modalShowPassword)}
                          title={modalShowPassword ? 'Hide password' : 'Show password'}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-card flex items-center justify-center"
                        >
                          {modalShowPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(portalPassword);
                            setModalPasswordCopied(true);
                            setTimeout(() => setModalPasswordCopied(false), 2000);
                          }}
                          disabled={!portalPassword}
                          title="Copy password"
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                        >
                          {modalPasswordCopied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPortalPassword(generateStrongPassword());
                            setModalShowPassword(true);
                          }}
                          title="Generate strong password"
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-card flex items-center justify-center"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                    {modalPasswordCopied && (
                      <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 animate-fade-in font-medium">
                        <CheckCircle size={12} />
                        Password copied!
                      </p>
                    )}
                  </div>                  {/* Subscription block */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                    <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Hosting subscription
                    </p>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Plan type</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {(
                          [
                            { key: '', label: 'No plan' },
                            { key: 'static', label: 'Static · 200k/mo' },
                            { key: 'dynamic', label: 'Dynamic · 350k/mo' },
                          ] as const
                        ).map((type) => (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() =>
                              setSubscriptionType(type.key as 'static' | 'dynamic' | '')
                            }
                            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              subscriptionType === type.key
                                ? 'border-foreground/20 bg-muted text-foreground'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {subscriptionType !== '' && (
                      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-scale">
                        <Input
                          label="Quota (months)"
                          type="number"
                          min="1"
                          max="120"
                          required
                          value={subscriptionMonths}
                          onChange={(e) =>
                            setSubscriptionMonths(Number(e.target.value))
                          }
                        />
                        <Input
                          label="Start date"
                          type="date"
                          required
                          value={subscriptionStartDate}
                          onChange={(e) => setSubscriptionStartDate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Select
                    label="Sourced by"
                    value={sourcedBy}
                    onChange={(e) => setSourcedBy(e.target.value)}
                  >
                    <option value="organic">Organic / Direct</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referralRate}% commission)
                      </option>
                    ))}
                    <option value="affiliate">External affiliate (10%)</option>
                  </Select>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Account status
                    </label>
                    <div className="flex gap-2">
                      {(['pending', 'active', 'inactive'] as const).map((stat) => (
                        <button
                          key={stat}
                          type="button"
                          onClick={() => setStatus(stat)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-colors cursor-pointer ${
                            status === stat
                              ? 'border-foreground/20 bg-muted text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {stat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- SLA & T&C CUSTOMIZATION MODAL --- */}
      {mounted &&
        agreementModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={handleCancelAgreement}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8">
                <SectionHeading
                  title="Customize SLA & T&C"
                  description="Modify specific contractual agreements and signature sign-off."
                  action={
                    <button
                      onClick={handleCancelAgreement}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleSaveAgreementTerms} className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Signature status
                    </label>
                    <div className="flex gap-2">
                      {(['pending', 'signed'] as const).map((stat) => (
                        <button
                          key={stat}
                          type="button"
                          onClick={() => setTcStatus(stat)}
                          className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                            tcStatus === stat
                              ? 'border-primary bg-primary text-primary-foreground font-extrabold'
                              : 'border-border bg-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {stat === 'signed' ? '✓ Signed & Executed' : 'Awaiting Signature'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Custom Clauses & Riders
                      </p>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Special Terms & Conditions</label>
                          <textarea
                            placeholder="Add specific terms, data requirements, or liability modifications..."
                            value={tcCustomTerms}
                            onChange={(e) => setTcCustomTerms(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Custom SLA Adjustments</label>
                          <textarea
                            placeholder="Add specific support response times, uptime targets, or escalation chains..."
                            value={slaCustomTerms}
                            onChange={(e) => setSlaCustomTerms(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={handleCancelAgreement}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                    >
                      Save Agreements
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- CONFIGURE INTERVALS MODAL --- */}
      {mounted &&
        maintenanceModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={handleCancelMaintenance}
            />

            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6">
                <SectionHeading
                  title="Configure Maintenance Intervals"
                  description="Set recurrence durations (in months) for standard operational checks."
                  action={
                    <button
                      onClick={handleCancelMaintenance}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleSaveIntervals} className="space-y-4 mt-3">
                  <Input
                    label="Environment Variables Rotation (Months)"
                    type="number"
                    min="1"
                    required
                    value={envRotationInterval}
                    onChange={(e) => setEnvRotationInterval(Number(e.target.value))}
                  />

                  <Input
                    label="Stability & Security Check (Months)"
                    type="number"
                    min="1"
                    required
                    value={stabilityCheckInterval}
                    onChange={(e) => setStabilityCheckInterval(Number(e.target.value))}
                  />

                  <Input
                    label="Expectations & Review (Months)"
                    type="number"
                    min="1"
                    required
                    value={expectationsCheckInterval}
                    onChange={(e) => setExpectationsCheckInterval(Number(e.target.value))}
                  />

                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={handleCancelMaintenance}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                    >
                      Save Intervals
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- SLA / T&C AGREEMENT PREVIEW OVERLAY --- */}
      {agreementPreviewOpen && (
        <ClientAgreementPreview
          client={client}
          onClose={() => setAgreementPreviewOpen(false)}
        />
      )}

      {/* --- TASK CREATION/EDIT MODAL --- */}
      {mounted &&
        taskModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-background/85 backdrop-blur-md"
              onClick={handleCancelTask}
            />

            <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
              <div className="p-6 sm:p-8 text-left">
                <SectionHeading
                  title={editingTask ? 'Edit Task Details' : 'Create Client Task'}
                  description={`Task/update follow-up for ${client.name}`}
                  action={
                    <button
                      onClick={handleCancelTask}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  }
                />

                <form onSubmit={handleSubmitTask} className="space-y-5 mt-4">
                  <Input
                    ref={taskTitleInputRef}
                    label="Task / Update Title *"
                    required
                    placeholder="e.g. Review environment variables"
                    value={taskTitle}
                    onChange={(e) => {
                      setTaskTitle(e.target.value);
                      if (taskTitleError) setTaskTitleError('');
                    }}
                    error={taskTitleError || undefined}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Add details, notes, or guidelines..."
                      rows={3}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Status / Column
                      </label>
                      <Select
                        value={taskStatus}
                        onChange={(e) => setTaskStatus(e.target.value as any)}
                      >
                        <option value="to_prepare">To Prepare</option>
                        <option value="in_progress">In Progress</option>
                        <option value="achieved">Achieved</option>
                      </Select>
                    </div>

                    <Input
                      label="Target Date / Due Date"
                      type="date"
                      value={taskTargetDate}
                      onChange={(e) => setTaskTargetDate(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={handleCancelTask}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-1.5" size={14} />
                          Saving...
                        </>
                      ) : (
                        editingTask ? 'Save Changes' : 'Create Task'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- TASK CARD CONTEXT MENU --- */}
      {mounted && contextMenu && createPortal(
        <div
          className="fixed inset-0 z-[90] cursor-default"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            className="absolute z-[100] min-w-[160px] py-1.5 rounded-xl border border-border bg-card shadow-2xl animate-fade-in-scale"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              boxShadow: '0 8px 30px -4px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                handleEditTaskClick(contextMenu.task);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
            >
              <Edit size={13} className="text-muted-foreground" />
              Edit details
            </button>
            <button
              type="button"
              onClick={() => {
                handleDeleteTaskClick(contextMenu.task.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} className="text-red-500" />
              Delete task
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
