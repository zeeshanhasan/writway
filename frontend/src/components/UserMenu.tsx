'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface CurrentUserResponse {
  success: boolean;
  data?: {
    user?: { id: string; name: string; email: string };
  };
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('User');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.getCurrentUser();
        const payload = res as unknown as CurrentUserResponse;
        const name = payload?.data?.user?.name;
        if (name) setDisplayName(name);
      } catch {
        // ignore, keep default label
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleSignOut = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-[12px] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        style={{ cursor: 'pointer' }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{displayName}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white text-[var(--color-primary)] rounded-[12px] shadow-card py-1 z-50"
        >
          <a href="/dashboard/settings" className="block px-3 py-2 text-sm hover:bg-gray-50" role="menuitem">Settings</a>
          <a href="/dashboard/billing" className="block px-3 py-2 text-sm hover:bg-gray-50" role="menuitem">Plans</a>
          <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" role="menuitem">Sign Out</button>
        </div>
      )}
    </div>
  );
}


