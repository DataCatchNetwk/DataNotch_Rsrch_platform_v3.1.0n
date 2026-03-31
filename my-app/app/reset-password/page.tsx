'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, new_password: newPassword },
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={s.container}>
      <div style={s.bg} />
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <h1 style={{ margin: '12px 0 4px', fontSize: 24, fontWeight: 700 }}>Reset Password</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Enter your reset token and new password</p>
        </div>

        {error && (
          <div style={s.alert}><span>⚠️</span> {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Reset Token</label>
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Paste your reset token" style={s.input} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min 8 characters" style={s.input} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" style={s.input} />
          </div>
          <button type="submit" disabled={submitting} style={s.button}>
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

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
  alert: {
    background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px',
    color: '#c33', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
};
