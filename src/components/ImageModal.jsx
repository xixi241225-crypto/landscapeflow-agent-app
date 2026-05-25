import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageModal({ src, title, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Dark overlay backdrop */}
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal content */}
        <motion.div
          className="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[90vh]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#A8A29A',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#A8A29A';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="rounded-2xl overflow-hidden max-w-[90vw] max-h-[85vh]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <img
              src={src}
              alt={title || '查看大图'}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              style={{ background: '#1a1a1a' }}
            />
          </div>

          {/* Title */}
          {title && (
            <p
              className="mt-4 text-sm font-medium text-center"
              style={{ color: '#A8A29A' }}
            >
              {title}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
