'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { apiFetch, ApiError } from '@/lib/api';

type RegisterAdminResponse = {
  message: string;
  user: {
    id: string;
    firstname: string;
    surname: string;
    email: string;
    roles: string[];
  };
};

function RegistrationsContent() {
  const [form, setForm] = useState({
    firstname: '',
    surname: '',
    email: '',
    country_code: '+1',
    mobile_number: '',
    password: '',
    date_of_birth: '',
    referral_code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token') ?? undefined;
      if (!token) {
        throw new Error('You must be logged in as admin to create admin accounts.');
      }

      const res = await apiFetch<RegisterAdminResponse>('/auth/register-admin', {
        method: 'POST',
        token,
        body: {
          ...form,
          referral_code: form.referral_code || undefined,
        },
      });

      setSuccess(`${res.user.email} has been registered as ADMIN.`);
      setForm({
        firstname: '',
        surname: '',
        email: '',
        country_code: '+1',
        mobile_number: '',
        password: '',
        date_of_birth: '',
        referral_code: '',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to register admin account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <header style={{
        background: 'white', borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', maxWidth: 1400, margin: '0 auto' }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Registration Requests</h1>
        </div>
      </header>
      <main style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ fontSize: 14, fontWeight: 500, color: '#667eea', textDecoration: 'none' }}>
            &larr; Back to Admin
          </Link>
        </div>
        <div style={{
          background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, maxWidth: 760,
        }}>
          <h2 style={{ margin: '0 0 8px', color: '#1a1a1a' }}>Create Admin Account</h2>
          <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
            Register a new administrator. This user will immediately have ADMIN access.
          </p>

          {error && <div style={{ marginBottom: 12, color: '#b00020', fontSize: 14 }}>{error}</div>}
          {success && <div style={{ marginBottom: 12, color: '#1e7e34', fontSize: 14 }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="First Name" name="firstname" value={form.firstname} onChange={onChange} required />
              <Field label="Surname" name="surname" value={form.surname} onChange={onChange} required />
            </div>
            <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
              <Field label="Code" name="country_code" value={form.country_code} onChange={onChange} required />
              <Field label="Mobile Number" name="mobile_number" value={form.mobile_number} onChange={onChange} required placeholder="10-digit number" />
            </div>
            <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
            <Field label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={onChange} required />
            <Field label="Referral Code (optional)" name="referral_code" value={form.referral_code} onChange={onChange} />

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 8,
                border: 'none',
                borderRadius: 10,
                padding: '12px 18px',
                color: '#fff',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Creating admin...' : 'Create Admin'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #ddd',
          borderRadius: 8,
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <RegistrationsContent />
    </ProtectedRoute>
  );
}
