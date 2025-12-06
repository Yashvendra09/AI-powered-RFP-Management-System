// src/components/ui/Card.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * A reusable glassmorphism-style card container.
 */
export default function Card({ children, className = '', hoverable = false, ...props }) {
  // Glassmorphism base style: translucent white, backdrop blur, soft border, shadow
  const baseClasses = 'bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl p-6 transition-all duration-300';
  
  // Animation variant for hover effect
  const hoverProps = hoverable 
    ? { 
        whileHover: { scale: 1.01, boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1)" },
        transition: { type: "spring", stiffness: 300, damping: 20 } 
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`${baseClasses} ${className}`}
      {...hoverProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}