import { getTimeAgo } from "../utils/timeAgo";

function NotificationCard({ item, now, onRead, onDelete }) {
  const color =
    item.type === "upload"
      ? "bg-emerald-500"
      : item.type === "reports"
      ? "bg-purple-500"
      : "bg-red-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col md:flex-row md:items-center gap-5">
      <div
        className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-2xl`}
      >
        {item.icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">{item.title}</h3>

          {!item.is_read && (
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
          )}
        </div>

        <p className="text-white/60 mt-1">{item.message}</p>

        <span className="inline-block mt-3 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold capitalize">
          {item.type}
        </span>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
       <p className="text-white/50 text-sm">
  {getTimeAgo(item.created_at, now)}
</p>

        <div className="flex gap-2">
          {!item.is_read && (
            <button
              onClick={() => onRead(item.id)}
              className="rounded-xl border border-emerald-400/30 text-emerald-300 px-4 py-2 text-sm font-bold hover:bg-emerald-500/10"
            >
              Mark as Read
            </button>
          )}

          <button
            onClick={() => onDelete(item.id)}
            className="rounded-xl border border-red-400/30 text-red-300 px-4 py-2 text-sm font-bold hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationList({ filteredNotifications, now, onRead, onDelete }) {
  if (filteredNotifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold">No Notifications</h3>
        <p className="text-white/50 mt-2">
          Everything is up to date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredNotifications.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          now={now}
          onRead={onRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
