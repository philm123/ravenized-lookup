'use client';

import Link from 'next/link';

type Role = 'field' | 'marketing' | 'owner';
const LABELS: Record<Role, string> = { field: 'Field', marketing: 'Mktg', owner: 'Owner' };

export function RoleChip({ role }: { role: Role }) {
  return (
    <Link
      href="/"
      className="font-display text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1.5 text-text-secondary"
      style={{ border: '1px solid rgba(255,255,255,0.15)' }}
    >
      {LABELS[role]}
    </Link>
  );
}
