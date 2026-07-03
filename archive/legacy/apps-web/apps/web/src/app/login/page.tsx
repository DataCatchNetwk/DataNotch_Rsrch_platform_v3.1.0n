'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!identifier.trim()) {
      errors.identifier = 'Email or phone number is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login({ identifier, password });
      router.push('/dashboard');
    } catch (err) {
      setPassword('');
    }
  };

  return (
    <div className={styles.container}>
      {/* Layer 1: Background Gradient */}
      <div className={styles.backgroundLayer}></div>

      {/* Layer 2: Animated Elements */}
      <div className={styles.animatedElements}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
      </div>

      {/* Layer 3: Content Container */}
      <div className={styles.contentWrapper}>
        {/* Layer 3a: Card Shadow/Elevation */}
        <div className={styles.cardShadow}></div>

        {/* Layer 3b: Main Card */}
        <div className={styles.card}>
          {/* Layer 4: Header Section */}
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>🏥</div>
              <h1 className={styles.title}>Health Data Platform</h1>
            </div>
            <p className={styles.subtitle}>Centralized Health Data Management System</p>
          </div>

          {/* Layer 5: Alert Section */}
          {error && (
            <div className={styles.alertContainer}>
              <div className={styles.alert}>
                <span className={styles.alertIcon}>⚠️</span>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>Login Failed</div>
                  <p className={styles.alertMessage}>{error}</p>
                </div>
                <button
                  className={styles.alertClose}
                  onClick={clearError}
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Layer 6: Form Section */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email/Phone Field */}
            <div className={styles.formGroup}>
              <label htmlFor="identifier" className={styles.label}>
                Email or Phone Number
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (validationErrors.identifier) {
                      setValidationErrors({ ...validationErrors, identifier: '' });
                    }
                  }}
                  placeholder="admin@healthplatform.local"
                  className={`${styles.input} ${validationErrors.identifier ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.identifier && (
                <p className={styles.errorText}>{validationErrors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <div className={styles.labelWrapper}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? '👁️‍🗨️ Hide' : '👁️ Show'}
                </button>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: '' });
                    }
                  }}
                  placeholder="Enter your password"
                  className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.password && (
                <p className={styles.errorText}>{validationErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={styles.optionsRow}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  disabled={isLoading}
                  defaultChecked={true}
                />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Logging in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className={styles.buttonArrow}>→</span>
                </>
              )}
            </button>
          </form>

          {/* Layer 7: Footer Section */}
          <div className={styles.footer}>
            <div className={styles.divider}></div>
            <p className={styles.footerText}>
              Demo Credentials: <strong>admin@healthplatform.local</strong> / <strong>Admin@12345</strong>
            </p>
            <p className={styles.footerText}>
              Don&apos;t have an account? <a href="/register" style={{ color: '#667eea', fontWeight: 600 }}>Register</a>
            </p>
          </div>
        </div>

        {/* Layer 8: Info Panel (Right Side) */}
        <div className={styles.infoPanel}>
          <div className={styles.infoPanelContent}>
            <h2>Welcome Back</h2>
            <p>Access your health data platform with secure authentication</p>
            
            <div className={styles.featureList}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span>Role-Based Access Control</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span>Secure JWT Authentication</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span>Audit Logging</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span>Data Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
