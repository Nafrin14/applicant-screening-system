export default function QuickActionsPanel({ onDownloadPdf, onDownloadExcel, onPrint }) {
  return (
    <section className="dashboard-card">
      <h2 className="text-xl font-bold mb-6">
        Quick Actions
      </h2>

      <div className="space-y-4">
        <button
          onClick={onDownloadPdf}
          className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
        >
          📄 Download PDF
        </button>

        <button
          onClick={onDownloadExcel}
          className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
        >
          📊 Download Excel
        </button>

        <button
          onClick={onPrint}
          className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
        >
          🖨 Print Report
        </button>

        <button
          className="w-full bg-[#064E3B] hover:bg-[#065F46] text-white rounded-xl py-3 font-bold transition"
        >
          📧 Email Report
        </button>
      </div>
    </section>
  );
}
