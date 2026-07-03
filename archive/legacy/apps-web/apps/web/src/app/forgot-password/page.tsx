'use client';

import { useState } from 'react';
import { authApi } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset password form state
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
      const result = await authApi.forgotPassword(email);
      setMessage(result.message);
      if (result.reset_token) {
        setResetToken(result.reset_token);
        setToken(result.reset_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
      const result = await authApi.resetPassword(token, newPassword);
      setResetMessage(result.message);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🔑</div>
          <h1 style={{ margin: '12px 0 4px', fontSize: 24, fontWeight: 700 }}>
            {showReset ? 'Reset Password' : 'Forgot Password'}
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {showReset
              ? 'Enter the reset token and your new password'
              : 'Enter your email to receive a reset token'}
          </p>
        </div>

        {!showReset ? (
          <>
            {error && <div style={styles.alert}><span>⚠️</span> {error}</div>}
            {message && <div style={styles.success}><span>✅</span> {message}</div>}

            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: 14 }}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  style={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Sending...' : 'Request Reset Token'}
              </button>
            </form>

            {resetToken && (
              <div style={{ marginTop: 16 }}>
                <div style={styles.tokenBox}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>
                    Reset Token (for development):
                  </p>
                  <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#667eea' }}>
                    {resetToken}
                  </code>
                </div>
                <button
                  onClick={() => setShowReset(true)}
                  style={{ ...styles.button, background: '#28a745', marginTop: 12 }}
                >
                  Use Token to Reset Password
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {resetError && <div style={styles.alert}><span>⚠️</span> {resetError}</div>}
            {resetMessage && (
              <div style={styles.success}>
                <span>✅</span> {resetMessage}
                <div style={{ marginTop: 8 }}>
                  <a href="/login" style={{ color: '#667eea', fontWeight: 600 }}>Go to Login</a>
                </div>
              </div>
            )}

            {!resetMessage && (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Reset Token</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    placeholder="Paste your reset token"
                    style={styles.input}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    style={styles.input}
                  />
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <button
              onClick={() => setShowReset(false)}
              style={{ ...styles.linkButton, marginTop: 12 }}
            >
              &larr; Back to forgot password
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          <a href="/login" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    zIndex: -1,
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: '32px 36px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    margin: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#444',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  linkButton: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: '#667eea',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  alert: {
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#c33',
    fontSize: 14,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  success: {
    background: '#e6f9ee',
    border: '1px solid #8fd4a6',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#1a8a4a',
    fontSize: 14,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    flexDirection: 'column' as const,
  },
  tokenBox: {
    background: '#f5f7fb',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
};
