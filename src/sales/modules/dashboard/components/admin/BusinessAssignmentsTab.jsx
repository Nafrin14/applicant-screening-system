import { useState } from 'react';

export default function BusinessAssignmentsTab({ assignments, salesUsers, loading, saving, onSave }) {
  const [newLocation, setNewLocation] = useState('');
  const [newSalesperson, setNewSalesperson] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState('');

  const resolveUserId = (name) => salesUsers.find(u => u.name === name)?.id || null;

  const startEdit = (row) => { setEditingRow(row.id); setEditValue(row.salesperson_name); };
  const cancelEdit = () => { setEditingRow(null); setEditValue(''); };

  const submitEdit = async (row) => {
    const ok = await onSave(row.business_location, editValue, resolveUserId(editValue));
    if (ok) cancelEdit();
  };

  const submitNew = async (e) => {
    e.preventDefault();
    const ok = await onSave(newLocation, newSalesperson, resolveUserId(newSalesperson));
    if (ok) { setNewLocation(''); setNewSalesperson(''); }
  };

  return (
    <div className="space-y-4">
      <datalist id="assignment-salesperson-names">
        {salesUsers.map(u => <option key={u.id} value={u.name} />)}
      </datalist>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Business → Salesperson Assignments ({assignments.length})</h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">This is what the Final Lead Report looks up when it's generated — reassigning a business here updates every future report immediately, without editing any uploaded CSV data.</p>
        </div>
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 border-b border-slate-200/60">
              <th className="p-4">Business</th>
              <th className="p-4">Assigned Salesperson</th>
              <th className="p-4">Last Updated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-slate-400">No businesses configured yet — add one below, or run supabase-sql/business_assignments.sql to seed the current mapping.</td></tr>
            ) : assignments.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">{row.business_location}</td>
                <td className="p-4">
                  {editingRow === row.id ? (
                    <input
                      type="text"
                      list="assignment-salesperson-names"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      autoFocus
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900 w-full sm:w-auto"
                    />
                  ) : (
                    <span className="font-semibold text-emerald-900">{row.salesperson_name}</span>
                  )}
                </td>
                <td className="p-4 text-slate-400">{row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'}</td>
                <td className="p-4 text-right space-x-3 font-bold">
                  {editingRow === row.id ? (
                    <>
                      <button onClick={() => submitEdit(row)} disabled={saving} className="text-emerald-700 hover:underline disabled:opacity-50">Save</button>
                      <button onClick={cancelEdit} className="text-slate-400 hover:underline">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(row)} className="text-emerald-700 hover:underline">Reassign</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm max-w-xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add a Business</h4>
        <form onSubmit={submitNew} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Business Location</label>
            <input type="text" required value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Utica"
              className="text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-900"/>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salesperson</label>
            <input type="text" required list="assignment-salesperson-names" value={newSalesperson} onChange={e => setNewSalesperson(e.target.value)} placeholder="Name"
              className="text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-900"/>
          </div>
          <button type="submit" disabled={saving} className="bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-950 disabled:opacity-60">{saving ? 'Saving…' : '+ Add / Update'}</button>
        </form>
      </div>
    </div>
  );
}
