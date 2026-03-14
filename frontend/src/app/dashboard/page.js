'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUsers, FiActivity, FiFileText, FiSearch, FiPlus, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [pidSearch, setPidSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadDashboard = useCallback(async () => {
    try {
      const isPharmacy = user.role === 'pharmacy' || user.role === 'pharmacist';
      const isLab = user.role === 'lab' || user.role === 'lab_tech';

      if (user.role === 'doctor') {
        const total = (await api.get('/patients?limit=1')).data.total || 0;
        setStats({ patients: total });
      } else if (isPharmacy) {
        const res = await api.get('/prescriptions/pending');
        setItems(res.data || []);
        setStats({ pending: res.data?.length || 0 });
      } else if (isLab) {
        const res = await api.get('/labtests/pending');
        setItems(res.data || []);
        setStats({ pending: res.data?.length || 0 });
      } else if (user.role === 'admin') {
        const auditRes = await api.get('/audit?limit=10');
        const total = (await api.get('/patients?limit=1')).data.total || 0;
        setStats({ patients: total, auditEntries: auditRes.data.total || 0 });
        setItems(auditRes.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user, loadDashboard]);

  const handlePidSearch = async (e) => {
    e.preventDefault();
    if (!pidSearch.trim()) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const { data } = await api.get(`/patients/${pidSearch.trim()}`);
      router.push(`/patients/${data.pid}`);
    } catch {
      try {
        const { data } = await api.get(`/patients?search=${pidSearch.trim()}`);
        if (data.patients?.length === 1) {
          router.push(`/patients/${data.patients[0].pid}`);
        } else if (data.patients?.length > 1) {
          setSearchResults(data.patients);
        } else {
          toast.error('No patient found');
        }
      } catch {
        toast.error('Search failed');
      }
    } finally {
      setSearching(false);
    }
  };

  if (authLoading || !user) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header animate-in">
        <h1 className="page-title">
          {user.role === 'doctor' && '🩺 '}
          {(user.role === 'pharmacy' || user.role === 'pharmacist') && '💊 '}
          {(user.role === 'lab' || user.role === 'lab_tech') && '🔬 '}
          {user.role === 'admin' && '🛡️ '}
          {user.role === 'doctor' ? 'Doctor' : user.role === 'pharmacist' ? 'Pharmacist' : user.role === 'lab_tech' ? 'Lab Technician' : user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
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
        {(user.role === 'pharmacy' || user.role === 'pharmacist') && (
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
        {(user.role === 'lab' || user.role === 'lab_tech') && (
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
            <Link href="/scan" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}><FiSearch /></div>
              <div className="stat-label">Find Patient by PID</div>
            </Link>
          </>
        )}
      </div>

      {/* Patient Lookup — PID search only, no listing */}
      {(user.role === 'doctor' || user.role === 'admin') && (
        <div className="glass-card animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>🔍 Find Patient by PID</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Enter a Patient ID, name, or phone to access their records
          </p>
          <form onSubmit={handlePidSearch} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" style={{ paddingLeft: '40px' }}
                placeholder="PID-000001 or patient name or phone..."
                value={pidSearch} onChange={(e) => setPidSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={searching || !pidSearch.trim()}>
              {searching ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : 'Search'}
            </button>
          </form>
          {searchResults && searchResults.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {searchResults.length} results found:
              </p>
              {searchResults.map((p) => (
                <div key={p._id} onClick={() => router.push(`/patients/${p.pid}`)}
                  style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '8px', cursor: 'pointer', transition: 'var(--transition)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)', marginRight: '12px' }}>{p.pid}</span>
                  <span>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.85rem' }}>{p.age}yrs, {p.gender}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pharmacy / Lab / Admin work items */}
      {loadingData ? (
        <div className="loading-screen" style={{ minHeight: '30vh' }}><div className="spinner" /></div>
      ) : (user.role !== 'doctor') && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontWeight: 600 }}>
              {(user.role === 'pharmacy' || user.role === 'pharmacist') && 'Pending Prescriptions'}
              {(user.role === 'lab' || user.role === 'lab_tech') && 'Pending Lab Tests'}
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
                    {(user.role === 'pharmacy' || user.role === 'pharmacist') && <><th>Patient</th><th>Doctor</th><th>Medications</th><th>Status</th><th>Action</th></>}
                    {(user.role === 'lab' || user.role === 'lab_tech') && <><th>Patient</th><th>Test</th><th>Ordered By</th><th>Status</th><th>Action</th></>}
                    {user.role === 'admin' && <><th>User</th><th>Action</th><th>Resource</th><th>Time</th></>}
                  </tr>
                </thead>
                <tbody>
                  {(user.role === 'pharmacy' || user.role === 'pharmacist') && items.map((rx) => (
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
                  {(user.role === 'lab' || user.role === 'lab_tech') && items.map((t) => (
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
