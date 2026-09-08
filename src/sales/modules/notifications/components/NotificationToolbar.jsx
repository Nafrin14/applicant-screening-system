import { FaSearch, FaCheck, FaTrash } from "react-icons/fa";

export default function NotificationToolbar({ search, setSearch, onMarkAllRead, onClearAll }) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
      <div className="relative max-w-xl w-full">
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />

        <input
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl bg-white/5 border border-white/10 pl-14 pr-4 py-4 outline-none focus:border-emerald-400"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onMarkAllRead}
          className="rounded-xl border border-emerald-400/30 text-emerald-300 px-5 py-3 font-bold hover:bg-emerald-500/10"
        >
          <FaCheck className="inline mr-2" />
          Mark All as Read
        </button>

        <button
          onClick={onClearAll}
          className="rounded-xl border border-red-400/30 text-red-300 px-5 py-3 font-bold hover:bg-red-500/10"
        >
          <FaTrash className="inline mr-2" />
          Clear All
        </button>
      </div>
    </div>
  );
}
