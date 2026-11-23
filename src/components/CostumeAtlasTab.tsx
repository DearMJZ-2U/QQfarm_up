import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Package, FolderTree, X, ZoomIn } from 'lucide-react';
import costumeData from '../data/costume_atlas.json';
import { groupCostumesBySet, buildOrderedSections, type CostumeItem, type CostumeSet } from '../data/costume-sets';
import { RemoteImage, costumeImageUrls, EmptyState, PillTabGroup, Portal } from './shared';

const tagChip: Record<string, string> = {
  '默认': 'chip-ink',
  '活动': 'chip-orange',
  '黄金': 'chip-sun',
};

const catAccents = ['leaf', 'orange', 'sun', 'berry', 'sky', 'plum'] as const;
type Accent = typeof catAccents[number];

type ViewTab = 'functional' | 'set';

// 「点击看大图」用 Context 下发，避免逐层透传（Tab → SetView → Section → SetRow → ItemGrid）
const ZoomCtx = React.createContext<(item: CostumeItem) => void>(() => {});

function ItemCard({ item }: { item: CostumeItem; key?: React.Key }) {
  const onZoom = React.useContext(ZoomCtx);
  return (
    <button
      type="button"
      onClick={() => onZoom(item)}
      className="sticker sticker-press p-2.5 sm:p-3 flex flex-col gap-2 sm:gap-2.5 text-left group cursor-zoom-in">
      {/* 图片区：正方形自适应，随卡片宽度放大 */}
      <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--surface-soft)' }}>
        <RemoteImage urls={costumeImageUrls(item.img, item.name)} name={item.name}
          className="w-[86%] h-[86%]" rounded />
        {/* 标签做成图片角标 —— 不再与名称争抢横向空间（PC 端窄列时曾挤掉大半名称） */}
        <span className={`chip ${tagChip[item.tag] || tagChip['默认']} absolute top-2 left-2`}
          style={{ fontSize: '0.6rem', padding: '0.1rem 0.45rem' }}>
          {item.tag}
        </span>
        <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.94)', boxShadow: '0 1px 4px rgba(0,0,0,.14)' }}>
          <ZoomIn size={13} className="text-[var(--ink-soft)]" />
        </span>
      </div>
      {/* 文字区：只保留名称 —— costume_atlas.json 中 desc 与 name 完全相同（75/75），
          再渲染一遍就是重复文案 */}
      <div className="px-0.5 pb-0.5">
        <div className="font-bold text-xs sm:text-sm text-[var(--ink)] leading-snug line-clamp-2">{item.name}</div>
      </div>
    </button>
  );
}

function ItemGrid({ items }: { items: CostumeItem[] }) {
  return (
    // 页面容器上限 64rem(1024px)，4 列时每列约 230px —— 再往上加列就会挤到文字
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, j) => (
        <ItemCard key={`${item.name}-${j}`} item={item} />
      ))}
    </div>
  );
}

function FunctionalView() {
  const { categories } = costumeData;
  return (
    <>
      {categories.map((cat, i) => {
        const accent = catAccents[i % catAccents.length];
        return (
          <motion.section key={cat.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}>
            <div className="sticker-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3"
                style={{ background: `var(--${accent}-bg)`, borderBottom: `1.5px solid var(--${accent}-soft)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(255,255,255,0.8)' }}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display italic text-base font-bold" style={{ color: `var(--${accent}-deep)` }}>
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-[var(--ink-soft)]">{cat.desc}</p>
                </div>
                <span className="chip" style={{ background: 'rgba(255,255,255,0.7)', color: `var(--${accent}-deep)` }}>
                  {cat.items.length} 件
                </span>
              </div>

              <div className="p-3 sm:p-4">
                {cat.items.length === 0 ? (
                  <EmptyState emoji="🎒" title="该分类暂无装扮" />
                ) : (
                  <ItemGrid items={cat.items.map(item => ({ ...item, category: cat.name }))} />
                )}
              </div>
            </div>
          </motion.section>
        );
      })}
    </>
  );
}

function SetRow({ set, accent }: { set: CostumeSet; accent: Accent; key?: React.Key }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: `var(--${accent})` }} />
        <span className="font-bold text-sm text-[var(--ink)]">{set.name}</span>
        <span className="chip chip-ink flex-shrink-0" style={{ fontSize: '0.65rem' }}>{set.items.length} 件</span>
      </div>
      <ItemGrid items={set.items} />
    </div>
  );
}

function Section({ title, desc, icon, count, accent, children }: {
  title: string; desc?: string; icon: string; count: string; accent: Accent | 'ink';
  children: React.ReactNode; key?: React.Key;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <div className="sticker-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ background: `var(--${accent}-bg)`, borderBottom: `1.5px solid var(--${accent}-soft)` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(255,255,255,0.8)' }}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-display italic text-base font-bold" style={{ color: `var(--${accent}-deep)` }}>
              {title}
            </h3>
            {desc && <p className="text-[10px] text-[var(--ink-soft)]">{desc}</p>}
          </div>
          <span className="chip" style={{ background: 'rgba(255,255,255,0.7)', color: `var(--${accent}-deep)` }}>
            {count}
          </span>
        </div>

        <div className="p-3 sm:p-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function SetView() {
  const grouped = React.useMemo(
    () => groupCostumesBySet(costumeData.categories as any),
    []
  );

  const ordered = React.useMemo(
    () => buildOrderedSections(grouped.events, grouped.themes),
    [grouped]
  );
  const topAccents = (idx: number) => catAccents[idx % catAccents.length];

  return (
    <>
      {ordered.map((sec, i) => {
        const accent = topAccents(i);
        if (sec.kind === 'event') {
          const ev = sec.event;
          const totalItems = ev.sets.reduce((s, x) => s + x.items.length, 0);
          return (
            <Section key={`e:${ev.name}`} title={ev.name} icon="🎉" accent={accent} count={`${ev.sets.length} 套 · ${totalItems} 件`}>
              <div className="space-y-4 pl-3 border-l border-[var(--line)]">
                {ev.sets.map((set, j) => (
                  <SetRow key={j} set={set} accent={accent} />
                ))}
              </div>
            </Section>
          );
        }
        const set = sec.set;
        return (
          <Section key={`t:${set.name}`} title={set.name} icon="🎨" accent={accent} count={`${set.items.length} 件`}>
            <ItemGrid items={set.items} />
          </Section>
        );
      })}

      <Section title="默认系列" icon="🎒" accent="ink" count={`${grouped.default.items.length} 件`}>
        <ItemGrid items={grouped.default.items} />
      </Section>
    </>
  );
}

// 点击卡片后的大图预览（装扮图源已是 500×500，这里给到 ~520px 展示）
function CostumeZoom({ item, onClose }: { item: CostumeItem; onClose: () => void }) {
  return (
    <Portal>
      <motion.div
        key="costume-zoom"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}>
        <div className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-sm" />
        <motion.div
          key="costume-zoom-panel"
          initial={{ scale: 0.92, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[640px] rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-3"
          style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10"
            style={{ background: 'var(--bg-2)' }} aria-label="关闭">
            <X size={18} className="text-[var(--ink-soft)]" />
          </button>
          <div className="w-full flex items-center justify-center rounded-2xl py-2"
            style={{ background: 'var(--surface)' }}>
            <RemoteImage urls={costumeImageUrls(item.img, item.name)} name={item.name}
              className="w-[62vw] h-[62vw] max-w-[520px] max-h-[520px]" rounded />
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="font-display italic text-lg sm:text-xl font-bold text-[var(--ink)]">{item.name}</span>
            <span className={`chip ${tagChip[item.tag] || tagChip['默认']}`}>{item.tag}</span>
          </div>
          {/* desc 与 name 相同，不再重复渲染 */}
        </motion.div>
      </motion.div>
    </Portal>
  );
}

export default function CostumeAtlasTab() {
  const [view, setView] = React.useState<ViewTab>('set');
  const [zoom, setZoom] = React.useState<CostumeItem | null>(null);
  const { categories } = costumeData;
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);

  // ESC 关闭大图
  React.useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  return (
    <ZoomCtx.Provider value={setZoom}>
      <div className="space-y-5 fade-in">
        {/* Hero */}
        <header className="page-header">
          <span className="page-header-chip" style={{ background: 'var(--sky-bg)', color: 'var(--sky-deep)' }}>
            <Home size={11} strokeWidth={2.5} /> 装扮图鉴
          </span>
          <h2 className="page-header-title">打扮你的农场</h2>
          <p className="page-header-subtitle">{categories.length} 大类装扮共 {totalItems} 件 · 点击卡片可查看大图</p>
        </header>

        <PillTabGroup
          items={[
            { id: 'set',        label: '套装分类', emoji: '🎁' },
            { id: 'functional', label: '功能分类', emoji: '🗂️' },
          ]}
          value={view}
          onChange={(id) => setView(id as ViewTab)}
          accent="orange"
          size="md"
        />

        {view === 'set' && <SetView />}
        {view === 'functional' && <FunctionalView />}
      </div>

      <AnimatePresence>
        {zoom && <CostumeZoom item={zoom} onClose={() => setZoom(null)} />}
      </AnimatePresence>
    </ZoomCtx.Provider>
  );
}
