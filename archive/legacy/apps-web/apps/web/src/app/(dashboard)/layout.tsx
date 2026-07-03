'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import styles from './layout.module.css';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/health-data', icon: '💾', label: 'Health Data' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoEmoji}>🏥</span>
            <h1 className={styles.logoText}>Health Data Platform</h1>
          </div>

          {/* Desktop Nav */}
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
          </nav>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <button
              className={styles.userButton}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              disabled={isLoading}
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
                      <span key={role} className={styles.roleBadge}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className={styles.divider} />

                <button
                  className={styles.logoutButton}
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
