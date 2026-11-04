/**
 * General Utilities & Accessibility Helpers
 */

import { BlockType, DocumentStatus } from './types';

/**
 * Combine CSS classes cleanly
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format bytes into readable KB / MB
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format date string into human readable time
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Provides accessible human-friendly description of block types
 */
export function getBlockTypeDetails(type: BlockType): {
  label: string;
  badgeClass: string;
  description: string;
} {
  switch (type) {
    case 'diagram':
      return {
        label: 'Diagram',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold',
        description: 'Visual layout walking through parts and connections',
      };
    case 'flowchart':
      return {
        label: 'Flowchart',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
        description: 'Step-by-step process and decision sequence',
      };
    case 'graph':
      return {
        label: 'Graph / Chart',
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-200 font-bold',
        description: 'Data trends, axes, and minimum/maximum values',
      };
    case 'table':
      return {
        label: 'Table',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 font-bold',
        description: 'Structured comparison of rows and columns',
      };
    case 'formula':
      return {
        label: 'Formula / Equation',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
        description: 'Mathematical relationship and practical meaning',
      };
    case 'text':
    default:
      return {
        label: 'Text Explanation',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 font-bold',
        description: 'Plain-English summary of text content',
      };
  }
}

/**
 * Provides accessible styling and labels for document processing statuses
 */
export function getStatusDetails(status: DocumentStatus): {
  label: string;
  badgeClass: string;
  ariaLabel: string;
} {
  switch (status) {
    case 'completed':
      return {
        label: 'Ready to Read',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
        ariaLabel: 'Document status: Ready to read',
      };
    case 'processing':
      return {
        label: 'Processing OCR & AI',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold animate-pulse',
        ariaLabel: 'Document status: Processing OCR and AI explanations',
      };
    case 'uploaded':
      return {
        label: 'Uploaded (Needs Processing)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
        ariaLabel: 'Document status: Uploaded and awaiting processing',
      };
    case 'failed':
      return {
        label: 'Processing Failed',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
        ariaLabel: 'Document status: Processing failed',
      };
  }
}
