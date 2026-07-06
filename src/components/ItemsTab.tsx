import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import itemsData from '../data/items.json';
import { CropImage, RemoteImage, itemImageUrls, goldSeedIds, Portal, RowCard, EmptyState, GrowthPhases, CategoryNav, getGrade } from './shared';
import type { CategoryNavItem } from './shared';

const categories = itemsData.categories;

const catAccent: Record<string, 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' | 'ink'> = {
  '05': 'leaf',
  '17': 'sun',
  '02': 'orange',
  '04': 'sky',
  '07': 'leaf',
  '10': 'plum',
  '08': 'orange',
  '09': 'berry',
  '19': 'berry',
  '01': 'ink',
  '03': 'plum',
  '15': 'plum',
};

interface GoldDetail {
  name: string;
  desc: string;
  iconFile: string;
  localFile?: string;
  rarity?: number;
  rarityColor?: string;
}

// 占位/无意义条目过滤（id 列表）
const HIDDEN_ITEM_IDS = new Set([2101, 2102, 2103]);

function categoryCount(c: any): number {
  return (c.items || []).filter((it: any) => !HIDDEN_ITEM_IDS.has(it.id)).length;
}

export default function ItemsTab({ initialCategoryId }: { initialCategoryId?: string } = {}) {
  const [catId, setCatId] = React.useState(initialCategoryId || '05');
  const [goldDetail, setGoldDetail] = React.useState<GoldDetail | null>(null);

  // 当父组件传入新的 initialCategoryId 时切换分类
  React.useEffect(() => {
    if (initialCategoryId && initialCategoryId !== catId) {
      setCatId(initialCategoryId);
    }
  }, [initialCategoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cat = categories.find(c => c.id === catId);
  const isSeed = catId === '05';
  const isGoldenFruit = catId === '17';
  const showGrade = isSeed || isGoldenFruit;

  // 给 CategoryNav 用的简化数据
  const navItems: CategoryNavItem[] = React.useMemo(
    () => categories.map(c => ({
      id: c.id,
      label: c.name,
      emoji: c.icon,
      count: categoryCount(c),
      color: catAccent[c.id] || 'leaf',
    })),
    [],
  );

  const visibleItems = React.useMemo(() => {
    let items = (cat?.items || []).filter((it: any) => !HIDDEN_ITEM_IDS.has(it.id));
    // 种子和超变果实按品级降序：天工(4) > 珍品(3) > 稀有(2) > 普通(1)
    if (isSeed || isGoldenFruit) {
      items = [...items].sort((a, b) => {
        const ra = a.rarity || 1;
        const rb = b.rarity || 1;
        if (rb !== ra) return rb - ra;
        return (a.level || 0) - (b.level || 0);
      });
    }
    return items;
  }, [cat, isSeed, isGoldenFruit]);
  const visibleCount = visibleItems.length;

  return (
    <div className="space-y-4 fade-in">
      {/* Hero */}
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--berry-bg)', color: 'var(--berry-deep)' }}>
          <ShoppingBag size={11} strokeWidth={2.5} /> 道具目录
        </span>
        <h2 className="page-header-title">全部商店道具</h2>
        <p className="page-header-subtitle">
          {categories.length} 个分类 · {categories.reduce((s, c) => s + categoryCount(c), 0)} 件道具
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-52 lg:flex-shrink-0">
          <CategoryNav
            items={navItems}
            value={catId}
            onChange={setCatId}
          />
        </div>

        {/* Items List */}
        <div className="flex-1 min-w-0">
          <motion.div key={catId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="sticker-lg overflow-hidden">

            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-2"
              style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
              <span className="text-lg sm:text-xl">{cat?.icon}</span>
              <span className="font-display italic text-base sm:text-lg font-bold text-[var(--ink)]">{cat?.name}</span>
              <span className="chip chip-ink ml-auto">{visibleCount} 件</span>
            </div>

            <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 max-h-[70vh] overflow-y-auto">
              {!cat ? (
                <EmptyState emoji="🛒" title="数据整理中" />
              ) : visibleCount === 0 ? (
                <EmptyState emoji="🫙" title="该分类暂无数据" />
              ) : visibleItems.map((item) => {
                if (isSeed) {
                  const seedPrice = item.sells ? parseInt(item.sells.split(':')[1]) || 0 : 0;
                  const grade = showGrade ? getGrade(item.rarity, item.rarityColor) : null;
                  return (
                    <RowCard key={item.id}>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--leaf-bg)' }}>
                        <CropImage seedId={item.id} name={item.name} className="w-14 h-14 sm:w-16 sm:h-16" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm sm:text-base font-bold truncate"
                          style={grade ? { color: `#${grade.color}` } : undefined}
                          title={grade ? `品级：${grade.name}` : undefined}>
                          {item.name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] font-mono mt-0.5 sm:mt-1">
                          Lv{item.level} · 🌱 {item.exp}
                          {item.seasons > 1 && <span className="ml-1.5 text-[var(--berry-deep)] font-bold">· {item.seasons}季</span>}
                        </div>
                      </div>
                      <span className="font-mono tnum text-xs sm:text-sm font-bold text-[var(--sun-deep)] flex-shrink-0">
                        💰 {seedPrice}
                      </span>
                    </RowCard>
                  );
                }

                const openGold = () => {
                  if (isGoldenFruit) {
                    setGoldDetail({
                      name: item.name,
                      desc: item.desc,
                      iconFile: item.iconFile,
                      localFile: (item as any).localFile,
                      rarity: item.rarity,
                      rarityColor: item.rarityColor,
                    });
                  }
                };

                const grade = showGrade ? getGrade(item.rarity, item.rarityColor) : null;
                return (
                  <RowCard key={item.id} onClick={openGold}>
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isGoldenFruit ? 'var(--sun-bg)' : 'var(--bg-2)' }}>
                      <RemoteImage urls={itemImageUrls(item.iconFile, (item as any).localFile)} name={item.name} className="w-14 h-14 sm:w-20 sm:h-20" rounded />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm sm:text-base font-bold"
                        style={grade ? { color: `#${grade.color}` } : undefined}
                        title={grade ? `品级：${grade.name}` : undefined}>
                        {item.name}
                      </div>
                      {item.desc && <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] mt-0.5 sm:mt-1 line-clamp-2">{item.desc}</div>}
                    </div>
                    {item.level > 0 && (
                      <span className="chip chip-sky flex-shrink-0">Lv.{item.level}</span>
                    )}
                  </RowCard>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {goldDetail && (
          <Portal>
            <motion.div
              key="gold-detail-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setGoldDetail(null)}>
              <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" />
              <motion.div
                key="gold-detail-panel"
                initial={{ y: '100%', scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>

            <div className="sticky top-0 z-10 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between"
              style={{ background: 'var(--bg-paper)', borderBottom: '1.5px solid var(--line)' }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--sun-bg)' }}>
                  <RemoteImage urls={itemImageUrls(goldDetail.iconFile, goldDetail.localFile)} name={goldDetail.name} className="w-16 h-16 sm:w-28 sm:h-28" rounded />
                </div>
                <div>
                  {(() => {
                    const g = showGrade ? getGrade(goldDetail.rarity, goldDetail.rarityColor) : null;
                    return (
                      <h3
                        className="font-display italic text-lg sm:text-2xl font-bold leading-tight"
                        style={g ? { color: `#${g.color}` } : undefined}
                        title={g ? `品级：${g.name}` : undefined}>
                        {goldDetail.name}
                      </h3>
                    );
                  })()}
                  <div className="text-[11px] sm:text-xs text-[var(--ink-mute)] mt-1 sm:mt-1.5 line-clamp-2 max-w-[14rem] sm:max-w-[18rem]">{goldDetail.desc}</div>
                </div>
              </div>
              <button onClick={() => setGoldDetail(null)}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-2)' }}
                aria-label="关闭">
                <X size={16} className="text-[var(--ink-soft)] sm:hidden" />
                <X size={20} className="text-[var(--ink-soft)] hidden sm:block" />
              </button>
            </div>

            {goldSeedIds[goldDetail.name] && (() => {
              const isGoldItem = goldDetail.name.startsWith('黄金·');
              return (
                <div className="p-5 sm:p-6">
                  <div className="section-eyebrow mb-2">成长阶段{isGoldItem && ' · 黄金变异'}</div>
                  <div className="sticker-soft p-3 sm:p-4">
                    {isGoldItem ? (
                      <GrowthPhases seedId={goldSeedIds[goldDetail.name]} gold />
                    ) : (
                      <div className="flex justify-center">
                        <RemoteImage urls={itemImageUrls(goldDetail.iconFile, goldDetail.localFile)} name={goldDetail.name} className="w-48 h-48 sm:w-56 sm:h-56" rounded />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            </motion.div>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
