import { getDateRange } from '../../utils/dateRange';
import { AUDIT_REPORT_STAGES } from '../../hooks/useAuditReport';

const QUICK_PRESETS = [['Today','today'],['Yesterday','yesterday'],['Last 7 Days','last7'],['Last Month','lastMonth']];

export default function AiReportTab({
  salesUsers,
  pdfFilterUser, setPdfFilterUser,
  pdfFilterStart, setPdfFilterStart,
  pdfFilterEnd, setPdfFilterEnd,
  pdfFilterStage, setPdfFilterStage,
  pdfGenerating,
  onDownload,
  aiGenerating,
  aiProgress,
  aiProgressLabel,
  reportData,
}) {
  const hasActiveFilters = pdfFilterStart||pdfFilterEnd||pdfFilterUser||pdfFilterStage;

  const summaryStats = [
    {label:'Total Leads',value:reportData?.totalLeads,color:'text-emerald-700',bg:'bg-emerald-50 border-emerald-200'},
    {label:'New Leads',value:reportData?.newLeads,color:'text-slate-900',bg:'bg-slate-50 border-slate-200'},
    {label:'Appt Booked',value:reportData?.apptBooked,color:'text-blue-700',bg:'bg-blue-50 border-blue-200'},
    {label:'Missing Uploads',value:reportData?.missingUploads,color:'text-red-600',bg:'bg-red-50 border-red-200'},
    {label:'Duplicate Flags',value:reportData?.duplicateFlags,color:'text-amber-600',bg:'bg-amber-50 border-amber-200'},
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-950 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">📥</span>
          <div>
            <h3 className="text-white font-black text-sm">Download Lead Summary Report</h3>
            <p className="text-emerald-300/70 text-xs mt-0.5">Simple table format — Name · Phone · Location · Business Line · Salesperson · Stage · Date</p>
          </div>
        </div>
        <div className="p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salesperson</label>
              <select value={pdfFilterUser} onChange={e=>setPdfFilterUser(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"
              >
                <option value="">All Salespeople</option>
                {salesUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
              <input type="date" value={pdfFilterStart} onChange={e=>setPdfFilterStart(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
              <input type="date" value={pdfFilterEnd} onChange={e=>setPdfFilterEnd(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stage</label>
              <select value={pdfFilterStage} onChange={e=>setPdfFilterStage(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"
              >
                <option value="">All Stages</option>
                {AUDIT_REPORT_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center">Quick Presets:</span>
            {QUICK_PRESETS.map(([label,preset])=>(
              <button key={preset} onClick={()=>{ const r=getDateRange(preset); setPdfFilterStart(r.start); setPdfFilterEnd(r.end); }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-all"
              >
                {label}
              </button>
            ))}
            {hasActiveFilters && (
              <button onClick={()=>{setPdfFilterUser('');setPdfFilterStart('');setPdfFilterEnd('');setPdfFilterStage('');}}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
              >
                ✕ Clear Filters
              </button>
            )}
          </div>

          <button onClick={onDownload} disabled={pdfGenerating}
            className="w-full sm:w-auto bg-emerald-900 text-white font-black text-sm px-6 lg:px-8 py-3.5 rounded-xl hover:bg-emerald-950 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {pdfGenerating ? '⏳ Processing Leads…' : '📥 Download Lead Report (PDF)'}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summaryStats.map(s=>(
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
  );
}
