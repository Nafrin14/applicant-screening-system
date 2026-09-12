import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../core/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────
// Loads and manages the sales module's notifications (module="sales"):
// search/filter state, a `now` clock that ticks every minute so relative
// timestamps stay fresh, and the read/delete actions.
// ─────────────────────────────────────────────────────────────────────────
export default function useNotifications() {
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

  return {
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
  };
}
