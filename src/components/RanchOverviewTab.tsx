// 工具 · 牧场全览 —— 嵌入 public/ranch_overview.html（单文件自包含，图片全部内联）
//
// 和「等级查询 / 土地升级所需」保持同一种观感：整页自然滚动，不做成一屏高的窗口。
// 页面通过 postMessage 上报真实内容高度，这里把 iframe 撑到那个高度，滚动交给外层页面。
//
// 动物详情弹层必须由这边渲染：iframe 高度等于整页高度，里面的 position:fixed 会跑到
// 整页最底部，用户点卡片得滚到底才看得见。所以页面只把数据发过来（ranch-sheet），
// 弹层在 React 这层用 Portal 覆盖真实视口。
import { useEffect, useRef, useState } from 'react';
import { publicUrl, Portal } from './shared';

const MIN_H = 900;
const STAGE_LABEL = ['幼崽', '幼年', '成长', '成熟'];

interface SheetRow { k: string; v: string }
interface SheetData {
  name: string;
  lv?: string;
  meta?: string;
  rateNum?: string;
  rateUnit?: string;
  stages: string[];
  rows: SheetRow[];
}

export default function RanchOverviewTab() {
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(MIN_H);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; h?: number; data?: SheetData } | null;
      if (!d || typeof d !== 'object') return;

      if (d.type === 'ranch-height' && typeof d.h === 'number' && d.h > 300) {
        setHeight(Math.ceil(d.h));
      }
      if (d.type === 'ranch-scroll-top' && boxRef.current) {
        const top = boxRef.current.getBoundingClientRect().top + window.scrollY - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      if (d.type === 'ranch-sheet' && d.data) {
        setSheet(d.data);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // 弹层打开时锁住背景滚动
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  return (
    <>
      <div ref={boxRef} className="relative w-full" style={{ height, transition: 'height 0.18s ease' }}>
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

      {sheet && (
        <Portal>
          <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0"
              style={{ background: 'rgba(20,26,18,0.45)', backdropFilter: 'blur(3px)' }}
              onClick={() => setSheet(null)} />

            <div
              className="relative w-full max-w-[560px] max-h-[86vh] overflow-y-auto rounded-t-[24px] px-4 pt-4"
              style={{
                background: 'var(--surface)',
                borderTop: '1.5px solid var(--line)',
                boxShadow: '0 -18px 50px -20px rgba(0,0,0,0.45)',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                animation: 'sheetUp .26s cubic-bezier(.2,.85,.25,1) both',
              }}>
              {/* 头部 */}
              <div className="flex items-center gap-3 pr-9 relative">
                <div className="w-[74px] h-[74px] flex-shrink-0 grid place-items-center rounded-2xl"
                  style={{ background: 'radial-gradient(circle,#e2f0d7,#f8f6ec 72%)' }}>
                  {sheet.stages[3] && (
                    <img src={sheet.stages[3]} alt={sheet.name} className="w-[66px] h-[66px] object-contain" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[19px] font-bold leading-tight" style={{ color: 'var(--ink)' }}>{sheet.name}</span>
                    {sheet.lv && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--sun-bg)', color: 'var(--sun-deep)' }}>{sheet.lv}</span>
                    )}
                  </div>
                  {sheet.meta && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--ink-mute)' }}>{sheet.meta}</div>
                  )}
                  {sheet.rateNum && (
                    <div className="text-[17px] font-bold mt-0.5" style={{ color: 'var(--leaf-deep)' }}>
                      {sheet.rateNum}
                      <span className="text-[10.5px] font-bold ml-0.5" style={{ color: 'var(--ink-mute)' }}>{sheet.rateUnit}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setSheet(null)} aria-label="关闭"
                  className="absolute right-0 top-0 w-8 h-8 grid place-items-center rounded-full text-sm"
                  style={{ border: '1px solid var(--line)', background: 'var(--surface-soft)', color: 'var(--ink-soft)' }}>✕</button>
              </div>

              {/* 四阶段 */}
              <div className="grid grid-cols-4 gap-1.5 mt-3.5">
                {sheet.stages.map((src, i) => (
                  <figure key={i} className="text-center m-0">
                    <img src={src} alt="" className="w-full aspect-square object-contain" />
                    <figcaption className="text-[10px]" style={{ color: 'var(--ink-mute)' }}>{STAGE_LABEL[i]}</figcaption>
                  </figure>
                ))}
              </div>

              {/* 明细 */}
              <div className="mt-2">
                {sheet.rows.map((r, i) => (
                  <div key={i} className="flex justify-between gap-2 py-1.5 text-[12.5px]"
                    style={{ borderBottom: i === sheet.rows.length - 1 ? 'none' : '1px dashed var(--line)' }}>
                    <span style={{ color: 'var(--ink-mute)' }}>{r.k}</span>
                    <span className="text-right" style={{ color: 'var(--ink-soft)' }}
                      dangerouslySetInnerHTML={{ __html: r.v }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`@keyframes sheetUp{from{transform:translateY(34px);opacity:.5}to{transform:none;opacity:1}}`}</style>
        </Portal>
      )}
    </>
  );
}
