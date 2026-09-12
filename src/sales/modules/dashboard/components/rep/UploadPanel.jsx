import { FaCloudUploadAlt } from "react-icons/fa";

export default function UploadPanel({ uploading, onBrowseClick }) {
  return (
    <section className="dashboard-card">
      <h2 className="text-xl font-bold mb-5">Upload CSV</h2>

     <div className="border-2 border-dashed border-[#064E3B] rounded-3xl min-h-[280px] flex flex-col
items-center justify-center text-center bg-white px-6 py-12">
        <FaCloudUploadAlt className="text-6xl text-[#064E3B] mb-4" />

        <h3 className="text-xl font-bold">Upload your CSV file</h3>

       <p className="text-slate-500 mt-2 mb-5">
          Select a CSV file from your computer.
        </p>

        <button
          onClick={onBrowseClick}
          disabled={uploading}
          className="bg-[#064E3B] hover:bg-[#065F46] text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-60 transition duration-300"
        >
          {uploading ? "Uploading..." : "Browse CSV Files"}
        </button>
      </div>
    </section>
  );
}
