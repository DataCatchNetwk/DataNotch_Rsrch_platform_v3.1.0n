'use client';

import { useMemo, useState, type CSSProperties } from 'react';

type Dataset = {
  id: string;
  title: string;
  format: 'CSV' | 'XLSX' | 'JSON';
  rows: number;
  status: 'Queued' | 'Profiled' | 'Validated' | 'Failed';
  updated: string;
};

const datasets: Dataset[] = [
  { id: '1', title: 'Diabetes Cohort Pilot', format: 'CSV', rows: 4210, status: 'Profiled', updated: '2026-03-26' },
  { id: '2', title: 'Activity and Lifestyle Signals', format: 'XLSX', rows: 1098, status: 'Queued', updated: '2026-03-27' },
  { id: '3', title: 'Clinical Metadata Registry', format: 'JSON', rows: 902, status: 'Validated', updated: '2026-03-25' },
  { id: '4', title: 'Cardio Outcomes Study Batch A', format: 'CSV', rows: 6580, status: 'Validated', updated: '2026-03-20' },
  { id: '5', title: 'Hospital Admissions by Region', format: 'XLSX', rows: 2234, status: 'Profiled', updated: '2026-03-24' },
  { id: '6', title: 'Vaccination Follow-up Wave 3', format: 'CSV', rows: 3902, status: 'Failed', updated: '2026-03-19' },
  { id: '7', title: 'Laboratory Normalization Table', format: 'JSON', rows: 477, status: 'Queued', updated: '2026-03-27' },
  { id: '8', title: 'Nutrition Survey 2025 Q4', format: 'CSV', rows: 7211, status: 'Profiled', updated: '2026-03-21' },
  { id: '9', title: 'ANC Attendance Aggregates', format: 'XLSX', rows: 1876, status: 'Validated', updated: '2026-03-22' },
  { id: '10', title: 'Mental Health Indicators Set', format: 'JSON', rows: 1333, status: 'Profiled', updated: '2026-03-23' },
  { id: '11', title: 'Mortality Longitudinal Panel', format: 'CSV', rows: 8112, status: 'Queued', updated: '2026-03-27' },
  { id: '12', title: 'Facility Readiness Matrix', format: 'XLSX', rows: 965, status: 'Validated', updated: '2026-03-18' },
];

const PAGE_SIZE = 6;

function timeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function statusStyle(status: Dataset['status']): CSSProperties {
  if (status === 'Profiled') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  if (status === 'Queued') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  if (status === 'Validated') return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' };
  return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
}

export default function DatasetsPage() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'rows' | 'updated'>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    let result = datasets.filter((d) => {
      if (!query) return true;
      return (
        d.title.toLowerCase().includes(query) ||
        d.format.toLowerCase().includes(query) ||
        d.status.toLowerCase().includes(query)
      );
    });

    result = [...result].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
      if (sortBy === 'rows') return (a.rows - b.rows) * dir;
      return (new Date(a.updated).getTime() - new Date(b.updated).getTime()) * dir;
    });

    return result;
  }, [globalFilter, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const pageData = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: 'title' | 'rows' | 'updated') => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortDirection('asc');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const toggleSelectAllPage = () => {
    const pageIds = pageData.map((d) => d.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 30, color: '#0f172a' }}>Datasets</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>Manage uploads, profiling, and versioned research data.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          style={{
            border: 'none',
            borderRadius: 12,
            padding: '11px 16px',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #0891b2, #2563eb)',
          }}
        >
          Upload dataset
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Search datasets..."
          style={{
            border: '1px solid #dbe3ef',
            background: '#fff',
            borderRadius: 12,
            padding: '10px 12px',
            minWidth: 280,
            fontSize: 14,
          }}
        />

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#991b1b', borderRadius: 10, padding: '9px 12px' }}
          >
            Clear selection ({selectedIds.length})
          </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #dbe3ef', borderRadius: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
              <th style={{ padding: '12px 14px' }}>
                <input
                  type="checkbox"
                  checked={pageData.length > 0 && pageData.every((d) => selectedIds.includes(d.id))}
                  onChange={toggleSelectAllPage}
                />
              </th>
              <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => toggleSort('title')}>Dataset</th>
              <th style={{ padding: '12px 14px' }}>Format</th>
              <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => toggleSort('rows')}>Rows</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => toggleSort('updated')}>Updated</th>
              <th style={{ padding: '12px 14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No datasets found</td>
              </tr>
            ) : (
              pageData.map((dataset) => (
                <tr key={dataset.id} style={{ borderTop: '1px solid #eef2f7' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(dataset.id)}
                      onChange={() => toggleSelect(dataset.id)}
                    />
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{dataset.title}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ border: '1px solid #dbe3ef', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>
                      {dataset.format}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>{dataset.rows.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ ...statusStyle(dataset.status), borderRadius: 999, fontSize: 12, padding: '3px 8px' }}>
                      {dataset.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{timeAgo(dataset.updated)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDataset(dataset)}
                        style={{ border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff', padding: '5px 10px', cursor: 'pointer' }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading ${dataset.title}...`)}
                        style={{ border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff', padding: '5px 10px', cursor: 'pointer' }}
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Showing {pageData.length} of {filteredAndSorted.length} datasets
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff', padding: '7px 10px' }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff', padding: '7px 10px' }}
          >
            Next
          </button>
        </div>
      </div>

      {showUpload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 120,
          }}
          onClick={() => setShowUpload(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(560px, calc(100vw - 24px))', background: '#fff', borderRadius: 16, padding: 20 }}
          >
            <h3 style={{ margin: 0, color: '#0f172a' }}>Upload New Dataset</h3>
            <p style={{ color: '#64748b', marginTop: 8 }}>Drag and drop CSV / XLSX / JSON or select file.</p>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 30, textAlign: 'center', color: '#64748b' }}>
              Upload form placeholder
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'end' }}>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                style={{ border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff', padding: '8px 12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDataset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.4)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 130,
          }}
          onClick={() => setSelectedDataset(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(700px, calc(100vw - 24px))', background: '#fff', borderRadius: 16, padding: 20 }}
          >
            <h3 style={{ marginTop: 0 }}>{selectedDataset.title}</h3>
            <p><strong>Format:</strong> {selectedDataset.format}</p>
            <p><strong>Rows:</strong> {selectedDataset.rows.toLocaleString()}</p>
            <p><strong>Status:</strong> {selectedDataset.status}</p>
            <p><strong>Updated:</strong> {timeAgo(selectedDataset.updated)}</p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'end' }}>
              <button
                type="button"
                onClick={() => setSelectedDataset(null)}
                style={{ border: '1px solid #dbe3ef', borderRadius: 8, background: '#fff', padding: '8px 12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
