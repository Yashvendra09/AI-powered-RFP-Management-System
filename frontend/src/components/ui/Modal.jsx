// src/components/ui/Modal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * A standard, animated, accessible modal component.
 */
export default function Modal({ isOpen, onClose, children, title = 'Modal' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            className="w-full max-w-lg bg-white/90 rounded-2xl shadow-2xl p-6 border border-white/40 max-h-[90vh] overflow-y-auto"
            role="document"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
          >
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="pt-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}