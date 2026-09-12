const NAV_ITEMS = [
  ['overview','📊 Performance Overview'],
  ['users','👥 Manage All Users'],
  ['assignments','🧭 Business Assignments'],
  ['csv-vault','📄 View Salesperson Records'],
  ['ai-report','🎯 Final Audit Report'],
  ['data-comparison','🔍 Data Comparison'],
];

export default function AdminSidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen, onLogout }) {
  return (
    <>
      {/* ─── MOBILE OVERLAY ─────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className={`
        w-72 h-screen fixed top-0 left-0 bg-emerald-950 text-white flex flex-col justify-between
        shrink-0 shadow-2xl border-r border-emerald-900 z-20
        transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div>
          <div className="p-6 border-b border-emerald-900/60">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-white rounded-full inline-block animate-pulse"></span>
             KD Marketing Sales
            </h1>
            <p className="text-xs text-emerald-300/70 font-medium mt-1">Admin Dashboard Workspace</p>
          </div>
          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.map(([key,label]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab===key
                    ? 'bg-white text-emerald-950 shadow-md'
                    : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-emerald-900/60">
          <button onClick={onLogout}
            className="w-full bg-transparent hover:bg-red-500/10 text-red-300 border border-red-500/20 font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Log Out of System
          </button>
        </div>
      </aside>
    </>
  );
}
