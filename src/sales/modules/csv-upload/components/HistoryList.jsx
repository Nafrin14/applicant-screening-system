import { FaFileCsv, FaCalendarAlt, FaTrash, FaCheckCircle } from "react-icons/fa";

export default function HistoryList({ loading, filteredUploads, onDelete }) {
  return (
    <div className="dashboard-card">
      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : filteredUploads.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">📂</div>
          <p className="text-slate-700 font-semibold">
            No upload history found.
          </p>
          <p className="text-slate-400 mt-2">
            Upload your first CSV file to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUploads.map((upload) => (
            <div
              key={upload.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-white border border-gray-200 shadow-sm px-6 py-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] border border-[#064E3B]/20 flex items-center justify-center text-[#064E3B]">
                  <FaFileCsv />
                </div>

                <div>
                  <h3 className="font-bold">{upload.file_name}</h3>

                  <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                    <FaCalendarAlt />
                    {new Date(upload.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => onDelete(upload.id)}
                  className="w-10 h-10 rounded-xl bg-[#064E3B] text-white hover:bg-[#065F46] hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <FaTrash />
                </button>

                <span className="w-fit flex items-center gap-2 px-5 py-2 rounded-full bg-[#064E3B] text-white text-sm font-bold">
                  <FaCheckCircle />
                  Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
