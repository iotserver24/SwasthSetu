'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiLogOut, FiUser, FiHome, FiUsers, FiActivity, FiFileText, FiSearch, FiShield } from 'react-icons/fi';
import { useState } from 'react';

const roleMenus = {
  doctor: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/patients/register', label: 'Register Patient', icon: FiUsers },
    { href: '/consultation/new', label: 'New Consultation', icon: FiActivity },
    { href: '/scan', label: 'QR Scan', icon: FiSearch },
  ],
  pharmacy: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/scan', label: 'QR Scan', icon: FiSearch },
  ],
  lab: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/scan', label: 'QR Scan', icon: FiSearch },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/patients/register', label: 'Register Patient', icon: FiUsers },
    { href: '/audit', label: 'Audit Logs', icon: FiShield },
    { href: '/scan', label: 'QR Scan', icon: FiSearch },
  ],
};

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return null;

  const menuItems = user ? (roleMenus[user.role] || []) : [];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: '72px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Link href={user ? '/dashboard' : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🏥</span>
          <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>SwasthyaSetu</span>
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  transition: 'var(--transition)',
                }}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="desktop-nav" style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)', border: '1px solid var(--border-color)'
              }}>
                <FiUser size={14} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{user.name}</span>
                <span className={`badge badge-${user.role === 'doctor' ? 'ordered' : user.role === 'admin' ? 'completed' : 'pending'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={() => setMobileOpen(!mobileOpen)} 
                className="mobile-toggle"
                style={{
                  display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)',
                  cursor: 'pointer', fontSize: '1.5rem', padding: '8px',
                }}
              >
                {mobileOpen ? <FiX /> : <FiMenu />}
              </button>
              <button onClick={logout} className="btn btn-secondary btn-sm desktop-nav" style={{ padding: '8px' }}>
                <FiLogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {user && mobileOpen && (
        <div style={{
          position: 'fixed', top: '72px', left: 0, right: 0, bottom: 0,
          background: 'var(--bg-primary)', // Use solid background
          zIndex: 1001, padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          animation: 'fadeIn 0.2s ease-out',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', 
            padding: '16px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
            marginBottom: '12px'
          }}>
            <div style={{ width: '44px', height: '44px', background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUser color="white" size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              <span className={`badge badge-${user.role === 'doctor' ? 'ordered' : user.role === 'admin' ? 'completed' : 'pending'}`} style={{ fontSize: '0.6rem', marginTop: '4px' }}>
                {user.role}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                  background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid ' + (isActive ? 'var(--accent-primary)' : 'var(--border-color)'),
                  transition: 'var(--transition)',
                }}>
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-danger)', background: 'rgba(239, 68, 68, 0.05)',
            color: 'var(--accent-danger)', fontSize: '1rem', fontWeight: 600,
            marginTop: '24px', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            <FiLogOut size={20} />
            Logout
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
