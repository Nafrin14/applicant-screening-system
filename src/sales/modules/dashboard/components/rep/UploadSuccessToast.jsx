export default function UploadSuccessToast({ show, fileName }) {
  if (!show) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slideDown">
      <div className="flex items-center gap-4 rounded-2xl bg-white text-slate-900 px-6 py-4 shadow-2xl border border-[#064E3B]">
        <div className="w-12 h-12 rounded-full bg-[#064E3B] flex items-center justify-center text-white text-2xl font-black">
          ✓
        </div>

        <div>
          <h3 className="font-black text-lg">
            Upload Successful
          </h3>

          <p className="text-sm text-gray-500">
            {fileName}
          </p>
        </div>
      </div>
    </div>
  );
}
