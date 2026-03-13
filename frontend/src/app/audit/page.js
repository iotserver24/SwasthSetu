'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FiShield, FiFilter } from 'react-icons/fi';

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', resourceType: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/dashboard');
  }, [user, authLoading, router]);

  useEffect(() => { if (user?.role === 'admin') loadLogs(); }, [user, page, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (filters.action) params.set('action', filters.action);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      const { data } = await api.get(`/audit?${params}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header animate-in">
        <h1 className="page-title"><FiShield style={{ verticalAlign: 'middle' }} /> Access Audit Trail</h1>
        <p className="page-subtitle">Complete log of all patient data access — {total} entries</p>
      </div>
      <div className="glass-card animate-in" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FiFilter />
        <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
          value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="VIEW">View</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
        </select>
        <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
          value={filters.resourceType} onChange={(e) => { setFilters({ ...filters, resourceType: e.target.value }); setPage(1); }}>
          <option value="">All Resources</option>
          <option value="Patient">Patient</option>
          <option value="Consultation">Consultation</option>
          <option value="Prescription">Prescription</option>
          <option value="LabTest">Lab Test</option>
        </select>
      </div>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🛡️</div><p>No audit logs found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Resource</th><th>Details</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 500 }}>{log.userName}</td>
                    <td><span className="badge badge-ordered" style={{ fontSize: '0.65rem' }}>{log.userRole}</span></td>
                    <td><span className={`badge ${log.action === 'CREATE' ? 'badge-completed' : log.action === 'UPDATE' ? 'badge-pending' : 'badge-ordered'}`}>{log.action}</span></td>
                    <td>{log.resourceType}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {total > 30 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
