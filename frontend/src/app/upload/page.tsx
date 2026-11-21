'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, subscribeAuth } from '@/lib/auth';
import { formatBytes } from '@/lib/utils';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Button } from '@/components/ui/Button';
import {
  Upload,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  FileImage,
  ShieldCheck,
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit (Security rule FR13)
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function UploadPage() {
  const router = useRouter();
  const { announcePolite, announceAssertive } = useAnnounce();

  const token = useSyncExternalStore(
    subscribeAuth,
    () => getToken(),
    () => null
  );

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [pagesReady, setPagesReady] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successDocId, setSuccessDocId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Check if cloud backend is currently awake
    api.checkHealth().catch(() => {
      if (isMounted) {
        setIsServerWaking(true);
        const wakeTimer = setInterval(async () => {
          try {
            await api.checkHealth();
            clearInterval(wakeTimer);
            if (isMounted) {
              setIsServerWaking(false);
              announcePolite('Cloud backend is active and ready.');
            }
          } catch {
            // keep waking
          }
        }, 5000);
      }
    });

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const validateAndSetFile = (candidate: File | null) => {
    setErrorMessage('');
    if (!candidate) return;

    const ext = '.' + candidate.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      const msg = `Unsupported file format. Please upload a PDF, JPG, or PNG file.`;
      setErrorMessage(msg);
      announceAssertive(msg);
      setFile(null);
      return;
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      const msg = `File is too large (${formatBytes(candidate.size)}). Maximum allowed size is 25 MB.`;
      setErrorMessage(msg);
      announceAssertive(msg);
      setFile(null);
      return;
    }

    setFile(candidate);
    announcePolite(
      `Selected file: ${candidate.name}, size ${formatBytes(candidate.size)}. Ready to upload.`
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    announcePolite('File selection cleared.');
  };

  const startStatusPolling = (docId: string | number, userToken: string) => {
    setIsProcessing(true);
    setProcessingDocId(String(docId));
    setProcessingStatusText('Validating and reading document pages...');
    announcePolite('Upload received. Preparing document pages in the background...');

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusData = await api.getDocumentStatus(docId, userToken);
        setPagesReady(statusData.pages_ready);
        setTotalPages(statusData.page_count);

        let statusMsg = '';
        switch (statusData.status) {
          case 'uploaded':
            statusMsg = 'Document received by server. Preparing to extract pages...';
            break;
          case 'reading':
            statusMsg = `Reading ${statusData.page_count > 0 ? statusData.page_count + ' ' : ''}pages from document...`;
            break;
          case 'cleaning':
            statusMsg = 'Sanitizing sensitive personal information on page images...';
            break;
          case 'explaining':
            if (statusData.pages_ready > 0) {
              statusMsg = `Page ${statusData.pages_ready} of ${statusData.page_count} ready. Explaining visual diagrams...`;
            } else {
              statusMsg = 'Structuring plain-English visual explanations with AI vision...';
            }
            break;
          case 'ready':
          case 'completed':
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsProcessing(false);
            setSuccessDocId(String(docId));
            announcePolite('Document processing completed. Opening reading screen...');
            setTimeout(() => {
              router.push(`/reader/${docId}`);
            }, 1000);
            return;
          case 'failed':
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsProcessing(false);
            const failReason = statusData.error_message || 'Document processing encountered an error.';
            setErrorMessage(failReason);
            announceAssertive(failReason);
            return;
          default:
            statusMsg = `Processing status: ${statusData.status}...`;
        }

        setProcessingStatusText(statusMsg);
        announcePolite(statusMsg);
      } catch (pollErr: unknown) {
        console.warn('Status poll retry:', pollErr);
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      const msg = 'Please choose a document to upload first.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    if (!token) {
      const msg = 'You are not logged in. Please log in to upload and save study documents.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(100);
    announcePolite('Uploading document to server...');

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 45000);

    try {
      const res = await api.uploadDocument(file, token, abortController.signal);
      clearTimeout(timeoutId);
      setIsUploading(false);
      startStatusPolling(res.id, token);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      setIsUploading(false);
      const rawMsg = err instanceof Error ? err.message : '';
      if (err instanceof Error && err.name === 'AbortError') {
        const msg = 'Upload request timed out after 45 seconds. The cloud server may still be processing. Please retry.';
        setErrorMessage(msg);
        announceAssertive(msg);
        return;
      }
      if (
        (err as { status?: number }).status === 401 ||
        rawMsg.includes('401') ||
        rawMsg.toLowerCase().includes('session has expired') ||
        rawMsg.toLowerCase().includes('log in again')
      ) {
        setErrorMessage('Your session has expired or you are not signed in. Please log in to upload.');
        announceAssertive('Your session has expired. Please log in.');
        return;
      }
      let msg = rawMsg || 'Upload failed. Please try again.';

      if (
        rawMsg.toLowerCase().includes('failed to fetch') ||
        rawMsg.toLowerCase().includes('network') ||
        rawMsg.toLowerCase().includes('load failed')
      ) {
        msg = 'Cloud server was sleeping on standby (Render free plan). Waking up now; please wait about 30 seconds and click Retry Upload.';
        setIsServerWaking(true);
        const wakeTimer = setInterval(async () => {
          try {
            await api.checkHealth();
            clearInterval(wakeTimer);
            setIsServerWaking(false);
            setErrorMessage('Server is now awake and ready! Click Retry Upload.');
            announcePolite('Server is awake. Click Retry Upload to proceed.');
          } catch {
            // Keep waiting for wake-up
          }
        }, 5000);
      }

      setErrorMessage(msg);
      announceAssertive(msg);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 text-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 p-2 rounded-xl hover:bg-slate-200/60 min-h-[38px] transition-colors"
            aria-label="Return to document dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Return to Documents</span>
          </Link>
        </div>

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-sm space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            <Upload className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span>Document Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Upload Study Document
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Upload course notes, textbook chapters, or STEM diagrams. The system renders pages, detects and masks personal information, and structures diagrams into clear audio explanations.
          </p>
        </div>

        {/* Privacy Architecture Notice */}
        <div
          role="note"
          aria-label="Automated PII sanitization and privacy notice"
          className="rounded-2xl bg-white p-4 sm:p-5 text-sm text-slate-700 flex items-start gap-3.5 border border-slate-200 shadow-xs"
        >
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5 border border-blue-200">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <strong className="text-slate-900 font-bold block text-sm">Automated PII Redaction &amp; Data Isolation</strong>
            <p className="text-slate-600 text-xs leading-relaxed">
              Files are sanitized using Presidio and pattern detection before external vision analysis. Each account maintains isolated storage and multi-tenant access controls.
            </p>
          </div>
        </div>

        {/* Unauthenticated Alert Banner */}
        {!token && (
          <div
            role="note"
            className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
              <div>
                <strong className="font-bold block text-sm text-blue-950">Student Login Required</strong>
                <p className="text-xs text-blue-800">
                  Courseware uploads are securely tied to your student profile. Please log in or sign up before uploading.
                </p>
              </div>
            </div>
            <Link href="/login" className="self-end sm:self-center">
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                Log In
              </Button>
            </Link>
          </div>
        )}

        {/* Server Standby / Waking Notification */}
        {isServerWaking && (
          <div
            role="status"
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-xs"
          >
            <div className="h-4 w-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <strong className="font-bold block text-sm text-amber-950">Connecting to Cloud Backend...</strong>
              <p className="text-xs text-amber-800">The server was on standby and is waking up (takes ~30s on Render free tier). You can still select your document.</p>
            </div>
          </div>
        )}

        {/* Error Alert with Retry or Login Action */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-bold block text-sm text-rose-900">Upload Issue:</strong>
                <p className="text-xs text-rose-800">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {errorMessage.toLowerCase().includes('log in') || errorMessage.toLowerCase().includes('session') ? (
                <Link href="/login">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                    aria-label="Go to login page"
                  >
                    Log In Now
                  </Button>
                </Link>
              ) : file ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                  aria-label="Retry upload with the currently selected file"
                >
                  Retry Upload
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-100 cursor-pointer"
                aria-label="Dismiss error notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successDocId && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong className="font-bold block text-sm text-emerald-900">Upload Completed</strong>
              <p className="text-xs">Processing initialized. Launching document reader...</p>
            </div>
          </div>
        )}

        {/* Form & Dropzone Card */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white shadow-sm ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60 shadow-md ring-4 ring-blue-100'
                : 'border-slate-300 hover:border-blue-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="sr-only"
              aria-describedby="upload-instructions"
              disabled={isUploading}
            />

            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
                <Upload className="h-7 w-7" aria-hidden="true" />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="file-upload"
                  className="text-base sm:text-lg font-bold text-blue-600 hover:text-blue-700 cursor-pointer underline underline-offset-4 focus-within:ring-2 focus-within:ring-blue-600 rounded-md p-1"
                >
                  Choose a file
                </label>
                <span className="text-slate-600 text-sm"> or drag and drop it here</span>
              </div>

              <p id="upload-instructions" className="text-xs text-slate-500 font-medium">
                Supports PDF, JPG, and PNG documents up to 25 MB
              </p>

              {/* Supported Format Chips */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <FileText className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                  <span>PDF</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <FileImage className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                  <span>JPG</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <FileImage className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span>PNG</span>
                </span>
              </div>
            </div>
          </div>

          {/* Selected File Card */}
          {file && (
            <div
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4"
              aria-label="Selected file details"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <FileCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <strong className="text-slate-900 font-bold truncate block text-sm">
                    {file.name}
                  </strong>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatBytes(file.size)} • {file.type || 'Document'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={clearSelectedFile}
                disabled={isUploading}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Remove selected file"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Upload and Processing Progress Card */}
          {isUploading && (
            <div className="space-y-2 p-4 rounded-2xl bg-blue-50 border border-blue-200" aria-live="polite" role="status">
              <div className="flex justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Uploading {file?.name || 'document'} to cloud server...</span>
                </span>
                <span className="text-blue-700">Connecting...</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 animate-pulse rounded-full"
                  style={{ width: `100%` }}
                />
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4 p-5 rounded-2xl bg-blue-50 border-2 border-blue-300 shadow-xs" aria-live="polite" role="status">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="text-sm font-bold text-slate-900 block truncate">
                    {processingStatusText}
                  </strong>
                  {totalPages > 0 && (
                    <span className="text-xs font-semibold text-blue-700">
                      {pagesReady > 0 ? `Page ${pagesReady} of ${totalPages} ready` : `Total pages: ${totalPages}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                  style={{
                    width: totalPages > 0 ? `${Math.max(15, (pagesReady / totalPages) * 100)}%` : '25%',
                  }}
                />
              </div>

              {/* Early Access Button: Listen to Page 1 immediately once it is ready */}
              {pagesReady >= 1 && processingDocId && (
                <div className="pt-2 border-t border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-blue-800 font-medium">
                    Page 1 is ready! You do not have to wait for later pages.
                  </span>
                  <Link href={`/reader/${processingDocId}`}>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap shadow-xs"
                    >
                      Start Reading Page 1 Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard">
              <Button type="button" variant="outline" size="md" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Cancel
              </Button>
            </Link>
            {token ? (
              <Button
                type="submit"
                size="md"
                isLoading={isUploading}
                disabled={!file || isUploading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>Upload Document</span>
              </Button>
            ) : (
              <Link href="/login">
                <Button
                  type="button"
                  size="md"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>Log In to Upload Document</span>
                </Button>
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
