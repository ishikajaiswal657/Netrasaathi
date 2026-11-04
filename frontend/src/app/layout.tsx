import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { LiveAnnouncerProvider } from '@/components/accessibility/LiveAnnouncer';
import { Navbar } from '@/components/ui/Navbar';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Netrasaathi — Accessible AI Study Platform',
  description:
    'An accessible, voice-first assistive platform that translates diagrams, flowcharts, graphs, formulas, and STEM courseware into structured, plain-English audio for visually impaired students.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#070714] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {/* WCAG AAA Skip Link for Screen Readers and Keyboard Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-indigo-400"
        >
          Skip to main content
        </a>

        <LiveAnnouncerProvider>
          <DemoBanner />
          <Suspense fallback={<div className="h-20 bg-[#070714] border-b border-white/10" />}>
            <Navbar />
          </Suspense>
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-12 text-indigo-300 font-semibold text-base">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Loading platform...</span>
                </div>
              </div>
            }
          >
            <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-hidden">
              {children}
            </main>
          </Suspense>
          <footer className="bg-[#05050f] border-t border-white/[0.08] py-8 px-4 text-sm text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo size="sm" showSubtitle={false} />
                <span className="text-slate-600 hidden sm:inline">|</span>
                <p className="text-xs text-slate-400 font-medium">
                  Universal Assistive Courseware &amp; Vision Engine
                </p>
              </div>
              <p className="text-xs text-slate-500">
                WCAG 2.1 AAA Compliant. Zero-Content Privacy Architecture.
              </p>
            </div>
          </footer>
        </LiveAnnouncerProvider>
      </body>
    </html>
  );
}
