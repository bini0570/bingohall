import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -15,
  }
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
};

export default function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ minHeight: '100%', width: '100%', paddingBottom: '80px' }}
    >
      {children}
    </motion.div>
  );
}
