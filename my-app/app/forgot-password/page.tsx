'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetToken(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ message: string; reset_token?: string }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setMessage(result.message);
      if (result.reset_token) {
        setResetToken(result.reset_token);
        setToken(result.reset_token);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ message: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: { token, new_password: newPassword },
      });
      setResetMessage(result.message);
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.bg} />
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🔑</div>
          <h1 style={{ margin: '12px 0 4px', fontSize: 24, fontWeight: 700 }}>
            {showReset ? 'Reset Password' : 'Forgot Password'}
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {showReset ? 'Enter the reset token and your new password' : 'Enter your email to receive a reset token'}
          </p>
        </div>

        {!showReset ? (
          <>
            {error && <div style={s.alert}><span>⚠️</span> {error}</div>}
            {message && <div style={s.success}><span>✅</span> {message}</div>}

            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" style={s.input} />
              </div>
              <button type="submit" disabled={loading} style={s.button}>
                {loading ? 'Sending...' : 'Request Reset Token'}
              </button>
            </form>

            {resetToken && (
              <div style={{ marginTop: 16 }}>
                <div style={s.tokenBox}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>Reset Token (for development):</p>
                  <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#667eea' }}>{resetToken}</code>
                </div>
                <button onClick={() => setShowReset(true)} style={{ ...s.button, background: '#28a745', marginTop: 12 }}>
                  Use Token to Reset Password
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {resetError && <div style={s.alert}><span>⚠️</span> {resetError}</div>}
            {resetMessage && (
              <div style={s.success}>
                <span>✅</span> {resetMessage}
                <div style={{ marginTop: 8 }}>
                  <a href="/" style={{ color: '#667eea', fontWeight: 600 }}>Go to Login</a>
                </div>
              </div>
            )}

            {!resetMessage && (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Reset Token</label>
                  <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Paste your reset token" style={s.input} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min 8 characters" style={s.input} />
                </div>
                <button type="submit" disabled={loading} style={s.button}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <button onClick={() => setShowReset(false)} style={{ ...s.linkButton, marginTop: 12 }}>
              &larr; Back to forgot password
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          <a href="/" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Back to Login</a>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', zIndex: -1,
  },
  card: {
    background: 'white', borderRadius: 16, padding: '32px 36px', width: '100%',
    maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: 20,
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 4,
  },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%', padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
  },
  linkButton: {
    background: 'none', border: 'none', color: '#667eea', cursor: 'pointer',
    fontSize: 14, fontWeight: 500, padding: 0, display: 'block', width: '100%', textAlign: 'center' as const,
  },
  alert: {
    background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px',
    color: '#c33', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  success: {
    background: '#efe', border: '1px solid #cfc', borderRadius: 8, padding: '10px 14px',
    color: '#363', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  tokenBox: {
    background: '#f5f7fb', border: '1px solid #e0e0e0', borderRadius: 8, padding: '12px 14px',
  },
};
