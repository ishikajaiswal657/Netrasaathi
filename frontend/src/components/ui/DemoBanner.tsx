'use client';

import React, { useSyncExternalStore } from 'react';
import { isMockModeActive, setMockModeActive } from '@/lib/api';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Activity, Database, RefreshCw } from 'lucide-react';

const subscribeStorage = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

export function DemoBanner() {
  const isMock = useSyncExternalStore(
    subscribeStorage,
    () => isMockModeActive(),
    () => false
  );

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { announcePolite } = useAnnounce();

  if (!mounted) return null;

  const toggleMockMode = () => {
    const nextVal = !isMock;
    setMockModeActive(nextVal);
    announcePolite(
      nextVal
        ? 'Switched to Demo Mode with preloaded evaluation documents.'
        : 'Switched to Live API Mode connecting to the FastAPI backend.'
    );
    window.location.reload();
  };

  if (!isMock) {
    return (
      <aside
        aria-label="API connection mode"
        className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="font-medium text-slate-300">
            Backend Status: <span className="text-emerald-400 font-semibold">Connected</span>
          </span>
          <span className="text-slate-500">•</span>
          <code className="font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[11px] text-cyan-300">
            {process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          </code>
        </span>
        <button
          onClick={toggleMockMode}
          className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1.5 py-0.5 cursor-pointer"
        >
          Switch to Offline Demo Mode
        </button>
      </aside>
    );
  }

  return (
    <aside
      role="region"
      aria-label="Offline demo mode active"
      className="bg-amber-950/40 border-b border-amber-600/40 px-4 py-2 text-xs text-amber-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
          <div>
            <span className="font-bold text-amber-300">Sample Evaluation Dataset Active: </span>
            <span className="text-amber-200/90">
              Running in offline evaluation mode with sample STEM materials (OSI 7-Layer Model, Binary Trees, CPU Scheduling).
            </span>
          </div>
        </div>
        <button
          onClick={toggleMockMode}
          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          <span>Connect to Live API</span>
        </button>
      </div>
    </aside>
  );
}
