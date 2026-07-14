'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { ClientAgreementPreview } from './components/ClientAgreementPreview';
import {
  createClient,
  MockClient,
  MockClientTask,
  createPartner,
  updatePartner,
  deletePartner,
  MockPartner,
  MockInvoice,
  getClients,
  getPartners,
  getInvoices,
  getClientTasks,
} from '@/lib/db/queries';
import { NewClient, NewPartner } from '@/lib/db/schema';
import { isDbWriteError } from '@/lib/db/errors';
import {
  invalidateCache,
  CACHE_KEYS,
  useAdminData,
} from '@/lib/data-cache';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import FilterBar, { FilterOption } from '@/components/ui/FilterBar';

// Local modular refactored components
import { ComponentErrorBoundary } from './components/ComponentErrorBoundary';
import { ClientsList } from './components/ClientsList';
import { PartnersList } from './components/PartnersList';
import { CreateClientModal } from './components/CreateClientModal';
import { CreatePartnerModal } from './components/CreatePartnerModal';

type TabValue = 'clients' | 'partners';
type StatusFilter = 'all' | 'active' | 'pending' | 'inactive';

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabValue>('clients');

  // Queries using admin cache hooks
  const { data: clientsData, loading: loadingClients, mutate: mutateClients } = useAdminData<MockClient[]>(CACHE_KEYS.CLIENTS, getClients);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partnersData, loading: loadingPartners, mutate: mutatePartners } = useAdminData<MockPartner[]>(CACHE_KEYS.PARTNERS, getPartners as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoicesData } = useAdminData<MockInvoice[]>(CACHE_KEYS.INVOICES, getInvoices as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tasksData } = useAdminData<MockClientTask[]>(CACHE_KEYS.CLIENT_TASKS, getClientTasks as any);

  const clients = clientsData || [];
  const partners = partnersData || [];
  const invoices = invoicesData || [];
  const allTasks = tasksData || [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [partnersSearch, setPartnersSearch] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<MockPartner | null>(null);
  const [selectedAgreementClient, setSelectedAgreementClient] = useState<MockClient | null>(null);

  const [isPending, startTransition] = useTransition();

  // Auto-open new client modal if query param is set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModalOpen(true);
      }
    }
  }, []);

  // Form submit handlers
  const handleCreateClientSubmit = async (
    clientData: Omit<NewClient, 'logoUrl' | 'tcStatus' | 'envRotationLastAt' | 'stabilityCheckLastAt' | 'expectationsCheckLastAt'>
  ) => {
    startTransition(async () => {
      try {
        const newClient = await createClient({
          ...clientData,
          logoUrl: null,
          tcStatus: 'pending',
          envRotationLastAt: new Date(),
          stabilityCheckLastAt: new Date(),
          expectationsCheckLastAt: new Date(),
        });

        if (newClient && !isDbWriteError(newClient)) {
          mutateClients([newClient as MockClient, ...clients]);
          setModalOpen(false);

          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/admin/clients');
          }
        }
      } catch (err) {
        console.error('Failed to create client', err);
      }
    });
  };

  const handleCreatePartnerSubmit = async (partnerData: Omit<NewPartner, 'id' | 'createdAt'>) => {
    startTransition(async () => {
      try {
        if (editingPartner) {
          const updated = await updatePartner(editingPartner.id, partnerData);
          if (updated && !isDbWriteError(updated)) {
            mutatePartners(
              partners.map((p) => (p.id === updated.id ? (updated as MockPartner) : p))
            );
          }
        } else {
          const created = await createPartner(partnerData);
          if (created && !isDbWriteError(created)) {
            mutatePartners([created as MockPartner, ...partners]);
          }
        }
        setEditingPartner(null);
        setPartnerModalOpen(false);
      } catch (err) {
        console.error('Failed to save partner', err);
      }
    });
  };

  const handleEditPartnerClick = (partner: MockPartner) => {
    setEditingPartner(partner);
    setPartnerModalOpen(true);
  };

  const handleDeletePartnerClick = async (partnerId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this partner? Any clients referred by them will be marked as organic.'
      )
    )
      return;

    startTransition(async () => {
      try {
        const deleted = await deletePartner(partnerId);
        if (isDbWriteError(deleted)) {
          console.error('Failed to delete partner:', deleted.error);
          return;
        }
        mutatePartners(partners.filter((p) => p.id !== partnerId));
        invalidateCache(CACHE_KEYS.CLIENTS);
      } catch (err) {
        console.error('Failed to delete partner', err);
      }
    });
  };

  // Tab count metrics
  const tabOptions: FilterOption<TabValue>[] = [
    { value: 'clients', label: 'Clients', count: clients.length },
    { value: 'partners', label: 'Affiliate Partners', count: partners.length },
  ];

  const isClients = activeTab === 'clients';

  return (
    <>
      <div className={cn("space-y-8 animate-fade-up", selectedAgreementClient && "print:hidden")}>
        {/* Tab switcher */}
        <FilterBar<TabValue>
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          size="md"
        />

        {/* Page header */}
        <PageHeader
          title={isClients ? 'Client Directory' : 'Affiliate Partners'}
          description={
            isClients
              ? 'Manage client accounts, subscription billing, and hosting quotas.'
              : 'Manage external entities that refer clients and build the pipeline.'
          }
          actions={
            isClients ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => setModalOpen(true)}
              >
                New Client
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setEditingPartner(null);
                  setPartnerModalOpen(true);
                }}
              >
                New Partner
              </Button>
            )
          }
        />

        {/* List Content with Isolated Error Boundaries */}
        {isClients ? (
          <ComponentErrorBoundary componentName="ClientsList">
            <ClientsList
              clients={clients}
              partners={partners}
              invoices={invoices}
              allTasks={allTasks}
              loading={loadingClients}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              setSelectedAgreementClient={setSelectedAgreementClient}
              setModalOpen={setModalOpen}
            />
          </ComponentErrorBoundary>
        ) : (
          <ComponentErrorBoundary componentName="PartnersList">
            <PartnersList
              partners={partners}
              clients={clients}
              partnersLoading={loadingPartners}
              partnersSearch={partnersSearch}
              setPartnersSearch={setPartnersSearch}
              handleEditPartnerClick={handleEditPartnerClick}
              handleDeletePartnerClick={handleDeletePartnerClick}
              setPartnerModalOpen={setPartnerModalOpen}
            />
          </ComponentErrorBoundary>
        )}

        {/* Modals with isolated Error Boundaries */}
        <ComponentErrorBoundary componentName="CreateClientModal">
          <CreateClientModal
            isOpen={mounted && modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleCreateClientSubmit}
            isPending={isPending}
            partners={partners}
          />
        </ComponentErrorBoundary>

        <ComponentErrorBoundary componentName="CreatePartnerModal">
          <CreatePartnerModal
            isOpen={mounted && partnerModalOpen}
            onClose={() => {
              setPartnerModalOpen(false);
              setEditingPartner(null);
            }}
            onSubmit={handleCreatePartnerSubmit}
            isPending={isPending}
            editingPartner={editingPartner}
          />
        </ComponentErrorBoundary>
      </div>

      {/* SLA / T&C Print Modal */}
      {selectedAgreementClient && (
        <ClientAgreementPreview
          client={selectedAgreementClient}
          onClose={() => setSelectedAgreementClient(null)}
        />
      )}
    </>
  );
}
