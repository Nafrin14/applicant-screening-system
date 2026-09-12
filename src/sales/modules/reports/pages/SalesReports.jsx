import SalesSidebar from "../../../components/SalesSidebar";
import SalesNavbar from "../../../components/SalesNavbar";
import { useNotification } from "../../../../core/context/NotificationContext";

import useSalesReports from "../hooks/useSalesReports";
import { exportReportPdf, exportReportExcel } from "../utils/exportReport";
import ReportFilterBar from "../components/ReportFilterBar";
import ReportStatCards from "../components/ReportStatCards";
import UploadDetailsTable from "../components/UploadDetailsTable";
import QuickActionsPanel from "../components/QuickActionsPanel";

export default function SalesReports() {
  const { notify } = useNotification();
  const {
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
  } = useSalesReports({ notify });

  const reportSummary = { filter, totalUploads, completedUploads, failedUploads, missingUploads, successRate, uploads };
  const downloadPDF = () => exportReportPdf(reportSummary);
  const downloadExcel = () => exportReportExcel(reportSummary);
  const printReport = () => window.print();

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
          <ReportFilterBar
            filter={filter} setFilter={setFilter}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
            onGenerate={loadReports}
          />

          <ReportStatCards
            totalUploads={totalUploads}
            completedUploads={completedUploads}
            failedUploads={failedUploads}
            missingUploads={missingUploads}
            successRate={successRate}
          />

          <div className="grid xl:grid-cols-4 gap-6">
            <UploadDetailsTable
              loading={loading}
              uploads={uploads}
              onDownloadPdf={downloadPDF}
              onPrint={printReport}
            />

            <QuickActionsPanel
              onDownloadPdf={downloadPDF}
              onDownloadExcel={downloadExcel}
              onPrint={printReport}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
