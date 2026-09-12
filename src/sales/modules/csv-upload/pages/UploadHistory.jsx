import SalesSidebar from "../../../components/SalesSidebar";
import SalesNavbar from "../../../components/SalesNavbar";
import { useNotification } from "../../../../core/context/NotificationContext";

import useUploadHistoryList from "../hooks/useUploadHistoryList";
import HistoryStatCards from "../components/HistoryStatCards";
import HistoryFilters from "../components/HistoryFilters";
import HistoryList from "../components/HistoryList";

export default function UploadHistory() {
  const { notify, confirmDialog } = useNotification();
  const {
    search, setSearch,
    filter, setFilter,
    loading,
    totalFiles,
    completedFiles,
    todayUploads,
    filteredUploads,
    deleteUpload,
  } = useUploadHistoryList({ notify, confirmDialog });

  return (
    <div className="min-h-screen w-screen bg-white text-slate-900 overflow-x-hidden">
      <SalesSidebar />

      <main className="min-h-screen w-screen lg:ml-72 lg:w-[calc(100vw-18rem)]">
        <SalesNavbar
          title="Upload History"
          subtitle="View all CSV files uploaded by your account."
        />

        <div className="px-3 py-6 md:p-10">
          <div className="w-full">
            <HistoryStatCards
              totalFiles={totalFiles}
              completedFiles={completedFiles}
              todayUploads={todayUploads}
            />

            <HistoryFilters
              search={search} setSearch={setSearch}
              filter={filter} setFilter={setFilter}
            />

            <HistoryList
              loading={loading}
              filteredUploads={filteredUploads}
              onDelete={deleteUpload}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
