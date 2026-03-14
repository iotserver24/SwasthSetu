'use client';

import { usePathname } from 'next/navigation';
import DnaHelixCanvas from '@/components/DnaHelixCanvas';

const SLIDE_DURATION_MS = 500;

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isRegister = pathname === '/register';

  return (
    <div
      className="auth-split-root"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      {/* DNA panel: left on login, right on register — slides smoothly */}
      <div
        className="auth-dna-slide-panel"
        style={{
          position: 'absolute',
          left: isRegister ? '50%' : '0%',
          width: '50%',
          top: 0,
          bottom: 0,
          transition: `left ${SLIDE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        }}
      >
        <DnaHelixCanvas />
      </div>

      {/* Form panel: full right (login) or full left (register) — no card, content spans panel */}
      <div
        className="auth-form-slide-panel"
        style={{
          position: 'absolute',
          left: isRegister ? '0%' : '50%',
          width: '50%',
          top: 0,
          bottom: 0,
          transition: `left ${SLIDE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          padding: '48px',
          background: 'var(--gradient-hero)',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
