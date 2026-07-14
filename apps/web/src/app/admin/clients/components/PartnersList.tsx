'use client';

import React from 'react';
import {
  Plus,
  Search,
  Users,
  Briefcase,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { MockPartner, MockClient } from '@/lib/db/queries';
import { cn, TABLE_ROW_HOVER } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';

interface PartnersListProps {
  partners: MockPartner[];
  clients: MockClient[];
  partnersLoading: boolean;
  partnersSearch: string;
  setPartnersSearch: (val: string) => void;
  handleEditPartnerClick: (partner: MockPartner) => void;
  handleDeletePartnerClick: (id: string) => void;
  setPartnerModalOpen: (open: boolean) => void;
}

export function PartnersList({
  partners,
  clients,
  partnersLoading,
  partnersSearch,
  setPartnersSearch,
  handleEditPartnerClick,
  handleDeletePartnerClick,
  setPartnerModalOpen,
}: PartnersListProps) {
  
  const filteredPartners = partners.filter((p) => {
    return (
      p.name.toLowerCase().includes(partnersSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(partnersSearch.toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(partnersSearch.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search partners by name, email, or company…"
            leftIcon={<Search size={16} />}
            value={partnersSearch}
            onChange={(e) => setPartnersSearch(e.target.value)}
          />
        </div>
      </div>

      {partnersLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
          <p className="text-sm text-muted-foreground">Loading partners…</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Users size={20} />}
            title="No affiliate partners found"
            description="Try adjusting your search, or register a new external referrer."
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => {
                  setPartnerModalOpen(true);
                }}
              >
                New Partner
              </Button>
            }
          />
        </Card>
      ) : (
        <Card padding="sm">
          <div className="divide-y divide-border animate-fade-in-scale">
            {filteredPartners.map((partner) => {
              const referralsCount = clients.filter(
                (c) => c.sourcedBy === partner.id
              ).length;

              return (
                <div
                  key={partner.id}
                  className={cn(
                    'group flex items-start justify-between gap-4 py-4 px-3 -mx-3 rounded-lg border border-transparent',
                    TABLE_ROW_HOVER,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {partner.name}
                      </p>
                      <Badge variant="neutral">
                        {partner.referralRate}% commission
                      </Badge>
                      <Badge
                        variant={referralsCount > 0 ? 'success' : 'neutral'}
                        dot={referralsCount > 0}
                      >
                        {referralsCount} {referralsCount === 1 ? 'referral' : 'referrals'}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 truncate font-medium">
                        <Briefcase size={11} className="shrink-0 text-muted-foreground/75" />
                        {partner.companyName || 'Freelance / Individual'}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail size={11} className="shrink-0 text-muted-foreground/75" />
                        {partner.email}
                      </span>
                      {partner.phone && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <Phone size={11} className="shrink-0 text-muted-foreground/75" />
                          {partner.phone}
                        </span>
                      )}
                    </div>
                    {partner.bankDetails && (
                      <p
                        className="mt-1.5 text-xs text-muted-foreground truncate max-w-md font-mono"
                        title={partner.bankDetails}
                      >
                        Payout: {partner.bankDetails}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-0 !h-8 !w-8"
                      aria-label="Edit partner"
                      onClick={() => handleEditPartnerClick(partner)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-0 !h-8 !w-8 hover:!text-red-500"
                      aria-label="Delete partner"
                      onClick={() => handleDeletePartnerClick(partner.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
