'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, FileText, FlaskConical, KeyRound, BadgeCheck, Activity, Globe } from 'lucide-react';

export default function UserLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!identifier.trim()) errors.identifier = 'Email or phone number is required';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      if (!rememberMe) {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          localStorage.removeItem('auth_token');
          sessionStorage.setItem('auth_token', storedToken);
        }
      }
      if (user.roles.includes('ADMIN')) {
        router.push('/admin');
      } else if (user.roles.includes('PENDING') && !user.roles.includes('ANALYST')) {
        router.push('/dashboard/pending');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-linear-to-r from-blue-600 via-violet-600 to-fuchsia-400 px-4 py-4 md:px-8 md:py-4">
      <div className="mx-auto grid h-full w-full max-w-7xl items-center gap-5 lg:grid-cols-[440px_1fr] xl:grid-cols-[460px_1fr]">
        <section className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[26px] border border-white/70 bg-[#f5f4fb]/95 px-4 py-4 shadow-[0_25px_70px_rgba(36,20,99,0.33)] backdrop-blur md:px-5 md:py-5">
          <div className="mb-2.5 text-center">
            <span className="inline-flex rounded-full bg-violet-100 px-4 py-1 text-[13px] font-semibold text-violet-700">Researcher Access</span>
            <h1 className="mt-2.5 flex items-center justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#101828] md:text-[38px]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100/80 text-xl motion-safe:animate-[hospitalFloat_2.2s_ease-in-out_infinite]">🏥</span>
              <span>Health Data Platform</span>
            </h1>
            <p className="mt-1.5 text-xs font-medium text-slate-500">Centralized health data management for secure research access.</p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-center">Encrypted</span>
              <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-center">Audit Ready</span>
              <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-center">Role Based</span>
            </div>

            <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-white/90 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Access Preview</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg bg-slate-50 px-1.5 py-1">
                  <p className="text-[9px] text-slate-500">Studies</p>
                  <p className="text-xs font-semibold text-slate-700">12</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-1.5 py-1">
                  <p className="text-[9px] text-slate-500">Datasets</p>
                  <p className="text-xs font-semibold text-slate-700">48</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-1.5 py-1">
                  <p className="text-[9px] text-slate-500">Alerts</p>
                  <p className="text-xs font-semibold text-slate-700">3</p>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="identifier" className="mb-1 block text-xs font-semibold text-slate-800">Email or Phone Number</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="h-4 w-4" /></span>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (validationErrors.identifier) setValidationErrors({ ...validationErrors, identifier: '' });
                  }}
                  placeholder="jerrywonder@yahoo.co.uk"
                  className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none ring-violet-400 transition focus:ring-2"
                  disabled={submitting}
                />
              </div>
              {validationErrors.identifier && <p className="mt-1 text-xs font-medium text-rose-600">{validationErrors.identifier}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-800">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="h-4 w-4" /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                  }}
                  placeholder="Enter your password"
                  className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm font-medium text-slate-700 outline-none ring-violet-400 transition focus:ring-2"
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && <p className="mt-1 text-xs font-medium text-rose-600">{validationErrors.password}</p>}
            </div>

            <p className="text-xs font-semibold text-emerald-600">Secure connection verified</p>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Trust this device
              </label>
              <Link href="/forgot-password" className="font-semibold text-violet-600 hover:text-violet-700">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-9.5 w-full rounded-xl bg-linear-to-r from-blue-500 to-violet-600 text-sm font-bold text-white shadow-[0_10px_24px_rgba(88,71,208,0.35)] transition hover:brightness-105 disabled:opacity-60"
            >
              {submitting ? 'Logging in...' : 'Access Dashboard →'}
            </button>
          </form>

          <div className="my-3 border-t border-slate-200" />
          <p className="mb-2 text-center text-[10px] font-semibold tracking-wide text-slate-400">OR CONTINUE WITH</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <button type="button" className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M1.6 2A1.6 1.6 0 0 0 0 3.6v16.8A1.6 1.6 0 0 0 1.6 22H10V2H1.6z" fill="#0A2767"/><circle cx="5.5" cy="12" r="3.5" fill="none" stroke="white" strokeWidth="1.5"/><path d="M10 5h12.4A1.6 1.6 0 0 1 24 6.6v10.8A1.6 1.6 0 0 1 22.4 19H10V5z" fill="#0078D4"/><path d="M10 5.5l7 5.3 7-5.3" fill="none" stroke="white" strokeWidth="1.2"/></svg>
              Continue with Microsoft Outlook
            </button>
          </div>

          <div className="mt-3 text-center text-xs text-slate-600">
            Don&apos;t have an account? <Link href="/register" className="font-semibold text-violet-600">Register</Link>
          </div>
          <div className="mt-1.5 text-center">
            <Link href="/login/admin" className="inline-flex rounded-xl border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50">
              🔐 Switch to Admin Portal →
            </Link>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-2.5 text-center text-[11px] text-slate-500">
            <div className="flex flex-wrap justify-center gap-2.5">
              <span>🟢 Secure session</span>
              <span>🟢 Encrypted transmission</span>
              <span>🟢 Activity monitored</span>
            </div>
            <p className="mt-1.5">Need help? <a className="font-semibold text-violet-600" href="mailto:support@healthplatform.local">Contact support</a></p>
          </div>
        </section>

        <section className="hidden max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[30px] border border-white/15 bg-white/14 p-5 text-white shadow-[0_20px_60px_rgba(44,18,88,0.28)] backdrop-blur-[2px] lg:block">
          <span className="inline-flex rounded-full bg-white/18 px-3 py-0.5 text-xs font-semibold text-white/90">Trusted Access</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight xl:text-4xl">Welcome Back</h2>
          <p className="mt-1.5 text-base text-white/85">Access your health data workspace with secure authentication and governed permissions.</p>

          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm text-white/95">
            <div className="flex items-center gap-2"><KeyRound className="h-4 w-4" /><span>Role-Based Access Control</span></div>
            <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" /><span>Secure JWT Authentication</span></div>
            <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>Audit Logging</span></div>
            <div className="flex items-center gap-2"><Lock className="h-4 w-4" /><span>Data Encryption</span></div>
            <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /><span>Research-Grade Data Security</span></div>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /><span>Centralized Access Management</span></div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/20 bg-white/12 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">Workspace Preview</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/20 px-2 py-1.5 text-center">
                <p className="text-[10px] text-white/75">Studies</p>
                <p className="text-sm font-semibold">12</p>
              </div>
              <div className="rounded-lg bg-white/20 px-2 py-1.5 text-center">
                <p className="text-[10px] text-white/75">Datasets</p>
                <p className="text-sm font-semibold">48</p>
              </div>
              <div className="rounded-lg bg-white/20 px-2 py-1.5 text-center">
                <p className="text-[10px] text-white/75">Alerts</p>
                <p className="text-sm font-semibold">3</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes hospitalFloat {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          25% {
            transform: translateY(-3px) rotate(-3deg) scale(1.02);
          }
          50% {
            transform: translateY(-5px) rotate(0deg) scale(1.05);
          }
          75% {
            transform: translateY(-2px) rotate(3deg) scale(1.02);
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
