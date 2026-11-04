/**
 * Netrasaathi TypeScript Types
 * Defined strictly according to Netrasaathi_PRD.md and Netrasaathi_Architecture.md
 */

export type UserRole = 'student' | 'admin';

export interface User {
  id: number | string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: User;
}

export interface SignupResponse {
  message?: string;
  user?: User;
  access_token?: string;
}

export type DocumentStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface DocumentItem {
  id: number | string;
  user_id?: number | string;
  filename: string;
  file_path?: string;
  status: DocumentStatus;
  page_count: number;
  created_at: string;
  updated_at?: string;
  error_message?: string;
}

export type Document = DocumentItem;

export type BlockType = 'text' | 'diagram' | 'flowchart' | 'graph' | 'table' | 'formula';

export interface ExplanationBlock {
  id: number | string;
  page_id?: number | string;
  order_index: number;
  block_type: BlockType;
  explanation_text: string;
  title?: string;
}

export type Block = ExplanationBlock;

export interface PageBlocksResponse {
  document_id: number | string;
  page_number: number;
  total_pages: number;
  blocks: ExplanationBlock[];
}

export interface AskQuestionRequest {
  question: string;
}

export interface AskQuestionResponse {
  question: string;
  answer: string;
  relevant_pages?: number[];
}

export interface AuditLogItem {
  id: number | string;
  user_id: number | string;
  user_email?: string;
  action: string; // e.g. 'upload', 'process', 'view', 'ask'
  document_id?: number | string | null;
  ip_address?: string;
  created_at: string;
}

export interface AdminStatsResponse {
  total_users: number;
  total_documents: number;
  total_audit_events: number;
  action_breakdown: Record<string, number>;
}

export interface SpeechPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  rate: number; // 0.75, 1.0, 1.25, etc.
  currentBlockIndex: number;
  supported: boolean;
}
