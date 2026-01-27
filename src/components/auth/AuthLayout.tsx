// src/components/auth/AuthLayout.tsx
// Shared layout for authentication pages

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../ui/Logo';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBackLink?: boolean;
}

export default function AuthLayout({ children, title, subtitle, showBackLink = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Back link */}
        {showBackLink && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to home</span>
          </Link>
        )}

        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showTagline />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-50 mb-1">{title}</h2>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
          )}
        </div>

        {/* Auth card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
