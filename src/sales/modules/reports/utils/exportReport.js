import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────────────────────
// PDF/Excel export for the Sales Reports page. Both take the same summary
// numbers plus the raw upload rows so the file matches whatever the page
// is currently showing.
// ─────────────────────────────────────────────────────────────────────────
export function exportReportPdf({ filter, totalUploads, completedUploads, failedUploads, missingUploads, successRate, uploads }) {
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
}

export function exportReportExcel({ totalUploads, completedUploads, failedUploads, missingUploads, successRate, uploads }) {
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
}
