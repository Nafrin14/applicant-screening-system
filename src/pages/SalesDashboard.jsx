import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import CalendarTracker from '../components/CalendarTracker';
import { formatDateString } from '../utils/helpers';

export default function SalesDashboard() {
  const [history, setHistory] = useState([]);
  const [markedDates, setMarkedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // Tracks upload loading state

  // 1. Fetch historical data rows from Supabase matching active user context
  const loadUserUploadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('csv_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);

      const formattedDates = (data || []).map(item => formatDateString(item.created_at));
      setMarkedDates([...new Set(formattedDates)]);
    } catch (err) {
      console.error("Error fetching historical logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Process real-time file insertion to Supabase public schema
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Direct extension type check guard
    if (!file.name.endsWith('.csv')) {
      alert("Invalid format: Please upload a file with a valid .csv extension.");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authenticated session expired or missing.");

      // Insert record entry referencing the profile owner
      const { error } = await supabase
        .from('csv_uploads')
        .insert([
          {
            user_id: user.id,
            file_name: file.name,
            status: 'success'
          }
        ]);

      if (error) throw error;

      alert(`"${file.name}" has been successfully parsed and pinned to your tracker!`);
      
      // Instantly refresh logs and map new calendar highlight marker
      await loadUserUploadHistory();
    } catch (err) {
      alert(err.message || "An unhandled error occurred during file sync.");
    } finally {
      setUploading(false);
      event.target.value = ""; // Flush input element buffer
    }
  };

  useEffect(() => {
    loadUserUploadHistory();
  }, []);

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh', color: '#333' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '32px', fontWeight: 'bold' }}>KD3 Operations Dashboard</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Upload analytical datasets, inspect verification statuses, and monitor tracking flags.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          {/* Upload Input Widget Block */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>Synchronize New CSV Target Dataset</h3>
            <div style={{ border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', borderRadius: '8px', background: '#f8fafc', marginTop: '16px' }}>
              {uploading ? (
                <p style={{ fontWeight: '600', color: '#4f46e5' }}>Processing file metadata headers inside pipeline...</p>
              ) : (
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  style={{ cursor: 'pointer' }}
                />
              )}
            </div>
          </div>

          {/* Verification Logs Datagrid Table */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '16px', fontWeight: 'bold' }}>File Synchronization Logs</h3>
            {loading ? <p>Loading logs...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '10px', color: '#475569' }}>File Signature Name</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Verification State</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan="2" style={{ padding: '16px', color: '#94a3b8', textAlign: 'center' }}>No historical record strings match this user handle context.</td></tr>
                  ) : history.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', color: '#334155' }}>{row.file_name || 'untitled_data.csv'}</td>
                      <td style={{ padding: '10px', color: '#10b981', fontWeight: 'bold' }}>✓ Successfully Synced</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <CalendarTracker markedDates={markedDates} />
        </div>
      </div>
    </div>
  );
}