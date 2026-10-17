'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AssetPipelineStatus, IdentityStatus, JobStatus } from '@/lib/configurator-types';
import { STATUS_LABELS } from '@/lib/configurator-types';

export const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent disabled:bg-gray-50';

export const smallBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-body-sm font-semibold bg-primary-accent text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('bg-white rounded-xl border border-gray-200', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
          <h2 className="text-body-md font-semibold text-primary-text">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-primary-text mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1 text-caption text-primary-muted">{hint}</span>}
    </label>
  );
}

const STATUS_TONE: Partial<Record<AssetPipelineStatus, string>> = {
  MODEL_UNAVAILABLE: 'bg-amber-50 text-amber-800 border-amber-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  READY_FOR_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-300',
};

export function PipelineBadge({ status }: { status: AssetPipelineStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-caption font-medium whitespace-nowrap', STATUS_TONE[status] ?? 'bg-gray-50 text-gray-700 border-gray-200')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const IDENTITY_TEXT: Record<IdentityStatus, [string, string]> = {
  UNVERIFIED: ['Identity unverified', 'bg-amber-50 text-amber-800 border-amber-200'],
  VERIFIED_EXACT: ['Verified exact model', 'bg-green-50 text-green-700 border-green-200'],
  APPROVED_APPROXIMATE: ['Approved approximate', 'bg-orange-50 text-orange-800 border-orange-200'],
  REJECTED: ['Rejected', 'bg-red-50 text-red-700 border-red-200'],
  NOT_APPLICABLE: ['n/a', 'bg-gray-50 text-gray-600 border-gray-200'],
};

export function IdentityBadge({ status }: { status: IdentityStatus | null | undefined }) {
  if (!status) return <span className="text-caption text-primary-muted">No 3D model</span>;
  const [text, tone] = IDENTITY_TEXT[status];
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-caption font-medium whitespace-nowrap', tone)}>{text}</span>;
}

const JOB_TONE: Record<JobStatus, string> = {
  QUEUED: 'text-gray-600',
  RUNNING: 'text-blue-700',
  WAITING_FOR_INPUT: 'text-amber-700',
  COMPLETED: 'text-green-700',
  FAILED: 'text-red-700',
  CANCELLED: 'text-gray-500',
};

export function JobStatusText({ status }: { status: JobStatus }) {
  return <span className={cn('text-caption font-medium', JOB_TONE[status])}>{status.replace(/_/g, ' ').toLowerCase()}</span>;
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'success'; children: ReactNode }) {
  const tones = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };
  return <div className={cn('rounded-lg border px-4 py-3 text-body-sm', tones[tone])}>{children}</div>;
}

export function formatBytes(n?: number | null) {
  if (!n) return '—';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
