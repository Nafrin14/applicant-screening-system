import { useMemo, useRef, useState } from 'react';

const SUB_TABS = [
  ['all', 'All Records'],
  ['matched', 'Matched'],
  ['mismatched', 'Mismatched'],
  ['missing', 'Missing from GHL'],
  ['extra', 'Extra in GHL'],
  ['duplicates', 'Duplicates'],
  ['incomplete', 'Missing/Incomplete Data'],
];

const MISMATCH_FIELD_OPTIONS = ['Business Name', 'Customer Name', 'Phone', 'Email', 'Address', 'Salesperson', 'Status', 'Stage', 'Comment'];

function displayName(record) {
  if (!record) return '—';
  return record.businessName || record.name || '(no name)';
}

function recordSearchText(record) {
  if (!record) return '';
  return [record.businessName, record.name, record.phone, record.email, record.address, record.salesperson, record.status]
    .filter(Boolean).join(' ').toLowerCase();
}

function missingFieldsFor(record) {
  const missing = [];
  if (!record.phone && !record.email) missing.push('Phone/Email');
  if (!record.name && !record.businessName) missing.push('Name');
  if (!record.address) missing.push('Address');
  return missing;
}

// ─── Small shared bits ───────────────────────────────────────────────────
function FormatBadge({ format }) {
  if (!format) return null;
  const label = format === 'excel' ? 'XLSX' : format.toUpperCase();
  return <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{label}</span>;
}

function StatTile({ label, value, tone }) {
  const toneClass = { danger: 'text-red-600', warn: 'text-amber-600', ok: 'text-emerald-700' }[tone] || 'text-slate-900';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5">
      <span className={`text-xl font-black ${toneClass}`}>{value}</span>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function UploadZone({ title, hint, file, rows, format, busy, onFile }) {
  const inputRef = useRef(null);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1 min-w-[260px]">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
        <FormatBadge format={format} />
      </div>
      <p className="text-[11px] text-slate-400 mb-3">{hint}</p>
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
        onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
        className="w-full bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-950 disabled:opacity-50">
        {busy ? '⏳ Reading file…' : file ? '🔁 Replace File' : '📤 Choose File'}
      </button>
      {file && (
        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
          <p className="text-[11px] text-slate-400">{rows?.length ?? 0} row(s) read</p>
        </div>
      )}
    </div>
  );
}

function FilterBar({ search, onSearch, salesperson, onSalesperson, status, onStatus, salespeople, statuses, mismatchField, onMismatchField, showMismatchField }) {
  return (
    <div className="flex flex-wrap gap-3 items-end bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search</label>
        <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Name, business, phone, address…"
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-900" />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salesperson</label>
        <select value={salesperson} onChange={(e) => onSalesperson(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
          <option value="">All</option>
          {salespeople.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</label>
        <select value={status} onChange={(e) => onStatus(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
          <option value="">All</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {showMismatchField && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mismatch Type</label>
          <select value={mismatchField} onChange={(e) => onMismatchField(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-900">
            <option value="">Any field</option>
            {MISMATCH_FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function RecordRow({ category, master, ghl }) {
  const primary = master || ghl;
  const categoryStyle = {
    Matched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Mismatched: 'bg-amber-50 text-amber-700 border-amber-200',
    'Missing from GHL': 'bg-red-50 text-red-700 border-red-200',
    'Extra in GHL': 'bg-blue-50 text-blue-700 border-blue-200',
  }[category] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <tr className="hover:bg-slate-50/50">
      <td className="p-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${categoryStyle}`}>{category}</span></td>
      <td className="p-3 font-bold text-slate-800">{displayName(primary)}</td>
      <td className="p-3 text-slate-500">{primary?.phone || '—'}</td>
      <td className="p-3 text-slate-500 max-w-[220px] truncate">{primary?.address || '—'}</td>
      <td className="p-3 text-slate-500">{primary?.salesperson || '—'}</td>
      <td className="p-3 text-slate-500">{primary?.status || '—'}</td>
    </tr>
  );
}

function MismatchCard({ master, fields }) {
  const diffCount = fields.filter((f) => !f.match).length;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-sm text-slate-800">{displayName(master)}</p>
          <p className="text-[11px] text-slate-400">{master.phone || master.email || '—'}</p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full">{diffCount} field{diffCount !== 1 ? 's' : ''} differ</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50 border-b border-slate-100">
            <th className="p-3">Field</th><th className="p-3">Master Data</th><th className="p-3">GHL Data</th><th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {fields.map((f) => (
            <tr key={f.key} className={f.match ? '' : 'bg-red-50/40'}>
              <td className="p-3 font-bold text-slate-600">{f.field}</td>
              <td className="p-3 text-slate-700">{f.masterValue}</td>
              <td className="p-3 text-slate-700">{f.ghlValue}</td>
              <td className="p-3 text-center">{f.match ? '✅ Match' : '❌ Mismatch'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DuplicateGroup({ reason, sourceLabel, records }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{sourceLabel}</span>
        <p className="text-xs font-bold text-slate-700">{reason}</p>
        <span className="text-[11px] text-slate-400">· {records.length} records</span>
      </div>
      <table className="w-full text-left border-collapse">
        <tbody className="divide-y divide-slate-100 text-xs">
          {records.map((r) => (
            <tr key={r._index}>
              <td className="p-3 font-bold text-slate-800">{displayName(r)}</td>
              <td className="p-3 text-slate-500">{r.phone || '—'}</td>
              <td className="p-3 text-slate-500 max-w-[220px] truncate">{r.address || '—'}</td>
              <td className="p-3 text-slate-500">{r.salesperson || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataComparisonTab({
  masterFile, ghlFile, masterRows, ghlRows, masterFormat, ghlFormat,
  parsingMaster, parsingGhl, comparing, result,
  onMasterFile, onGhlFile, onCompare, onReset,
}) {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [status, setStatus] = useState('');
  const [mismatchField, setMismatchField] = useState('');

  const { salespeople, statuses } = useMemo(() => {
    if (!result) return { salespeople: [], statuses: [] };
    const all = [...result.masterRecords, ...result.ghlRecords];
    return {
      salespeople: [...new Set(all.map((r) => r.salesperson).filter(Boolean))].sort(),
      statuses: [...new Set(all.map((r) => r.status).filter(Boolean))].sort(),
    };
  }, [result]);

  const passesCommonFilters = (master, ghl) => {
    const text = `${recordSearchText(master)} ${recordSearchText(ghl)}`;
    if (search && !text.includes(search.toLowerCase())) return false;
    if (salesperson && master?.salesperson !== salesperson && ghl?.salesperson !== salesperson) return false;
    if (status && master?.status !== status && ghl?.status !== status) return false;
    return true;
  };

  const allRows = useMemo(() => {
    if (!result) return [];
    return [
      ...result.matched.map((m) => ({ key: `m-${m.master._index}-${m.ghl._index}`, category: m.hasMismatch ? 'Mismatched' : 'Matched', master: m.master, ghl: m.ghl })),
      ...result.missingFromGhl.map((m) => ({ key: `miss-${m.master._index}`, category: 'Missing from GHL', master: m.master, ghl: null })),
      ...result.extraInGhl.map((e) => ({ key: `extra-${e.ghl._index}`, category: 'Extra in GHL', master: null, ghl: e.ghl })),
    ];
  }, [result]);

  if (!result) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500 max-w-2xl">
          Upload the salesperson's Master Data Sheet and the GHL Lead Data export for the same period — the system matches records
          by phone, email, name, address, or Lead/Opportunity ID (whichever each side actually has) and flags mismatches,
          duplicates, and incomplete rows in one place.
        </p>
        <div className="flex flex-wrap gap-4">
          <UploadZone title="1 · Master Data Sheet" hint="The salesperson's tracking sheet — .csv, .xlsx, or .pdf."
            file={masterFile} rows={masterRows} format={masterFormat} busy={parsingMaster} onFile={onMasterFile} />
          <UploadZone title="2 · GHL Lead Data" hint="Export from the existing system — .csv, .xlsx, or .pdf."
            file={ghlFile} rows={ghlRows} format={ghlFormat} busy={parsingGhl} onFile={onGhlFile} />
        </div>
        <button type="button" onClick={onCompare} disabled={!masterRows?.length || !ghlRows?.length || comparing}
          className="bg-emerald-900 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed">
          {comparing ? '⏳ Comparing…' : '🔍 Compare Data'}
        </button>
        {(!masterRows?.length || !ghlRows?.length) && <p className="text-[11px] text-slate-400">Upload both files to enable comparison.</p>}
      </div>
    );
  }

  const { summary } = result;

  let rows = [];
  if (activeSubTab === 'all') rows = allRows.filter((r) => passesCommonFilters(r.master, r.ghl));
  if (activeSubTab === 'matched') rows = allRows.filter((r) => r.category === 'Matched' && passesCommonFilters(r.master, r.ghl));
  if (activeSubTab === 'missing') rows = allRows.filter((r) => r.category === 'Missing from GHL' && passesCommonFilters(r.master, r.ghl));
  if (activeSubTab === 'extra') rows = allRows.filter((r) => r.category === 'Extra in GHL' && passesCommonFilters(r.master, r.ghl));

  const mismatchedRows = activeSubTab === 'mismatched'
    ? result.mismatched.filter((m) => {
        if (!passesCommonFilters(m.master, m.ghl)) return false;
        if (mismatchField && !m.fields.some((f) => f.field === mismatchField && !f.match)) return false;
        return true;
      })
    : [];

  const duplicateGroups = activeSubTab === 'duplicates'
    ? [
        ...result.masterDuplicates.map((g) => ({ ...g, sourceLabel: 'Master Data' })),
        ...result.ghlDuplicates.map((g) => ({ ...g, sourceLabel: 'GHL Data' })),
      ].filter((g) => g.records.some((r) => passesCommonFilters(r, null) || passesCommonFilters(null, r)))
    : [];

  const incompleteRows = activeSubTab === 'incomplete'
    ? result.incomplete.filter(({ record }) => passesCommonFilters(record, null) || passesCommonFilters(null, record))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">{masterFile?.name}</span> vs <span className="font-bold text-slate-700">{ghlFile?.name}</span>
        </div>
        <button type="button" onClick={onReset} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">↺ Start Over</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatTile label="Total Master" value={summary.totalMaster} />
        <StatTile label="Total GHL" value={summary.totalGhl} />
        <StatTile label="Matching" value={summary.matched - summary.mismatched} tone="ok" />
        <StatTile label="Mismatched" value={summary.mismatched} tone="warn" />
        <StatTile label="Missing from GHL" value={summary.missingFromGhl} tone="danger" />
        <StatTile label="Extra in GHL" value={summary.extraInGhl} tone="warn" />
        <StatTile label="Duplicates" value={summary.duplicatesMaster + summary.duplicatesGhl} tone="warn" />
        <StatTile label="Incomplete" value={summary.incomplete} tone="danger" />
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-1">
        {SUB_TABS.map(([key, label]) => (
          <button key={key} onClick={() => setActiveSubTab(key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${activeSubTab === key ? 'bg-emerald-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            {label}
          </button>
        ))}
      </div>

      <FilterBar
        search={search} onSearch={setSearch}
        salesperson={salesperson} onSalesperson={setSalesperson}
        status={status} onStatus={setStatus}
        salespeople={salespeople} statuses={statuses}
        mismatchField={mismatchField} onMismatchField={setMismatchField}
        showMismatchField={activeSubTab === 'mismatched'}
      />

      {['all', 'matched', 'missing', 'extra'].includes(activeSubTab) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 border-b border-slate-200/60">
                <th className="p-3">Category</th><th className="p-3">Name / Business</th><th className="p-3">Phone</th>
                <th className="p-3">Address</th><th className="p-3">Salesperson</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.length === 0
                ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">No records match the current filters.</td></tr>
                : rows.map((r) => <RecordRow key={r.key} category={r.category} master={r.master} ghl={r.ghl} />)}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'mismatched' && (
        <div className="space-y-4">
          {mismatchedRows.length === 0
            ? <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">No mismatched records match the current filters.</div>
            : mismatchedRows.map((m) => <MismatchCard key={`${m.master._index}-${m.ghl._index}`} master={m.master} ghl={m.ghl} fields={m.fields} />)}
        </div>
      )}

      {activeSubTab === 'duplicates' && (
        <div className="space-y-4">
          {duplicateGroups.length === 0
            ? <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">No duplicate records found.</div>
            : duplicateGroups.map((g, i) => <DuplicateGroup key={`${g.sourceLabel}-${i}`} reason={g.reason} sourceLabel={g.sourceLabel} records={g.records} />)}
        </div>
      )}

      {activeSubTab === 'incomplete' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 border-b border-slate-200/60">
                <th className="p-3">Source</th><th className="p-3">Name / Business</th><th className="p-3">Phone</th>
                <th className="p-3">Address</th><th className="p-3">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {incompleteRows.length === 0
                ? <tr><td colSpan="5" className="p-8 text-center text-slate-400">No incomplete records match the current filters.</td></tr>
                : incompleteRows.map(({ record, sourceLabel }) => (
                  <tr key={`${sourceLabel}-${record._index}`}>
                    <td className="p-3"><span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{sourceLabel}</span></td>
                    <td className="p-3 font-bold text-slate-800">{displayName(record)}</td>
                    <td className="p-3 text-slate-500">{record.phone || '—'}</td>
                    <td className="p-3 text-slate-500 max-w-[220px] truncate">{record.address || '—'}</td>
                    <td className="p-3 text-red-600 font-semibold">{missingFieldsFor(record).join(', ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
