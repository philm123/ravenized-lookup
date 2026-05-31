export default function PatternCLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#06050B',
        color: '#FAFAFD',
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
