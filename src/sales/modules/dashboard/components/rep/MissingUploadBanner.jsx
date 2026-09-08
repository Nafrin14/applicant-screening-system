export default function MissingUploadBanner({ onUploadClick }) {
  return (
    <div className="mb-6 rounded-3xl border border-emerald-200 bg-white p-5 flex flex-col md:flex-row
    md:items-center md:justify-between gap-4">
      <div>
        <h3 className="font-bold text-red-600">
          You have not uploaded today.
        </h3>
        <p className="text-slate-600 mt-1">
          Please upload your CSV file to keep your daily report updated.
        </p>
      </div>

      <button
        onClick={onUploadClick}
        className="bg-[#064E3B] hover:bg-[#065F46] text-white px-6 py-3 rounded-xl font-bold shadow-lg transition duration-300"
      >
        Upload CSV
      </button>
    </div>
  );
}
