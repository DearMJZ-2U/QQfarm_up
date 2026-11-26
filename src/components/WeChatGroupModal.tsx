import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Portal } from './shared';
import { WECHAT_GROUP } from '../wechat-group';

// 顶部标题栏/顶栏的「加微信群」图标：两个错位对话气泡，小尺寸下也能一眼看出是聊天
export function WeChatGroupIcon({ size = 16, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      style={style}
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.4" y="2.8" width="11.2" height="7.2" rx="2.6" />
      <rect x="10.4" y="12" width="11.2" height="7.2" rx="2.6" />
      <circle cx="6" cy="6.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 微信群二维码是 7 天临时码：过期后换掉 public/wechat-group-qr.png 并同步改 expiresOn
function isQrExpired(iso?: string) {
  if (!iso) return false;
  const end = new Date(`${iso}T23:59:59`);
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime();
}

function formatExpiry(iso?: string) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return '';
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export default function WeChatGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const expired = isQrExpired(WECHAT_GROUP.expiresOn);
  const expiresLabel = formatExpiry(WECHAT_GROUP.expiresOn);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="wechat-group-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog" aria-modal="true" aria-labelledby="wechat-group-title">
            <div className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-sm" />
            <motion.div
              key="wechat-group-panel"
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
                <div id="wechat-group-title" className="font-display italic text-lg font-bold text-[var(--ink)] leading-snug">
                  计算收益，极致运营，猛冲等级
                </div>
                <div className="text-xs font-bold text-[var(--ink-soft)] mt-1">
                  微信群已开通，扫码进群聊最新玩法
                </div>
              </div>

              {/* 二维码 */}
              <div className="rounded-2xl p-2.5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
                <img
                  src={WECHAT_GROUP.qrSrc}
                  alt={`微信群「${WECHAT_GROUP.name}」二维码`}
                  width={220}
                  height={220}
                  loading="eager"
                  decoding="async"
                  className="block rounded-xl w-[196px] h-[196px] sm:w-[220px] sm:h-[220px] object-contain"
                  style={{ background: '#FFFFFF', opacity: expired ? 0.45 : 1 }}
                />
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] text-center -mt-1">
                {expired ? '本期二维码已过期，等待作者更新' : '微信扫码进群 · 长按二维码也可识别'}
              </div>

              {/* 群名 */}
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'var(--bg-2)' }}>
                <span className="text-[11px] font-bold text-[var(--ink-mute)] flex-shrink-0">群名称</span>
                <span className="ml-auto text-sm font-bold text-[var(--ink)] truncate">{WECHAT_GROUP.name}</span>
              </div>

              {/* 二维码是 7 天临时码，提前说明免得扫了才发现失效 */}
              <div className="w-full rounded-2xl px-3 py-2 text-[11px] leading-relaxed text-[var(--ink-mute)]" style={{ background: 'var(--bg-2)' }}>
                {expired
                  ? '本期二维码已过期，作者更新后即可重新扫码进群。'
                  : `有效期至 ${expiresLabel || '更新后'}，过期请稍后再来扫。`}
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
