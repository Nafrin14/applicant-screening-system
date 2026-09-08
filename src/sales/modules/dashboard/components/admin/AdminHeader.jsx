function titleForTab(activeTab, isEditing) {
  switch (activeTab) {
    case 'user-form': return isEditing ? 'Edit User' : 'Create User';
    case 'ai-report': return 'Final Audit Report';
    case 'overview': return 'Performance Overview';
    case 'users': return 'Manage Users';
    default: return 'Records';
  }
}

export default function AdminHeader({ activeTab, isEditing, loading, onRefresh, onOpenMobileMenu }) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 lg:py-5 flex justify-between items-center shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <div>
          <h2 className="text-lg lg:text-2xl font-black text-slate-900 tracking-tight">
            {titleForTab(activeTab, isEditing)}
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Database Sync: Live</p>
        </div>
      </div>
      <button onClick={onRefresh} disabled={loading}
        className="text-xs bg-slate-100 text-slate-700 px-3 lg:px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-60"
      >
        {loading ? '⏳ Refreshing…' : '🔄 Refresh Records'}
      </button>
    </header>
  );
}
