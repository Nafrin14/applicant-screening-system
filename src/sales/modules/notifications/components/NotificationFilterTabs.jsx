function FilterButton({ label, value, filter, setFilter }) {
  return (
    <button
      onClick={() => setFilter(value)}
      className={`px-5 py-3 rounded-xl font-bold transition ${
        filter === value
          ? "bg-emerald-500 text-white"
          : "bg-black/25 border border-white/10 text-white/70"
      }`}
    >
      {label}
    </button>
  );
}

export default function NotificationFilterTabs({ filter, setFilter, unreadCount }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <FilterButton label="All" value="all" filter={filter} setFilter={setFilter} />
      <FilterButton label={`Unread ${unreadCount}`} value="unread" filter={filter} setFilter={setFilter} />
      <FilterButton label="Upload" value="upload" filter={filter} setFilter={setFilter} />
      <FilterButton label="Reports" value="reports" filter={filter} setFilter={setFilter} />
      <FilterButton label="System" value="system" filter={filter} setFilter={setFilter} />
    </div>
  );
}
