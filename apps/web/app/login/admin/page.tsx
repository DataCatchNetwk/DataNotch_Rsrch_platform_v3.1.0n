'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { evaluateConnectionSecurity, type ConnectionSecurityStatus } from '@/lib/connection-security';
import { getGoogleSsoStart, getMicrosoftSsoStart, getSsoConfigurationStatus, type SsoConfigurationStatus } from '@/lib/auth-service';

const TRUST_DEVICE_KEY = 'trust_device_preference';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState('');
  // Default to Admin tab selected since this is the admin login route
  const [isAdmin, setIsAdmin] = useState(true);
  const [connectionSecurity, setConnectionSecurity] = useState<ConnectionSecurityStatus>('insecure');
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [vpnMessage, setVpnMessage] = useState('');
  const [checkingNetwork, setCheckingNetwork] = useState(true);
  const [networkCheckPassed, setNetworkCheckPassed] = useState(false);
  const [ssoConfig, setSsoConfig] = useState<SsoConfigurationStatus | null>(null);
  const [checkingSsoConfig, setCheckingSsoConfig] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    router.replace(user.roles.includes('ADMIN') ? '/admin' : '/dashboard');
  }, [authLoading, router, user]);

  useEffect(() => {
    const refreshConnectionSecurity = () => {
      setConnectionSecurity(evaluateConnectionSecurity());
    };

    refreshConnectionSecurity();
    window.addEventListener('online', refreshConnectionSecurity);
    window.addEventListener('offline', refreshConnectionSecurity);

    const savedTrustPreference = window.localStorage.getItem(TRUST_DEVICE_KEY);
    if (savedTrustPreference === 'true') {
      setRememberMe(true);
    } else if (savedTrustPreference === 'false') {
      setRememberMe(false);
    }

    return () => {
      window.removeEventListener('online', refreshConnectionSecurity);
      window.removeEventListener('offline', refreshConnectionSecurity);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TRUST_DEVICE_KEY, String(rememberMe));
  }, [rememberMe]);

  useEffect(() => {
    let isMounted = true;

    const checkNetworkRisk = async () => {
      try {
        const response = await fetch('/api/v1/security/network-check', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = (await response.json()) as {
          blocked?: boolean;
          reason?: string;
          checked?: boolean;
        };

        if (!isMounted) return;

        if (data.blocked) {
          const message = data.reason || 'Access blocked: VPN/proxy/Tor network detected.';
          setVpnBlocked(true);
          setNetworkCheckPassed(false);
          setVpnMessage(message);
          setError(message);
        } else {
          setVpnBlocked(false);
          const passed = data.checked === true;
          setNetworkCheckPassed(passed);
          setVpnMessage(passed ? 'Network check passed.' : 'Network risk check unavailable.');
        }
      } catch {
        if (!isMounted) return;
        setVpnBlocked(false);
        setNetworkCheckPassed(false);
        setVpnMessage('Network risk check unavailable.');
      } finally {
        if (isMounted) setCheckingNetwork(false);
      }
    };

    void checkNetworkRisk();

    const intervalId = window.setInterval(() => {
      void checkNetworkRisk();
    }, 15000);

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible' || navigator.onLine) {
        void checkNetworkRisk();
      }
    };

    window.addEventListener('online', handleVisibilityOrOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrOnline);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleVisibilityOrOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
    };
  }, []);

  const networkAccessAllowed = !vpnBlocked && (networkCheckPassed || connectionSecurity === 'local-dev');

  useEffect(() => {
    let isMounted = true;

    const loadSsoConfiguration = async () => {
      try {
        const status = await getSsoConfigurationStatus();
        if (!isMounted) return;
        setSsoConfig(status);
      } catch {
        if (!isMounted) return;
        setSsoConfig({ googleConfigured: false, microsoftConfigured: false });
      } finally {
        if (isMounted) setCheckingSsoConfig(false);
      }
    };

    void loadSsoConfiguration();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (checkingNetwork) {
      setError('Checking network security. Please wait a moment and try again.');
      return;
    }

    if (vpnBlocked) {
      setError(vpnMessage || 'Access blocked: VPN/proxy/Tor network detected.');
      return;
    }

    if (!networkAccessAllowed) {
      setError('Network verification is currently unavailable. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const authenticatedUser = await login(email, password, rememberMe);
      if (isAdmin && !authenticatedUser.roles.includes('ADMIN')) {
        setError('This account does not have admin access.');
        setPassword('');
        setLoading(false);
        return;
      }
      router.push(authenticatedUser.roles.includes('ADMIN') || isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'An error occurred');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || ssoLoading) return;
    setError('');

    if (checkingNetwork) {
      setError('Checking network security. Please wait a moment and try again.');
      return;
    }

    if (vpnBlocked) {
      setError(vpnMessage || 'Access blocked: VPN/proxy/Tor network detected.');
      return;
    }

    if (!networkAccessAllowed) {
      setError('Network verification is currently unavailable. Please try again.');
      return;
    }

    setSsoLoading('google');

    try {
      const { url } = await getGoogleSsoStart();
      if (!url) throw new Error('Google sign-in is currently unavailable.');
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setSsoLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    if (loading || ssoLoading) return;
    setError('');

    if (checkingNetwork) {
      setError('Checking network security. Please wait a moment and try again.');
      return;
    }

    if (vpnBlocked) {
      setError(vpnMessage || 'Access blocked: VPN/proxy/Tor network detected.');
      return;
    }

    if (!networkAccessAllowed) {
      setError('Network verification is currently unavailable. Please try again.');
      return;
    }

    setSsoLoading('microsoft');

    try {
      const { url } = await getMicrosoftSsoStart();
      if (!url) throw new Error('Microsoft sign-in is currently unavailable.');
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microsoft sign-in failed.');
      setSsoLoading(null);
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

          {/* Researcher / Admin selector — Admin pre-selected on this route */}
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
                placeholder={isAdmin ? 'admin@datanotchplatform.org' : 'jerrywonder@yahoo.co.uk'}
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

            <div className={`flex items-center gap-1 text-sm ${connectionSecurity === 'secure' ? 'text-green-600' : connectionSecurity === 'local-dev' ? 'text-amber-600' : 'text-red-600'}`}>
              <Check className="h-4 w-4" />
              {connectionSecurity === 'secure'
                ? 'Secure connection verified'
                : connectionSecurity === 'local-dev'
                  ? 'Secure connection verified'
                  : 'Connection is not secure (HTTPS required)'}
            </div>

            <div className={`text-sm ${vpnBlocked ? 'text-red-600' : networkCheckPassed ? 'text-green-700' : 'text-amber-700'}`}>
              {checkingNetwork ? 'Checking for VPN/proxy network risk...' : vpnMessage}
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

            <Button type="submit" disabled={loading || checkingNetwork || !networkAccessAllowed} className="h-12 w-full rounded-lg text-base">
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
              onClick={handleGoogleSignIn}
              disabled={loading || !!ssoLoading || checkingNetwork || checkingSsoConfig || !networkAccessAllowed}
              title="Sign in with Google"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-sm font-medium">{ssoLoading === 'google' ? 'Connecting...' : 'Google'}</span>
            </button>
            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={loading || !!ssoLoading || checkingNetwork || checkingSsoConfig || !networkAccessAllowed}
              title="Sign in with Microsoft Outlook"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M1.6 2A1.6 1.6 0 0 0 0 3.6v16.8A1.6 1.6 0 0 0 1.6 22H10V2H1.6z" fill="#0A2767"/><circle cx="5.5" cy="12" r="3.5" fill="none" stroke="white" strokeWidth="1.5"/><path d="M10 5h12.4A1.6 1.6 0 0 1 24 6.6v10.8A1.6 1.6 0 0 1 22.4 19H10V5z" fill="#0078D4"/><path d="M10 5.5l7 5.3 7-5.3" fill="none" stroke="white" strokeWidth="1.2"/></svg>
              <span className="text-sm font-medium">{ssoLoading === 'microsoft' ? 'Connecting...' : 'Microsoft Outlook'}</span>
            </button>
          </div>

          <div className="mt-8 space-y-2 text-center text-sm">
            <div>
              Need researcher access?{' '}
              <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-700">
                Researcher Create Account here →
              </Link>
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
              <Link href="/support" className="font-medium text-purple-600 hover:text-purple-700">
                Contact support
              </Link>
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
