export default function PatternBLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="theme-light"
      style={{
        background: '#FBFAFE',
        color: '#111016',
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        width: '100vw',
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
