import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import SalesSidebar from "../components/SalesSidebar";
import SalesNavbar from "../components/SalesNavbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

    if (filter === "week") {
      start.setDate(today.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    }

    if (filter === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
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
      console.log("USER ID:", user.id);


      const { start, end } = getDateRange();
      console.log("START:", start);
console.log("END:", end);

     const { data, error } = await supabase
  .from("csv_uploads")
  .select("*")
  .order("created_at", { ascending: false });

console.log("ERROR:", error);
console.log("REPORT DATA:", data);

      if (error) throw error;

      setUploads(data || []);
    } catch (err) {
      alert(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const totalUploads = uploads.length;

  const completedUploads = uploads.filter(
    (item) => item.status === "success"
  ).length;

  const missingUploads = totalUploads === 0 ? 1 : 0;
  const failedUploads = uploads.filter(
  (item) => item.status === "failed"
).length;

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
],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
     head: [["File Name", "Uploaded Date & Time"]],
body: uploads.map((item) => [
  item.file_name,
  new Date(item.created_at).toLocaleString(),
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
    <div className="min-h-screen bg-[#021b16] text-white">
      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Reports"
          subtitle="Generate and review CSV upload reports."
          uploadedToday={uploads.length > 0}
        />

        <div className="px-6 py-7 md:px-10">
         <section className="dashboard-card mb-6">
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
   


<div className="flex flex-wrap lg:flex-nowrap items-end gap-4">
      <div>
        <label className="block text-sm text-white/60 mb-2">
          From Date
        </label>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-[#0a2721] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">
          To Date
        </label>

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-[#0a2721] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
        />
      </div>

      <button
        onClick={loadReports}
        className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-8 py-3 font-bold text-white"
      >
        Generate Report
      </button>
      </div>

    
  
  
</section>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
            <ReportCard title="Total Uploads" value={totalUploads} icon={<FaFileAlt />} />
            <ReportCard title="Completed" value={completedUploads} icon={<FaCheckCircle />} />
            <ReportCard
  title="Failed Uploads"
  value={failedUploads}
  icon={<FaTimesCircle />}
  danger
/>
            <ReportCard title="Missing" value={missingUploads} icon={<FaExclamationTriangle />} danger />
            <ReportCard title="Success Rate" value={`${successRate}%`} icon={<FaPercent />} />
          </div>

         <div className="grid xl:grid-cols-4 gap-6">
            <section className="dashboard-card xl:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold">Upload Details</h2>

              <div className="flex gap-3">
                <button
                  onClick={downloadPDF}
                  className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-4 py-2 font-bold flex items-center gap-2"
                >
                  <FaDownload /> PDF
                </button>

                <button
                  onClick={printReport}
                  className="rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-300 px-4 py-2 font-bold flex items-center gap-2"
                >
                  <FaPrint /> Print
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-white/60">Loading...</p>
            ) : uploads.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📄</div>
                <p className="text-white/50">No upload records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-white/50 border-b border-white/10">
                    <tr>
                      <th className="py-3">File Name</th>
                      <th className="py-3">Uploaded Date</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {uploads.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="py-4 font-bold">📄 {item.file_name}</td>
                        <td className="py-4 text-white/60">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold">
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
      className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-xl py-3 font-bold"
    >
      📄 Download PDF
    </button>

   <button
  onClick={downloadExcel}
  className="w-full bg-green-600 hover:bg-green-700 rounded-xl py-3 font-bold"
>
  📊 Download Excel
</button>

    <button
      onClick={printReport}
      className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-bold"
    >
      🖨 Print Report
    </button>

    <button
      className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl py-3 font-bold"
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

function FilterButton({ label, value, filter, setFilter }) {
  return (
    <button
      onClick={() => setFilter(value)}
      className={`h-11 min-w-[130px] px-5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
        filter === value
          ? "bg-emerald-500 text-white"
          : "bg-black/25 border border-white/10 text-white/70 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function ReportCard({ title, value, icon, danger }) {
  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between">
        <p className="text-white/55 font-semibold">{title}</p>
        <span className={danger ? "text-red-300 text-2xl" : "text-emerald-300 text-2xl"}>
          {icon}
        </span>
      </div>

      <h2 className={danger ? "mt-5 text-3xl font-black text-red-300" : "mt-5 text-3xl font-black text-emerald-300"}>
        {value}
      </h2>
    </div>
  );
}