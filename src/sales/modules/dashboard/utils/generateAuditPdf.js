import { supabase } from '../../../../core/lib/supabase';

// ─── HELPER: Normalize stage for consistent display ──────────────────────
export function normalizeStage(stage) {
  if (!stage) return 'New Leads';

  const s = stage.toLowerCase().trim();

  if (s.includes('book') || s.includes('appointment') || s.includes('scheduled')) {
    return 'Appointment Booked';
  }
  if (s.includes('pending') || s.includes('waiting') || s.includes('follow')) {
    return 'Pending Service Completion';
  }
  if (s.includes('new') || s.includes('lead')) {
    return 'New Leads';
  }
  if (s.includes('closed') || s.includes('won') || s.includes('lost')) {
    return 'Closed';
  }

  // Return as-is with proper capitalization
  return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
}

// Generate PDF from leads data
// ─── FIX: forces background colors to print, and fixes column widths ─────
export function generateLeadsPdf(leads, { pdfFilterStart, pdfFilterEnd, showToast }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { showToast('Allow pop-ups to download the PDF.'); return; }

  const today = new Date().toLocaleDateString('en-GB');
  const dateLabel = pdfFilterStart && pdfFilterEnd ? `${pdfFilterStart} → ${pdfFilterEnd}` : 'All Historical Dates';

  // 1. DEDUPLICATE AND CLEAN LEADS
  const uniqueLeadsMap = new Map();
  leads.forEach(lead => {
    const phoneDigits = (lead.phone || '').replace(/\D/g, '');
    const matchKey = phoneDigits.slice(-10) || `${lead.name}|${lead.location}|${lead.salesperson}`;

    if (!uniqueLeadsMap.has(matchKey)) {
      const normalizedStage = normalizeStage(lead.stage);

      uniqueLeadsMap.set(matchKey, {
        name: lead.name || 'Unknown Lead',
        phone: lead.phone || '—',
        location: lead.location || 'Other / Unassigned',
        business_line: lead.business_line || 'General Pipeline',
        salesperson: lead.salesperson || 'Unassigned',
        stage: normalizedStage,
        date: lead.lead_date || (lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
      });
    }
  });

  const processedLeads = Array.from(uniqueLeadsMap.values());

  // 2. GROUP LEADS BY LOCATION + SALESPERSON
  const locationGroups = {};
  processedLeads.forEach(lead => {
    const groupKey = `${lead.location} — ${lead.salesperson}`;
    if (!locationGroups[groupKey]) {
      locationGroups[groupKey] = [];
    }
    locationGroups[groupKey].push(lead);
  });

  // Sort groups
  const locationOrder = ['Albany', 'Buffalo', 'Rochester', 'Syracuse', 'NYC Metro'];
  const sortedGroups = Object.keys(locationGroups).sort((a, b) => {
    const locA = a.split(' — ')[0];
    const locB = b.split(' — ')[0];
    const indexA = locationOrder.indexOf(locA);
    const indexB = locationOrder.indexOf(locB);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    if (indexA === indexB) return a.localeCompare(b);
    return indexA - indexB;
  });

  // 3. Generate HTML for each location group
  let tablesHtml = '';

  sortedGroups.forEach(groupKey => {
    const locLeads = locationGroups[groupKey];
    if (locLeads.length === 0) return;

    const totalLeads = locLeads.length;
    const bookedLeads = locLeads.filter(l => l.stage.includes('Appointment Booked')).length;
    const newLeads = locLeads.filter(l => l.stage.includes('New Leads')).length;
    const pendingLeads = locLeads.filter(l => l.stage.includes('Pending')).length;

    const location = groupKey.split(' — ')[0];

    const rows = locLeads.map((lead, i) => `
      <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding: 10px 14px; font-weight: 500; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${lead.name}</td>
        <td style="padding: 10px 14px; color: #475569; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${lead.phone}</td>
        <td style="padding: 10px 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">${lead.location}</td>
        <td style="padding: 10px 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">${lead.business_line}</td>
        <td style="padding: 10px 14px; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${lead.salesperson}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; ${lead.stage.includes('Appointment Booked') ? 'background-color: #dbeafe; color: #1e40af;' : lead.stage.includes('Pending') ? 'background-color: #fef3c7; color: #92400e;' : 'background-color: #dcfce7; color: #166534;'}">
            ${lead.stage}
          </span>
        </td>
        <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">${lead.date}</td>
      </tr>
    `).join('');

    const locationColors = {
      'Albany': 'background: linear-gradient(135deg, #11998e, #38ef7d);',
      'Buffalo': 'background: linear-gradient(135deg, #f7971e, #ffd200);',
      'Rochester': 'background: linear-gradient(135deg, #1e3c72, #2a5298);',
      'Syracuse': 'background: linear-gradient(135deg, #8e2de2, #4a00e0);',
      'NYC Metro': 'background: linear-gradient(135deg, #e44d26, #f39c12);',
    };
    const headerColor = locationColors[location] || 'background: linear-gradient(135deg, #475569, #1e293b);';

    tablesHtml += `
      <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="${headerColor} padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">📍 ${groupKey}</h2>
          <span style="color: #ffffff; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px;">
            Leads: ${totalLeads} | Booked: ${bookedLeads} | New: ${newLeads} | Pending: ${pendingLeads}
          </span>
        </div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 16%;">Name</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 15%;">Phone</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 12%;">Location</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 14%;">Business Line</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 13%;">Salesperson</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 18%;">Stage</th>
              <th style="padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; width: 12%;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  });

  if (!tablesHtml) {
    tablesHtml = `
      <div style="text-align: center; padding: 60px 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 14px;">No leads found for the selected filters.</p>
      </div>
    `;
  }

  const totalLeads = processedLeads.length;
  const totalBooked = processedLeads.filter(l => l.stage.includes('Appointment Booked')).length;
  const totalNew = processedLeads.filter(l => l.stage.includes('New Leads')).length;
  const totalPending = processedLeads.filter(l => l.stage.includes('Pending')).length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Lead Report — ${today}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #ffffff;
          color: #1e293b;
          padding: 30px 40px;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 13px;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        th, td {
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #0f172a;
        }
        .header-left h1 {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .header-left p {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }
        .date-badge {
          background: #0f172a;
          color: #ffffff;
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
        }
        .summary-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }
        .summary-stats span {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }
        .summary-stats .num {
          color: #0f172a;
          font-weight: 800;
          margin-left: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { padding: 16px 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>📋 Sales Lead Report</h1>
          <p>KD Marketing Sales Database · Filter: ${dateLabel}</p>
        </div>
        <div class="date-badge">${today}</div>
      </div>

      <div class="summary-stats">
        <span>Total Leads: <span class="num">${totalLeads}</span></span>
        <span>|</span>
        <span>Appointment Booked: <span class="num">${totalBooked}</span></span>
        <span>|</span>
        <span>New Leads: <span class="num">${totalNew}</span></span>
        <span>|</span>
        <span>Pending Service: <span class="num">${totalPending}</span></span>
      </div>

      ${tablesHtml}

      <div class="footer">
        Confidential Internal Sales Report · Generated on ${new Date().toLocaleString()}
      </div>

      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  showToast(`PDF generated with ${totalLeads} leads grouped by location.`);
}

// Fallback function - queries csv_uploads if sales_leads fails
export async function generateFallbackPdfFromCsvUploads({ pdfFilterUser, pdfFilterStart, pdfFilterEnd, showToast }) {
  try {
    let query = supabase
      .from('csv_uploads')
      .select('file_name, status, created_at, user_id, profiles:user_id(name)')
      .order('created_at', { ascending: false });

    if (pdfFilterUser) query = query.eq('user_id', pdfFilterUser);
    if (pdfFilterStart) query = query.gte('created_at', pdfFilterStart);
    if (pdfFilterEnd) query = query.lte('created_at', pdfFilterEnd + 'T23:59:59');

    const { data: uploads, error } = await query;
    if (error) throw error;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('en-GB');
    const rowsHtml = !uploads || uploads.length === 0
      ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8">No data found for selected filters.</td></tr>`
      : uploads.map((f, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600">${f.profiles?.name || '—'}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-family:monospace">${f.file_name}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px">
            <span style="background:${f.status === 'success' ? '#dcfce7' : '#fee2e2'};color:${f.status === 'success' ? '#166534' : '#991b1b'};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700">${f.status || 'success'}</span>
          </td>
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;white-space:nowrap">${new Date(f.created_at).toLocaleString()}</td>
        </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><title>Upload Report — ${today}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}@page{size:A4 landscape;margin:12mm;}body{font-family:'Segoe UI',Arial,sans-serif;padding:28px 32px;font-size:13px;color:#1e293b}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #064e3b}.title{font-size:22px;font-weight:900;color:#064e3b}.meta{font-size:11px;color:#64748b;margin-top:4px}.badge{background:#064e3b;color:#fff;padding:5px 14px;border-radius:6px;font-size:12px;font-weight:700}table{width:100%;border-collapse:collapse;table-layout:fixed}thead tr{background:#1a3d2e}thead th{padding:11px 14px;color:#fff;font-size:11px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.05em}.footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px}@media print{body{padding:16px 20px}}</style>
    </head><body>
    <div class="header"><div><div class="title">Upload Activity Report</div><div class="meta">KD Marketing Sales Console · Generated: ${new Date().toLocaleString()}</div></div><div class="badge">${today}</div></div>
    <table><thead><tr><th>Salesperson</th><th>File Name</th><th>Status</th><th>Upload Date</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <div class="footer">Upload Activity Report · ${today} · Total: ${uploads?.length || 0} files</div>
    <script>setTimeout(()=>window.print(),600);<\/script></body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    showToast('Fallback PDF generated from upload records.');
  } catch (err) {
    console.error('Fallback PDF generation failed:', err);
    showToast('Failed to generate PDF. Please try again.');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Orchestrator used by the Audit Report tab's "Download" button.
// Queries sales_leads (falling back to csv_uploads if that table/query
// fails), then hands the rows to the printable-HTML generator above.
// ─────────────────────────────────────────────────────────────────────────
export async function downloadAuditPdf({ pdfFilterUser, pdfFilterStart, pdfFilterEnd, pdfFilterStage, showToast, setPdfGenerating }) {
  setPdfGenerating(true);
  try {
    let query = supabase
      .from('sales_leads')
      .select(`
        name,
        phone,
        location,
        business_line,
        salesperson,
        stage,
        lead_date,
        created_at,
        user_id,
        csv_upload_id,
        profiles:user_id(name)
      `)
      .order('created_at', { ascending: false });

    if (pdfFilterUser) query = query.eq('user_id', pdfFilterUser);
    if (pdfFilterStart) query = query.gte('created_at', pdfFilterStart);
    if (pdfFilterEnd) query = query.lte('created_at', pdfFilterEnd + 'T23:59:59');
    if (pdfFilterStage) query = query.ilike('stage', `%${pdfFilterStage}%`);

    const { data: leads, error } = await query;

    if (error) {
      console.warn('Error downloading leads from sales_leads, falling back to csv_uploads:', error.message);
      await generateFallbackPdfFromCsvUploads({ pdfFilterUser, pdfFilterStart, pdfFilterEnd, showToast });
      return;
    }

    if (!leads || leads.length === 0) {
      showToast('No leads found matching the filters.');
      setPdfGenerating(false);
      return;
    }

    generateLeadsPdf(leads, { pdfFilterStart, pdfFilterEnd, showToast });
  } catch (err) {
    console.error(err);
    showToast('Error generating PDF. Using fallback data.');
    await generateFallbackPdfFromCsvUploads({ pdfFilterUser, pdfFilterStart, pdfFilterEnd, showToast });
  } finally {
    setPdfGenerating(false);
  }
}
