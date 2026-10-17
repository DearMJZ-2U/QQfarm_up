import { useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { Portal } from './shared';
import { QQ_GROUP } from '../qq-group';

// 顶部标题栏/顶栏的「加 QQ 群」图标：对话气泡 + QQ 企鹅轮廓
export function QQGroupIcon({ size = 16, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      style={style}
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 12.2c0 4.2-3.9 7.6-8.7 7.6-1 0-2-.15-2.9-.42L4.2 21l1.05-3.5C3.75 16.1 2.6 14.3 2.6 12.2 2.6 8 6.5 4.6 11.3 4.6s9.2 3.4 9.2 7.6Z" />
      <circle cx="8.9" cy="11.6" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="11.6" r="0.95" fill="currentColor" stroke="none" />
      <path d="M9.6 14.5c.9.7 2.1 1 2.9 1 .9 0 2-.3 2.9-1" />
    </svg>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 非 https / 老浏览器兜底
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* 忽略：用户可手动选中复制 */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" onClick={handleCopy}
      className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors flex-shrink-0"
      style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}
      aria-label={`复制${label}`} title={`复制${label}`}>
      {copied ? <Check size={12} strokeWidth={3} style={{ color: 'var(--leaf)' }} /> : <Copy size={12} strokeWidth={2.6} />}
      <span>{copied ? '已复制' : '复制'}</span>
    </button>
  );
}

export default function QQGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="qq-group-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog" aria-modal="true" aria-labelledby="qq-group-title">
            <div className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-sm" />
            <motion.div
              key="qq-group-panel"
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[380px] rounded-3xl px-4 pt-5 pb-4 flex flex-col items-center gap-3 max-h-[calc(100vh-2rem)] overflow-y-auto"
              style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>
              <button type="button" onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10"
                style={{ background: 'var(--bg-2)' }} aria-label="关闭">
                <X size={18} className="text-[var(--ink-soft)]" />
              </button>

              {/* 标题 */}
              <div className="w-full text-center px-6">
                <div className="text-2xl mb-1" aria-hidden>🌾</div>
                <div id="qq-group-title" className="font-display italic text-lg font-bold text-[var(--ink)] leading-snug">
                  计算收益，极致运营，猛冲等级
                </div>
                <div className="text-xs font-bold text-[var(--ink-soft)] mt-1">
                  加交流群，分享最新活动玩法
                </div>
              </div>

              {/* 二维码 */}
              <div className="rounded-2xl p-2.5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
                <img
                  src={QQ_GROUP.qrSrc}
                  alt={`QQ 群 ${QQ_GROUP.number} 二维码`}
                  width={220}
                  height={220}
                  className="block rounded-xl w-[196px] h-[196px] sm:w-[220px] sm:h-[220px] object-contain"
                  style={{ background: '#FFFFFF' }}
                />
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] text-center -mt-1">
                手机 QQ 扫码加群 · 长按二维码也可识别
              </div>

              {/* 群号 / 备注 */}
              <div className="w-full space-y-1.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'var(--bg-2)' }}>
                  <span className="text-[11px] font-bold text-[var(--ink-mute)] flex-shrink-0">QQ 群号</span>
                  <span className="ml-auto font-mono font-bold text-sm text-[var(--ink)] tnum select-all">{QQ_GROUP.number}</span>
                  <CopyButton text={QQ_GROUP.number} label="群号" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'var(--bg-2)' }}>
                  <span className="text-[11px] font-bold text-[var(--ink-mute)] flex-shrink-0">加群备注</span>
                  <span className="ml-auto text-sm font-bold text-[var(--ink)] truncate select-all">{QQ_GROUP.remark}</span>
                  <CopyButton text={QQ_GROUP.remark} label="加群备注" />
                </div>
              </div>

              <button type="button" onClick={onClose}
                className="btn-primary w-full h-11 rounded-full font-bold text-sm">
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
