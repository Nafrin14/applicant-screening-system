function FilterButton({ label, value, filter, setFilter }) {
  return (
    <button
      onClick={() => setFilter(value)}
      className={`h-11 min-w-[130px] px-5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
        filter === value
          ? "bg-[#064E3B] text-white shadow-lg"
          : "bg-white border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

const FILTERS = [
  ["All", "all"],
  ["Today", "today"],
  ["Yesterday", "yesterday"],
  ["This Week", "week"],
  ["This Month", "month"],
  ["Custom Range", "custom"],
];

export default function ReportFilterBar({ filter, setFilter, fromDate, setFromDate, toDate, setToDate, onGenerate }) {
  return (
    <section className="dashboard-card mb-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {FILTERS.map(([label, value]) => (
            <FilterButton
              key={value}
              label={label}
              value={value}
              filter={filter}
              setFilter={setFilter}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-end gap-5 mt-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            From Date
          </label>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-14 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-700 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            To Date
          </label>

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-14 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-700 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
          />
        </div>

        <button
          onClick={onGenerate}
          className="h-14 px-8 rounded-xl bg-[#064E3B] hover:bg-[#065F46] text-white font-bold shadow-lg transition-all"
        >
          Generate Report
        </button>
      </div>
    </section>
  );
}
