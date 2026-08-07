import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import SalesSidebar from "../components/SalesSidebar";
import SalesNavbar from "../components/SalesNavbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNotification } from "../context/NotificationContext";
import {
  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPercent,
  FaDownload,
  FaPrint,
  FaTimesCircle,
} from "react-icons/fa";

export default function SalesReports() {
  const { notify } = useNotification();
  const [uploads, setUploads] = useState([]);
  const [filter, setFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [filter]);

  const getDateRange = () => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (filter === "all") {
      start = new Date("2000-01-01");
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    if (filter === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (filter === "yesterday") {
      start.setDate(today.getDate() - 1);
      start.setHours(0, 0, 0, 0);

      end.setDate(today.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    }

    if (filter === "week") {
      start.setDate(today.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    }

    if (filter === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end.setHours(23, 59, 59, 999);
    }

    if (filter === "custom" && fromDate && toDate) {
      start = new Date(fromDate);
      end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const loadReports = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { start, end } = getDateRange();

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

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("KD MARKETING", 14, 20);

    doc.setFontSize(14);
    doc.text("CSV UPLOAD REPORT", 14, 30);

    doc.setFontSize(11);
    doc.text(`Report Type: ${filter.toUpperCase()}`, 14, 45);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 53);

    autoTable(doc, {
      startY: 65,
      head: [["Summary", "Value"]],
      body: [
        ["Total Uploads", totalUploads],
        ["Completed", completedUploads],
        ["Failed Uploads", failedUploads],
        ["Missing", missingUploads],
        ["Success Rate", `${successRate}%`],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["File Name", "Uploaded Date & Time", "Status"]],
      body: uploads.map((item) => [
        item.file_name,
        new Date(item.created_at).toLocaleString(),
        item.status || "success",
      ]),
    });

    doc.save("csv-report.pdf");
  };

  const downloadExcel = () => {
    const reportData = uploads.map((item, index) => ({
      No: index + 1,
      "File Name": item.file_name,
      "Uploaded Date": new Date(item.created_at).toLocaleString(),
      Status: item.status || "success",
    }));

    const summaryData = [
      { Summary: "Total Uploads", Value: totalUploads },
      { Summary: "Completed", Value: completedUploads },
      { Summary: "Failed Uploads", Value: failedUploads },
      { Summary: "Missing", Value: missingUploads },
      { Summary: "Success Rate", Value: `${successRate}%` },
    ];

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const reportSheet = XLSX.utils.json_to_sheet(reportData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, reportSheet, "Upload Details");

    XLSX.writeFile(workbook, "csv-upload-report.xlsx");
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Reports"
          subtitle="Generate and review CSV upload reports."
          uploadedToday={uploads.length > 0}
        />

        <div className="px-6 py-7 md:px-10">
          <section className="dashboard-card mb-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-3">
                <FilterButton
                  label="All"
                  value="all"
                  filter={filter}
                  setFilter={setFilter}
                />

                <FilterButton
                  label="Today"
                  value="today"
                  filter={filter}
                  setFilter={setFilter}
                />

                <FilterButton
                  label="Yesterday"
                  value="yesterday"
                  filter={filter}
                  setFilter={setFilter}
                />

                <FilterButton
                  label="This Week"
                  value="week"
                  filter={filter}
                  setFilter={setFilter}
                />

                <FilterButton
                  label="This Month"
                  value="month"
                  filter={filter}
                  setFilter={setFilter}
                />

                <FilterButton
                  label="Custom Range"
                  value="custom"
                  filter={filter}
                  setFilter={setFilter}
                />
              </div>
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-end gap-5 mt-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  From Date
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-14 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-700 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  To Date
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-14 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-700 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
                />
              </div>

              <button
                onClick={loadReports}
                className="h-14 px-8 rounded-xl bg-[#064E3B] hover:bg-[#065F46] text-white font-bold shadow-lg transition-all"
              >
                Generate Report
              </button>
            </div>
          </section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
            <ReportCard
              title="Total Uploads"
              value={totalUploads}
              icon={<FaFileAlt />}
            />

            <ReportCard
              title="Completed"
              value={completedUploads}
              icon={<FaCheckCircle />}
            />

            <ReportCard
              title="Failed Uploads"
              value={failedUploads}
              icon={<FaTimesCircle />}
              danger
            />

            <ReportCard
              title="Missing"
              value={missingUploads}
              icon={<FaExclamationTriangle />}
              danger
            />

            <ReportCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={<FaPercent />}
            />
          </div>

          <div className="grid xl:grid-cols-4 gap-6">
            <section className="dashboard-card xl:col-span-3 min-h-[420px]">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-5 border-b border-gray-200">

                <h2 className="text-xl font-bold">
                  Upload Details
                </h2>

                <div className="flex gap-3">

                  <button
                    onClick={downloadPDF}
                    className="rounded-xl bg-[#064E3B] text-white hover:bg-[#065F46] px-4 py-2 font-bold flex items-center gap-2 shadow-md transition-all"
                  >
                    <FaDownload />
                    PDF
                  </button>

                  <button
                    onClick={printReport}
                    className="rounded-xl bg-[#064E3B] text-white hover:bg-[#065F46] px-4 py-2 font-bold flex items-center gap-2 shadow-md transition-all"
                  >
                    <FaPrint />
                    Print
                  </button>

                </div>

              </div>

              {loading ? (

                <p className="text-slate-600">
                  Loading...
                </p>

              ) : uploads.length === 0 ? (

                <div className="text-center py-16">

                  <div className="text-5xl mb-3">
                    📄
                  </div>

                  <p className="text-slate-500">
                    No upload records found.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-left">

                    <thead className="bg-[#F0FDF4] text-[#064E3B]">

                      <tr>
                        <th className="py-4 px-4 font-semibold">
                          File Name
                        </th>

                        <th className="py-4 px-4 font-semibold">
                          Uploaded Date
                        </th>

                        <th className="py-4 px-4 font-semibold">
                          Status
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {uploads.map((item) => (

                        <tr
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-[#F0FDF4] transition"
                        >

                          <td className="py-4 px-4 font-bold">
                            📄 {item.file_name}
                          </td>

                          <td className="py-4 px-4 text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </td>

                          <td className="py-4 px-4">

                            <span className="px-3 py-1 rounded-full bg-[#064E3B] text-white text-sm font-bold">

                              Completed

                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            <section className="dashboard-card">

              <h2 className="text-xl font-bold mb-6">
                Quick Actions
              </h2>

              <div className="space-y-4">

                <button
                  onClick={downloadPDF}
                  className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
                >
                  📄 Download PDF
                </button>

                <button
                  onClick={downloadExcel}
                  className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
                >
                  📊 Download Excel
                </button>

                <button
                  onClick={printReport}
                  className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
                >
                  🖨 Print Report
                </button>

                <button
                  className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
                >
                  📧 Email Report
                </button>

              </div>

            </section>

          </div>

        </div>

      </main>

    </div>

  );
}

function FilterButton({
  label,
  value,
  filter,
  setFilter,
}) {
  return (
    <button
      onClick={() => setFilter(value)}
      className={`h-11 min-w-[130px] px-5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
        filter === value
          ? "bg-[#064E3B] text-white shadow-lg"
          : "bg-white border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ReportCard({
  title,
  value,
  icon,
  danger,
}) {
  return (
    <div className="dashboard-card min-h-[150px]">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
            {title}
          </p>

          <h2
            className={`mt-2 text-4xl font-extrabold ${
              danger
                ? "text-red-500"
                : "text-[#064E3B]"
            }`}
          >
            {value}
          </h2>

        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
            danger
              ? "bg-red-100 text-red-500"
              : "bg-[#D1FAE5] text-[#064E3B]"
          }`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}