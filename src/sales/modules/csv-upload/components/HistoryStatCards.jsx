import { FaFolderOpen, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";

export default function HistoryStatCards({ totalFiles, completedFiles, todayUploads }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <div className="dashboard-card min-h-[170px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-700 text-sm font-semibold">
              Total Files
            </p>
            <h2 className="text-5xl font-black mt-3 text-[#064E3B]">
              {totalFiles}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              All uploaded CSV files
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
            <FaFolderOpen className="text-2xl text-[#064E3B]" />
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-700 text-sm font-semibold">
              Completed
            </p>
            <h2 className="text-5xl font-black mt-3 text-[#064E3B]">
              {completedFiles}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Successfully processed
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
            <FaCheckCircle className="text-2xl text-[#064E3B]" />
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-700 text-sm font-semibold">
              Uploaded Today
            </p>
            <h2 className="text-5xl font-black mt-3 text-[#064E3B]">
              {todayUploads}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              CSV files uploaded today
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
            <FaCalendarAlt className="text-2xl text-[#064E3B]" />
          </div>
        </div>
      </div>
    </div>
  );
}
