'use client';

import { useState } from 'react';
import LoadingOverlay from '@/components/admin/LoadingOverlay';
import { useAdminLogin } from '@/lib/hooks/useAdminLogin';
import { useAutoScrollToNotification } from '@/lib/hooks/useAutoScrollToNotification';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  } = useAdminLogin();

  useAutoScrollToNotification(error);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-showcase)] bg-showcase-grain p-4">
      <LoadingOverlay isLoading={loading} message="Authenticating credentials..." className="w-full max-w-md">
        <div className="bg-[var(--bg-surface)] p-8 rounded-2xl shadow-2xl border border-[var(--border-default)]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-primary)] mx-auto mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Velvet Crumb Bakery Admin</h1>
            <p className="text-sm text-[var(--text-muted)]">Sign in to access the shop control panel</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[var(--state-error)]/10 text-[var(--state-error)] border border-[var(--state-error)]/30 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] disabled:opacity-60"
                placeholder="admin@velvetcrumbdemo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full px-3 py-2 pr-10 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </button>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </LoadingOverlay>
    </main>
  );
}
