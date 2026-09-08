import SalesSidebar from "../../../components/SalesSidebar";
import SalesNavbar from "../../../components/SalesNavbar";

import useNotifications from "../hooks/useNotifications";
import NotificationToolbar from "../components/NotificationToolbar";
import NotificationFilterTabs from "../components/NotificationFilterTabs";
import NotificationList from "../components/NotificationList";
import NotificationSummaryPanel from "../components/NotificationSummaryPanel";
import NotificationSettingsPanel from "../components/NotificationSettingsPanel";

export default function Notifications() {
  const {
    search, setSearch,
    filter, setFilter,
    now,
    notifications,
    filteredNotifications,
    unreadCount,
    todayCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useNotifications();

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
          <NotificationToolbar
            search={search}
            setSearch={setSearch}
            onMarkAllRead={markAllAsRead}
            onClearAll={clearAll}
          />

          <div className="grid xl:grid-cols-4 gap-6">
            <section className="dashboard-card xl:col-span-3">
              <NotificationFilterTabs filter={filter} setFilter={setFilter} unreadCount={unreadCount} />

              <NotificationList
                filteredNotifications={filteredNotifications}
                now={now}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            </section>

            <aside className="space-y-6">
              <NotificationSummaryPanel
                total={notifications.length}
                unreadCount={unreadCount}
                todayCount={todayCount}
              />

              <NotificationSettingsPanel />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
