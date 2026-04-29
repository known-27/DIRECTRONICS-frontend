'use client';

import React from 'react';
import type { ProjectStatus, PaymentStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'badge-gray' },
  SUBMITTED: { label: 'Submitted', className: 'badge-blue' },
  APPROVED: { label: 'Approved', className: 'badge-green' },
  REJECTED: { label: 'Rejected', className: 'badge-red' },
  PENDING:   { label: 'Pending',   className: 'badge-yellow' },
  PARTIAL:   { label: 'Partial',   className: 'badge-amber'  },
  PAID:      { label: 'Paid',      className: 'badge-purple' },
  CANCELLED: { label: 'Cancelled', className: 'badge-gray'   },
  ADMIN: { label: 'Admin', className: 'badge-blue' },
  EMPLOYEE: { label: 'Employee', className: 'badge-green' },
  active: { label: 'Active', className: 'badge-green' },
  inactive: { label: 'Inactive', className: 'badge-gray' },
};

interface StatusBadgeProps {
  status: ProjectStatus | PaymentStatus | string;
}

export const StatusBadge = ({ status }: StatusBadgeProps): React.ReactElement => {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'badge-gray' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};
