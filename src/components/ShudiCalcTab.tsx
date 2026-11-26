// 工具 · 蜜薯价格计算器 —— 嵌入 public/shudi_calc.html（单文件自包含，图标全部内联）
//
// 与「牧场全览」同一套路：整页自然滚动，不做成一屏高的窗口。
// 页面通过 postMessage 上报真实内容高度，这里把 iframe 撑到那个高度，
// 滚动交给外层页面；页面内部的 fixed 底栏在嵌入态已自行隐藏。
//
// 结论条由 App 的底部导航容器统一渲染：iframe 高度等于整页高度，里面的 position:fixed
// 会跑到整页最底部，用户得滚到底才看得见。所以页面只把结论发过来（shudi-price），
// 这里通过 onQuote 回传给外层。
import { useEffect, useRef, useState } from 'react';
import { publicUrl } from './shared';

export interface ShudiQuote {
  text: string;
  tag: string;
  level: string;
}

const MIN_H = 820;

interface Props {
  onQuote?: (q: ShudiQuote | null) => void;
}

export default function ShudiCalcTab({ onQuote }: Props = {}) {
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(MIN_H);
  const boxRef = useRef<HTMLDivElement>(null);
  const onQuoteRef = useRef(onQuote);
  onQuoteRef.current = onQuote;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; h?: number; text?: string; tag?: string; level?: string } | null;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'shudi-height' && typeof d.h === 'number' && d.h > 200) {
        setHeight(Math.ceil(d.h));
      }
      if (d.type === 'shudi-price' && typeof d.text === 'string') {
        onQuoteRef.current?.({ text: d.text, tag: d.tag || '', level: d.level || 'warn' });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // 切走时清掉外层悬浮条
  useEffect(() => () => { onQuoteRef.current?.(null); }, []);

  return (
    <>
      <div ref={boxRef} className="relative w-full" style={{ height, transition: 'height 0.18s ease' }}>
        {!ready && (
          <div className="absolute inset-x-0 top-24 grid place-items-center animate-pulse pointer-events-none">
            <span className="text-xs font-bold" style={{ color: 'var(--ink-mute)' }}>计算器加载中…</span>
          </div>
        )}
        <iframe
          src={publicUrl('shudi_calc.html')}
          title="蜜薯价格计算器"
          onLoad={() => setReady(true)}
          className="w-full h-full block border-0"
          style={{ background: 'transparent' }}
          scrolling="no"
        />
      </div>
    </>
  );
}
