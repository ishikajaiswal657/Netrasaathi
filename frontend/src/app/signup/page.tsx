'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { announcePolite, announceAssertive } = useAnnounce();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      const msg = 'Please enter a valid email address.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please retype carefully.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    setIsLoading(true);
    announcePolite('Creating your account, please wait...');

    try {
      const res = await api.signup(email.trim(), password);
      const successText = res.message || 'Account created successfully! Redirecting to sign in...';
      setSuccessMessage(successText);
      announcePolite(successText);

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(msg);
      announceAssertive(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-mesh-pattern min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 relative">
      <div className="max-w-md w-full bg-white border border-slate-200/90 shadow-md p-8 sm:p-10 rounded-3xl relative z-10 space-y-6">
        <div className="text-center flex flex-col items-center">
          <Logo size="lg" showSubtitle={false} className="justify-center mb-3" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Register to upload documents and access audio lessons
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Email address <span className="text-blue-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Password (min. 8 characters) <span className="text-blue-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                className="block w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none min-h-[40px] min-w-[40px] justify-center cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password as plain text'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Confirm password <span className="text-blue-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="signup-confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            aria-label="Create new account"
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs sm:text-sm text-slate-500">
          Already registered?{' '}
          <Link
            href="/login"
            className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
