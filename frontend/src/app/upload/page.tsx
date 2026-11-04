'use client';

import React, { useState, useRef, useSyncExternalStore } from 'react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successDocId, setSuccessDocId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      const msg = 'Please choose a document to upload first.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    if (!token) {
      announceAssertive('Your session has expired. Please sign in again.');
      router.push('/login');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(20);
    announcePolite('Starting secure file upload and sanitization...');

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 300);

      const res = await api.uploadDocument(file, token);

      clearInterval(progressTimer);
      setUploadProgress(100);
      setSuccessDocId(String(res.id));

      announcePolite(
        `Upload complete for ${res.filename}. Document status is ${res.status}. Loading document reader...`
      );

      setTimeout(() => {
        router.push(`/reader/${res.id}`);
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('401')) {
        announceAssertive('Your authentication token has expired. Please log in.');
        router.push('/login');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
      announceAssertive(msg);
    } finally {
      setIsUploading(false);
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

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong className="font-bold block text-sm text-rose-900">Upload Issue:</strong>
              <p className="text-xs">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="p-1 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-100"
              aria-label="Dismiss error notification"
            >
              <X className="h-4 w-4" />
            </button>
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

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Sanitizing &amp; uploading document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard">
              <Button type="button" variant="outline" size="md" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Cancel
              </Button>
            </Link>
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
          </div>
        </form>
      </div>
    </div>
  );
}
