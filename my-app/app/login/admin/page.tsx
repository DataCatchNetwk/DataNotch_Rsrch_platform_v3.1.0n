'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import styles from '../page.module.css';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!identifier.trim()) errors.identifier = 'Admin email is required';
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
      if (!user.roles.includes('ADMIN')) {
        setError('This login is for administrators only');
        return;
      }
      router.push('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundLayer}></div>
      <div className={styles.animatedElements}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.cardShadow}></div>

        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>🛡️</div>
              <h1 className={styles.title}>Admin Portal</h1>
            </div>
            <p className={styles.subtitle}>Administrator Access Only</p>
          </div>

          {error && (
            <div className={styles.alertContainer}>
              <div className={styles.alert}>
                <span className={styles.alertIcon}>⚠️</span>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>Login Failed</div>
                  <p className={styles.alertMessage}>{error}</p>
                </div>
                <button className={styles.alertClose} onClick={() => setError('')} type="button">✕</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier" className={styles.label}>Admin Email</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); if (validationErrors.identifier) setValidationErrors({ ...validationErrors, identifier: '' }); }}
                  placeholder="admin@healthplatform.local"
                  className={`${styles.input} ${validationErrors.identifier ? styles.inputError : ''}`}
                  disabled={submitting}
                />
              </div>
              {validationErrors.identifier && <p className={styles.errorText}>{validationErrors.identifier}</p>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelWrapper}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)} disabled={submitting}>
                  {showPassword ? '👁️‍🗨️ Hide' : '👁️ Show'}
                </button>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' }); }}
                  placeholder="Enter your password"
                  className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
                  disabled={submitting}
                />
              </div>
              {validationErrors.password && <p className={styles.errorText}>{validationErrors.password}</p>}
            </div>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? (
                <><span className={styles.spinner}></span> Logging in...</>
              ) : (
                <><span>Sign In as Admin</span><span className={styles.buttonArrow}>→</span></>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <div className={styles.divider}></div>
            <p className={styles.footerText}>
              <a href="/login/user" style={{ color: '#667eea', fontWeight: 600 }}>User Login</a>
            </p>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.infoPanelContent}>
            <h2>Admin Access</h2>
            <p>Manage users, approve registrations, and control platform access</p>
            <div className={styles.featureList}>
              <div className={styles.feature}><span className={styles.featureIcon}>✓</span><span>User Registration Approval</span></div>
              <div className={styles.feature}><span className={styles.featureIcon}>✓</span><span>Access Governance</span></div>
              <div className={styles.feature}><span className={styles.featureIcon}>✓</span><span>Role Management</span></div>
              <div className={styles.feature}><span className={styles.featureIcon}>✓</span><span>Audit Trail</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
