// src/components/ui/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Custom CSS for the required glossy gradient effect
const glossyButtonStyles = `
  .glossy-button-primary {
    /* Indigo-600 to Cyan-400 gradient */
    background: linear-gradient(90deg, #4f46e5 0%, #22d3ee 100%);
    box-shadow: 0 4px 15px rgba(34, 211, 238, 0.2);
  }
  .glossy-button-primary:hover {
    box-shadow: 0 6px 20px rgba(34, 211, 238, 0.4);
  }
  .glossy-button-secondary {
    background-color: #4f46e5; /* Primary Indigo-600 for secondary */
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.1);
  }
  .glossy-button-secondary:hover {
    background-color: #4338ca; /* Indigo-700 */
    box-shadow: 0 6px 15px rgba(79, 70, 229, 0.2);
  }
`;

/**
 * A glossy, animated button component.
 */
export default function Button({ children, className = '', secondary = false, disabled = false, type = 'button', ...props }) {
  const baseClasses = 'px-4 py-2 font-semibold text-white rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 flex items-center justify-center';
  
  const colorClasses = secondary
    ? 'glossy-button-secondary focus:ring-indigo-300'
    : 'glossy-button-primary focus:ring-cyan-300';
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed shadow-none' 
    : `${colorClasses}`;

  return (
    <>
      {/* Inject custom CSS once */}
      <style>{glossyButtonStyles}</style>
      <motion.button
        whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
        whileTap={disabled ? {} : { scale: 0.98, y: 0 }}
        className={`${baseClasses} ${disabledClasses} ${className}`}
        disabled={disabled}
        type={type}
        {...props}
      >
        {children}
      </motion.button>
    </>
  );
}