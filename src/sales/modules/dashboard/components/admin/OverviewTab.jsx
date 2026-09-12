import CalendarTracker from '../../../../components/CalendarTracker';

export default function OverviewTab({
  salesUsers,
  uploadedCsvFiles,
  unupdatedUsers,
  overviewUserFilter,
  setOverviewUserFilter,
  markedDates,
  onAddUser,
  onGenerateReport,
}) {
  const today2 = new Date().toISOString().split('T')[0];
  const todayFiles = uploadedCsvFiles.filter(f=>f.created_at?.startsWith(today2));
  const overviewUsers = overviewUserFilter==='active' ? salesUsers.filter(u=>!unupdatedUsers.find(x=>x.id===u.id)) : overviewUserFilter==='missing' ? unupdatedUsers : salesUsers;

  const stats = [
    {label:'Active Sales Reps',  value:salesUsers.length,      color:'text-slate-900'},
    {label:'CSV Files Total',    value:uploadedCsvFiles.length,color:'text-emerald-700'},
    {label:"Today's Uploads",    value:todayFiles.length,      color:'text-blue-700'},
    {label:'Missing Today',      value:unupdatedUsers.length,  color:unupdatedUsers.length>0?'text-red-600':'text-emerald-600'},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s=>(
          <div key={s.label} className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200 shadow-sm text-center">
            <div className={`text-2xl lg:text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] lg:text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter Users</label>
              <select value={overviewUserFilter} onChange={e=>setOverviewUserFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"
              >
                <option value="">All Users</option>
                <option value="active">Uploaded Today</option>
                <option value="missing">Missing Upload</option>
              </select>
            </div>
            {overviewUserFilter && <button onClick={()=>setOverviewUserFilter('')} className="text-xs text-slate-400 hover:text-slate-600 underline mb-0.5">Clear</button>}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Salesperson Activity Today</h3>
              <span className="text-xs text-slate-400">{overviewUsers.length} shown</span>
            </div>
            <table className="w-full text-left border-collapse text-xs min-w-[500px]">
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
          <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-3">
              <button onClick={onAddUser} className="bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-950">+ Add New User</button>
              <button onClick={onGenerateReport} className="bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-900">🤖 Generate AI Report</button>
            </div>
          </div>
        </div>
        <div className="bg-emerald-950 rounded-2xl overflow-hidden shadow-sm h-fit">
          <div className="p-4 border-b border-emerald-900/60 text-white text-xs font-bold uppercase tracking-wider">Admin Task Schedule</div>
          <div className="p-3"><CalendarTracker markedDates={markedDates} /></div>
        </div>
      </div>
    </div>
  );
}
