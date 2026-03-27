import Link from 'next/link';

const cards = [
  { icon: '👤', title: 'Users', desc: 'Submit registration, activate access, and use the researcher dashboard.', href: '/login/user', label: 'User Login' },
  { icon: '🛡️', title: 'Admin', desc: 'Review registrations, approve users, and manage platform access.', href: '/login/admin', label: 'Admin Login' },
  { icon: '📝', title: 'Registration', desc: 'Researchers and students request access before approval.', href: '/register', label: 'Request Access' },
];

export default function HomePage() {
  return (
    <div style={s.container}>
      <div style={s.bg} />
      <div style={s.inner}>
        <div style={{ textAlign: 'center', marginBottom: 48, color: 'white' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏥</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Health Data Platform
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, margin: 0, maxWidth: 500, marginInline: 'auto', lineHeight: 1.6 }}>
            Upload datasets, route registration through admin approval, and access a governed research workspace.
          </p>
        </div>

        <div style={s.grid}>
          {cards.map((card) => (
            <div key={card.href} style={s.card}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{card.icon}</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px' }}>{card.title}</h2>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px', lineHeight: 1.5 }}>{card.desc}</p>
              <Link href={card.href} style={s.button}>{card.label}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', zIndex: -1,
  },
  inner: { width: '100%', maxWidth: 900, zIndex: 1 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24,
  },
  card: {
    background: 'white', borderRadius: 16, padding: '32px 24px', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)', transition: 'transform 0.3s',
  },
  button: {
    display: 'inline-block', padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
  },
};
