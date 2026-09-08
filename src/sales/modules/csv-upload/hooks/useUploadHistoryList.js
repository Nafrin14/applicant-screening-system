import { useEffect, useState } from "react";
import { supabase } from "../../../../core/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────
// Loads the signed-in sales rep's CSV upload history, and provides the
// search/date-range filtering and delete action used by the Upload
// History page.
// ─────────────────────────────────────────────────────────────────────────
export default function useUploadHistoryList({ notify, confirmDialog }) {
  const [uploads, setUploads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const today = new Date().toDateString();

  const totalFiles = uploads.length;

  const completedFiles = uploads.filter(
    (item) => item.status === "success"
  ).length;

  const todayUploads = uploads.filter(
    (item) => new Date(item.created_at).toDateString() === today
  ).length;

  const loadUploads = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("csv_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUploads(data || []);
    } catch (err) {
      console.error("Upload history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUpload = async (id) => {
    const confirmDelete = await confirmDialog(
      "Are you sure you want to delete this upload?",
      { danger: true, confirmLabel: "Delete" }
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("csv_uploads")
      .delete()
      .eq("id", id);

    if (error) {
      notify(error.message, { type: "error" });
      return;
    }

    loadUploads();
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const filteredUploads = uploads.filter((item) => {
    const matchesSearch =
      !search ||
      item.file_name?.toLowerCase().includes(search.toLowerCase());

    const uploadDate = new Date(item.created_at);
    const now = new Date();

    const isToday = uploadDate.toDateString() === now.toDateString();

    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const isThisWeek = uploadDate >= weekAgo;

    const isThisMonth =
      uploadDate.getMonth() === now.getMonth() &&
      uploadDate.getFullYear() === now.getFullYear();

    if (filter === "today") return matchesSearch && isToday;
    if (filter === "week") return matchesSearch && isThisWeek;
    if (filter === "month") return matchesSearch && isThisMonth;

    return matchesSearch;
  });

  return {
    search, setSearch,
    filter, setFilter,
    loading,
    totalFiles,
    completedFiles,
    todayUploads,
    filteredUploads,
    deleteUpload,
  };
}
