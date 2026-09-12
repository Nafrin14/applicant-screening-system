import { useEffect, useState } from "react";
import { supabase } from "../../../../core/lib/supabase";
import { formatDateString } from "../../../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────
// Loads the signed-in sales rep's own upload history (used for the stat
// cards and the calendar), and exposes a delete action for a single upload.
// ─────────────────────────────────────────────────────────────────────────
export default function useUploadHistory({ notify } = {}) {
  const [history, setHistory] = useState([]);
  const [markedDates, setMarkedDates] = useState([]);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);

  const loadUserUploadHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      setUserName(profile?.name || user.email?.split("@")[0] || "User");

      const { data, error } = await supabase
        .from("csv_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHistory(data || []);

      const dates = (data || []).map((item) =>
        formatDateString(item.created_at)
      );

      setMarkedDates([...new Set(dates)]);
    } catch (err) {
      console.error("Dashboard loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUpload = async (id, { confirmDialog } = {}) => {
    const confirmDelete = await confirmDialog(
      "Are you sure you want to delete this upload?",
      { danger: true, confirmLabel: "Delete" }
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("csv_uploads")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadUserUploadHistory();
    } catch (err) {
      notify?.(err.message, { type: "error" });
    }
  };

  useEffect(() => {
    loadUserUploadHistory();
  }, []);

  return {
    history,
    markedDates,
    userName,
    loading,
    refetch: loadUserUploadHistory,
    deleteUpload,
  };
}
