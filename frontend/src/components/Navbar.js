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
      background: 'rgba(10, 14, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
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
            <>
              <div style={{
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
              <button onClick={logout} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                <FiLogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
