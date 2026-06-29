import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import CalendarTracker from '../components/CalendarTracker';
import { validateEmail } from '../utils/validation';
import { formatDateString } from '../utils/helpers';


// ─── Date Range Helper ──────────────────────────────────────────────────────
const getDateRange = (preset) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  switch (preset) {
    case 'today':     return { start: today, end: today };
    case 'yesterday': { const d = new Date(now); d.setDate(d.getDate()-1); const s=d.toISOString().split('T')[0]; return {start:s,end:s}; }
    case 'last7':     { const d = new Date(now); d.setDate(d.getDate()-6); return {start:d.toISOString().split('T')[0],end:today}; }
    case 'lastMonth': { const f=new Date(now.getFullYear(),now.getMonth()-1,1); const l=new Date(now.getFullYear(),now.getMonth(),0); return {start:f.toISOString().split('T')[0],end:l.toISOString().split('T')[0]}; }
    default: return { start:'', end:'' };
  }
};
const [parsedCsvData, setParsedCsvData] = useState([]);
const [csvFileName, setCsvFileName] = useState('');

const handleCsvUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setCsvFileName(file.name); // add this state too
  const reader = new FileReader();
  reader.onload = (evt) => {
    const lines = evt.target.result.split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]));
    });
    setParsedCsvData(rows);
  };
  reader.readAsText(file);
};

{csvFileName && (
  <div className="text-sm font-bold text-emerald-700">
    📄 Analyzing: {csvFileName}
  </div>
)}

export default function SalesAdminDashboard() {
  // ── Database State ─────────────────────────────────────────────────────────
  const [salesUsers,       setSalesUsers]       = useState([]);
  const [uploadedCsvFiles, setUploadedCsvFiles] = useState([]);
  const [markedDates,      setMarkedDates]      = useState([]);
  const [unupdatedUsers,   setUnupdatedUsers]   = useState([]);

  // ── Navigation & UI ────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('overview');
  const [loading,      setLoading]      = useState(false);
  const [notification, setNotification] = useState('');

  // ── User Form ──────────────────────────────────────────────────────────────
  const [isEditing,         setIsEditing]         = useState(false);
  const [targetUserId,      setTargetUserId]      = useState(null);
  const [formName,          setFormName]          = useState('');
  const [formEmail,         setFormEmail]         = useState('');
  const [formPassword,      setFormPassword]      = useState('');
  const [formResetPassword, setFormResetPassword] = useState('');

  // ── CSV Filters ────────────────────────────────────────────────────────────
  const [csvFilterName,   setCsvFilterName]   = useState('');
  const [csvDatePreset,   setCsvDatePreset]   = useState('');
  const [csvCustomStart,  setCsvCustomStart]  = useState('');
  const [csvCustomEnd,    setCsvCustomEnd]    = useState('');
  const [csvFilterStatus, setCsvFilterStatus] = useState('');
  const [selectedCsvIds,  setSelectedCsvIds]  = useState([]);

  // ── Overview filter ────────────────────────────────────────────────────────
  const [overviewUserFilter, setOverviewUserFilter] = useState('');

  // ── AI Report ──────────────────────────────────────────────────────────────
  const [aiReport,        setAiReport]        = useState('');
  const [aiGenerating,    setAiGenerating]    = useState(false);
  const [aiProgress,      setAiProgress]      = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState('');
  const [reportData,      setReportData]      = useState(null);

  // ── PDF filter state ───────────────────────────────────────────────────────
  const [pdfFilterUser,  setPdfFilterUser]  = useState('');
  const [pdfFilterStart, setPdfFilterStart] = useState('');
  const [pdfFilterEnd,   setPdfFilterEnd]   = useState('');
  const [pdfFilterStage, setPdfFilterStage] = useState('');
  const [pdfGenerating,  setPdfGenerating]  = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. FETCH
  // ─────────────────────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles').select('*').eq('role','user').eq('is_active',true).order('created_at',{ascending:false});
      if (pError) throw pError;
      setSalesUsers(profiles||[]);

      const { data: csvFiles, error: cError } = await supabase
        .from('csv_uploads').select(`id,file_name,status,created_at,user_id,profiles:user_id(name,email)`).order('created_at',{ascending:false});
      if (cError) throw cError;
      setUploadedCsvFiles(csvFiles||[]);
      setMarkedDates([...new Set((csvFiles||[]).map(i=>formatDateString(i.created_at)))]);

      const todayStamp = new Date().toISOString().split('T')[0];
      const activeTodayEmails = new Set((csvFiles||[]).filter(f=>f.created_at?.startsWith(todayStamp)).map(f=>f.profiles?.email).filter(Boolean));
      setUnupdatedUsers((profiles||[]).filter(u=>!activeTodayEmails.has(u.email)));
      setSelectedCsvIds([]);
    } catch(err) { console.error(err); showToast('Error pulling data from database.'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchDashboardData(); },[]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. USER CRUD
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenCreateMode = () => {
    setIsEditing(false); setTargetUserId(null);
    setFormName(''); setFormEmail(''); setFormPassword(''); setFormResetPassword('');
    setActiveTab('user-form');
  };
  const handleOpenEditMode = (user) => {
    setIsEditing(true); setTargetUserId(user.id);
    setFormName(user.name||''); setFormEmail(user.email||'');
    setFormPassword(''); setFormResetPassword('');
    setActiveTab('user-form');
  };
  const handleSaveUserForm = async (e) => {
    e.preventDefault();
    if (!validateEmail(formEmail)) { alert('Please enter a valid email address.'); return; }
    try {
      if (isEditing) {
        const { error } = await supabase.from('profiles').update({name:formName,email:formEmail}).eq('id',targetUserId);
        if (error) throw error;
        if (formResetPassword.trim().length>0) {
          if (formResetPassword.trim().length<6) { alert('Password must be at least 6 characters.'); return; }
          const {error:pwErr} = await supabase.auth.admin.updateUserById(targetUserId,{password:formResetPassword.trim()});
          if (pwErr) throw pwErr;
          showToast(`Password updated for: ${formEmail}`);
        } else { showToast(`User details saved for: ${formEmail}`); }
      } else {
        const {error:authError} = await supabase.auth.signUp({email:formEmail,password:formPassword||'PasswordSecure123!',options:{data:{full_name:formName,role:'user'}}});
        if (authError) throw authError;
        showToast(`New user created: ${formEmail}`);
      }
      setActiveTab('users'); fetchDashboardData();
    } catch(err) { alert(err.message||'Failed to save user.'); }
  };
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const {error} = await supabase.from('profiles').update({is_active:false}).eq('id',id);
      if (error) throw error;
      showToast('User deleted.'); fetchDashboardData();
    } catch(err) { alert('Error deleting user.'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3. CSV FILTERS
  // ─────────────────────────────────────────────────────────────────────────
  const uniqueCsvNames = [...new Set(uploadedCsvFiles.map(f=>f.profiles?.name).filter(Boolean))].sort();
  const resolveDateRange = () => {
    if (csvDatePreset==='custom') return {start:csvCustomStart,end:csvCustomEnd};
    if (csvDatePreset) return getDateRange(csvDatePreset);
    return {start:'',end:''};
  };
  const filteredCsvFiles = uploadedCsvFiles.filter(f => {
    if (csvFilterName && f.profiles?.name!==csvFilterName) return false;
    if (csvFilterStatus && f.status!==csvFilterStatus) return false;
    const {start,end} = resolveDateRange();
    const fd = f.created_at?.split('T')[0]||'';
    if (start && fd<start) return false;
    if (end   && fd>end)   return false;
    return true;
  });
  const handleCsvCheckbox = (id) => setSelectedCsvIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const handleSelectAllCsvs = (e) => setSelectedCsvIds(e.target.checked?filteredCsvFiles.map(f=>f.id):[]);
  const handleBulkDeleteCsvs = async () => {
    if (!selectedCsvIds.length) return;
    if (!window.confirm(`Delete ${selectedCsvIds.length} file(s)?`)) return;
    try {
      const {error} = await supabase.from('csv_uploads').delete().in('id',selectedCsvIds);
      if (error) throw error;
      showToast(`${selectedCsvIds.length} file(s) deleted.`); setSelectedCsvIds([]); fetchDashboardData();
    } catch(err) { alert('Error deleting files.'); }
  };
  const clearCsvFilters = () => { setCsvFilterName('');setCsvDatePreset('');setCsvCustomStart('');setCsvCustomEnd('');setCsvFilterStatus('');setSelectedCsvIds([]); };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. PDF DOWNLOAD — Clean Location-wise Data Sheet Generation
  // ─────────────────────────────────────────────────────────────────────────
  const handleDownloadAIPdf = async () => {
    setPdfGenerating(true);
    try {
      let query = supabase
        .from('csv_uploads')
        .select('file_name, status, created_at, user_id, profiles:user_id(name)')
        .order('created_at', { ascending: false });

      if (pdfFilterUser)  query = query.eq('user_id', pdfFilterUser);
      if (pdfFilterStart) query = query.gte('created_at', pdfFilterStart);
      if (pdfFilterEnd)   query = query.lte('created_at', pdfFilterEnd + 'T23:59:59');

      const { data: leads, error } = await query;

      if (error) {
        console.warn('Error downloading database leads, reverting to fallback data state:', error.message);
        generateFallbackPdf();
        return;
      }

      generateLeadsPdf(leads || []);
    } catch(err) {
      console.error(err);
      generateFallbackPdf();
    } finally {
      setPdfGenerating(false);
    }
  };

  const generateLeadsPdf = (leads) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('Allow pop-ups to download the PDF.'); return; }

    const today = new Date().toLocaleDateString('en-GB');
    const dateLabel = pdfFilterStart && pdfFilterEnd ? `${pdfFilterStart} → ${pdfFilterEnd}` : 'All Historical Dates';

    // 1. DEDUPLICATE AND CLEAN LEADS
    const uniqueLeadsMap = new Map();
    leads.forEach(lead => {
      const phoneDigits = (lead.phone || '').replace(/\D/g, '');
      const matchKey = phoneDigits.slice(-10) || lead.name || lead.file_name;
      
      if (!uniqueLeadsMap.has(matchKey)) {
        let location = 'Other / Unassigned';
        const fileContext = (lead.file_name || '').toLowerCase();
        const rawLoc = (lead.location || '').toLowerCase();
        
        if (fileContext.includes('rochester') || rawLoc.includes('rochester') || matchKey.startsWith('585')) {
          location = 'Rochester';
        } else if (fileContext.includes('albany') || rawLoc.includes('albany') || matchKey.startsWith('518')) {
          location = 'Albany';
        } else if (fileContext.includes('buffalo') || rawLoc.includes('buffalo') || matchKey.startsWith('716')) {
          location = 'Buffalo';
        } else if (matchKey.startsWith('347') || matchKey.startsWith('646')) {
          location = 'NYC Metro';
        }

        let businessLine = 'General Pipeline';
        if (fileContext.includes('fence')) businessLine = 'Fencing';
        else if (fileContext.includes('tree') || fileContext.includes('branch')) businessLine = 'Tree Service';
        else if (fileContext.includes('landscaping')) businessLine = 'Landscaping';

        uniqueLeadsMap.set(matchKey, {
          name: (lead.name || lead.file_name || 'Opportunity Lead').split(',')[0].split('  ')[0].trim(),
          phone: lead.phone || '—',
          location: location,
          business_line: businessLine,
          stage: lead.stage || 'Appointment Booked',
          date: lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
        });
      }
    });

    const processedLeads = Array.from(uniqueLeadsMap.values());

    // 2. GROUP LEADS BY GEOGRAPHIC REGION
    const locationsList = ['Rochester', 'Albany', 'Buffalo', 'NYC Metro', 'Other / Unassigned'];
    let tablesHtml = '';

    locationsList.forEach(loc => {
      const locLeads = processedLeads.filter(l => l.location === loc);
      if (locLeads.length === 0) return;

      const totalLoc = locLeads.length;
      const bookedLoc = locLeads.filter(l => l.stage.toLowerCase().includes('book')).length;

      const rows = locLeads.map((lead, i) => `
        <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
          <td style="padding: 12px 16px; font-weight: 600; color: #1e293b;">${lead.name}</td>
          <td style="padding: 12px 16px; color: #475569; font-family: monospace;">${lead.phone}</td>
          <td style="padding: 12px 16px; color: #475569;">${lead.business_line}</td>
          <td style="padding: 12px 16px;">
            <span class="badge-stage ${lead.stage.toLowerCase().includes('book') ? 'bg-booked' : 'bg-new'}">${lead.stage}</span>
          </td>
          <td style="padding: 12px 16px; color: #64748b;">${lead.date}</td>
        </tr>
      `).join('');

      const themeClass = loc === 'Rochester' ? 'bg-rochester' : loc === 'Albany' ? 'bg-albany' : 'bg-slate';

      tablesHtml += `
        <div class="location-card">
          <div class="location-header ${themeClass}">
            <h2>📍 ${loc.toUpperCase()} REGION</h2>
            <span class="summary-count">Leads: ${totalLoc} | Appointments: ${bookedLoc}</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Opportunity Name</th>
                <th>Phone Number</th>
                <th>Line of Business</th>
                <th>Pipeline Stage</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Lead Report — ${today}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #1e293b; padding: 30px; font-size: 13px; }
          .report-title-block { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 2px solid #0f172a; }
          .report-title-block h1 { font-size: 24px; font-weight: 900; color: #0f172a; }
          .report-title-block p { font-size: 11px; color: #64748b; margin-top: 2px; }
          .date-stamp { background: #0f172a; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; }
          .location-card { background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 30px; border: 1px solid #e2e8f0; overflow: hidden; }
          .location-header { padding: 14px 20px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; }
          .location-header h2 { font-size: 14px; font-weight: 800; letter-spacing: 0.5px; }
          .summary-count { font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; }
          .bg-rochester { background: linear-gradient(135deg, #1e3c72, #2a5298); }
          .bg-albany { background: linear-gradient(135deg, #11998e, #38ef7d); }
          .bg-slate { background: linear-gradient(135deg, #475569, #1e293b); }
          .data-table { width: 100%; border-collapse: collapse; text-align: left; }
          .data-table th { background: #f1f5f9; padding: 12px 16px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
          .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f3f5; font-size: 13px; }
          .badge-stage { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .bg-booked { background-color: #dbeafe; color: #1e40af; }
          .bg-new { background-color: #dcfce7; color: #166534; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { body { padding: 0; background: #fff; } .location-card { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="report-title-block">
          <div>
            <h1>Consolidated Sales Operations Ledger</h1>
            <p>HQ Database Pipeline Export &nbsp;·&nbsp; Filter Window: ${dateLabel}</p>
          </div>
          <div class="date-stamp">${today}</div>
        </div>
        ${tablesHtml}
        <div class="footer">Confidential Internal Sales Dashboard Log — HQ Sales Console</div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    showToast('PDF Ledger structured by location successfully.');
  };

  const generateFallbackPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const today = new Date().toLocaleDateString('en-GB');

    let rows = [...uploadedCsvFiles];
    if (pdfFilterUser)  rows = rows.filter(f=>f.user_id===pdfFilterUser);
    if (pdfFilterStart) rows = rows.filter(f=>f.created_at>=pdfFilterStart);
    if (pdfFilterEnd)   rows = rows.filter(f=>f.created_at<=pdfFilterEnd+'T23:59:59');

    const rowsHtml = rows.length===0
      ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8">No data found for selected filters.</td></tr>`
      : rows.map((f,i)=>`
        <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600">${f.profiles?.name||'—'}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-family:monospace">${f.file_name}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px">
            <span style="background:${f.status==='success'?'#dcfce7':'#fee2e2'};color:${f.status==='success'?'#166534':'#991b1b'};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700">${f.status||'success'}</span>
          </td>
          <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;white-space:nowrap">${new Date(f.created_at).toLocaleString()}</td>
        </tr>`).join('');

    const html=`<!DOCTYPE html><html><head><title>Upload Report — ${today}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;padding:28px 32px;font-size:13px;color:#1e293b}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #064e3b}.title{font-size:22px;font-weight:900;color:#064e3b}.meta{font-size:11px;color:#64748b;margin-top:4px}.badge{background:#064e3b;color:#fff;padding:5px 14px;border-radius:6px;font-size:12px;font-weight:700}table{width:100%;border-collapse:collapse}thead tr{background:#1a3d2e}thead th{padding:11px 14px;color:#fff;font-size:11px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.05em}.footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px}@media print{body{padding:16px 20px}}</style>
</head><body>
<div class="header"><div><div class="title">Upload Activity Report</div><div class="meta">HQ Sales Console · Generated: ${new Date().toLocaleString()}</div></div><div class="badge">${today}</div></div>
<table><thead><tr><th>Salesperson</th><th>File Name</th><th>Status</th><th>Upload Date</th></tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="footer">Upload Activity Report · ${today} · Total: ${rows.length} files</div>
<script>setTimeout(()=>window.print(),600);<\/script></body></html>`;
    printWindow.document.write(html); printWindow.document.close();
    showToast('PDF ready — use Print → Save as PDF.');
  };

  const showToast = (msg) => { setNotification(msg); setTimeout(()=>setNotification(''),4500); };
  const handleLogout = async () => {
    if (window.confirm('Log out?')) { await supabase.auth.signOut(); localStorage.removeItem('isLoggedIn'); window.location.href='/login'; }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const today2 = new Date().toISOString().split('T')[0];
  const todayFiles = uploadedCsvFiles.filter(f=>f.created_at?.startsWith(today2));
  const overviewUsers = overviewUserFilter==='active' ? salesUsers.filter(u=>!unupdatedUsers.find(x=>x.id===u.id)) : overviewUserFilter==='missing' ? unupdatedUsers : salesUsers;

  const uniqueStages = ['Appointment Booked','New Leads','Pending Service Completion','General'];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* SIDEBAR */}
      <aside className="w-72 bg-emerald-950 text-white flex flex-col justify-between shrink-0 shadow-2xl border-r border-emerald-900">
        <div>
          <div className="p-6 border-b border-emerald-900/60">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-white rounded-full inline-block animate-pulse"></span>
              HQ Sales Console
            </h1>
            <p className="text-xs text-emerald-300/70 font-medium mt-1">Admin Dashboard Workspace</p>
          </div>
          <nav className="p-4 space-y-1.5">
            {[['overview','📊 Performance Overview'],['users','👥 Manage All Users'],['csv-vault','📄 View Salesperson CSVs'],['ai-report','🤖 AI Audit Report']].map(([key,label])=>(
              <button key={key} onClick={()=>setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab===key?'bg-white text-emerald-950 shadow-md':'text-emerald-100 hover:bg-emerald-900/50'}`}>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-emerald-900/60">
          <button onClick={handleLogout}
            className="w-full bg-transparent hover:bg-red-500/10 text-red-300 border border-red-500/20 font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Log Out of System
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab==='user-form'?(isEditing?'Edit User':'Create User'):activeTab==='ai-report'?'AI Audit Report':activeTab==='overview'?'Performance Overview':activeTab==='users'?'Manage Users':'CSV Vault'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Database Sync: Live</p>
          </div>
          <button onClick={fetchDashboardData} disabled={loading}
            className="text-xs bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-60">
            {loading?'⏳ Refreshing…':'🔄 Refresh Records'}
          </button>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">

          {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────── */}
          {activeTab==='overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {label:'Active Sales Reps',  value:salesUsers.length,      color:'text-slate-900'},
                  {label:'CSV Files Total',    value:uploadedCsvFiles.length,color:'text-emerald-700'},
                  {label:"Today's Uploads",    value:todayFiles.length,      color:'text-blue-700'},
                  {label:'Missing Today',      value:unupdatedUsers.length,  color:unupdatedUsers.length>0?'text-red-600':'text-emerald-600'},
                ].map(s=>(
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
                    <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex gap-3 items-end flex-wrap">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter Users</label>
                      <select value={overviewUserFilter} onChange={e=>setOverviewUserFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
                        <option value="">All Users</option>
                        <option value="active">Uploaded Today</option>
                        <option value="missing">Missing Upload</option>
                      </select>
                    </div>
                    {overviewUserFilter && <button onClick={()=>setOverviewUserFilter('')} className="text-xs text-slate-400 hover:text-slate-600 underline mb-0.5">Clear</button>}
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-sm text-slate-800">Salesperson Activity Today</h3>
                      <span className="text-xs text-slate-400">{overviewUsers.length} shown</span>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                          <th className="p-4">Name</th><th className="p-4">Email</th>
                          <th className="p-4 text-center">Today</th><th className="p-4 text-center">Total</th><th className="p-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {overviewUsers.length===0 ? <tr><td colSpan="5" className="p-6 text-center text-slate-400">No users match filter.</td></tr>
                        : overviewUsers.map(u=>{
                          const todayU=uploadedCsvFiles.filter(f=>f.profiles?.email===u.email&&f.created_at?.startsWith(today2));
                          const totalU=uploadedCsvFiles.filter(f=>f.profiles?.email===u.email);
                          const miss=unupdatedUsers.find(x=>x.id===u.id);
                          return(<tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-900">{u.name||'N/A'}</td>
                            <td className="p-4 font-mono text-slate-500">{u.email}</td>
                            <td className="p-4 text-center font-bold">{todayU.length}</td>
                            <td className="p-4 text-center text-slate-500">{totalU.length}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${miss?'bg-red-50 text-red-700 border border-red-200':'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                {miss?'Needs Upload':'✓ Uploaded'}
                              </span>
                            </td>
                          </tr>);
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={handleOpenCreateMode} className="bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-950">+ Add New User</button>
                      <button onClick={()=>setActiveTab('ai-report')} className="bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-900">🤖 Generate AI Report</button>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-950 rounded-2xl overflow-hidden shadow-sm h-fit">
                  <div className="p-4 border-b border-emerald-900/60 text-white text-xs font-bold uppercase tracking-wider">Admin Task Schedule</div>
                  <div className="p-3"><CalendarTracker markedDates={markedDates} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: MANAGE USERS ─────────────────────────────────────── */}
          {activeTab==='users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">System User Directory ({salesUsers.length} active)</h3>
                <button onClick={handleOpenCreateMode} className="bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-950">+ Add New User</button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 border-b border-slate-200/60">
                      <th className="p-4">Full Name</th><th className="p-4">Email</th>
                      <th className="p-4 text-center">Files</th><th className="p-4 text-center">Today Status</th><th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesUsers.length===0?<tr><td colSpan="5" className="p-8 text-center text-slate-400">No users found.</td></tr>
                    :salesUsers.map(user=>{
                      const total=uploadedCsvFiles.filter(f=>f.profiles?.email===user.email).length;
                      const miss=unupdatedUsers.find(x=>x.id===user.id);
                      return(<tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{user.name||'N/A'}</td>
                        <td className="p-4 font-mono text-slate-500">{user.email}</td>
                        <td className="p-4 text-center font-semibold">{total}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${miss?'bg-red-50 text-red-700 border border-red-200':'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {miss?'Needs Upload':'✓ Uploaded'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-4 font-bold">
                          <button onClick={()=>handleOpenEditMode(user)} className="text-emerald-700 hover:underline">Edit</button>
                          <button onClick={()=>handleDeleteUser(user.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>);
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: USER FORM ────────────────────────────────────────── */}
          {activeTab==='user-form' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{isEditing?'Modify User Account':'Create New User Account'}</h3>
              <form onSubmit={handleSaveUserForm} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                  <input type="text" required value={formName} onChange={e=>setFormName(e.target.value)} placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                  <input type="email" required value={formEmail} onChange={e=>setFormEmail(e.target.value)} placeholder="name@company.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
                </div>
                {!isEditing && <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
                  <input type="password" required value={formPassword} onChange={e=>setFormPassword(e.target.value)} placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
                </div>}
                {isEditing && <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Reset Password <span className="normal-case font-normal text-slate-400">(leave blank to keep current)</span></label>
                  <input type="password" value={formResetPassword} onChange={e=>setFormResetPassword(e.target.value)} placeholder="Enter new password to reset"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
                </div>}
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="bg-emerald-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-emerald-950">{isEditing?'Save Changes':'Create User'}</button>
                  <button type="button" onClick={()=>setActiveTab('users')} className="bg-slate-100 text-slate-600 font-bold text-xs px-4 py-3 rounded-xl hover:bg-slate-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── TAB 4: CSV VAULT ────────────────────────────────────────── */}
          {activeTab==='csv-vault' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter CSV Files</h4>
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salesperson</label>
                    <select value={csvFilterName} onChange={e=>{setCsvFilterName(e.target.value);setSelectedCsvIds([]);}}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
                      <option value="">All Salespeople</option>
                      {uniqueCsvNames.map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date Range</label>
                    <select value={csvDatePreset} onChange={e=>{setCsvDatePreset(e.target.value);setCsvCustomStart('');setCsvCustomEnd('');setSelectedCsvIds([]);}}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7">Last 7 Days</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="custom">Custom Range…</option>
                    </select>
                  </div>
                  {csvDatePreset==='custom' && <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From</label>
                      <input type="date" value={csvCustomStart} onChange={e=>{setCsvCustomStart(e.target.value);setSelectedCsvIds([]);}} className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To</label>
                      <input type="date" value={csvCustomEnd} onChange={e=>{setCsvCustomEnd(e.target.value);setSelectedCsvIds([]);}} className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"/>
                    </div>
                  </>}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Upload Status</label>
                    <select value={csvFilterStatus} onChange={e=>{setCsvFilterStatus(e.target.value);setSelectedCsvIds([]);}}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
                      <option value="">All Statuses</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center ml-auto">
                    {(csvFilterName||csvDatePreset||csvFilterStatus) && <button onClick={clearCsvFilters} className="text-xs text-slate-400 hover:text-slate-600 underline">Clear all</button>}
                    {selectedCsvIds.length>0 && <button onClick={handleBulkDeleteCsvs} className="bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-red-700">🗑 Delete {selectedCsvIds.length}</button>}
                  </div>
                </div>
                {(csvFilterName||csvDatePreset||csvFilterStatus) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {csvFilterName && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full">{csvFilterName}</span>}
                    {csvDatePreset&&csvDatePreset!=='custom' && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full">{{today:'Today',yesterday:'Yesterday',last7:'Last 7 Days',lastMonth:'Last Month'}[csvDatePreset]}</span>}
                    {csvDatePreset==='custom'&&(csvCustomStart||csvCustomEnd) && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full">{csvCustomStart} → {csvCustomEnd}</span>}
                    {csvFilterStatus && <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-3 py-1 rounded-full capitalize">{csvFilterStatus}</span>}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Salesperson File Upload Index</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{filteredCsvFiles.length} file{filteredCsvFiles.length!==1?'s':''} shown{selectedCsvIds.length>0&&` · ${selectedCsvIds.length} selected`}</p>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                      <th className="p-4 w-10"><input type="checkbox" checked={filteredCsvFiles.length>0&&selectedCsvIds.length===filteredCsvFiles.length} onChange={handleSelectAllCsvs} className="rounded border-slate-300 cursor-pointer"/></th>
                      <th className="p-4">File Name</th><th className="p-4">Salesperson</th><th className="p-4">Upload Date</th><th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCsvFiles.length===0?<tr><td colSpan="5" className="p-8 text-center text-slate-400">No files match filters.</td></tr>
                    :filteredCsvFiles.map(file=>(
                      <tr key={file.id} className={`hover:bg-slate-50/40 transition-colors ${selectedCsvIds.includes(file.id)?'bg-emerald-50/40':''}`}>
                        <td className="p-4"><input type="checkbox" checked={selectedCsvIds.includes(file.id)} onChange={()=>handleCsvCheckbox(file.id)} className="rounded border-slate-300 cursor-pointer"/></td>
                        <td className="p-4 font-mono font-bold text-emerald-950 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0"></span>{file.file_name}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{file.profiles?.name||'System Operator'}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{file.profiles?.email||'N/A'}</span>
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">{new Date(file.created_at).toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${file.status==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-red-50 text-red-700 border border-red-200'}`}>{file.status||'success'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 5: AI REPORT ────────────────────────────────────────── */}
          {activeTab==='ai-report' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-emerald-950 px-6 py-4 flex items-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div>
                    <h3 className="text-white font-black text-sm">Download Lead Summary Report</h3>
                    <p className="text-emerald-300/70 text-xs mt-0.5">Structured Location Ledger — Name · Phone · Business Line · Stage · Date</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salesperson</label>
                      <select value={pdfFilterUser} onChange={e=>setPdfFilterUser(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
                        <option value="">All Salespeople</option>
                        {salesUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
                      <input type="date" value={pdfFilterStart} onChange={e=>setPdfFilterStart(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
                      <input type="date" value={pdfFilterEnd} onChange={e=>setPdfFilterEnd(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stage</label>
                      <select value={pdfFilterStage} onChange={e=>setPdfFilterStage(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
                        <option value="">All Stages</option>
                        {uniqueStages.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center">Quick Presets:</span>
                    {[['Today','today'],['Yesterday','yesterday'],['Last 7 Days','last7'],['Last Month','lastMonth']].map(([label,preset])=>(
                      <button key={preset} onClick={()=>{ const r=getDateRange(preset); setPdfFilterStart(r.start); setPdfFilterEnd(r.end); }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-all">
                        {label}
                      </button>
                    ))}
                    {(pdfFilterStart||pdfFilterEnd||pdfFilterUser||pdfFilterStage) && (
                      <button onClick={()=>{setPdfFilterUser('');setPdfFilterStart('');setPdfFilterEnd('');setPdfFilterStage('');}}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">
                        ✕ Clear Filters
                      </button>
                    )}
                  </div>

                  <button onClick={handleDownloadAIPdf} disabled={pdfGenerating}
                    className="w-full sm:w-auto bg-emerald-900 text-white font-black text-sm px-8 py-3.5 rounded-xl hover:bg-emerald-950 disabled:opacity-60 transition-all flex items-center gap-2">
                    {pdfGenerating ? '⏳ Processing Leads…' : '📥 Download Regional Master PDF'}
                  </button>
                </div>
              </div>

              {aiGenerating && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">{aiProgressLabel}</span>
                    <span className="text-[11px] text-slate-400 font-bold">{aiProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{width:`${aiProgress}%`}}/>
                  </div>
                </div>
              )}

              {reportData && !aiGenerating && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      {label:'Total Leads',value:reportData.totalLeads,color:'text-emerald-700',bg:'bg-emerald-50 border-emerald-200'},
                      {label:'New Leads',value:reportData.newLeads,color:'text-slate-900',bg:'bg-slate-50 border-slate-200'},
                      {label:'Appt Booked',value:reportData.apptBooked,color:'text-blue-700',bg:'bg-blue-50 border-blue-200'},
                      {label:'Missing Uploads',value:reportData.missingUploads,color:'text-red-600',bg:'bg-red-50 border-red-200'},
                      {label:'Duplicate Flags',value:reportData.duplicateFlags,color:'text-amber-600',bg:'bg-amber-50 border-amber-200'},
                    ].map(s=>(
                      <div key={s.label} className={`border rounded-xl p-3.5 text-center ${s.bg}`}>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value??'—'}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {reportData.executiveSummary && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="font-black text-slate-900 text-[11px] uppercase tracking-wider block mb-2">📋 Executive Summary</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{reportData.executiveSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"/>
          <p className="font-bold tracking-wide">{notification}</p>
        </div>
      )}
    </div>
  );
}