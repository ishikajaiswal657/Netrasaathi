'use client';

import React from 'react';
import { BlockType } from '@/lib/types';
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Database,
  Smartphone,
  Cpu,
  Layers,
  Activity,
  Zap,
  HelpCircle,
  Binary,
  Sun,
  Leaf,
} from 'lucide-react';

interface VisualRepresentationProps {
  blockType: BlockType;
  title?: string;
  explanationText: string;
  className?: string;
}

export function VisualRepresentation({
  blockType,
  title = '',
  explanationText = '',
  className = '',
}: VisualRepresentationProps) {
  const lowerTitle = title.toLowerCase();
  const lowerText = explanationText.toLowerCase();

  // ==========================================
  // 1. FLOWCHART VISUALIZATIONS
  // ==========================================
  if (blockType === 'flowchart') {
    // 1A. TCP 3-Way Handshake Flowchart
    if (lowerTitle.includes('handshake') || lowerTitle.includes('tcp') || lowerText.includes('syn')) {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Interactive Flowchart: TCP 3-Way Handshake
            </span>
            <span className="text-xs text-slate-500 font-medium">3 Sequential Steps</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: SYN */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center space-y-2 relative">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <div className="font-extrabold text-xs text-slate-900">Step 1: SYN (Synchronize)</div>
              <p className="text-[11px] text-slate-600">Client sends connection request sequence number to server.</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <span>Client</span>
                <ArrowRight className="h-3 w-3" />
                <span>Server</span>
              </div>
            </div>

            {/* Step 2: SYN-ACK */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs flex flex-col items-center text-center space-y-2 relative">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <div className="font-extrabold text-xs text-slate-900">Step 2: SYN-ACK</div>
              <p className="text-[11px] text-slate-600">Server acknowledges and replies with its own sync sequence.</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                <span>Server</span>
                <ArrowRight className="h-3 w-3" />
                <span>Client</span>
              </div>
            </div>

            {/* Step 3: ACK */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col items-center text-center space-y-2 relative">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <div className="font-extrabold text-xs text-slate-900">Step 3: ACK (Established)</div>
              <p className="text-[11px] text-slate-600">Client confirms acknowledgment. Reliable data channel is now open.</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 1B. Binary Search Flowchart
    if (lowerTitle.includes('binary search') || lowerTitle.includes('खोज') || lowerTitle.includes('தேடல்') || lowerText.includes('mid') || lowerText.includes('half')) {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border border-slate-200/90 space-y-4 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Flowchart: Binary Search Algorithm
            </span>
            <span className="text-xs text-slate-500 font-medium">Divide &amp; Conquer Flow</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 text-center flex-wrap">
            {/* Step 1: Sorted Array */}
            <div className="bg-white px-3.5 py-2 rounded-full border-2 border-emerald-500 text-xs font-bold text-emerald-800 shadow-xs">
              Start: Sorted Array
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />

            {/* Step 2: Compute Mid */}
            <div className="bg-white px-3 py-2 rounded-xl border border-blue-300 text-xs font-semibold text-slate-800 shadow-xs">
              Compute Mid = (L + R) / 2
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />

            {/* Step 3: Check Condition */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-3.5 py-2 rounded-xl border-2 border-amber-400 text-xs font-extrabold text-amber-900 shadow-xs">
              Target == Arr[Mid]?
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />

            {/* Step 4: Outcome */}
            <div className="bg-emerald-600 px-3.5 py-2 rounded-full text-xs font-bold text-white shadow-xs">
              Found (Return Index)
            </div>
          </div>

          {/* Branching Logic Explainer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">EQUAL</span>
              <span className="text-slate-600">Match found immediately. Return position and exit loop.</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-blue-200 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">LESS</span>
              <span className="text-slate-600">Target is smaller: Discard right half, search Left (R = Mid - 1).</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-indigo-200 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">GREATER</span>
              <span className="text-slate-600">Target is bigger: Discard left half, search Right (L = Mid + 1).</span>
            </div>
          </div>
        </div>
      );
    }

    // 1C. Newton's 2nd Law / Physics Flowchart
    if (lowerTitle.includes('newton') || lowerTitle.includes('बल') || lowerTitle.includes('force') || lowerText.includes('acceleration')) {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-rose-50/30 to-slate-50 border border-slate-200/90 space-y-4 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/70 px-2.5 py-0.5 rounded-md border border-rose-200">
              Flowchart: Newton&apos;s Second Law of Motion
            </span>
            <span className="text-xs text-slate-500 font-medium">Force &amp; Acceleration Path</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 text-center flex-wrap">
            <div className="bg-white px-3.5 py-2 rounded-full border-2 border-rose-500 text-xs font-bold text-rose-800 shadow-xs">
              Apply Net Force (F)
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-3.5 py-2 rounded-xl border-2 border-amber-400 text-xs font-extrabold text-amber-900 shadow-xs">
              Is Net Force &gt; 0?
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />
            <div className="bg-white px-3.5 py-2 rounded-xl border border-indigo-300 text-xs font-semibold text-slate-800 shadow-xs">
              Calculate a = F / m
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />
            <div className="bg-emerald-600 px-3.5 py-2 rounded-full text-xs font-bold text-white shadow-xs">
              Object Accelerates
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">YES</span>
              <span className="text-slate-600">Unbalanced force creates proportional acceleration in force direction.</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">NO</span>
              <span className="text-slate-600">Zero net force means constant velocity or remaining at rest.</span>
            </div>
          </div>
        </div>
      );
    }

    // 1D. Generic Step-by-Step Flowchart with Decision Diamond
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border border-slate-200/90 space-y-4 my-3.5 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Step-by-Step Algorithmic Flowchart
          </span>
          <span className="text-xs text-slate-500 font-medium">Logical Decision Path</span>
        </div>

        {/* Visual Flow Diagram */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
          {/* Start Box */}
          <div className="bg-white px-3.5 py-2 rounded-full border-2 border-emerald-500 text-xs font-bold text-emerald-800 shadow-xs">
            Start / Intake
          </div>

          <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />

          {/* Validation Process Box */}
          <div className="bg-white px-4 py-2 rounded-xl border border-blue-300 text-xs font-semibold text-slate-800 shadow-xs">
            Validate Input Data
          </div>

          <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />

          {/* Decision Diamond */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-2.5 rounded-xl border-2 border-amber-400 text-xs font-extrabold text-amber-900 shadow-xs">
            Condition Met?
          </div>

          <ArrowRight className="h-4 w-4 text-slate-400 rotate-90 sm:rotate-0" />

          {/* Result Box */}
          <div className="bg-emerald-600 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs">
            Success &amp; Return
          </div>
        </div>

        {/* Branching Logic Explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">YES</span>
            <span className="text-slate-600">Proceed along active path to execute process and complete goal.</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-start gap-2">
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">NO</span>
            <span className="text-slate-600">Re-route to error recovery, fallback state, or loop iteration.</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. DIAGRAM / ARCHITECTURE VISUALIZATIONS
  // ==========================================
  if (blockType === 'diagram') {
    // 2A. 7-Layer OSI Model Reference Stack
    if (lowerTitle.includes('osi') || lowerText.includes('layer 7') || lowerText.includes('application')) {
      const osiLayers = [
        { num: 7, name: 'Application', data: 'Data', protocols: 'HTTP, DNS, SMTP', color: 'bg-blue-600 text-white' },
        { num: 6, name: 'Presentation', data: 'Data', protocols: 'SSL/TLS, JPEG, ASCII', color: 'bg-indigo-600 text-white' },
        { num: 5, name: 'Session', data: 'Data', protocols: 'Sockets, RPC, NetBIOS', color: 'bg-violet-600 text-white' },
        { num: 4, name: 'Transport', data: 'Segments', protocols: 'TCP, UDP, Ports', color: 'bg-sky-600 text-white' },
        { num: 3, name: 'Network', data: 'Packets', protocols: 'IP, ICMP, Routers', color: 'bg-teal-600 text-white' },
        { num: 2, name: 'Data Link', data: 'Frames', protocols: 'Ethernet, MAC, Wi-Fi', color: 'bg-emerald-600 text-white' },
        { num: 1, name: 'Physical', data: 'Bits', protocols: 'Cables, Fiber, Radio (0/1)', color: 'bg-slate-700 text-white' },
      ];

      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/70 px-2.5 py-0.5 rounded-md border border-blue-200">
                Visual Stack: The 7 OSI Layers
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>Encapsulation</span>
              <ArrowDown className="h-3 w-3 text-blue-600" />
            </div>
          </div>

          {/* 7-Layer Interactive Stack */}
          <div className="space-y-1.5">
            {osiLayers.map((l) => (
              <div
                key={l.num}
                className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${l.color}`}>
                    {l.num}
                  </span>
                  <div>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 block leading-tight">{l.name} Layer</span>
                    <span className="text-[11px] text-slate-500 font-medium">{l.protocols}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    PDU: {l.data}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2B. Binary Search Tree (BST) Diagram
    if (lowerTitle.includes('binary search') || lowerTitle.includes('tree') || lowerText.includes('root node')) {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/70 px-2.5 py-0.5 rounded-md border border-blue-200">
              Visual Structure: Binary Search Tree (BST)
            </span>
            <span className="text-xs text-slate-500 font-medium">Left &lt; Root &lt; Right</span>
          </div>

          {/* Visual Node Hierarchy */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            {/* Root Node */}
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm border-2 border-blue-400">
              50
            </div>

            {/* Branches to Level 1 */}
            <div className="grid grid-cols-2 gap-16 sm:gap-24 relative">
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Left (&lt; 50)</span>
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  30
                </div>
                {/* Level 2 children */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-emerald-500 text-slate-900 font-bold text-[11px] flex items-center justify-center">20</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-emerald-500 text-slate-900 font-bold text-[11px] flex items-center justify-center">40</div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Right (&gt; 50)</span>
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  70
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-indigo-500 text-slate-900 font-bold text-[11px] flex items-center justify-center">60</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-indigo-500 text-slate-900 font-bold text-[11px] flex items-center justify-center">80</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2C. Photosynthesis Biology Diagram
    if (lowerTitle.includes('photosynthesis') || lowerTitle.includes('प्रकाश') || lowerText.includes('chlorophyll') || lowerText.includes('glucose')) {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/50 via-slate-50 to-teal-50/50 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Biological Process: Photosynthesis
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <Sun className="h-3.5 w-3.5" />
              <span>Solar Energy</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center space-y-1.5">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">Inputs</span>
              <span className="font-extrabold text-sm text-slate-900">Sunlight + CO₂ + H₂O</span>
              <p className="text-[11px] text-slate-600">Absorbed from air through stomata and roots from soil.</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col items-center text-center space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">Chloroplast Factory</span>
              <span className="font-extrabold text-sm text-slate-900">Light &amp; Dark Reactions</span>
              <p className="text-[11px] text-slate-600">Chlorophyll traps photons to split water molecules.</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-xs flex flex-col items-center text-center space-y-1.5">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">Outputs</span>
              <span className="font-extrabold text-sm text-slate-900">Glucose (C₆H₁₂O₆) + O₂</span>
              <p className="text-[11px] text-slate-600">Nourishes the plant and releases oxygen into the atmosphere.</p>
            </div>
          </div>
        </div>
      );
    }

    // 2D. General Multi-Tier Architecture Diagram
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/40 via-slate-50 to-indigo-50/40 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/70 px-2.5 py-0.5 rounded-md border border-blue-200">
            System Architecture Diagram
          </span>
          <span className="text-xs text-slate-500 font-medium">3-Tier Modular Pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xs text-slate-900">Client Presentation</span>
            <span className="text-[11px] text-slate-600">Voice UI, screen reader cues, and tactile responses.</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xs text-slate-900">AI Intelligence Core</span>
            <span className="text-[11px] text-slate-600">OCR diagram parser, multimodal vision &amp; Presidio privacy.</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Database className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xs text-slate-900">Isolated Storage</span>
            <span className="text-[11px] text-slate-600">Encrypted multi-tenant store with zero-content audit logs.</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. FORMULA VISUALIZATIONS
  // ==========================================
  if (blockType === 'formula') {
    let mathExpr = 'E = m • c²';
    let varChips = [
      { sym: 'E', label: 'Energy (Joules)' },
      { sym: 'm', label: 'Rest Mass (kg)' },
      { sym: 'c', label: 'Speed of Light (3 × 10⁸ m/s)' },
    ];

    if (lowerTitle.includes('bandwidth') || lowerTitle.includes('bdp') || lowerText.includes('round trip')) {
      mathExpr = 'BDP = Bandwidth × RTT';
      varChips = [
        { sym: 'BDP', label: 'Bandwidth-Delay Product (bits in flight)' },
        { sym: 'Bandwidth', label: 'Data rate (e.g. 100 Mbps)' },
        { sym: 'RTT', label: 'Round Trip Time latency (ms)' },
      ];
    } else if (lowerTitle.includes('complexity') || lowerText.includes('log') || lowerTitle.includes('search')) {
      mathExpr = 'T(N) = O(log₂ N)';
      varChips = [
        { sym: 'T(N)', label: 'Search Time / Operations' },
        { sym: 'N', label: 'Number of elements in dataset' },
        { sym: 'log₂', label: 'Halving search space at each comparison' },
      ];
    } else if (lowerTitle.includes('newton') || lowerText.includes('force') || lowerText.includes('mass')) {
      mathExpr = 'F = m • a';
      varChips = [
        { sym: 'F', label: 'Net Force (Newtons)' },
        { sym: 'm', label: 'Object Mass (kg)' },
        { sym: 'a', label: 'Acceleration (m/s²)' },
      ];
    } else if (lowerTitle.includes('ohm') || lowerText.includes('voltage') || lowerText.includes('current')) {
      mathExpr = 'V = I • R';
      varChips = [
        { sym: 'V', label: 'Voltage (Volts)' },
        { sym: 'I', label: 'Electric Current (Amperes)' },
        { sym: 'R', label: 'Resistance (Ohms Ω)' },
      ];
    } else if (lowerTitle.includes('photosynthesis') || lowerText.includes('glucose')) {
      mathExpr = '6CO₂ + 6H₂O + Light ➔ C₆H₁₂O₆ + 6O₂';
      varChips = [
        { sym: 'CO₂', label: 'Carbon Dioxide from air' },
        { sym: 'H₂O', label: 'Water drawn from soil' },
        { sym: 'C₆H₁₂O₆', label: 'Glucose Energy Sugar' },
      ];
    }

    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/40 via-slate-50 to-amber-50/40 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/70 px-2.5 py-0.5 rounded-md border border-rose-200">
            Mathematical Equation &amp; Term Breakdown
          </span>
          <span className="text-xs text-slate-500 font-medium">Scientific Notation</span>
        </div>

        {/* Big Math Callout Box */}
        <div className="bg-white py-4 px-6 rounded-2xl border-2 border-rose-200/80 shadow-xs text-center">
          <code className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-wider">
            {mathExpr}
          </code>
        </div>

        {/* Variable breakdown chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {varChips.map((chip, idx) => (
            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
              <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                {chip.sym}
              </span>
              <span className="text-xs font-semibold text-slate-700">{chip.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. GRAPH VISUALIZATIONS
  // ==========================================
  if (blockType === 'graph') {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-md border border-amber-200">
              Interactive Trend Graph: Speed vs Packet Loss
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Throughput (Mbps)</span>
        </div>

        {/* Clean SVG Trend Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <svg viewBox="0 0 400 160" className="w-full h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Grid lines */}
            <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="140" x2="380" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Axis Labels */}
            <text x="15" y="24" fontSize="10" fill="#64748b" fontWeight="600">100M</text>
            <text x="20" y="64" fontSize="10" fill="#64748b" fontWeight="600">60M</text>
            <text x="20" y="104" fontSize="10" fill="#64748b" fontWeight="600">20M</text>
            <text x="25" y="144" fontSize="10" fill="#64748b" fontWeight="600">0M</text>

            <text x="40" y="155" fontSize="10" fill="#64748b" fontWeight="600">0%</text>
            <text x="120" y="155" fontSize="10" fill="#64748b" fontWeight="600">2%</text>
            <text x="200" y="155" fontSize="10" fill="#64748b" fontWeight="600">4%</text>
            <text x="280" y="155" fontSize="10" fill="#64748b" fontWeight="600">6%</text>
            <text x="360" y="155" fontSize="10" fill="#64748b" fontWeight="600">10%</text>

            {/* Gradient Area Fill under Curve */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 40 24 Q 90 30, 120 90 T 200 130 T 380 135 L 380 140 L 40 140 Z"
              fill="url(#chartGradient)"
            />

            {/* Main Data Trend Line */}
            <path
              d="M 40 24 Q 90 30, 120 90 T 200 130 T 380 135"
              stroke="#2563eb"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Highlighted Data Points */}
            <circle cx="40" cy="24" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
            <circle cx="120" cy="90" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
            <circle cx="200" cy="130" r="4" fill="#64748b" stroke="#ffffff" strokeWidth="2" />

            {/* Annotations */}
            <rect x="48" y="14" width="70" height="18" rx="4" fill="#dbeafe" />
            <text x="52" y="27" fontSize="9" fill="#1e40af" fontWeight="bold">Peak: 98 Mbps</text>

            <rect x="130" y="78" width="90" height="18" rx="4" fill="#ffe4e6" />
            <text x="134" y="91" fontSize="9" fill="#be123c" fontWeight="bold">Drops 65% at 2% loss</text>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. TABLE VISUALIZATIONS
  // ==========================================
  if (blockType === 'table') {
    // 5A. TCP vs UDP Table
    if (lowerTitle.includes('tcp') || lowerTitle.includes('udp') || lowerText.includes('handshake')) {
      return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/70 px-2.5 py-0.5 rounded-md border border-purple-200">
              Structured Comparison: TCP vs UDP
            </span>
            <span className="text-xs text-slate-500 font-medium">Reliability vs Speed</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3">Attribute</th>
                  <th className="p-3 text-blue-700">TCP (Transmission Control)</th>
                  <th className="p-3 text-indigo-700">UDP (User Datagram)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-800 bg-slate-50/50">Connection Type</td>
                  <td className="p-3 text-slate-700">Connection-oriented (3-way handshake)</td>
                  <td className="p-3 text-slate-700">Connectionless (Fire-and-forget)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800 bg-slate-50/50">Reliability</td>
                  <td className="p-3 text-slate-700">Guaranteed delivery with retransmissions</td>
                  <td className="p-3 text-slate-700">Best effort (Packets may be dropped)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800 bg-slate-50/50">Use Cases</td>
                  <td className="p-3 text-slate-700">Web (HTTP), Email, File Transfer (FTP)</td>
                  <td className="p-3 text-slate-700">Live Voice, Video Streaming, Gaming, DNS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 5B. Layer 2 vs Layer 4 Table (Standard Seeded)
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 my-3.5 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/70 px-2.5 py-0.5 rounded-md border border-purple-200">
            Structured Comparison Matrix
          </span>
          <span className="text-xs text-slate-500 font-medium">3 Comparative Criteria</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <th className="p-3">Feature</th>
                <th className="p-3 text-blue-700">Layer 2 (Data Link)</th>
                <th className="p-3 text-indigo-700">Layer 4 (Transport)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-bold text-slate-800 bg-slate-50/50">Addressing Scheme</td>
                <td className="p-3 text-slate-700">Physical MAC Address (Hardware)</td>
                <td className="p-3 text-slate-700">Port Numbers (e.g. 80, 443)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800 bg-slate-50/50">Delivery Scope</td>
                <td className="p-3 text-slate-700">Hop-by-hop between local devices</td>
                <td className="p-3 text-slate-700">End-to-end between original programs</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800 bg-slate-50/50">Primary Protocols</td>
                <td className="p-3 text-slate-700">Ethernet (802.3), Wi-Fi (802.11)</td>
                <td className="p-3 text-slate-700">TCP (Guaranteed), UDP (Fast)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. DEFAULT / CONCEPT ILLUSTRATION (for 'text' blocks)
  // ==========================================
  return (
    <div className={`p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 my-3 flex items-start gap-3 ${className}`}>
      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5 border border-blue-200">
        <Zap className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <strong className="text-xs font-bold text-blue-900 block uppercase tracking-wide">
          Intuitive Visual Metaphor &amp; Takeaway
        </strong>
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {explanationText.length > 200 ? explanationText.slice(0, 200) + '...' : explanationText}
        </p>
      </div>
    </div>
  );
}
