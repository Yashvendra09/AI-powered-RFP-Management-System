// src/components/Toast.jsx
import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

// --- Internal components and logic ---

const TYPE_MAP = {
  success: { icon: CheckCircle, color: 'text-green-600 bg-green-50/90 border-green-300' },
  error: { icon: XCircle, color: 'text-red-600 bg-red-50/90 border-red-300' },
  info: { icon: Info, color: 'text-blue-600 bg-blue-50/90 border-blue-300' },
};

function ToastItem({ id, message, type, remove }) {
  const { icon: Icon, color } = TYPE_MAP[type] || TYPE_MAP.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      layout
      className={`relative flex items-center p-4 pr-10 mt-3 rounded-xl shadow-xl border ${color} max-w-sm backdrop-blur-sm`}
      role="alert"
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-800">{message}</span>
      <button 
        onClick={() => remove(id)} 
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

// --- Main Provider Component ---

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newToast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove the toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue = {
    toast: showToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error', 7000),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container, fixed top-right */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="flex flex-col items-end pointer-events-auto">
          <AnimatePresence>
            {toasts.map((toast) => (
              <ToastItem 
                key={toast.id} 
                {...toast} 
                remove={removeToast} 
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}