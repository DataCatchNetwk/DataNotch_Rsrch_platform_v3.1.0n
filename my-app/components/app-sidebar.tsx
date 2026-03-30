'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Database, Home, Users2, Bell, FolderOpenDot, ClipboardList, FileUp, Plus, Shield, PanelLeftClose, PanelLeftOpen, Activity, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import styles from './app-sidebar.module.css';

type AppSidebarProps = {
  showAdminLink?: boolean;
};

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'My Studies', url: '/dashboard/reports', icon: FolderOpenDot },
  { title: 'Datasets', url: '/dashboard/datasets', icon: Database },
  { title: 'Analysis Jobs', url: '/dashboard/analysis/jobs', icon: FlaskConical },
  { title: 'Workspaces', url: '/dashboard/workspaces', icon: ClipboardList },
  { title: 'Monitoring', url: '/dashboard/monitoring/pipelines', icon: Activity },
  { title: 'Requests', url: '/dashboard/requests', icon: FileUp },
  { title: 'Collaborators', url: '/dashboard/reports?tab=collaborators', icon: Users2 },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
];

export function AppSidebar({ showAdminLink = false }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(() => {
    if (!showAdminLink) return navItems;
    return [...navItems, { title: 'Admin Console', url: '/admin', icon: Shield }];
  }, [showAdminLink]);

  const initials = `${user?.firstname?.[0] ?? 'A'}${user?.surname?.[0] ?? 'D'}`.toUpperCase();
  const fullName = [user?.firstname, user?.surname].filter(Boolean).join(' ') || 'Alize Doyle';
  const email = user?.email || 'alize.doyle@research.org';

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>DN</div>
          <div className={`${collapsed ? styles.hideText : ''}`}>
            <h2 className={styles.title}>DataNotch</h2>
            <p className={styles.subtitle}>Researcher Workspace</p>
          </div>
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
        <p className={`${styles.label} ${collapsed ? styles.hideText : ''}`}>Main</p>
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

      <div className={`${styles.quickActions} ${collapsed ? styles.hideText : ''}`}>
        <p className={styles.label}>Quick Actions</p>
        <button
          type="button"
          className={`${styles.quickBtn} ${styles.quickBtnPrimary}`}
          onClick={() => router.push('/dashboard/reports?tab=new-study')}
        >
          <Plus size={14} /> New Study
        </button>
        <button type="button" className={styles.quickBtn} onClick={() => router.push('/dashboard/datasets?upload=1')}>Upload Data</button>
        <button type="button" className={styles.quickBtn} onClick={() => router.push('/dashboard/datasets')}>Browse Datasets</button>
        <button type="button" className={styles.quickBtn} onClick={() => router.push('/dashboard/workspaces')}>Join Workspace</button>
      </div>

      <div className={`${styles.footer} ${collapsed ? styles.hideText : ''}`}>
        <div className={styles.footerAvatar}>{initials}</div>
        <div>
          <p className={styles.footerName}>{fullName}</p>
          <p className={styles.footerEmail}>{email}</p>
        </div>
      </div>
    </aside>
  );
}
