import React, { useEffect, useState } from "react";
import { FaTimes, FaDownload, FaChartBar } from "react-icons/fa";
import { supabase } from "../../../../core/lib/supabase";
import { useNotification } from "../../../../core/context/NotificationContext";

const HISTORY_ITEMS_PER_PAGE = 10;

const getBatchStatus = (batch) => {
  if (batch.failed === 0) return "Complete";
  if (batch.sent === 0) return "Failed";
  return "Partial";
};

const statusPillClass = (status) => {
  if (status === "Complete") return "bg-green-100 text-green-700";
  if (status === "Failed") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const buildExportFileName = () => `bulk_actions_report_${Date.now()}.csv`;

function BulkActionsReport() {
  const { notify } = useNotification();

  const [bulkLogs, setBulkLogs] = useState([]);
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyOperationFilter, setHistoryOperationFilter] = useState("All");
  const [historyUserFilter, setHistoryUserFilter] = useState("All");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDetailBatchId, setHistoryDetailBatchId] = useState(null);

  useEffect(() => {
    fetchBulkHistory();
  }, []);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyDateFrom, historyDateTo, historyStatusFilter, historyOperationFilter, historyUserFilter]);

  const fetchBulkHistory = async () => {
    const { data, error } = await supabase
      .from("bulk_send_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.log("fetchBulkHistory error (table may not exist yet):", error);
      return;
    }

    setBulkLogs(data || []);
  };

  // Group raw per-candidate logs into per-batch rows
  const bulkHistory = (() => {
    const batches = {};
    bulkLogs.forEach((row) => {
      if (!batches[row.batch_id]) {
        batches[row.batch_id] = {
          batchId: row.batch_id,
          label: row.label || "Untitled",
          channel: row.channel,
          sentBy: row.sent_by || "—",
          sent: 0,
          failed: 0,
          createdAt: row.sent_at,
          completedAt: row.sent_at,
        };
      }
      const batch = batches[row.batch_id];
      if (row.status === "sent") batch.sent += 1;
      else batch.failed += 1;
      if (new Date(row.sent_at) < new Date(batch.createdAt)) batch.createdAt = row.sent_at;
      if (new Date(row.sent_at) > new Date(batch.completedAt)) batch.completedAt = row.sent_at;
    });
    return Object.values(batches).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  })();

  const historyUsers = Array.from(
    new Set(bulkHistory.map((b) => b.sentBy).filter(Boolean))
  );

  const historyFiltered = bulkHistory.filter((batch) => {
    const status = getBatchStatus(batch);
    const createdDate = batch.createdAt ? batch.createdAt.slice(0, 10) : "";

    if (historyDateFrom && createdDate < historyDateFrom) return false;
    if (historyDateTo && createdDate > historyDateTo) return false;
    if (historyStatusFilter !== "All" && status !== historyStatusFilter) return false;
    if (historyOperationFilter !== "All" && batch.channel !== historyOperationFilter) return false;
    if (historyUserFilter !== "All" && batch.sentBy !== historyUserFilter) return false;
    return true;
  });

  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyFiltered.length / HISTORY_ITEMS_PER_PAGE)
  );
  const historyPaginated = historyFiltered.slice(
    (historyPage - 1) * HISTORY_ITEMS_PER_PAGE,
    historyPage * HISTORY_ITEMS_PER_PAGE
  );

  const handleExportHistory = () => {
    const filteredBatchIds = new Set(historyFiltered.map((b) => b.batchId));
    const rows = bulkLogs.filter((log) => filteredBatchIds.has(log.batch_id));

    if (rows.length === 0) {
      notify("Nothing to export for the current filters", { type: "error" });
      return;
    }

    const header = [
      "Action Label",
      "Operation",
      "Candidate",
      "Status",
      "Error",
      "Sent At",
      "User",
    ];
    const csvRows = [
      header,
      ...rows.map((r) => [
        r.label || "Untitled",
        r.channel,
        r.candidate_name,
        r.status,
        r.error || "",
        r.sent_at ? new Date(r.sent_at).toLocaleString() : "",
        r.sent_by || "",
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fileName = buildExportFileName();
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const detailBatchLogs = historyDetailBatchId
    ? bulkLogs.filter((log) => log.batch_id === historyDetailBatchId)
    : [];

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#f8f9fa]">
      <div className="px-6 py-5 border-b border-slate-200 bg-white">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Send History
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review and export the history of every bulk SMS, WhatsApp, and Email send.
        </p>
      </div>

      <div className="p-6">
        <div className="max-w-6xl">
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={handleExportHistory}
              className="flex items-center gap-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-[#111b21] px-3 py-2 rounded-lg transition-colors"
            >
              <FaDownload size={12} /> Export
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-3 bg-white border border-gray-200 rounded-xl p-3">
            <span className="text-xs font-semibold text-gray-500">Filters</span>
            <input
              type="date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
            />
            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none bg-white"
            >
              <option value="All">All statuses</option>
              <option value="Complete">Complete</option>
              <option value="Partial">Partial</option>
              <option value="Failed">Failed</option>
            </select>
            <select
              value={historyOperationFilter}
              onChange={(e) => setHistoryOperationFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none bg-white"
            >
              <option value="All">All operations</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
            <select
              value={historyUserFilter}
              onChange={(e) => setHistoryUserFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none bg-white"
            >
              <option value="All">All users</option>
              {historyUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {historyFiltered.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-6 text-center">
              No bulk actions found for these filters.
            </p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 font-semibold">Action Label</th>
                      <th className="px-4 py-3 font-semibold">Operation</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                      <th className="px-4 py-3 font-semibold">Completed</th>
                      <th className="px-4 py-3 font-semibold">Statistics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyPaginated.map((batch) => {
                      const status = getBatchStatus(batch);
                      return (
                        <tr key={batch.batchId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-[#111b21]">
                            {batch.label}
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-600">
                            {batch.channel}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusPillClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{batch.sentBy}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(batch.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(batch.completedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setHistoryDetailBatchId(batch.batchId)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-[#111b21] hover:text-blue-600"
                              title="View per-candidate breakdown"
                            >
                              <FaChartBar className="text-gray-400" />
                              <span className="text-green-600">{batch.sent}</span>/
                              <span className="text-red-500">{batch.failed}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Page {historyPage} of {historyTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setHistoryPage((p) => Math.min(historyTotalPages, p + 1))
                      }
                      disabled={historyPage === historyTotalPages}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch Detail Modal (Statistics drill-down) */}
      {historyDetailBatchId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-[#111b21]">Batch Detail</h3>
              <button
                onClick={() => setHistoryDetailBatchId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 divide-y divide-gray-100">
              {detailBatchLogs.map((log) => (
                <div
                  key={`${log.candidate_id}-${log.sent_at}`}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="text-[#111b21] font-medium">{log.candidate_name}</p>
                    {log.error && (
                      <p className="text-xs text-red-500 mt-0.5">{log.error}</p>
                    )}
                  </div>
                  {log.status === "sent" ? (
                    <span className="text-green-600 font-semibold">✓ Sent</span>
                  ) : (
                    <span className="text-red-500 font-semibold">✕ Failed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkActionsReport;
