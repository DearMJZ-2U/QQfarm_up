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
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={scrollTop}
          aria-label="回到顶部"
          title="回到顶部"
          className="fixed bottom-24 right-5 z-40 hidden sm:flex items-center justify-center w-12 h-12 rounded-full"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1.5px solid var(--line)',
            boxShadow: 'var(--shadow-sticker-lg)',
          }}>
          <motion.span
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', damping: 16, stiffness: 300 }}
            className="flex items-center justify-center">
            <ArrowUp size={18} strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
