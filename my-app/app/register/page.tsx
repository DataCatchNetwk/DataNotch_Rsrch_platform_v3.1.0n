'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstname: '', surname: '', email: '', country_code: '+1',
    mobile_number: '', password: '', date_of_birth: '', referral_code: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        ...form,
        referral_code: form.referral_code || undefined,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.bg} />
      <div style={pageStyles.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🏥</div>
          <h1 style={{ margin: '12px 0 4px', fontSize: 24, fontWeight: 700 }}>Create Account</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Join the Health Data Platform</p>
        </div>

        {error && (
          <div style={pageStyles.error}>
            <span>⚠️</span> {error}
            <button onClick={() => setError('')} style={pageStyles.errorClose}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="First Name" name="firstname" value={form.firstname} onChange={handleChange} required />
            <Field label="Surname" name="surname" value={form.surname} onChange={handleChange} required />
          </div>
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
            <Field label="Code" name="country_code" value={form.country_code} onChange={handleChange} required />
            <Field label="Mobile Number" name="mobile_number" value={form.mobile_number} onChange={handleChange} required placeholder="10-digit number" />
          </div>
          <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 8 characters" />
          <Field label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required />
          <Field label="Referral Code (optional)" name="referral_code" value={form.referral_code} onChange={handleChange} />

          <button type="submit" disabled={submitting} style={pageStyles.button}>
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' }}>
          Already have an account?{' '}
          <a href="/login/user" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, name, type = 'text', value, onChange, required, placeholder,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8,
          fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
        }}
      />
    </div>
  );
}

const pageStyles: Record<string, React.CSSProperties> = {
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
    maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: 20,
  },
  error: {
    background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px',
    color: '#c33', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  errorClose: {
    marginLeft: 'auto', background: 'none', border: 'none', color: '#c33', cursor: 'pointer', fontSize: 16,
  },
  button: {
    width: '100%', padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8,
  },
};
