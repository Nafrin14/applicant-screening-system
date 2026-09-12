import { useRef } from 'react';

const DATE_PRESET_LABELS = { today:'Today', yesterday:'Yesterday', last7:'Last 7 Days', lastMonth:'Last Month' };

export default function CsvVaultTab({
  salesUsers,
  csvFilterName, onFilterNameChange,
  csvDatePreset, onDatePresetChange,
  csvCustomStart, onCustomStartChange,
  csvCustomEnd, onCustomEndChange,
  csvFilterStatus, onFilterStatusChange,
  uniqueCsvNames,
  filteredCsvFiles,
  selectedCsvIds,
  onCheckbox,
  onSelectAll,
  onBulkDelete,
  onClearFilters,
  uploadTargetUserId,
  setUploadTargetUserId,
  onUploadOnBehalf,
  uploadingOnBehalf,
}) {
  const hasActiveFilters = csvFilterName || csvDatePreset || csvFilterStatus;
  const adminFileInputRef = useRef(null);

  return (
    <div className="space-y-4">
      {/* ─── Admin: upload a salesperson's CSV on their behalf ──────────── */}
      {onUploadOnBehalf && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-950 px-5 py-4 flex items-center gap-3">
            <span className="text-xl">📤</span>
            <div>
              <h4 className="text-white font-black text-sm">Upload Leads CSV</h4>
              <p className="text-emerald-300/70 text-xs mt-0.5">If a salesperson is on leave, upload their CSV here on their behalf — it's saved exactly as if they'd uploaded it themselves.</p>
            </div>
          </div>
          <div className="p-4 lg:p-5 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Upload on behalf of</label>
              <select
                value={uploadTargetUserId}
                onChange={e => setUploadTargetUserId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"
              >
                <option value="">Select a salesperson…</option>
                {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <input
              ref={adminFileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={onUploadOnBehalf}
              className="hidden"
            />
            <button
              type="button"
              disabled={!uploadTargetUserId || uploadingOnBehalf}
              onClick={() => adminFileInputRef.current?.click()}
              className="bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!uploadTargetUserId ? 'Pick a salesperson first' : ''}
            >
              {uploadingOnBehalf ? '⏳ Uploading…' : '📤 Choose CSV File(s)'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter CSV Files</h4>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salesperson</label>
            <select value={csvFilterName} onChange={e=>onFilterNameChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"
            >
              <option value="">All Salespeople</option>
              {uniqueCsvNames.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date Range</label>
            <select value={csvDatePreset} onChange={e=>onDatePresetChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range…</option>
            </select>
          </div>
          {csvDatePreset==='custom' && <>
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From</label>
              <input type="date" value={csvCustomStart} onChange={e=>onCustomStartChange(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"/>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To</label>
              <input type="date" value={csvCustomEnd} onChange={e=>onCustomEndChange(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"/>
            </div>
          </>}
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Upload Status</label>
            <select value={csvFilterStatus} onChange={e=>onFilterStatusChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 items-center ml-auto">
            {hasActiveFilters && <button onClick={onClearFilters} className="text-xs text-slate-400 hover:text-slate-600 underline">Clear all</button>}
            {selectedCsvIds.length>0 && <button onClick={onBulkDelete} className="bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-red-700">🗑 Delete {selectedCsvIds.length}</button>}
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {csvFilterName && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full">{csvFilterName}</span>}
            {csvDatePreset&&csvDatePreset!=='custom' && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full">{DATE_PRESET_LABELS[csvDatePreset]}</span>}
            {csvDatePreset==='custom'&&(csvCustomStart||csvCustomEnd) && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full">{csvCustomStart} → {csvCustomEnd}</span>}
            {csvFilterStatus && <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-3 py-1 rounded-full capitalize">{csvFilterStatus}</span>}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Salesperson File Upload Index</h3>
            <p className="text-xs text-slate-400 mt-0.5">{filteredCsvFiles.length} file{filteredCsvFiles.length!==1?'s':''} shown{selectedCsvIds.length>0&&` · ${selectedCsvIds.length} selected`}</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 w-10"><input type="checkbox" checked={filteredCsvFiles.length>0&&selectedCsvIds.length===filteredCsvFiles.length} onChange={onSelectAll} className="rounded border-slate-300 cursor-pointer"/></th>
              <th className="p-4">File Name</th><th className="p-4">Salesperson</th><th className="p-4">Upload Date</th><th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredCsvFiles.length===0?<tr><td colSpan="5" className="p-8 text-center text-slate-400">No files match filters.</td></tr>
            :filteredCsvFiles.map(file=>(
              <tr key={file.id} className={`hover:bg-slate-50/40 transition-colors ${selectedCsvIds.includes(file.id)?'bg-emerald-50/40':''}`}>
                <td className="p-4"><input type="checkbox" checked={selectedCsvIds.includes(file.id)} onChange={()=>onCheckbox(file.id)} className="rounded border-slate-300 cursor-pointer"/></td>
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
  );
}
