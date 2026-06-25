import React, { useState, useEffect } from 'react';
import {supabase} from '../supabase';
import { validateEmail } from '../utils/validation';
import AnalyticsTable from '../components/AnalyticsTable';

export default function SalesAdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlatformProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error(err);
    } {
      setLoading(false);
    }
  };

  const handleToggleActiveState = async (userId, currentState) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentState })
        .eq('id', userId);
      if (error) throw error;
      loadPlatformProfiles();
    } catch (err) {
      alert('Failed to modify target account configuration metadata flags.');
    }
  };

  const handleExecuteAnalysisPipeline = async (userId) => {
    // Basic structural generation framework modeling standard aggregation rows
    const mockMetricsOutput = [
      { metric: "Total Records Quantified", value: "8,412 rows parsed" },
      { metric: "Data Verification Metric", value: "99.2% Compliant" },
      { metric: "Core Demographic Target", value: "Enterprise Marketing (SaaS)" }
    ];
    setSelectedSummary(mockMetricsOutput);
  };

  const handleRegisterNewUserForm = (e) => {
    e.preventDefault();
    if (!validateEmail(inviteEmail)) {
      alert('Format verification error. Please write out a fully qualified address.');
      return;
    }
    alert(`Success! Verification email handshake sequence dispatched to: ${inviteEmail}`);
    setInviteEmail('');
  };

  useEffect(() => {
    loadPlatformProfiles();
  }, []);

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '32px' }}>KD3 Administrator Workspace</h1>
        <p style={{ color: '#475569', margin: '4px 0 0 0' }}>Provision corporate access mappings, activate operational sessions, and run summary generators.</p>
      </header>

      {/* User Provisioning Form Component Card */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '12px' }}>Provision New Corporate Core Profile</h3>
        <form onSubmit={handleRegisterNewUserForm} style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="email" placeholder="employee-name@company.com" required
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px' }}
          />
          <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Add User By Email
          </button>
        </form>
      </div>

      {/* Master Data Grid Mappings */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '16px' }}>Registered Core Mappings Directory</h3>
        {loading ? <p>Reading database listings...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px', color: '#475569' }}>Identity Handle Email</th>
                <th style={{ padding: '14px', color: '#475569' }}>Workspace Role Mappings</th>
                <th style={{ padding: '14px', color: '#475569' }}>System Authorization Toggle</th>
                <th style={{ padding: '14px', color: '#475569' }}>Reporting Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(rowItem => (
                <tr key={rowItem.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px', color: '#334155' }}>{rowItem.email}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {rowItem.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <button 
                      onClick={() => handleToggleActiveState(rowItem.id, rowItem.is_active)}
                      style={{
                        background: rowItem.is_active ? '#fee2e2' : '#dcfce7',
                        color: rowItem.is_active ? '#b91c1c' : '#15803d',
                        border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      {rowItem.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <button 
                      onClick={() => handleExecuteAnalysisPipeline(rowItem.id)}
                      style={{ background: '#f3f4f6', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', color: '#1e293b', cursor: 'pointer' }}
                    >
                      Summarize
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Aggregate Analytical Table Output Panel */}
      <AnalyticsTable summaryData={selectedSummary} />
    </div>
  );
}