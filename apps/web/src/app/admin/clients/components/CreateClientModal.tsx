'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, CheckCircle, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { MockPartner } from '@/lib/db/queries';
import { cn, generateStrongPassword } from '@/lib/utils';
import SectionHeading from '@/components/ui/SectionHeading';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    websiteAddress: string | null;
    description: string | null;
    status: 'pending' | 'active' | 'inactive';
    subscriptionType: 'static' | 'dynamic' | null;
    subscriptionMonths: number | null;
    subscriptionStartDate: Date | null;
    portalPassword: string;
    sourcedBy: string;
    envRotationInterval: number;
    stabilityCheckInterval: number;
    expectationsCheckInterval: number;
  }) => void;
  isPending: boolean;
  partners: MockPartner[];
}

export function CreateClientModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  partners,
}: CreateClientModalProps) {
  const [mounted, setMounted] = useState(false);

  // Form fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteAddress, setWebsiteAddress] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [subscriptionType, setSubscriptionType] = useState<'static' | 'dynamic' | ''>('');
  const [subscriptionMonths, setSubscriptionMonths] = useState<number>(12);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [portalPassword, setPortalPassword] = useState('');
  const [sourcedBy, setSourcedBy] = useState('organic');

  // Interval defaults
  const [envRotationInterval, setEnvRotationInterval] = useState<number>(6);
  const [stabilityCheckInterval, setStabilityCheckInterval] = useState<number>(1);
  const [expectationsCheckInterval, setExpectationsCheckInterval] = useState<number>(3);

  // Interactive UI state
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [modalPasswordCopied, setModalPasswordCopied] = useState(false);
  const [modalEmailCopied, setModalEmailCopied] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setWebsiteAddress('');
    setDescription('');
    setStatus('pending');
    setSubscriptionType('');
    setSubscriptionMonths(12);
    setSubscriptionStartDate(new Date().toISOString().substring(0, 10));
    setPortalPassword('');
    setSourcedBy('organic');
    setEnvRotationInterval(6);
    setStabilityCheckInterval(1);
    setExpectationsCheckInterval(3);
    setNameError('');
    setEmailError('');
    setModalShowPassword(false);
    setModalPasswordCopied(false);
    setModalEmailCopied(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Initialize/reset form state on open status changes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPortalPassword(generateStrongPassword());
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
  }, [isOpen]);

  const isDirty = () => {
    return (
      name !== '' ||
      email !== '' ||
      phone !== '' ||
      companyName !== '' ||
      websiteAddress !== '' ||
      status !== 'pending' ||
      subscriptionType !== '' ||
      subscriptionMonths !== 12 ||
      sourcedBy !== 'organic' ||
      envRotationInterval !== 6 ||
      stabilityCheckInterval !== 1 ||
      expectationsCheckInterval !== 3
    );
  };

  const handleCancel = () => {
    if (isDirty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmClose) return;
    }
    onClose();
  };

  const generateSuggestedEmail = (company: string, clientName: string) => {
    const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    
    const nameParts = clientName.trim().split(/\s+/);
    const firstName = nameParts[0] ? nameParts[0].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const lastName = nameParts[1] ? nameParts[1].toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    const cleanCompany = cleanString(company);
    
    if (firstName && cleanCompany) {
      return `${firstName}@${cleanCompany}.com`;
    }
    
    if (firstName) {
      const rand = Math.floor(Math.random() * 900) + 100;
      const domain = lastName || 'client';
      return `${firstName}${rand}@${domain}.com`;
    }
    
    const randVal = Math.floor(Math.random() * 9000) + 1000;
    return `client${randVal}@example.com`;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
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

    onSubmit({
      name,
      email,
      phone: phone || null,
      companyName: companyName || null,
      websiteAddress: websiteAddress || null,
      description: description || null,
      status,
      subscriptionType: subscriptionType || null,
      subscriptionMonths: subscriptionType ? Number(subscriptionMonths) : null,
      subscriptionStartDate: subscriptionType ? new Date(subscriptionStartDate) : null,
      portalPassword: portalPassword || generateStrongPassword(),
      sourcedBy: sourcedBy || 'organic',
      envRotationInterval: Number(envRotationInterval),
      stabilityCheckInterval: Number(stabilityCheckInterval),
      expectationsCheckInterval: Number(expectationsCheckInterval),
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
            title="New client"
            description="Create a new client account and optional subscription."
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

          <form onSubmit={handleFormSubmit} className="space-y-8">
            {/* ── 1. Contact details ── */}
            <section className="space-y-4">
              <SectionHeading
                eyebrow="01 · Contact"
                title="Contact details"
                className="!mb-0"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="text-xs font-semibold text-muted-foreground block">
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
                        title="Generate suggested email"
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
                <Input
                  label="Phone number"
                  placeholder="e.g. +628123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  containerClassName="sm:col-span-2"
                />
              </div>
            </section>

            <hr className="border-border" />

            {/* ── 2. Business ── */}
            <section className="space-y-4">
              <SectionHeading
                eyebrow="02 · Business"
                title="Business"
                className="!mb-0"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company name"
                  placeholder="e.g. Anak Web"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Input
                  label="Website address"
                  type="url"
                  placeholder="https://anakweb.com"
                  value={websiteAddress}
                  onChange={(e) => setWebsiteAddress(e.target.value)}
                />
                <Select
                  label="Sourced by"
                  value={sourcedBy}
                  onChange={(e) => setSourcedBy(e.target.value)}
                  containerClassName="sm:col-span-2"
                >
                  <option value="organic">Organic / Direct</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.referralRate}% commission)
                    </option>
                  ))}
                  <option value="affiliate">External affiliate (10%)</option>
                </Select>
                <Textarea
                  label="Description"
                  placeholder="Brief overview of the client, project goals, or business scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  containerClassName="sm:col-span-2"
                  rows={3}
                />
              </div>
            </section>

            <hr className="border-border" />

            {/* ── 3. Subscription & access ── */}
            <section className="space-y-4">
              <SectionHeading
                eyebrow="03 · Subscription"
                title="Subscription & access"
                className="!mb-0"
              />

              {/* Initial status */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Initial status
                </label>
                <div className="flex gap-2">
                  {(['pending', 'active', 'inactive'] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setStatus(stat)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-colors cursor-pointer',
                        status === stat
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hosting plan */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Hosting plan
                </label>
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
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                        subscriptionType === type.key
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {subscriptionType !== '' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-scale">
                  <Input
                    label="Quota (months)"
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={subscriptionMonths}
                    onChange={(e) => setSubscriptionMonths(Number(e.target.value))}
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

              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Operations & Maintenance (Interval in Months)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Env Rotation"
                    type="number"
                    min="1"
                    required
                    value={envRotationInterval}
                    onChange={(e) => setEnvRotationInterval(Number(e.target.value))}
                  />
                  <Input
                    label="Stability Check"
                    type="number"
                    min="1"
                    required
                    value={stabilityCheckInterval}
                    onChange={(e) => setStabilityCheckInterval(Number(e.target.value))}
                  />
                  <Input
                    label="Client Review"
                    type="number"
                    min="1"
                    required
                    value={expectationsCheckInterval}
                    onChange={(e) => setExpectationsCheckInterval(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Portal password</label>
                <div className="relative flex items-center">
                  <input
                    type={modalShowPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="w-full bg-background border border-border pl-3 pr-24 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-primary/50 text-foreground"
                  />
                  <div className="absolute right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm pl-1 py-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setModalShowPassword(!modalShowPassword)}
                      title={modalShowPassword ? 'Hide password' : 'Show password'}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted/50 flex items-center justify-center"
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
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted/50 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
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
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted/50 flex items-center justify-center"
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
              </div>
            </section>

            <div className="flex gap-2 justify-end pt-5 border-t border-border">
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
                {isPending ? 'Saving…' : 'Create client'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
