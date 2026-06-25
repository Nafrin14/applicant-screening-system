import React from 'react';
import { exportSummaryToPDF } from '../utils/exportPDF';

export default function AnalyticsTable({ summaryData }) {
  if (!summaryData) {
    return (
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', color: '#64748b', textAlign: 'center', marginTop: '24px' }}>
        Select a platform candidate's dataset row from the user control array to extract structural summaries.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', marginTop: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Consolidated Metrics View Layer</h3>
        <button 
          onClick={() => exportSummaryToPDF(summaryData)}
          style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Download PDF Document
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '14px', textAlign: 'left', color: '#64748b' }}>Data Metric Pillar</th>
            <th style={{ padding: '14px', textAlign: 'left', color: '#64748b' }}>Computed Result</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((row, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '14px', color: '#334155' }}>{row.metric}</td>
              <td style={{ padding: '14px', fontWeight: '600', color: '#0f172a' }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}