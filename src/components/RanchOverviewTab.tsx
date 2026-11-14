// 工具 · 牧场全览 —— 直接嵌入 public/ranch_overview.html（单文件自包含，图片全部内联）
// 页面本身带 5 个子 tab（总览/动物/设施/经济/玩法），所以这里用 iframe 承载，
// 高度撑满可视区、内部独立滚动，避免与外层页面争抢滚动条。
import { useState } from 'react';
import { publicUrl } from './shared';

export default function RanchOverviewTab() {
  const [ready, setReady] = useState(false);

  return (
    <div
      className="relative rounded-[20px] overflow-hidden"
      style={{
        height: 'calc(100dvh - 258px)',
        minHeight: 460,
        border: '1.5px solid var(--line)',
        background: '#f6f4ec',
        boxShadow: '0 18px 40px -28px rgba(0,0,0,0.45)',
      }}>
      {!ready && (
        <div className="absolute inset-0 grid place-items-center animate-pulse">
          <span className="text-xs font-bold" style={{ color: 'var(--ink-mute)' }}>牧场全览加载中…</span>
        </div>
      )}
      <iframe
        src={publicUrl('ranch_overview.html')}
        title="牧场全览"
        onLoad={() => setReady(true)}
        className="w-full h-full block border-0"
        style={{ background: '#f6f4ec' }}
      />
    </div>
  );
}
