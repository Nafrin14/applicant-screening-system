import { FaDownload, FaPrint } from "react-icons/fa";

export default function UploadDetailsTable({ loading, uploads, onDownloadPdf, onPrint }) {
  return (
    <section className="dashboard-card xl:col-span-3 min-h-[420px]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
        <h2 className="text-xl font-bold">
          Upload Details
        </h2>

        <div className="flex gap-3">
          <button
            onClick={onDownloadPdf}
            className="rounded-xl bg-[#064E3B] text-white hover:bg-[#065F46] px-4 py-2 font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <FaDownload />
            PDF
          </button>

          <button
            onClick={onPrint}
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
  );
}
