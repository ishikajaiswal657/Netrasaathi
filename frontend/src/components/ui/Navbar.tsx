'use client';

import React, { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, subscribeAuth, getToken } from '@/lib/auth';
import { User } from '@/lib/types';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { Logo } from '@/components/ui/Logo';
import { Files, UploadCloud, ShieldCheck, LogOut, LogIn, UserCheck } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { announcePolite } = useAnnounce();

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

  const handleLogout = () => {
    clearSession();
    announcePolite('You have logged out successfully.');
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Documents', icon: Files },
    { href: '/upload', label: 'Upload', icon: UploadCloud },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200/80 shadow-xs transition-all">
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold z-50 shadow-lg ring-2 ring-blue-400"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Platform Name */}
          <Link
            href={authed ? '/dashboard' : '/'}
            className="flex items-center rounded-2xl p-1 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-transform hover:opacity-95"
            aria-label="Netrasaathi - Accessible AI Study Assistant Home"
          >
            <Logo size="md" showSubtitle={true} />
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="flex items-center gap-2 sm:gap-4">
            {authed && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[38px] ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Profile & Auth Controls */}
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
              {authed && user ? (
                <div className="flex items-center gap-2.5">
                  <div
                    className="hidden md:inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium shadow-xs"
                    title={`Authenticated as ${user.email} (${user.role})`}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" aria-hidden="true" />
                    <span className="max-w-[130px] truncate text-xs text-slate-700 font-semibold">{user.email}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl min-h-[38px] transition-all cursor-pointer border border-transparent hover:border-rose-200"
                    aria-label="Log out of account"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Log out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl min-h-[38px] transition-all"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    <span>Log in</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl min-h-[38px] shadow-xs transition-all"
                  >
                    <span>Sign up</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
