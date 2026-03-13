'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUsers, FiActivity, FiFileText, FiSearch, FiPlus, FiCheckCircle, FiClock, FiPackage } from 'react-icons/fi';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      if (user.role === 'doctor') {
        const [patientsRes, consultsRes] = await Promise.all([
          api.get('/patients?limit=5'),
          api.get('/prescriptions?limit=5'),
        ]);
        setStats({ patients: patientsRes.data.total || 0 });
        setItems(patientsRes.data.patients || []);
      } else if (user.role === 'pharmacy') {
        const res = await api.get('/prescriptions/pending');
        setItems(res.data || []);
        setStats({ pending: res.data?.length || 0 });
      } else if (user.role === 'lab') {
        const res = await api.get('/labtests/pending');
        setItems(res.data || []);
        setStats({ pending: res.data?.length || 0 });
      } else if (user.role === 'admin') {
        const [patientsRes, auditRes] = await Promise.all([
          api.get('/patients?limit=5'),
          api.get('/audit?limit=10'),
        ]);
        setStats({ patients: patientsRes.data.total || 0, auditEntries: auditRes.data.total || 0 });
        setItems(auditRes.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  if (authLoading || !user) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header animate-in">
        <h1 className="page-title">
          {user.role === 'doctor' && '🩺 '}
          {user.role === 'pharmacy' && '💊 '}
          {user.role === 'lab' && '🔬 '}
          {user.role === 'admin' && '🛡️ '}
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
        </h1>
        <p className="page-subtitle">Welcome, {user.name}</p>
      </div>

      {/* Quick Actions */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {user.role === 'doctor' && (
          <>
            <Link href="/patients/register" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}><FiPlus /></div>
              <div className="stat-label">Register New Patient</div>
            </Link>
            <Link href="/consultation/new" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}><FiActivity /></div>
              <div className="stat-label">New Consultation</div>
            </Link>
            <Link href="/scan" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}><FiSearch /></div>
              <div className="stat-label">Scan Patient QR</div>
            </Link>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><FiUsers /></div>
              <div className="stat-value">{stats?.patients || '...'}</div>
              <div className="stat-label">Total Patients</div>
            </div>
          </>
        )}
        {user.role === 'pharmacy' && (
          <>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><FiClock /></div>
              <div className="stat-value">{stats?.pending ?? '...'}</div>
              <div className="stat-label">Pending Prescriptions</div>
            </div>
            <Link href="/scan" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}><FiSearch /></div>
              <div className="stat-label">Scan Patient QR</div>
            </Link>
          </>
        )}
        {user.role === 'lab' && (
          <>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><FiClock /></div>
              <div className="stat-value">{stats?.pending ?? '...'}</div>
              <div className="stat-label">Pending Lab Tests</div>
            </div>
            <Link href="/scan" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}><FiSearch /></div>
              <div className="stat-label">Scan Patient QR</div>
            </Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><FiUsers /></div>
              <div className="stat-value">{stats?.patients || '...'}</div>
              <div className="stat-label">Total Patients</div>
            </div>
            <Link href="/audit" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><FiFileText /></div>
              <div className="stat-value">{stats?.auditEntries || '...'}</div>
              <div className="stat-label">Audit Entries</div>
            </Link>
          </>
        )}
      </div>

      {/* Items List */}
      {loadingData ? (
        <div className="loading-screen" style={{ minHeight: '30vh' }}><div className="spinner" /></div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 600 }}>
              {user.role === 'doctor' && 'Recent Patients'}
              {user.role === 'pharmacy' && 'Pending Prescriptions'}
              {user.role === 'lab' && 'Pending Lab Tests'}
              {user.role === 'admin' && 'Recent Audit Logs'}
            </h3>
          </div>
          {items.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><p>No items yet</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    {user.role === 'doctor' && <><th>PID</th><th>Name</th><th>Age</th><th>Gender</th><th>Action</th></>}
                    {user.role === 'pharmacy' && <><th>Patient</th><th>Doctor</th><th>Medications</th><th>Status</th><th>Action</th></>}
                    {user.role === 'lab' && <><th>Patient</th><th>Test</th><th>Ordered By</th><th>Status</th><th>Action</th></>}
                    {user.role === 'admin' && <><th>User</th><th>Action</th><th>Resource</th><th>Time</th></>}
                  </tr>
                </thead>
                <tbody>
                  {user.role === 'doctor' && items.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{p.pid}</td>
                      <td>{p.name}</td>
                      <td>{p.age}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                      <td><Link href={`/patients/${p.pid}`} className="btn btn-secondary btn-sm">View</Link></td>
                    </tr>
                  ))}
                  {user.role === 'pharmacy' && items.map((rx) => (
                    <tr key={rx._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rx.patient?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rx.patientPid}</div>
                      </td>
                      <td>{rx.doctorName}</td>
                      <td>{rx.medications?.map(m => m.name).join(', ')}</td>
                      <td><span className={`badge badge-${rx.status}`}>{rx.status}</span></td>
                      <td>
                        {rx.status === 'pending' && (
                          <button className="btn btn-success btn-sm" onClick={async () => {
                            try { await api.patch(`/prescriptions/${rx._id}/dispense`); toast.success('Dispensed!'); loadDashboard(); } catch(e) { toast.error('Error'); }
                          }}><FiCheckCircle /> Dispense</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {user.role === 'lab' && items.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.patient?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.patientPid}</div>
                      </td>
                      <td>{t.testName}</td>
                      <td>{t.orderedBy}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>
                        <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                          value={t.status} onChange={async (e) => {
                            try {
                              const status = e.target.value;
                              let results = '';
                              if (status === 'completed') results = prompt('Enter test results:') || '';
                              await api.patch(`/labtests/${t._id}/status`, { status, results });
                              toast.success('Status updated!');
                              loadDashboard();
                            } catch(e) { toast.error('Error'); }
                          }}>
                          <option value="ordered">Ordered</option>
                          <option value="sample-collected">Sample Collected</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {user.role === 'admin' && items.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{log.userName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.userRole}</div>
                      </td>
                      <td><span className={`badge ${log.action === 'CREATE' ? 'badge-completed' : log.action === 'UPDATE' ? 'badge-pending' : 'badge-ordered'}`}>{log.action}</span></td>
                      <td>{log.resourceType}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
