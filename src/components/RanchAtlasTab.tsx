import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, X, ZoomIn } from 'lucide-react';
import ranchData from '../data/ranch_atlas.json';
import { RemoteImage, EmptyState, PillTabGroup, Portal, StatTile, publicUrl } from './shared';

// 牧场图鉴 —— 24 只牧场动物（ItemInfo type=105，官方 Illustrated「牧场图鉴」排序）
// 数据来自 ranch_atlas.json（extract_from_wxapkg.ts 生成）
// 图片来自 animal bundle 的 texture/<动物id>_<1..4>（幼崽 → 成熟 4 个阶段）

interface Animal {
  id: number;
  name: string;
  category: string;      // 窝 / 棚
  rarity: number;
  rarityColor: string;
  unlockLevel: number;
  desc: string;
  product: string;       // 长大后产出什么
  price: number;
  priceUnit: string;
  assetBase: string;
  stages: string[];      // 4 个阶段的图片相对路径
  productId: number;
  productName: string;
  sort: number;
}

const ANIMALS = (ranchData as any).animals as Animal[];

// 4 个阶段的名称：官方配置里没有单独命名（ItemInfo 只有「幼崽」的整体描述），
// 这里按「幼崽 → 长大」的语义给出可读标签。
const STAGE_NAMES = ['幼崽', '成长', '半熟', '成熟'];

type CatFilter = 'all' | '窝' | '棚';

function AnimalCard({ animal, onOpen }: { animal: Animal; onOpen: (a: Animal) => void; key?: React.Key }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(animal)}
      className="sticker sticker-press p-2.5 sm:p-3 flex flex-col gap-2 text-left group cursor-zoom-in">
      <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--surface-soft)' }}>
        <RemoteImage urls={[publicUrl(animal.stages[3] || animal.stages[0])]} name={animal.name}
          className="w-[86%] h-[86%]" rounded />
        <span className="chip absolute top-2 left-2"
          style={{ fontSize: '0.6rem', padding: '0.1rem 0.45rem', background: 'rgba(255,255,255,0.86)', color: 'var(--ink-soft)' }}>
          {animal.category}
        </span>
        <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.94)', boxShadow: '0 1px 4px rgba(0,0,0,.14)' }}>
          <ZoomIn size={13} className="text-[var(--ink-soft)]" />
        </span>
      </div>
      <div className="px-0.5 pb-0.5 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs sm:text-sm text-[var(--ink)] leading-snug line-clamp-1">{animal.name}</span>
          <span className="chip chip-sky flex-shrink-0" style={{ fontSize: '0.6rem', padding: '0.05rem 0.4rem' }}>
            Lv.{animal.unlockLevel}
          </span>
        </div>
        <div className="text-[10px] text-[var(--ink-mute)] truncate" title={animal.product}>
          产出 {animal.product}
        </div>
      </div>
    </button>
  );
}

function AnimalDetail({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  return (
    <Portal>
      <motion.div
        key="ranch-detail"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}>
        <div className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-sm" />
        <motion.div
          key="ranch-detail-panel"
          initial={{ y: '100%', scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
          style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>
          <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 flex items-center gap-3"
            style={{ background: 'var(--bg-paper)', borderBottom: '1.5px solid var(--line)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--leaf-bg)' }}>
              <RemoteImage urls={[publicUrl(animal.stages[3])]} name={animal.name} className="w-10 h-10" rounded />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display italic text-lg font-bold text-[var(--ink)]">{animal.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="chip chip-ink" style={{ fontSize: '0.62rem' }}>{animal.category}</span>
                <span className="chip chip-sky" style={{ fontSize: '0.62rem' }}>Lv.{animal.unlockLevel} 解锁</span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-2)' }} aria-label="关闭">
              <X size={18} className="text-[var(--ink-soft)]" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* 成长阶段 */}
            <div className="sticker p-3 sm:p-4">
              <div className="section-eyebrow mb-2">成长阶段</div>
              <div className="flex items-end justify-between gap-1">
                {animal.stages.map((s, i) => (
                  <React.Fragment key={i}>
                    <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <RemoteImage urls={[publicUrl(s)]} name={`${animal.name}${i}`}
                        className="w-full aspect-square" rounded />
                      <span className="text-[10px] font-bold text-[var(--ink-soft)]">{STAGE_NAMES[i] || `阶段 ${i + 1}`}</span>
                    </div>
                    {i < animal.stages.length - 1 && (
                      <span className="text-[var(--ink-mute)]/60 text-lg flex-shrink-0 pb-5" aria-hidden>›</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 数据面板 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <StatTile label="长大后产出" value={animal.product || '—'} color="leaf" />
              <StatTile label="解锁等级" value={`Lv.${animal.unlockLevel}`} color="sky" />
              <StatTile label="售价" value={`${animal.price} ${animal.priceUnit}`} color="sun" />
            </div>

            {animal.desc && (
              <p className="text-[11px] sm:text-xs text-[var(--ink-soft)] leading-relaxed">{animal.desc}</p>
            )}
            {animal.productName && (
              <p className="text-[11px] text-[var(--ink-mute)]">
                成熟后可收获「{animal.productName}」，出售换取{animal.priceUnit}。
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Portal>
  );
}

export default function RanchAtlasTab() {
  const [filter, setFilter] = React.useState<CatFilter>('all');
  const [detail, setDetail] = React.useState<Animal | null>(null);

  React.useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetail(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail]);

  const list = React.useMemo(
    () => (filter === 'all' ? ANIMALS : ANIMALS.filter((a) => a.category === filter)),
    [filter],
  );
  const countOf = (c: CatFilter) => (c === 'all' ? ANIMALS.length : ANIMALS.filter((a) => a.category === c).length);

  return (
    <div className="space-y-5 fade-in">
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--leaf-bg)', color: 'var(--leaf-deep)' }}>
          <Sprout size={11} strokeWidth={2.5} /> 牧场图鉴
        </span>
        <h2 className="page-header-title">养大它们，收获产物</h2>
        <p className="page-header-subtitle">
          {ANIMALS.length} 只牧场动物 · 窝 {countOf('窝')} / 棚 {countOf('棚')} · 点击卡片看成长阶段
        </p>
      </header>

      <PillTabGroup
        items={[
          { id: 'all', label: '全部', emoji: '🐾', count: countOf('all') },
          { id: '窝', label: '窝', emoji: '🪹', count: countOf('窝') },
          { id: '棚', label: '棚', emoji: '🏠', count: countOf('棚') },
        ]}
        value={filter}
        onChange={(id) => setFilter(id as CatFilter)}
        accent="leaf"
        size="md"
      />

      {list.length === 0 ? (
        <EmptyState emoji="🐾" title="该分类暂无动物" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {list.map((a) => <AnimalCard key={a.id} animal={a} onOpen={setDetail} />)}
        </div>
      )}

      <AnimatePresence>
        {detail && <AnimalDetail animal={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
