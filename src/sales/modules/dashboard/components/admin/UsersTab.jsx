export default function UsersTab({ salesUsers, uploadedCsvFiles, unupdatedUsers, onAddUser, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">System User Directory ({salesUsers.length} active)</h3>
        <button onClick={onAddUser} className="bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-950">+ Add New User</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
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
                  <button onClick={()=>onEdit(user)} className="text-emerald-700 hover:underline">Edit</button>
                  <button onClick={()=>onDelete(user.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
