'use client';

import React from 'react';
import { Block } from '@/lib/types';
import { getBlockTypeDetails } from '@/lib/utils';
import {
  Volume2,
  Network,
  GitBranch,
  BarChart2,
  Table as TableIcon,
  Binary,
  BookOpen,
} from 'lucide-react';
import { VisualRepresentation } from './VisualRepresentation';

interface ExplanationBlockCardProps {
  block: Block;
  isActive: boolean;
  onReadBlock: (block: Block) => void;
}

export function ExplanationBlockCard({
  block,
  isActive,
  onReadBlock,
}: ExplanationBlockCardProps) {
  const typeDetails = getBlockTypeDetails(block.block_type);

  const getBlockIcon = () => {
    switch (block.block_type) {
      case 'diagram':
        return <Network className="h-5 w-5 text-indigo-600" aria-hidden="true" />;
      case 'flowchart':
        return <GitBranch className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
      case 'graph':
        return <BarChart2 className="h-5 w-5 text-amber-600" aria-hidden="true" />;
      case 'table':
        return <TableIcon className="h-5 w-5 text-purple-600" aria-hidden="true" />;
      case 'formula':
        return <Binary className="h-5 w-5 text-rose-600" aria-hidden="true" />;
      case 'text':
      default:
        return <BookOpen className="h-5 w-5 text-blue-600" aria-hidden="true" />;
    }
  };

  const getBorderColor = () => {
    switch (block.block_type) {
      case 'diagram':
        return 'border-l-indigo-600';
      case 'flowchart':
        return 'border-l-emerald-600';
      case 'graph':
        return 'border-l-amber-600';
      case 'table':
        return 'border-l-purple-600';
      case 'formula':
        return 'border-l-rose-600';
      case 'text':
      default:
        return 'border-l-blue-600';
    }
  };

  return (
    <article
      id={`block-${block.id}`}
      aria-label={`Block ${block.order_index}: ${typeDetails.label} - ${block.title || ''}`}
      className={`rounded-2xl p-5 sm:p-7 transition-all border border-l-4 relative bg-white ${getBorderColor()} ${
        isActive
          ? 'border-blue-300 ring-2 ring-blue-600 shadow-md bg-blue-50/20'
          : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Active speaker status pill */}
      {isActive && (
        <div
          role="status"
          className="absolute -top-3 left-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-2 shadow-sm border border-blue-400"
        >
          <div className="flex items-end gap-1 h-3" aria-hidden="true">
            <span className="wave-bar wave-bar-1 h-3! w-1! bg-white" />
            <span className="wave-bar wave-bar-2 h-3! w-1! bg-white" />
            <span className="wave-bar wave-bar-3 h-3! w-1! bg-white" />
          </div>
          <span>Playing Audio</span>
        </div>
      )}

      {/* Header with Type Badge, Order, and Direct Read Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            {getBlockIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${typeDetails.badgeClass}`}
              >
                {typeDetails.label}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Block {block.order_index}
              </span>
            </div>
            {block.title && (
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 leading-snug">
                {block.title}
              </h3>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onReadBlock(block)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all min-h-[38px] cursor-pointer ${
            isActive
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs hover:bg-blue-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
          }`}
          aria-label={`Read Block ${block.order_index} aloud`}
        >
          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isActive ? 'Playing' : 'Listen to this block'}</span>
        </button>
      </div>

      {/* Interactive Visual Representation: Flowchart, Diagram, Formula, Graph, or Table */}
      <VisualRepresentation
        blockType={block.block_type}
        title={block.title}
        explanationText={block.explanation_text}
      />

      {/* Spoken Explanation Text */}
      <div className="text-slate-800 text-sm sm:text-base leading-relaxed font-normal space-y-2 mt-3 pt-2 border-t border-slate-100">
        <p>{block.explanation_text}</p>
      </div>
    </article>
  );
}
