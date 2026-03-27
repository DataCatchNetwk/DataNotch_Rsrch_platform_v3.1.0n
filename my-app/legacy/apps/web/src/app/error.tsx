'use client';

import React from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>
          ⚠️
        </div>

        <h1 style={{ fontSize: '28px', margin: '0 0 12px 0', textAlign: 'center' }}>
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: '14px',
            opacity: 0.9,
            margin: '16px 0',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '16px',
              fontSize: '12px',
              fontFamily: 'Monaco, monospace',
              lineHeight: '1.4',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <strong>Error ID:</strong> {error.digest}
          </div>
        )}

        <button
          onClick={reset}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            target.style.transform = 'scale(1.02)';
            target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            target.style.transform = 'scale(1)';
            target.style.boxShadow = 'none';
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
