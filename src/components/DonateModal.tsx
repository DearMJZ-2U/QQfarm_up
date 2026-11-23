import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coffee } from 'lucide-react';
import { Portal } from './shared';
import { DONATE } from '../donate';

export default function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [channelId, setChannelId] = useState(DONATE.channels[0].id);
  const channel = DONATE.channels.find((c) => c.id === channelId) ?? DONATE.channels[0];

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="donate-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog" aria-modal="true" aria-labelledby="donate-title">
            <div className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-sm" />
            <motion.div
              key="donate-panel"
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[360px] rounded-3xl px-4 pt-5 pb-4 flex flex-col items-center gap-3 max-h-[calc(100vh-2rem)] overflow-y-auto"
              style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>
              <button type="button" onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10"
                style={{ background: 'var(--bg-2)' }} aria-label="关闭">
                <X size={18} className="text-[var(--ink-soft)]" />
              </button>

              {/* 标题 */}
              <div className="w-full text-center px-6">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: 'var(--orange)', color: '#FFFFFF', boxShadow: '0 2px 0 var(--orange-deep)' }}>
                  <Coffee size={22} strokeWidth={2.5} />
                </div>
                <div id="donate-title" className="font-display italic text-lg font-bold text-[var(--ink)] leading-snug">
                  {DONATE.title}
                </div>
                <div className="text-xs font-bold text-[var(--ink-soft)] mt-1 leading-relaxed">
                  {DONATE.subtitle}
                </div>
              </div>

              {/* 渠道切换 */}
              <div className="w-full flex gap-1.5 p-1.5 rounded-full" role="tablist" aria-label="打赏渠道"
                style={{ background: 'var(--bg-2)' }}>
                {DONATE.channels.map((c) => {
                  const active = c.id === channel.id;
                  return (
                    <button key={c.id} type="button" role="tab"
                      aria-selected={active} aria-controls="donate-qr"
                      onClick={() => setChannelId(c.id)}
                      className="flex-1 flex items-center justify-center gap-1 h-9 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                      style={active
                        ? { background: `var(--${c.accent})`, color: '#FFFFFF', boxShadow: `0 2px 0 var(--${c.accent}-deep)` }
                        : { background: 'transparent', color: 'var(--ink-soft)' }}>
                      <span aria-hidden>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 二维码 */}
              <div id="donate-qr" role="tabpanel" className="w-full flex items-center justify-center py-0.5">
                <img
                  key={channel.id}
                  src={channel.qrSrc}
                  alt={`${channel.label}打赏二维码`}
                  width={channel.width}
                  height={channel.height}
                  className="block h-[248px] sm:h-[268px] w-auto rounded-2xl"
                  style={{ background: '#FFFFFF', border: '1.5px solid var(--line)' }}
                />
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] text-center -mt-1">
                {channel.hint}
              </div>

              <div className="text-[11px] text-[var(--ink-mute)] text-center -mt-1">
                {DONATE.note}
              </div>

              <button type="button" onClick={onClose}
                className="btn-primary w-full h-11 rounded-full font-bold text-sm">
                好的，谢谢作者
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}