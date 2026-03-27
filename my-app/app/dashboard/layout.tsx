'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import styles from './layout.module.css';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/datasets', icon: '💾', label: 'Datasets' },
  { href: '/dashboard/reports', icon: '📋', label: 'Reports' },
  { href: '/dashboard/profile', icon: '👤', label: 'Profile' },
  { href: '/dashboard/access', icon: '🔑', label: 'Access' },
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoEmoji}>🏥</span>
            <h1 className={styles.logoText}>Health Data Platform</h1>
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {user?.roles.includes('ADMIN') && (
              <Link
                href="/admin"
                className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.navLinkActive : ''}`}
              >
                <span>🛡️</span>
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className={styles.userMenu}>
            <button
              className={styles.userButton}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              disabled={loading}
            >
              <span className={styles.userAvatar}>👤</span>
              <span className={styles.userEmail}>{user?.email}</span>
              <span className={styles.dropdown}>▼</span>
            </button>

            {isUserMenuOpen && (
              <div className={styles.userDropdown}>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{user?.firstname} {user?.surname}</p>
                  <p className={styles.userEmailSmall}>{user?.email}</p>
                  <div className={styles.roles}>
                    {user?.roles.map((role) => (
                      <span key={role} className={styles.roleBadge}>{role}</span>
                    ))}
                  </div>
                </div>
                <hr className={styles.divider} />
                <button className={styles.logoutButton} onClick={handleLogout} disabled={loading}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ProtectedRoute>
  );
}
