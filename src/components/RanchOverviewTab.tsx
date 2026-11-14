// 工具 · 牧场全览 —— 嵌入 public/ranch_overview.html（单文件自包含，图片全部内联）
//
// 和「等级查询 / 土地升级所需」保持同一种观感：整页自然滚动，不做成一屏高的窗口。
// 做法是页面通过 postMessage 上报自己的真实内容高度，这里把 iframe 撑到那个高度，
// 滚动交给外层页面；页面内切换子 tab 时再让外层滚回本页顶部。
import { useEffect, useRef, useState } from 'react';
import { publicUrl } from './shared';

const MIN_H = 900;

export default function RanchOverviewTab() {
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(MIN_H);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; h?: number } | null;
      if (!d || typeof d !== 'object') return;

      if (d.type === 'ranch-height' && typeof d.h === 'number' && d.h > 300) {
        setHeight(Math.ceil(d.h));
      }
      if (d.type === 'ranch-scroll-top' && boxRef.current) {
        const top = boxRef.current.getBoundingClientRect().top + window.scrollY - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full"
      style={{ height, transition: 'height 0.18s ease' }}>
      {!ready && (
        <div className="absolute inset-x-0 top-24 grid place-items-center animate-pulse pointer-events-none">
          <span className="text-xs font-bold" style={{ color: 'var(--ink-mute)' }}>牧场全览加载中…</span>
        </div>
      )}
      <iframe
        src={publicUrl('ranch_overview.html')}
        title="牧场全览"
        onLoad={() => setReady(true)}
        className="w-full h-full block border-0"
        style={{ background: 'transparent' }}
        scrolling="no"
      />
    </div>
  );
}
