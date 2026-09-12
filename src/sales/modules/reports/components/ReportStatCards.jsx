import { FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaPercent, FaTimesCircle } from "react-icons/fa";

function ReportCard({ title, value, icon, danger }) {
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

export default function ReportStatCards({ totalUploads, completedUploads, failedUploads, missingUploads, successRate }) {
  return (
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
  );
}
