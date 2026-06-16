import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 240);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={scrollTop}
          aria-label="回到顶部"
          title="回到顶部"
          className="fixed right-4 sm:right-5 z-40 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full"
          style={{
            bottom: 'calc(var(--bottom-nav-h) + 1rem)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1.5px solid var(--line)',
            boxShadow: 'var(--shadow-sticker-lg)',
          }}>
          <ArrowUp size={18} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
