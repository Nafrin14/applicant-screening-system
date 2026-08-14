import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import ToastStack from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

const NotificationContext = createContext(null);

let toastId = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolver = useRef(null);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, options = {}) => {
      const { type = "info", duration = 3500, action = null } = options;
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type, duration, action }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const confirmDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({
        message,
        title: options.title || (options.danger ? "Are you sure?" : "Please confirm"),
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        danger: !!options.danger,
      });
    });
  }, []);

  const resolveConfirm = useCallback((result) => {
    if (confirmResolver.current) {
      confirmResolver.current(result);
      confirmResolver.current = null;
    }
    setConfirmState(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss, confirmDialog }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      {confirmState && (
        <ConfirmDialog
          {...confirmState}
          onCancel={() => resolveConfirm(false)}
          onConfirm={() => resolveConfirm(true)}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return ctx;
}
