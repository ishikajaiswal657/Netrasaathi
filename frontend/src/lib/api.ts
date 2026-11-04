/**
 * Netrasaathi Typed API Client
 * Connects frontend to the FastAPI backend.
 * Provides explicit, configurable mock adapter for development when the backend is offline.
 * Never silently replaces real API failures with fake data.
 */

import { getToken, removeToken, setCurrentUser } from './auth';
import {
  AuthResponse,
  SignupResponse,
  User,
  DocumentItem,
  PageBlocksResponse,
  AskQuestionResponse,
  AuditLogItem,
  AdminStatsResponse,
} from './types';
import {
  MOCK_STUDENT_USER,
  MOCK_ADMIN_USER,
  MOCK_DOCUMENTS,
  MOCK_PAGE_BLOCKS,
  MOCK_AUDIT_LOGS,
} from './mock-data';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const MOCK_STORAGE_KEY = 'netrasaathi_use_mock_mode';

/**
 * Checks if mock mode is active.
 * Enabled either via NEXT_PUBLIC_USE_MOCK='true' or user toggle in UI.
 */
export function isMockModeActive(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  }
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  return process.env.NEXT_PUBLIC_USE_MOCK === 'true';
}

export function setMockModeActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_STORAGE_KEY, active ? 'true' : 'false');
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Core HTTP fetch wrapper with authorization and error handling.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  explicitToken?: string | null
): Promise<T> {
  const token = explicitToken || getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown network failure';
    throw new ApiError(
      `Network error connecting to backend (${BASE_URL}): ${errorMsg}. If the backend is not running yet, you can enable Demo/Mock Mode.`,
      0
    );
  }

  if (response.status === 401) {
    // Unauthorized / Expired session
    removeToken();
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  if (response.status === 403) {
    throw new ApiError('Access denied: You do not have permission to view this resource.', 403);
  }

  let body: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

// In-memory demo state for mock mode
const inMemoryDocuments = [...MOCK_DOCUMENTS];
const inMemoryAuditLogs = [...MOCK_AUDIT_LOGS];

/**
 * Explicit mock adapter used ONLY when mock mode is enabled.
 */
const mockAdapter = {
  async signup(email: string): Promise<SignupResponse> {
    await new Promise((r) => setTimeout(r, 400));
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
    const newUser: User = {
      id: inMemoryDocuments.length + 10,
      email,
      role: role as 'student' | 'admin',
      created_at: new Date().toISOString(),
    };
    return {
      message: 'Account created successfully in demo mode.',
      user: newUser,
      access_token: 'mock-jwt-token-demo',
    };
  },

  async login(email: string): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 400));
    const isMockAdmin = email.toLowerCase().includes('admin');
    const user = isMockAdmin ? MOCK_ADMIN_USER : MOCK_STUDENT_USER;
    const token = isMockAdmin ? 'mock-admin-token' : 'mock-student-token';

    inMemoryAuditLogs.unshift({
      id: Date.now(),
      user_id: user.id,
      user_email: user.email,
      action: 'login',
      document_id: null,
      ip_address: '127.0.0.1 (demo)',
      created_at: new Date().toISOString(),
    });

    return {
      access_token: token,
      token_type: 'bearer',
      user,
    };
  },

  async getMe(): Promise<User> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_STUDENT_USER;
  },

  async getDocuments(): Promise<DocumentItem[]> {
    await new Promise((r) => setTimeout(r, 300));
    return [...inMemoryDocuments];
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    await new Promise((r) => setTimeout(r, 800));
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      user_id: 1,
      filename: file.name,
      status: 'uploaded',
      page_count: 2,
      created_at: new Date().toISOString(),
    };
    inMemoryDocuments.unshift(newDoc);
    inMemoryAuditLogs.unshift({
      id: Date.now(),
      user_id: 1,
      user_email: 'student@netrasaathi.edu',
      action: 'upload',
      document_id: newDoc.id,
      ip_address: '127.0.0.1 (demo)',
      created_at: new Date().toISOString(),
    });
    return newDoc;
  },

  async processDocument(documentId: string | number): Promise<{ id: string | number; status: string; page_count: number }> {
    await new Promise((r) => setTimeout(r, 1200));
    const doc = inMemoryDocuments.find((d) => String(d.id) === String(documentId));
    if (doc) {
      doc.status = 'completed';
      doc.page_count = 2;
    }
    inMemoryAuditLogs.unshift({
      id: Date.now(),
      user_id: 1,
      user_email: 'student@netrasaathi.edu',
      action: 'process',
      document_id: documentId,
      ip_address: '127.0.0.1 (demo)',
      created_at: new Date().toISOString(),
    });
    return { id: documentId, status: 'completed', page_count: 2 };
  },

  async getDocumentBlocks(documentId: string | number, pageNumber: number): Promise<PageBlocksResponse> {
    await new Promise((r) => setTimeout(r, 300));
    const docBlocks = MOCK_PAGE_BLOCKS[String(documentId)];
    const blocks = (docBlocks && docBlocks[pageNumber]) || [
      {
        id: `mock-${documentId}-${pageNumber}-1`,
        order_index: 1,
        block_type: 'text',
        title: 'Demo Reading Content',
        explanation_text:
          'This is a demonstration explanation block for this study page. In production mode, the FastAPI backend processes your document image with OCR, redacts personal information, and extracts plain-English explanations of text, diagrams, and formulas.',
      },
      {
        id: `mock-${documentId}-${pageNumber}-2`,
        order_index: 2,
        block_type: 'diagram',
        title: 'Sample Architecture Flow',
        explanation_text:
          'The diagram illustrates a sequence of three processing steps from left to right. Box one shows document text extraction. An arrow points to Box two showing privacy redaction. A final arrow points to Box three showing plain-English audio narration.',
      },
    ];

    return {
      document_id: documentId,
      page_number: pageNumber,
      total_pages: 3,
      blocks,
    };
  },

  async askQuestion(documentId: string | number, question: string): Promise<AskQuestionResponse> {
    await new Promise((r) => setTimeout(r, 600));
    inMemoryAuditLogs.unshift({
      id: Date.now(),
      user_id: 1,
      user_email: 'student@netrasaathi.edu',
      action: 'ask',
      document_id: documentId,
      ip_address: '127.0.0.1 (demo)',
      created_at: new Date().toISOString(),
    });

    const lowerQ = question.toLowerCase();
    let answer = `Based on your uploaded material for this document, here is the answer in plain English: `;

    if (lowerQ.includes('osi') || lowerQ.includes('layer')) {
      answer +=
        'The OSI reference model consists of seven layers. At the highest level is the Application layer, and at the bottom is the Physical wire layer. Data moves downwards through each layer during transmission and upwards when received.';
    } else if (lowerQ.includes('handshake') || lowerQ.includes('tcp')) {
      answer +=
        'The TCP three-way handshake uses three messages: SYN to start, SYN-ACK to reply and acknowledge, and ACK to finalize the connection before data flows.';
    } else if (lowerQ.includes('loss') || lowerQ.includes('speed') || lowerQ.includes('throughput')) {
      answer +=
        'According to the graph, TCP throughput reaches its peak of 98 Megabits at zero loss, but drops sharply down to 35 Megabits when packet loss reaches just two percent.';
    } else {
      answer +=
        `This material explains the concepts step by step. Regarding "${question}", the document shows that structured protocols ensure reliable communication between computers without losing packets.`;
    }

    return {
      question,
      answer,
      relevant_pages: [1, 2],
    };
  },

  async getAuditLogs(action?: string): Promise<AuditLogItem[]> {
    await new Promise((r) => setTimeout(r, 300));
    if (action && action !== 'all') {
      return inMemoryAuditLogs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
    }
    return [...inMemoryAuditLogs];
  },

  async getAdminStats(): Promise<AdminStatsResponse> {
    await new Promise((r) => setTimeout(r, 300));
    const breakdown: Record<string, number> = {
      upload: inMemoryAuditLogs.filter((l) => l.action.toLowerCase() === 'upload').length,
      process: inMemoryAuditLogs.filter((l) => l.action.toLowerCase() === 'process').length,
      view: inMemoryAuditLogs.filter((l) => l.action.toLowerCase() === 'view').length,
      ask: inMemoryAuditLogs.filter((l) => l.action.toLowerCase() === 'ask').length,
    };
    return {
      total_users: 2,
      total_documents: inMemoryDocuments.length,
      total_audit_events: inMemoryAuditLogs.length,
      action_breakdown: breakdown,
    };
  },
};

// ==========================================
// EXPORTED API CLIENT
// ==========================================

export const api = {
  /**
   * User Signup
   * Route: POST /auth/signup
   */
  async signup(email: string, password: string): Promise<SignupResponse> {
    if (isMockModeActive()) {
      return mockAdapter.signup(email);
    }
    return request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * User Login
   * Route: POST /auth/login
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    if (isMockModeActive()) {
      return mockAdapter.login(email);
    }
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.user) {
      setCurrentUser(response.user);
    }
    return response;
  },

  /**
   * Current User Profile
   * Route: GET /me
   */
  async getMe(): Promise<User> {
    if (isMockModeActive()) {
      return mockAdapter.getMe();
    }
    return request<User>('/me', {
      method: 'GET',
    });
  },

  /**
   * List Student's Documents
   * Route: GET /documents
   */
  async getDocuments(token?: string | null): Promise<DocumentItem[]> {
    if (isMockModeActive()) {
      return mockAdapter.getDocuments();
    }
    return request<DocumentItem[]>('/documents', { method: 'GET' }, token);
  },

  /**
   * List Student's Documents (alias for getDocuments)
   */
  async listDocuments(token?: string | null): Promise<DocumentItem[]> {
    return this.getDocuments(token);
  },

  /**
   * Upload Document (PDF, JPG, PNG)
   * Route: POST /documents
   */
  async uploadDocument(file: File, token?: string | null): Promise<DocumentItem> {
    if (isMockModeActive()) {
      return mockAdapter.uploadDocument(file);
    }
    const formData = new FormData();
    formData.append('file', file);

    return request<DocumentItem>(
      '/documents',
      {
        method: 'POST',
        body: formData,
      },
      token
    );
  },

  /**
   * Trigger Document Processing
   * Route: POST /documents/{id}/process
   */
  async processDocument(
    documentId: string | number,
    token?: string | null
  ): Promise<{ id: string | number; status: string; page_count: number }> {
    if (isMockModeActive()) {
      return mockAdapter.processDocument(documentId);
    }
    return request<{ id: string | number; status: string; page_count: number }>(
      `/documents/${documentId}/process`,
      {
        method: 'POST',
      },
      token
    );
  },

  /**
   * Fetch Explanation Blocks for a Page
   * Route: GET /documents/{id}/pages/{n}/blocks
   */
  async getDocumentBlocks(
    documentId: string | number,
    pageNumber: number,
    token?: string | null
  ): Promise<PageBlocksResponse> {
    if (isMockModeActive()) {
      return mockAdapter.getDocumentBlocks(documentId, pageNumber);
    }
    return request<PageBlocksResponse>(
      `/documents/${documentId}/pages/${pageNumber}/blocks`,
      {
        method: 'GET',
      },
      token
    );
  },

  /**
   * Ask Follow-up Question
   * Route: POST /documents/{id}/ask
   */
  async askQuestion(
    documentId: string | number,
    question: string,
    token?: string | null
  ): Promise<AskQuestionResponse> {
    if (isMockModeActive()) {
      return mockAdapter.askQuestion(documentId, question);
    }
    return request<AskQuestionResponse>(
      `/documents/${documentId}/ask`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      },
      token
    );
  },

  /**
   * Fetch Audit Logs (Admin only)
   * Route: GET /admin/audit-logs
   */
  async getAuditLogs(action?: string, token?: string | null): Promise<AuditLogItem[]> {
    if (isMockModeActive()) {
      return mockAdapter.getAuditLogs(action);
    }
    const query = action && action !== 'all' ? `?action=${encodeURIComponent(action)}` : '';
    return request<AuditLogItem[]>(`/admin/audit-logs${query}`, { method: 'GET' }, token);
  },

  /**
   * Fetch Platform Security & Operational Metrics (Admin only)
   * Route: GET /admin/stats
   */
  async getAdminStats(token?: string | null): Promise<AdminStatsResponse> {
    if (isMockModeActive()) {
      return mockAdapter.getAdminStats();
    }
    return request<AdminStatsResponse>('/admin/stats', { method: 'GET' }, token);
  },
};
