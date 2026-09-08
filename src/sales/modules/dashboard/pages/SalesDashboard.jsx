import { useRef } from "react";
import CalendarTracker from "../../../components/CalendarTracker";
import { formatDateString } from "../../../utils/helpers";
import SalesSidebar from "../../../components/SalesSidebar";
import SalesNavbar from "../../../components/SalesNavbar";
import { useNotification } from "../../../../core/context/NotificationContext";

import useUploadHistory from "../hooks/useUploadHistory";
import useCsvUpload from "../hooks/useCsvUpload";

import UploadSuccessToast from "../components/rep/UploadSuccessToast";
import DashboardStats from "../components/rep/DashboardStats";
import MissingUploadBanner from "../components/rep/MissingUploadBanner";
import UploadPanel from "../components/rep/UploadPanel";

export default function SalesDashboard() {
  const { notify } = useNotification();
  const fileInputRef = useRef(null);

  const { history, markedDates, userName, refetch: loadUserUploadHistory } = useUploadHistory({ notify });
  const { uploading, uploadToast, uploadedFileName, handleFileUpload } = useCsvUpload({
    notify,
    refetch: loadUserUploadHistory,
  });

  const today = formatDateString(new Date());
  const uploadedToday = markedDates.includes(today);

  const totalUploads = history.length;
  const completedUploads = history.filter(
    (item) => item.status === "success"
  ).length;
  const missingUploads = uploadedToday ? 0 : 1;

  const openFilePicker = () => fileInputRef.current.click();

  return (
 <div className="min-h-screen bg-white text-slate-900">
      <UploadSuccessToast show={uploadToast} fileName={uploadedFileName} />

      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Dashboard"
          subtitle="Upload your CSV and monitor your daily progress."
          uploadedToday={uploadedToday}
        />

        <div className="px-6 py-7 pb-10 md:px-10">
          <section className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
            <h2 className="text-2xl md:text-3xl font-black mt-1 text-emerald-900">
                Welcome Back, {userName} 👋
              </h2>
            </div>
          </section>

          <DashboardStats
            totalUploads={totalUploads}
            completedUploads={completedUploads}
            uploadedToday={uploadedToday}
            missingUploads={missingUploads}
          />

          {!uploadedToday && <MissingUploadBanner onUploadClick={openFilePicker} />}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <UploadPanel uploading={uploading} onBrowseClick={openFilePicker} />

            <CalendarTracker markedDates={markedDates} />
          </div>
        </div>
      </main>
    </div>
  );
}
