// ─── Date Range Helper ──────────────────────────────────────────────────────
// Resolves a named preset ('today', 'yesterday', 'last7', 'lastMonth') into a
// concrete { start, end } ISO date range. Shared by the CSV Vault filters and
// the Audit Report quick-preset buttons.
export const getDateRange = (preset) => {
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
