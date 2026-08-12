import React, { useEffect } from "react";
import { FaExclamationTriangle, FaQuestionCircle } from "react-icons/fa";

export default function ConfirmDialog({
  message,
  title,
  confirmLabel,
  cancelLabel,
  danger,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, onConfirm]);

  const Icon = danger ? FaExclamationTriangle : FaQuestionCircle;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] px-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[28px] p-7 animate-glass-pop">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
            danger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}
        >
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 ${
              danger
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
