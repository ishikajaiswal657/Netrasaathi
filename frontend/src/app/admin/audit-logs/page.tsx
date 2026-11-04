'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';
import { AuditLogItem, AdminStatsResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Button } from '@/components/ui/Button';
import {
  RotateCw,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Lock,
  Radar,
  Users,
  FileText,
  Activity,
  Search,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { announcePolite, announceAssertive } = useAnnounce();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const user = getCurrentUser();
  const isAdminUser = user?.role === 'admin';
  const [isLoading, setIsLoading] = useState(Boolean(isAdminUser));
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAuditData = useCallback(
    async (actionFilter: string = 'all') => {
      setIsLoading(true);
      try {
        const [logsData, statsData] = await Promise.all([
          api.getAuditLogs(actionFilter),
          api.getAdminStats().catch(() => null),
        ]);
        setLogs(logsData);
        if (statsData) {
          setStats(statsData);
        }
        setErrorMessage('');
        announcePolite(`Loaded ${logsData.length} audit log entries.`);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          announceAssertive('Your session expired. Please log in.');
          router.push('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          announceAssertive('Access denied. Administrator privileges required.');
          return;
        }
        const msg =
          err instanceof Error ? err.message : 'Failed to fetch admin audit logs.';
        setErrorMessage(msg);
        announceAssertive(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [announceAssertive, announcePolite, router]
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!isAdminUser) {
      return;
    }

    fetchAuditData('all');
  }, [isAdminUser, fetchAuditData, router]);

  const handleFilterChange = (newAction: string) => {
    setFilterAction(newAction);
    fetchAuditData(newAction);
    announcePolite(`Filtering audit logs by ${newAction}.`);
  };

  // If user is not admin, show accessible forbidden screen
  if (!isAdminUser) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm text-slate-900">
          <div
            className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs"
            aria-hidden="true"
          >
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900">Access Restricted</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              This console requires <strong>Administrator</strong> privileges. You are currently signed in as {user?.email || 'Student'}.
            </p>
          </div>
          <div>
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Return to Documents</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const uploadCount = stats ? stats.action_breakdown['upload'] || 0 : logs.filter((l) => l.action.toLowerCase() === 'upload').length;
  const processCount = stats ? stats.action_breakdown['process'] || 0 : logs.filter((l) => l.action.toLowerCase() === 'process').length;
  const askCount = stats ? stats.action_breakdown['ask'] || 0 : logs.filter((l) => l.action.toLowerCase() === 'ask').length;
  const totalEvents = stats ? stats.total_audit_events : logs.length;

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-10 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
                <Radar className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>Security Audit Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                System Security &amp; Audit Trail
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Review authenticated audit events for document uploads, OCR diagram processing, student study sessions, and voice queries.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => fetchAuditData(filterAction)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl min-h-[40px] cursor-pointer transition-all shadow-xs disabled:opacity-50"
                aria-label="Refresh audit logs"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`}
                  aria-hidden="true"
                />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {/* Audit Stats Quick-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200 mt-6">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Audit Events
              </span>
              <span className="text-xl font-extrabold text-slate-900">{totalEvents}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                Uploads
              </span>
              <span className="text-xl font-extrabold text-blue-700">{uploadCount}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Processed Pages
              </span>
              <span className="text-xl font-extrabold text-emerald-700">{processCount}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Voice Q&amp;A Queries
              </span>
              <span className="text-xl font-extrabold text-amber-800">{askCount}</span>
            </div>
          </div>
        </div>

        {/* Privacy Guarantee Banner */}
        <div
          role="note"
          aria-label="Audit privacy guarantee"
          className="rounded-2xl bg-white p-4 sm:p-5 text-sm text-slate-700 flex items-start gap-3.5 border border-slate-200 shadow-xs"
        >
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5 border border-blue-200">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <strong className="text-slate-900 font-bold block text-sm">
              Zero-Content Privacy Architecture (FR16 &amp; PRD):
            </strong>
            <p className="text-slate-600 text-xs leading-relaxed">
              Audit logs record event timestamps, authenticated user IDs, action names, and opaque document references. Raw document text, extracted diagrams, and student voice question content are strictly omitted from audit databases to guarantee student privacy.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm pl-1">
            <Filter className="h-3.5 w-3.5 text-blue-600 shrink-0" aria-hidden="true" />
            <span>Filter by Action:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'upload', label: 'Uploads' },
              { id: 'process', label: 'Processing' },
              { id: 'ask', label: 'Voice Q&A' },
              { id: 'view', label: 'Views' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFilterChange(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] cursor-pointer flex items-center gap-1.5 ${
                  filterAction === item.id
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
                aria-pressed={filterAction === item.id}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div
            role="alert"
            className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong className="font-bold block text-base text-rose-900">
                Failed to load audit logs:
              </strong>
              <p className="text-sm">{errorMessage}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => fetchAuditData(filterAction)}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-sm"
            aria-busy="true"
          >
            <div
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-sm"
              aria-hidden="true"
            />
            <p className="text-slate-700 font-bold text-base">
              Loading authenticated audit records...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && logs.length === 0 && !errorMessage && (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center space-y-4 shadow-sm">
            <div
              className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-200 shadow-xs"
              aria-hidden="true"
            >
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">No audit events found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {filterAction === 'all'
                ? 'No audit entries have been logged in the system yet.'
                : `No audit entries match the action filter "${filterAction}".`}
            </p>
          </div>
        )}

        {/* Audit Log Table */}
        {!isLoading && logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="System audit log records">
                <caption className="sr-only">
                  List of recent system actions with timestamps, user identity, and document references.
                </caption>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th scope="col" className="p-4 sm:px-6">Timestamp</th>
                    <th scope="col" className="p-4 sm:px-6">Action</th>
                    <th scope="col" className="p-4 sm:px-6">User Identity</th>
                    <th scope="col" className="p-4 sm:px-6">Document Ref</th>
                    <th scope="col" className="p-4 sm:px-6">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {logs.map((log) => {
                    const getActionBadge = (act: string) => {
                      switch (act.toLowerCase()) {
                        case 'upload':
                          return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
                        case 'process':
                          return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                        case 'ask':
                          return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
                        case 'view':
                        default:
                          return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
                      }
                    };

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 sm:px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-4 sm:px-6 whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs uppercase border ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 sm:px-6 font-bold text-slate-900">
                          {log.user_email || `User #${log.user_id}`}
                        </td>
                        <td className="p-4 sm:px-6 font-mono text-xs text-slate-600">
                          {log.document_id ? (
                            <span className="bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg font-bold text-blue-700">
                              {String(log.document_id)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="p-4 sm:px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
