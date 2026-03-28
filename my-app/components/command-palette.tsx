'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { Database, FileText, Home, Lock, UserCircle2 } from 'lucide-react';
import styles from './command-palette.module.css';

type PaletteItem = {
  label: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

const items: PaletteItem[] = [
  { label: 'Dashboard', url: '/dashboard', icon: Home },
  { label: 'Datasets', url: '/dashboard/datasets', icon: Database },
  { label: 'Reports', url: '/dashboard/reports', icon: FileText },
  { label: 'Access & Permissions', url: '/dashboard/access', icon: Lock },
  { label: 'Profile', url: '/dashboard/profile', icon: UserCircle2 },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q) || item.url.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (activeIndex > filtered.length - 1) setActiveIndex(Math.max(filtered.length - 1, 0));
  }, [activeIndex, filtered.length]);

  const navigate = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery('');
  };

  useEffect(() => {
    const onEnter = (e: KeyboardEvent) => {
      if (!open || e.key !== 'Enter') return;
      const item = filtered[activeIndex];
      if (item) navigate(item.url);
    };

    document.addEventListener('keydown', onEnter);
    return () => document.removeEventListener('keydown', onEnter);
  }, [open, filtered, activeIndex]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search datasets, reports, or go to..."
        />

        <p className={styles.groupTitle}>Navigation</p>
        <div className={styles.items}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>No results found.</p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.url}
                  type="button"
                  className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => navigate(item.url)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <span className={styles.kbd}>{item.url}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
