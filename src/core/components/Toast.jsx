import React from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
};

const STYLES = {
  success: { icon: "text-green-600", bar: "bg-green-500" },
  error: { icon: "text-red-600", bar: "bg-red-500" },
  info: { icon: "text-blue-600", bar: "bg-blue-500" },
};

function ToastItem({ toast, onDismiss }) {
  const style = STYLES[toast.type] || STYLES.info;
  const Icon = ICONS[toast.type] || ICONS.info;

  return (
    <div className="pointer-events-auto w-80 max-w-[90vw] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl overflow-hidden animate-toast-in">
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className={`text-lg mt-0.5 shrink-0 ${style.icon}`} />
        <p className="flex-1 text-sm text-slate-800 leading-snug">
          {toast.message}
        </p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-600 mt-0.5 shrink-0"
          aria-label="Dismiss notification"
        >
          <FaTimes size={12} />
        </button>
      </div>
      {toast.duration > 0 && (
        <div className="h-0.5 bg-black/5">
          <div
            className={`h-full ${style.bar} animate-toast-shrink`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
