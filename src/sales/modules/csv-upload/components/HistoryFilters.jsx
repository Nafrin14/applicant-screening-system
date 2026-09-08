import { FaSearch } from "react-icons/fa";

const FILTERS = [
  ["all", "All"],
  ["today", "Today"],
  ["week", "This Week"],
  ["month", "This Month"],
];

export default function HistoryFilters({ search, setSearch, filter, setFilter }) {
  const filterButtonClass = (type) =>
    `w-full h-11 rounded-xl text-sm font-bold transition ${
      filter === type
        ? "bg-[#064E3B] text-white shadow-md"
        : "bg-white border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white"
    }`;

  return (
    <div className="dashboard-card mb-8 py-8">
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#064E3B]" />
        <input
          type="text"
          placeholder="Search file name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-14 rounded-xl bg-white border border-[#064E3B] pl-12 pr-4 outline-none text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#064E3B] shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
        {FILTERS.map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={filterButtonClass(type)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
