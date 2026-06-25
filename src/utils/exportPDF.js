// Simple test generator substituting an enterprise canvas layer with native document windows
export const exportSummaryToPDF = (summaryData) => {
  if (!summaryData || summaryData.length === 0) {
    alert("No summary data available to export.");
    return;
  }
  
  const printWindow = window.open('', '_blank');
  let tableRows = summaryData.map(row => `
    <tr>
      <td style="border:1px solid #ddd; padding:8px;">${row.metric || 'N/A'}</td>
      <td style="border:1px solid #ddd; padding:8px;">${row.value || '0'}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head><title>KD3 Marketing Analytics Report</title></head>
      <body style="font-family:sans-serif; padding:4px;">
        <h2>KD3 Marketing Analytics Report</h2>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="border:1px solid #ddd; padding:8px; text-align:left;">Metric</th>
              <th style="border:1px solid #ddd; padding:8px; text-align:left;">Value</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};