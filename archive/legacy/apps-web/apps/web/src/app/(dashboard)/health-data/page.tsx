'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { tokenStorage } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface HealthDataRecord {
  id: string;
  title: string;
  dataYear: number;
  value: string | null;
  notes: string | null;
  processedStatus: string;
  createdAt: string;
  domain?: { name: string } | null;
  subDomain?: { name: string } | null;
  category?: { name: string } | null;
  healthOutcome?: { name: string } | null;
  variable?: { name: string } | null;
  demographic?: { name: string } | null;
  geographyUnit?: { name: string } | null;
  dataUnit?: { name: string } | null;
  dataSource?: { name: string } | null;
}

export default function HealthDataPage() {
  const [records, setRecords] = useState<HealthDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = tokenStorage.getToken();
      const res = await fetch(`${API_BASE_URL}/health-data`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const years = [...new Set(records.map((r) => r.dataYear))].sort((a, b) => b - a);
  const domains = [...new Set(records.map((r) => r.domain?.name).filter(Boolean))].sort();

  const filtered = records.filter((r) => {
    if (yearFilter && r.dataYear !== Number(yearFilter)) return false;
    if (domainFilter && r.domain?.name !== domainFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.domain?.name?.toLowerCase().includes(q) ||
        r.category?.name?.toLowerCase().includes(q) ||
        r.healthOutcome?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>Health Data</h1>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
            background: 'white',
            padding: 16,
            borderRadius: 12,
            border: '1px solid #e0e0e0',
          }}
        >
          <input
            type="text"
            placeholder="Search by title, domain, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
          />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: 'white' }}
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: 'white' }}
          >
            <option value="">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d!}>{d}</option>
            ))}
          </select>
          {(search || yearFilter || domainFilter) && (
            <button
              onClick={() => { setSearch(''); setYearFilter(''); setDomainFilter(''); }}
              style={{
                padding: '10px 16px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
            Loading health data...
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: 12,
              padding: 20,
              color: '#c33',
              marginBottom: 20,
            }}
          >
            <strong>Error:</strong> {error}
            <button onClick={fetchData} style={{ marginLeft: 12, cursor: 'pointer', color: '#667eea', background: 'none', border: 'none', textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e0e0e0',
              color: '#888',
            }}
          >
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>📭</p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>No health data records found</p>
            <p style={{ fontSize: 13 }}>
              {search || yearFilter || domainFilter
                ? 'Try adjusting your filters'
                : 'Seed the database or create records via the API to see data here'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e0e0e0',
              overflow: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0', background: '#fafafa' }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>Domain</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Health Outcome</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{r.title}</span>
                    </td>
                    <td style={tdStyle}>{r.dataYear}</td>
                    <td style={tdStyle}>{r.domain?.name || '—'}</td>
                    <td style={tdStyle}>{r.category?.name || '—'}</td>
                    <td style={tdStyle}>{r.healthOutcome?.name || '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{r.value ?? '—'}</td>
                    <td style={tdStyle}>{r.dataUnit?.name || '—'}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: statusColor(r.processedStatus).bg,
                          color: statusColor(r.processedStatus).text,
                        }}
                      >
                        {r.processedStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontWeight: 600,
  color: '#555',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: '#333',
  whiteSpace: 'nowrap',
};

function statusColor(status: string) {
  switch (status) {
    case 'PROCESSED':
      return { bg: '#e6f9ee', text: '#1a8a4a' };
    case 'FAILED':
      return { bg: '#fee', text: '#c33' };
    default:
      return { bg: '#fff3e0', text: '#e65100' };
  }
}
