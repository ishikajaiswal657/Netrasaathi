'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setToken, setCurrentUser } from '@/lib/auth';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Eye, EyeOff, Lock, Mail, AlertCircle, User, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { announcePolite, announceAssertive } = useAnnounce();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter both your email and password.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    setIsLoading(true);
    announcePolite('Signing in, please wait...');

    try {
      const res = await api.login(email.trim(), password);
      setToken(res.access_token);
      setCurrentUser(res.user);
      announcePolite(`Welcome, ${res.user.email}! Signed in successfully.`);

      if (res.user.role === 'admin') {
        router.push('/admin/audit-logs');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      announceAssertive(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setEmail('student@netrasaathi.edu');
      setPassword('StudySecure123!');
      announcePolite('Filled student demo credentials.');
    } else {
      setEmail('admin@netrasaathi.edu');
      setPassword('AdminSecure123!');
      announcePolite('Filled administrator demo credentials.');
    }
  };

  return (
    <div className="bg-mesh-pattern min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 relative">
      <div className="max-w-md w-full bg-white border border-slate-200/90 shadow-md p-8 sm:p-10 rounded-3xl relative z-10 space-y-6">
        <div className="text-center flex flex-col items-center">
          <Logo size="lg" showSubtitle={false} className="justify-center mb-3" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Sign in to access your study documents and audio explanations
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email-address"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Email address <span className="text-blue-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@netrasaathi.edu"
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Password <span className="text-blue-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            aria-label="Sign in to account"
          >
            Sign In
          </Button>
        </form>

        {/* Demo Fast-Fill Helper */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">
            Quick Demo Accounts:
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => fillQuickDemo('student')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-blue-300 flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] transition-all shadow-xs"
            >
              <User className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-purple-50 text-purple-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-purple-300 flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] transition-all shadow-xs"
            >
              <Shield className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
