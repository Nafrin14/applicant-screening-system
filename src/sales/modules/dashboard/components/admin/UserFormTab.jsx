export default function UserFormTab({
  isEditing,
  formName, setFormName,
  formEmail, setFormEmail,
  formPassword, setFormPassword,
  formResetPassword, setFormResetPassword,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm w-full max-w-2xl mx-auto">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{isEditing?'Modify User Account':'Create New User Account'}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
          <input type="text" required value={formName} onChange={e=>setFormName(e.target.value)} placeholder="e.g. Sarah Jenkins"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Company Email Address</label>
          <input type="email" required value={formEmail} onChange={e=>setFormEmail(e.target.value)} placeholder="name@kdmarketinggroup.org"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
          <p className="text-[10px] text-slate-400 mt-1">Must be a @kdmarketinggroup.org address — personal email domains are not allowed.</p>
        </div>
        {!isEditing && <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
          <input type="password" required value={formPassword} onChange={e=>setFormPassword(e.target.value)} placeholder="Minimum 6 characters"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
        </div>}
        {isEditing && <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Change Password <span className="normal-case font-normal text-slate-400">(optional)</span></label>
          <input type="password" value={formResetPassword} onChange={e=>setFormResetPassword(e.target.value)} placeholder="Leave blank to keep current password"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-900 focus:outline-none"/>
          <p className="text-[10px] text-slate-400 mt-1">The new password takes effect immediately — the user can log in with it right away.</p>
        </div>}
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="bg-emerald-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-emerald-950">{isEditing?'Save Changes':'Create User'}</button>
          <button type="button" onClick={onCancel} className="bg-slate-100 text-slate-600 font-bold text-xs px-4 py-3 rounded-xl hover:bg-slate-200">Cancel</button>
        </div>
      </form>
    </div>
  );
}
