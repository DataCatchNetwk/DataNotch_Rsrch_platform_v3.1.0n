'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    router.replace(user.roles.includes('ADMIN') ? '/admin' : '/dashboard');
  }, [authLoading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authenticatedUser = await login(email, password);
      router.push(authenticatedUser.roles.includes('ADMIN') || isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'An error occurred');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-linear-to-br from-blue-600 via-purple-600 to-pink-500 p-2">
      <div className="mx-auto grid h-[calc(100dvh-1rem)] w-full max-w-6xl grid-cols-1 items-stretch gap-3 lg:grid-cols-2 lg:gap-4">
        <div className="h-full overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl md:p-5">
          <div className="mb-8">
            <div className="mb-2 text-center text-sm font-semibold text-purple-600">Researcher Access</div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-900 md:text-4xl">
              <span className="mr-2 inline-block text-2xl">🏥</span>
              Health Data Platform
            </h1>
            <p className="mx-auto max-w-md text-center text-sm text-gray-600">
              Centralized health data management for secure research access.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-center text-xs font-medium text-gray-700">
              Encrypted
            </span>
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-center text-xs font-medium text-gray-700">
              Audit Ready
            </span>
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-center text-xs font-medium text-gray-700">
              Role Based
            </span>
          </div>

          <div className="mb-6 flex rounded-lg border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition ${
                !isAdmin ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Researcher
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition ${
                isAdmin ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900">
                Email or Phone Number
              </label>
              <input
                id="email"
                type="text"
                placeholder="admin@healthplatform.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-900">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Secure connection verified
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-900">Trust this device</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-lg text-base">
              {loading ? 'Signing in...' : isAdmin ? 'Admin Access' : 'Access Dashboard'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 font-medium text-gray-500">OR CONTINUE WITH</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <span>🌐</span>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              type="button"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <span>⊞</span>
              <span className="text-sm font-medium">Microsoft</span>
            </button>
          </div>

          <div className="mt-8 space-y-2 text-center text-sm">
            <div>
              New to the platform?{' '}
              <button
                type="button"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                Request Access
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" /> Secure session
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" /> Encrypted transmission
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" /> Activity monitored
              </div>
            </div>
            <div className="mt-3 text-center text-xs text-gray-600">
              Need help?{' '}
              <a href="mailto:support@healthplatform.local" className="font-medium text-purple-600 hover:text-purple-700">
                Contact support
              </a>
            </div>
          </div>
        </div>

        <div className="hidden h-full overflow-y-auto rounded-3xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-sm lg:flex lg:flex-col lg:justify-center md:p-5">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/85 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-white"></span>
            <span className="text-sm font-semibold text-slate-900">Trusted Access</span>
          </div>

          <h2 className="mb-2 text-3xl font-bold md:text-4xl">Welcome Back</h2>
          <p className="mb-5 text-base leading-relaxed text-white/90">
            Access your health data workspace with secure authentication and governed permissions.
          </p>

          <div className="space-y-3">
            {[
              ['👤', 'Role-Based Access Control', 'Fine-grained permissions based on your role'],
              ['🔐', 'Secure JWT Authentication', 'Industry-standard token-based authentication'],
              ['📋', 'Audit Logging', 'Complete activity logs for compliance'],
              ['🔬', 'Research-Grade Data Security', 'HIPAA and compliance-ready encryption'],
              ['🔒', 'Data Encryption', 'End-to-end encryption for all data'],
              ['⚙️', 'Centralized Access Management', 'Single control point for all user access'],
            ].map(([icon, title, text]) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <span>{icon}</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-sm text-white/80">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
