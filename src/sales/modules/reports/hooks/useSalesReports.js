import { useEffect, useState } from "react";
import { supabase } from "../../../../core/lib/supabase";
import { getDateRange } from "../utils/reportDateRange";

// ─────────────────────────────────────────────────────────────────────────
// Loads csv_uploads for the signed-in rep, filtered by the selected date
// range, and derives the summary numbers the Sales Reports page shows.
// ─────────────────────────────────────────────────────────────────────────
export default function useSalesReports({ notify }) {
  const [uploads, setUploads] = useState([]);
  const [filter, setFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { start, end } = getDateRange(filter, fromDate, toDate);

      let query = supabase
        .from("csv_uploads")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setUploads(data || []);
    } catch (err) {
      notify(err.message || "Failed to load reports.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const totalUploads = uploads.length;

  const completedUploads = uploads.filter(
    (item) => item.status === "success"
  ).length;

  const failedUploads = uploads.filter(
    (item) => item.status === "failed"
  ).length;

  const missingUploads = totalUploads === 0 ? 1 : 0;

  const successRate =
    totalUploads === 0
      ? 0
      : Math.round((completedUploads / totalUploads) * 100);

  return {
    uploads,
    filter, setFilter,
    fromDate, setFromDate,
    toDate, setToDate,
    loading,
    loadReports,
    totalUploads,
    completedUploads,
    failedUploads,
    missingUploads,
    successRate,
  };
}
