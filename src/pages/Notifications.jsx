import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "../supabase";
import SalesSidebar from "../components/SalesSidebar";
import SalesNavbar from "../components/SalesNavbar";
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaSearch,
  FaCloudUploadAlt,
  FaChartLine,
  FaCog,
  FaEnvelope,
} from "react-icons/fa";
const getTimeAgo = (date, now = new Date()) => {
  const past = new Date(date);
  const diffMs = now - past;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "Yesterday";

  return past.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
export default function Notifications() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(new Date());

 const [notifications, setNotifications] = useState([]);
 const loadNotifications = async () => {
  const { data, error } = await supabase
    .from("notifications")
.select("*")
.eq("module", "sales")
.order("created_at", { ascending: false });

  if (error) {
    console.log(error.message);
    return;
  }

  setNotifications(data || []);
};
useEffect(() => {
  loadNotifications();

  const timer = setInterval(() => {
    setNow(new Date());
  }, 60000);

  return () => clearInterval(timer);
}, []);
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "all" ||
        (filter === "unread" && !item.is_read) ||
        item.type === filter;

      return matchSearch && matchFilter;
    });
  }, [notifications, search, filter]);

 const unreadCount = notifications.filter(
  (item) => !item.is_read
).length;

 const todayCount = notifications.filter((item) => {
  const created = new Date(item.created_at);
  const today = new Date();

  return created.toDateString() === today.toDateString();
}).length;
  const markAsRead = async (id) => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    console.log(error.message);
    return;
  }

  loadNotifications();
};

 const markAllAsRead = async () => {
 const { error } = await supabase
  .from("notifications")
  .update({ is_read: true })
  .eq("module", "sales")
  .eq("is_read", false);

  if (error) {
    console.log(error.message);
    return;
  }

  loadNotifications();
};

const clearAll = async () => {
  const { error } = await supabase
    .from("notifications")
   .delete()
.eq("module", "sales");

  if (error) {
    console.log(error.message);
    return;
  }

  loadNotifications();
};

 const deleteNotification = async (id) => {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) {
    console.log(error.message);
    return;
  }

  loadNotifications();
};

  return (
    <div className="min-h-screen bg-[#021b16] text-white">
      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Notifications"
          subtitle="View and manage all your system notifications."
          uploadedToday={unreadCount === 0}
        />

        <div className="px-6 py-10 md:px-10">
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
                onClick={markAllAsRead}
                className="rounded-xl border border-emerald-400/30 text-emerald-300 px-5 py-3 font-bold hover:bg-emerald-500/10"
              >
                <FaCheck className="inline mr-2" />
                Mark All as Read
              </button>

              <button
                onClick={clearAll}
                className="rounded-xl border border-red-400/30 text-red-300 px-5 py-3 font-bold hover:bg-red-500/10"
              >
                <FaTrash className="inline mr-2" />
                Clear All
              </button>
            </div>
          </div>

          <div className="grid xl:grid-cols-4 gap-6">
            <section className="dashboard-card xl:col-span-3">
              <div className="flex flex-wrap gap-3 mb-6">
                <FilterButton label="All" value="all" filter={filter} setFilter={setFilter} />
                <FilterButton label={`Unread ${unreadCount}`} value="unread" filter={filter} setFilter={setFilter} />
                <FilterButton label="Upload" value="upload" filter={filter} setFilter={setFilter} />
                <FilterButton label="Reports" value="reports" filter={filter} setFilter={setFilter} />
                <FilterButton label="System" value="system" filter={filter} setFilter={setFilter} />
              </div>

              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold">No Notifications</h3>
                    <p className="text-white/50 mt-2">
                      Everything is up to date.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => (
                   <NotificationCard
  key={item.id}
  item={item}
  now={now}
  onRead={markAsRead}
  onDelete={deleteNotification}
/>
                  ))
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="dashboard-card h-fit">
                <h2 className="text-xl font-bold mb-5">
                  Notification Summary
                </h2>

                <SummaryItem title="Total Notifications" value={notifications.length} icon="📋" />
                <SummaryItem title="Unread Notifications" value={unreadCount} icon="🔔" danger />
                <SummaryItem title="Today's Notifications" value={todayCount} icon="📅" />
                <SummaryItem title="This Week" value={notifications.length} icon="📈" />
              </section>

              <section className="dashboard-card h-fit">
                <h2 className="text-xl font-bold mb-5">
                  Notification Settings
                </h2>

                <SettingRow label="Email Notifications" />
                <SettingRow label="Upload Alerts" />
                <SettingRow label="Report Alerts" />
                <SettingRow label="System Alerts" />

                <button className="mt-5 w-full rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 py-3 font-bold">
                  ⚙ Manage Preferences
                </button>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

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

function NotificationCard({
  item,
  now,
  onRead,
  onDelete,
}) {
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
          {!item.isRead && (
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

function SettingRow({ label }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-white/70">{label}</span>

      <span className="w-12 h-6 rounded-full bg-emerald-500 relative">
        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></span>
      </span>
    </div>
  );
}