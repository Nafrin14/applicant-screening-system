function SummaryItem({ title, value, icon, danger }) {
  return (
    <div className="rounded-2xl bg-black/20 border border-white/10 p-4 mb-3 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>

      <div>
        <p className="text-white/60 text-sm">{title}</p>
        <h3 className={danger ? "text-2xl font-black text-red-300" : "text-2xl font-black text-emerald-300"}>
          {value}
        </h3>
      </div>
    </div>
  );
}

export default function NotificationSummaryPanel({ total, unreadCount, todayCount }) {
  return (
    <section className="dashboard-card h-fit">
      <h2 className="text-xl font-bold mb-5">
        Notification Summary
      </h2>

      <SummaryItem title="Total Notifications" value={total} icon="📋" />
      <SummaryItem title="Unread Notifications" value={unreadCount} icon="🔔" danger />
      <SummaryItem title="Today's Notifications" value={todayCount} icon="📅" />
      <SummaryItem title="This Week" value={total} icon="📈" />
    </section>
  );
}
