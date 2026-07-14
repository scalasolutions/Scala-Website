/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MockPartner } from '@/lib/db/queries';
import SectionHeading from '@/components/ui/SectionHeading';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface CreatePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    referralRate: number;
    bankDetails: string | null;
  }) => void;
  isPending: boolean;
  editingPartner: MockPartner | null;
}

export function CreatePartnerModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingPartner,
}: CreatePartnerModalProps) {
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [referralRate, setReferralRate] = useState<number>(10);
  const [bankDetails, setBankDetails] = useState('');

  // Form Refs & Error States
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setReferralRate(10);
    setBankDetails('');
    setNameError('');
    setEmailError('');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state with editingPartner or defaults on open
  useEffect(() => {
    if (isOpen) {
      if (editingPartner) {
        setName(editingPartner.name || '');
        setEmail(editingPartner.email || '');
        setPhone(editingPartner.phone || '');
        setCompanyName(editingPartner.companyName || '');
        setReferralRate(editingPartner.referralRate || 10);
        setBankDetails(editingPartner.bankDetails || '');
      } else {
        resetForm();
      }
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = 'hidden';
    } else {
      resetForm();
      document.body.style.overflow = '';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.overflow = '';
    };
  }, [isOpen, editingPartner]);

  const isDirty = () => {
    if (editingPartner) {
      return (
        name !== (editingPartner.name || '') ||
        email !== (editingPartner.email || '') ||
        phone !== (editingPartner.phone || '') ||
        companyName !== (editingPartner.companyName || '') ||
        referralRate !== (editingPartner.referralRate || 10) ||
        bankDetails !== (editingPartner.bankDetails || '')
      );
    } else {
      return (
        name !== '' ||
        email !== '' ||
        phone !== '' ||
        companyName !== '' ||
        referralRate !== 10 ||
        bankDetails !== ''
      );
    }
  };

  const handleCancel = () => {
    if (isDirty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    setNameError('');
    setEmailError('');

    if (!name.trim()) {
      setNameError('Partner name is required');
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError('Partner email is required');
      if (!hasError) {
        emailInputRef.current?.focus();
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      hasError = true;
    }
    if (hasError) return;

    onSubmit({
      name,
      email,
      phone: phone || null,
      companyName: companyName || null,
      referralRate: Number(referralRate),
      bankDetails: bankDetails || null,
    });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
        onClick={handleCancel}
      />

      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in-scale">
        <div className="p-6 sm:p-8">
          <SectionHeading
            title={editingPartner ? 'Edit affiliate partner' : 'New affiliate partner'}
            description="External referrer details and commission rate."
            action={
              <button
                onClick={handleCancel}
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            }
          />

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                ref={nameInputRef}
                label="Name *"
                required
                placeholder="e.g. Alex Kim"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                error={nameError || undefined}
              />
              <Input
                ref={emailInputRef}
                label="Email *"
                type="email"
                required
                placeholder="e.g. alex@marketingventures.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                error={emailError || undefined}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Company name"
                placeholder="e.g. Marketing Ventures Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="Phone number"
                placeholder="e.g. +6281999888777"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Input
              label="Referral commission rate (%)"
              type="number"
              min="1"
              max="100"
              required
              value={referralRate}
              onChange={(e) => setReferralRate(Number(e.target.value))}
            />

            <Textarea
              label="Payment / bank details"
              placeholder="e.g. BCA Account 1234567890 (a.n. Alex Kim)"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={3}
            />

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isPending}
              >
                {isPending ? 'Saving…' : editingPartner ? 'Save changes' : 'Create partner'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
