// Native document window engine compiling summary tables into structured PDFs
export const exportSummaryToPDF = (summaryData) => {
  if (!summaryData || summaryData.length === 0) return;
  
  const targetWindow = window.open('', '_blank');
  const rows = summaryData.map(row => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px; color: #334155;">${row.metric}</td>
      <td style="padding: 12px; font-weight: bold; color: #0f172a;">${row.value}</td>
    </tr>
  `).join('');

  targetWindow.document.write(`
    <html>
      <head><title>KD3 Marketing Summary Insights Report</title></head>
      <body style="font-family: sans-serif; padding: 40px; background: #fff;">
        <h2 style="color: #1e293b; margin-bottom: 4px;">KD3 Marketing Analytics Summary</h2>
        <p style="color: #64748b; margin-top: 0;">Exported on: ${new Date().toLocaleDateString()}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 12px; color: #475569;">Data Metric Pillar</th>
              <th style="padding: 12px; color: #475569;">Computed Value</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  targetWindow.document.close();
};