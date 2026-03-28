'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, FileText, Home, Lock, UserCircle2, Shield, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './app-sidebar.module.css';

type AppSidebarProps = {
  showAdminLink?: boolean;
};

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Datasets', url: '/dashboard/datasets', icon: Database },
  { title: 'Reports', url: '/dashboard/reports', icon: FileText },
  { title: 'Access & Permissions', url: '/dashboard/access', icon: Lock },
  { title: 'Profile', url: '/dashboard/profile', icon: UserCircle2 },
];

export function AppSidebar({ showAdminLink = false }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(() => {
    if (!showAdminLink) return navItems;
    return [...navItems, { title: 'Admin Console', url: '/admin', icon: Shield }];
  }, [showAdminLink]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>DN</div>
          <h2 className={`${styles.title} ${collapsed ? styles.hideText : ''}`}>DataNotch</h2>
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className={styles.icon} /> : <PanelLeftClose className={styles.icon} />}
        </button>
      </div>

      <div className={styles.section}>
        <p className={`${styles.label} ${collapsed ? styles.hideText : ''}`}>Workspace</p>
        <ul className={styles.menu}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
              <li key={item.url}>
                <Link href={item.url} className={`${styles.link} ${isActive ? styles.linkActive : ''}`}>
                  <Icon className={styles.icon} />
                  <span className={collapsed ? styles.hideText : ''}>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${styles.footer} ${collapsed ? styles.hideText : ''}`}>
        Powered by Health Data Platform
      </div>
    </aside>
  );
}
