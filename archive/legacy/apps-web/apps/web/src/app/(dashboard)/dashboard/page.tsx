'use client';

import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import styles from './page.module.css';

const cards = [
  { href: '/dashboard', icon: '📊', title: 'Dashboard', desc: 'View health data analytics and metrics' },
  { href: '/health-data', icon: '💾', title: 'Health Data', desc: 'Manage and access health data records' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <h1 className={styles.title}>Welcome, {user?.firstname || user?.email}! 👋</h1>
          <p className={styles.subtitle}>You have successfully logged in to the Health Data Platform</p>
        </div>

        <div className={styles.grid}>
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className={styles.card}>
              <div className={styles.cardIcon}>{card.icon}</div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className={styles.infoBox}>
          <h2>Your Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Name:</label>
              <p>{user?.firstname} {user?.surname}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Email:</label>
              <p>{user?.email}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Roles:</label>
              <p>{user?.roles.join(', ') || 'None'}</p>
            </div>
            <div className={styles.infoItem}>
              <label>User ID:</label>
              <p className={styles.userId}>{user?.id}</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
