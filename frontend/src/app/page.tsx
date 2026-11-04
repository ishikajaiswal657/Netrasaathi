'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { subscribeAuth, getToken } from '@/lib/auth';
import { User } from '@/lib/types';
import { speakText, stopSpeech } from '@/lib/speech';
import { Button } from '@/components/ui/Button';
import { VoiceAvatar3D } from '@/components/voice/VoiceAvatar3D';
import {
  Volume2,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Network,
  GitBranch,
  BarChart2,
  Table as TableIcon,
  Binary,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Compass,
  Headphones,
  Eye,
  Layers,
  Cpu,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

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

  const authed = Boolean(token);

  const handleDemoAudio = () => {
    if (isPlayingDemo) {
      stopSpeech();
      setIsPlayingDemo(false);
      return;
    }

    const demoScript =
      'Welcome to Netrasaathi. This demonstration illustrates an architecture diagram of the OSI seven-layer networking model. At the highest level is the Application layer, which interfaces directly with user software. Below it, the Presentation and Session layers manage data formatting and connections. At the center, the Transport layer ensures error-free delivery, while the Network and Data Link layers handle routing and frame transfer. Finally, at the base is the Physical layer, transmitting raw electrical and optical signals across physical media.';

    setIsPlayingDemo(true);
    speakText(demoScript, {
      rate: 1.0,
      lang: 'en-IN',
      onEnd: () => setIsPlayingDemo(false),
      onError: () => setIsPlayingDemo(false),
    });
  };

  return (
    <div className="bg-mesh-pattern min-h-screen text-slate-900 pb-20 relative">
      {/* Hero Section (Coursera / Modern Educational Portal Style) */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left Content Column */}
            <div className="space-y-6 max-w-2xl text-center lg:text-left">
              {/* Educational Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-wider shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                <span>Next-Generation Accessible STEM Education</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Learn Today. <br />
                  <span className="text-blue-600">
                    Understand Every Diagram with Voice.
                  </span>
                </h1>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                  Empowering visually impaired and print-disabled students with independent access to complex diagrams, flowcharts, graphs, and textbook formulas through AI vision and interactive, human-like voice narration.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {authed ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">
                      <Layers className="h-4 w-4" aria-hidden="true" />
                      <span>Open Document Dashboard</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Get Started Free</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                        <Compass className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        <span>Try Demo Account</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">WCAG AAA Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">9 Languages</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">AI Vision STEM</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Zero Cloud Leak</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Voice Assistant Avatar Showcase */}
            <div className="shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/50 p-8 sm:p-10 rounded-3xl border border-blue-100 shadow-sm relative">
              <VoiceAvatar3D
                size="xl"
                state={isPlayingDemo ? 'speaking' : 'idle'}
                speechBubbleText={
                  isPlayingDemo
                    ? 'Narrating: OSI 7-Layer Architecture Model'
                    : 'Click me to listen to my voice!'
                }
                onClick={handleDemoAudio}
                className="cursor-pointer"
              />

              <div className="mt-5 text-center space-y-2">
                <button
                  type="button"
                  onClick={handleDemoAudio}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm cursor-pointer shadow-sm transition-all ${
                    isPlayingDemo
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 ring-2 ring-rose-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isPlayingDemo ? (
                    <>
                      <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>Stop Voice Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>Listen to Audio Preview</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] font-semibold text-slate-500">
                  Powered by OpenAI Flagship Neural TTS (nova)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Visual Modalities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            <span>Visual Understanding Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Bridging the Accessibility Gap in Visual STEM
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-normal">
            Netrasaathi analyzes visual diagrams, graphs, and academic courseware, translating them into structured, intuitive voice lessons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Diagrams */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Network className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 block w-fit">
              Diagrams
            </span>
            <h3 className="text-base font-bold text-slate-900">System Architecture &amp; Schematics</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Explains visual components from top to bottom, detailing individual modules, connecting interfaces, and functional relationships.
            </p>
          </div>

          {/* 2. Flowcharts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <GitBranch className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 block w-fit">
              Flowcharts
            </span>
            <h3 className="text-base font-bold text-slate-900">Decision Trees &amp; Logic Paths</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Sequentially traverses process branches and decision conditions: &ldquo;If threshold met, proceed to step 2; otherwise route to step 4.&rdquo;
            </p>
          </div>

          {/* 3. Graphs & Charts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <BarChart2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 block w-fit">
              Graphs &amp; Plots
            </span>
            <h3 className="text-base font-bold text-slate-900">Data Visualizations &amp; Trends</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              States axis dimensions and units, highlights significant trends, and reports maximum peaks, lowest troughs, and outliers.
            </p>
          </div>

          {/* 4. Tables */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <TableIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 block w-fit">
              Tables
            </span>
            <h3 className="text-base font-bold text-slate-900">Structured Tabular Data</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Reads tabular records row by row in a coherent, comparative format without skipping headers or mixing adjacent column values.
            </p>
          </div>

          {/* 5. Formulas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Binary className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 block w-fit">
              Formulas
            </span>
            <h3 className="text-base font-bold text-slate-900">Mathematical &amp; Scientific Notation</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Verbalizes mathematical symbols clearly into natural sentences and clarifies the underlying physical or conceptual principle.
            </p>
          </div>

          {/* 6. Text Passages */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 block w-fit">
              Text Passages
            </span>
            <h3 className="text-base font-bold text-slate-900">Synchronized Highlighting</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              Narrates textual passages with synchronized visual highlight states, assisting students with residual vision in following along.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Flat OCR vs Netrasaathi */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900">
              Traditional Screen Readers vs. Netrasaathi
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Why traditional optical character recognition fails visually impaired students on STEM courseware:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Standard OCR */}
            <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3.5">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <XCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
                <span>Standard OCR &amp; Flat Screen Readers</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>Scrambles visual diagram labels into disjointed character fragments.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>Cannot interpret arrows, process hierarchies, or spatial relationships.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>Provides no interactive clarification or voice-driven Q&amp;A capability.</span>
                </li>
              </ul>
            </div>

            {/* Netrasaathi */}
            <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                <span>Netrasaathi Assistive Intelligence</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Deconstructs diagrams, flowcharts, graphs, and tables into plain English.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Supports voice commands (&ldquo;Next&rdquo;, &ldquo;Repeat&rdquo;, &ldquo;Slower&rdquo;, &ldquo;Faster&rdquo;, &ldquo;Stop&rdquo;).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Answers spoken questions strictly grounded in the uploaded material.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
