'use client';

import React, { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, subscribeAuth } from '@/lib/auth';
import { Document, User } from '@/lib/types';
import { formatDate, getStatusDetails } from '@/lib/utils';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Button } from '@/components/ui/Button';
import { DirectConceptExplainerModal } from '@/components/voice/DirectConceptExplainerModal';
import { VoiceAvatar3D } from '@/components/voice/VoiceAvatar3D';
import {
  Upload,
  FileText,
  FileImage,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Search,
  ArrowRight,
  Layers,
  Files,
  Activity,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { announcePolite } = useAnnounce();

  const token = useSyncExternalStore(
    subscribeAuth,
    () => getToken(),
    () => null
  );

  const rawUser = useSyncExternalStore(
    subscribeAuth,
    () => (typeof window !== 'undefined' ? localStorage.getItem('netrasaathi_user_session') : null),
    () => null
  );

  const user: User | null = useMemo(() => {
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }, [rawUser]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'completed' | 'processing' | 'uploaded'>('all');
  const [isDirectExplainerOpen, setIsDirectExplainerOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await api.listDocuments(token);
      setDocuments(data);
      announcePolite(`Loaded ${data.length} documents.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve your documents.';
      setErrorMessage(msg);
      announcePolite(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [token, announcePolite]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDocuments();
  }, [token, router, fetchDocuments]);

  // Filter documents by search and tab
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = selectedStatusTab === 'all' || doc.status === selectedStatusTab;
      return matchesSearch && matchesTab;
    });
  }, [documents, searchQuery, selectedStatusTab]);

  // Summary Metrics
  const stats = {
    total: documents.length,
    ready: documents.filter((d) => d.status === 'completed').length,
    processing: documents.filter((d) => d.status === 'processing').length,
    totalPages: documents.reduce((sum, d) => sum + (d.page_count || 1), 0),
  };

  return (
    <div className="bg-mesh-pattern min-h-screen py-8 sm:py-10 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Hero Section with 3D Voice Assistant Companion */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            {/* Left Column: Greeting & Summary */}
            <div className="space-y-3 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
                <Files className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                <span>My Learning Space</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Welcome back, {user?.email ? user.email.split('@')[0] : 'Student'}
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                Explore your study documents, inspect diagrams with AI vision, and listen to natural voice narration in your preferred language.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsDirectExplainerOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md cursor-pointer min-h-[42px] transition-all hover:scale-105 active:scale-95"
                  aria-label="Direct voice mode: Ask for any diagram or concept explanation hands-free"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Ask Netra Any Diagram</span>
                </button>

                <Link href="/upload">
                  <Button size="md" variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Upload className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    <span>Upload Study File</span>
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={fetchDocuments}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  aria-label="Refresh document list"
                  title="Refresh Documents"
                >
                  <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Column: 3D Animated Voice Assistant Avatar Card */}
            <div className="shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 p-6 rounded-3xl border border-blue-100/80 shadow-xs">
              <VoiceAvatar3D
                size="md"
                state="idle"
                speechBubbleText="Hi! I'm Netra, your voice tutor."
                onClick={() => setIsDirectExplainerOpen(true)}
                className="cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-500 mt-1">
                Click Netra to talk or ask a concept
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 mt-6 relative z-10">
            {/* Total */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                <Files className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total</span>
                <span className="text-xl font-extrabold text-slate-900">{stats.total}</span>
              </div>
            </div>

            {/* Ready */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Ready</span>
                <span className="text-xl font-extrabold text-emerald-800">{stats.ready}</span>
              </div>
            </div>

            {/* Processing */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Processing</span>
                <span className="text-xl font-extrabold text-amber-800">{stats.processing}</span>
              </div>
            </div>

            {/* Total Pages */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Pages</span>
                <span className="text-xl font-extrabold text-purple-900">{stats.totalPages}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Status Filtering */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name..."
              aria-label="Filter documents by filename"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm min-h-[38px] focus:outline-hidden focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="tablist" aria-label="Filter documents by status">
            {[
              { id: 'all', label: 'All', count: stats.total },
              { id: 'completed', label: 'Ready', count: stats.ready },
              { id: 'processing', label: 'Processing', count: stats.processing },
              { id: 'uploaded', label: 'Uploaded', count: documents.filter((d) => d.status === 'uploaded').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selectedStatusTab === tab.id}
                onClick={() => {
                  setSelectedStatusTab(tab.id as typeof selectedStatusTab);
                  announcePolite(`Showing ${tab.label}.`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[34px] flex items-center gap-1.5 ${
                  selectedStatusTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  selectedStatusTab === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong className="font-bold block text-xs sm:text-sm text-rose-900">Unable to load documents:</strong>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-800 hover:bg-rose-100" onClick={fetchDocuments}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            className="bg-white rounded-2xl p-16 border border-slate-200 text-center space-y-3 shadow-xs"
            aria-busy="true"
          >
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
            <p className="text-slate-600 font-semibold text-sm">Loading document repository...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDocuments.length === 0 && !errorMessage && (
          <div className="bg-white rounded-2xl p-12 sm:p-16 border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100" aria-hidden="true">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900">
                {searchQuery ? 'No matching documents found' : 'No documents in repository'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal">
                {searchQuery
                  ? `No documents matched "${searchQuery}". Try a different search term or clear the filter.`
                  : 'Upload your first study PDF or diagram to begin automated visual analysis and voice narration.'}
              </p>
            </div>
            <div>
              {searchQuery ? (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              ) : (
                <Link href="/upload">
                  <Button size="md" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>Upload First Document</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Document Grid */}
        {!isLoading && filteredDocuments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Repository Documents</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {filteredDocuments.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map((doc) => {
                const statusDetails = getStatusDetails(doc.status);
                const isReady = doc.status === 'completed';
                const fileExt = doc.filename.split('.').pop()?.toUpperCase() || 'FILE';

                return (
                  <article
                    key={doc.id}
                    className="group bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative"
                  >
                    <div className="space-y-3.5">
                      {/* Top Chips */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Format Chip */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                          {fileExt === 'PDF' ? (
                            <FileText className="h-3 w-3 text-rose-500" aria-hidden="true" />
                          ) : (
                            <FileImage className="h-3 w-3 text-blue-500" aria-hidden="true" />
                          )}
                          <span>{fileExt}</span>
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            isReady
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          }`}
                          aria-label={statusDetails.ariaLabel}
                        >
                          {isReady ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Clock className="h-3 w-3 text-amber-600" aria-hidden="true" />
                          )}
                          <span>{statusDetails.label}</span>
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {doc.filename}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                            <span>{doc.page_count || 1} {doc.page_count === 1 ? 'Page' : 'Pages'}</span>
                          </span>
                          <span>•</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isReady ? (
                        <Link href={`/reader/${doc.id}`} className="block">
                          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs" size="sm">
                            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                            <span>Open Reader</span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          disabled
                          variant="outline"
                          className="w-full gap-2 opacity-60 cursor-not-allowed border-slate-200 text-slate-500"
                          size="sm"
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Processing...</span>
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Direct Voice Asking Modal for Hands-Free Operation */}
      <DirectConceptExplainerModal
        isOpen={isDirectExplainerOpen}
        onClose={() => setIsDirectExplainerOpen(false)}
        selectedLanguage="en-IN"
      />
    </div>
  );
}
