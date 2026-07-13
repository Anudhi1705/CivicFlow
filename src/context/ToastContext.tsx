import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} className="text-emerald-600" />;
      case "error":
        return <AlertCircle size={18} className="text-rose-600" />;
      case "warning":
        return <AlertTriangle size={18} className="text-amber-600" />;
      case "info":
      default:
        return <Info size={18} className="text-blue-600" />;
    }
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-[0_4px_20px_rgba(16,185,129,0.12)]";
      case "error":
        return "bg-rose-50 border-rose-200 text-rose-900 shadow-[0_4px_20px_rgba(244,63,94,0.12)]";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-900 shadow-[0_4px_20px_rgba(245,158,11,0.12)]";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-900 shadow-[0_4px_20px_rgba(59,130,246,0.12)]";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        id="toast-notification-portal"
        className="fixed top-6 right-6 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${getToastColors(
                toast.type
              )}`}
              id={`toast-message-${toast.id}`}
            >
              <div className="shrink-0 mt-0.5">
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-800 transition-colors p-0.5 rounded-lg hover:bg-black/5"
                aria-label="Close Notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
