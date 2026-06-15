import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import itemsData from '../data/items.json';
import { CropImage, GrowthPhases, RemoteImage, itemImageUrls, goldSeedIds, Portal } from './shared';

const categories = itemsData.categories;

const catAccent: Record<string, string> = {
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

interface GoldDetail { name: string; desc: string; iconFile: string; localFile?: string; }

// 占位/无意义条目过滤（id 列表）
const HIDDEN_ITEM_IDS = new Set([2101, 2102, 2103]);

function categoryCount(c: any): number {
  return (c.items || []).filter((it: any) => !HIDDEN_ITEM_IDS.has(it.id)).length;
}

export default function ItemsTab() {
  const [catId, setCatId] = React.useState('05');
  const [goldDetail, setGoldDetail] = React.useState<GoldDetail | null>(null);

  const cat = categories.find(c => c.id === catId);
  const isSeed = catId === '05';
  const isGoldenFruit = catId === '17';
  const visibleItems = React.useMemo(() => {
    let items = (cat?.items || []).filter((it: any) => !HIDDEN_ITEM_IDS.has(it.id));
    // 超变果实(id=17)：按 cropNumber 倒序排，cropNumber 越大代表越近期上架，越靠前
    // 注意：item.id 的"10"前缀只是分类标记，与上架时间无关；
    //      同一作物的黄金版（104xxxxx）与原版（49xxx/46xxx/40xxx）应排在一起
    if (isGoldenFruit) {
      items = [...items].sort((a: any, b: any) => {
        const ca = Number(a.cropNumber) || 0;
        const cb = Number(b.cropNumber) || 0;
        if (cb !== ca) return cb - ca;
        return (b.id || 0) - (a.id || 0);
      });
    }
    return items;
  }, [cat, isGoldenFruit]);
  const visibleCount = visibleItems.length;

  return (
    <div className="space-y-4 fade-in">
      {/* Hero */}
      <header>
        <div className="chip chip-berry mb-2"><ShoppingBag size={11} strokeWidth={2.5} /> 道具目录</div>
        <h2 className="font-display italic text-3xl font-bold text-[var(--ink)] leading-tight">
          全部商店道具
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mt-1">
          {categories.length} 个分类 · {categories.reduce((s, c) => s + categoryCount(c), 0)} 件道具
        </p>
      </header>

      {/* Mobile-friendly horizontal scroll for categories on small screens, sidebar on large */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Pills (mobile: horizontal scroll, desktop: vertical rail) */}
        <div className="lg:w-52 lg:flex-shrink-0">
          <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {categories.map(c => {
              const active = catId === c.id;
              const accent = catAccent[c.id] || 'leaf';
              return (
                <button key={c.id} onClick={() => setCatId(c.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all"
                  style={active
                    ? { background: `var(--${accent === 'ink' ? 'ink' : accent})`, color: 'white', boxShadow: `0 2px 0 var(--${accent === 'ink' ? 'ink' : accent}-deep)` }
                    : { background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>
                  <span className="text-base">{c.icon}</span><span>{c.name}</span>
                  <span className="font-mono opacity-70">{categoryCount(c)}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block space-y-1.5 sticky top-32">
            <div className="section-eyebrow px-2 pb-2">分类</div>
            {categories.map(c => {
              const active = catId === c.id;
              const accent = catAccent[c.id] || 'leaf';
              return (
                <button key={c.id} onClick={() => setCatId(c.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${!active && 'hover:bg-[var(--bg-2)]'}`}
                  style={active ? {
                    background: `var(--${accent === 'ink' ? 'bg-2' : accent + '-bg'})`,
                    border: `1.5px solid var(--${accent === 'ink' ? 'ink' : accent})`,
                    boxShadow: 'var(--shadow-pop)',
                  } : { border: '1.5px solid transparent' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: active ? 'rgba(255,255,255,0.7)' : `var(--${accent === 'ink' ? 'bg-2' : accent + '-bg'})` }}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[var(--ink)] truncate">{c.name}</div>
                    <div className="text-[11px] font-mono text-[var(--ink-mute)]">{categoryCount(c)} 件</div>
                  </div>
                </button>
              );
            })}
          </div>
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
                <div className="text-xs text-[var(--ink-mute)] text-center py-12">数据整理中</div>
              ) : visibleCount === 0 ? (
                <div className="text-xs text-[var(--ink-mute)] text-center py-12">暂无数据</div>
              ) : visibleItems.map((item) => {
                if (isSeed) {
                  const seedPrice = item.sells ? parseInt(item.sells.split(':')[1]) || 0 : 0;
                  return (
                    <div key={item.id}
                      className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl transition-colors hover:bg-[var(--leaf-bg)]"
                      style={{ background: 'transparent' }}>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--leaf-bg)' }}>
                        <CropImage seedId={item.id} name={item.name} size={40} className="sm:hidden" />
                        <CropImage seedId={item.id} name={item.name} size={56} className="hidden sm:block" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-bold text-[var(--ink)] truncate">{item.name}</div>
                        <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] font-mono mt-0.5 sm:mt-1">
                          Lv{item.level} · 🌱 {item.exp}
                          {item.seasons > 1 && <span className="ml-1.5 text-[var(--sky-deep)] font-bold">· {item.seasons}季</span>}
                        </div>
                      </div>
                      <span className="font-mono tnum text-xs sm:text-sm font-bold text-[var(--sun-deep)] flex-shrink-0">
                        💰 {seedPrice}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={item.id}
                    onClick={() => isGoldenFruit ? setGoldDetail({ name: item.name, desc: item.desc, iconFile: item.iconFile, localFile: (item as any).localFile }) : undefined}
                    className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl transition-all ${isGoldenFruit ? 'cursor-pointer hover:bg-[var(--sun-bg)]' : 'hover:bg-[var(--bg-2)]'}`}>
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isGoldenFruit ? 'var(--sun-bg)' : 'var(--bg-2)' }}>
                      <RemoteImage urls={itemImageUrls(item.iconFile, (item as any).localFile)} name={item.name} size={48} className="sm:hidden" rounded />
                      <RemoteImage urls={itemImageUrls(item.iconFile, (item as any).localFile)} name={item.name} size={72} className="hidden sm:block" rounded />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-bold text-[var(--ink)]">{item.name}</div>
                      {item.desc && <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] mt-0.5 sm:mt-1 line-clamp-2">{item.desc}</div>}
                    </div>
                    {item.level > 0 && (
                      <span className="chip chip-ink flex-shrink-0">Lv.{item.level}</span>
                    )}
                  </div>
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
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>

            <div className="sticky top-0 z-10 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between"
              style={{ background: 'var(--bg-paper)', borderBottom: '1.5px solid var(--line)' }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--sun-bg)' }}>
                  <RemoteImage urls={itemImageUrls(goldDetail.iconFile, goldDetail.localFile)} name={goldDetail.name} size={56} className="sm:hidden" rounded />
                  <RemoteImage urls={itemImageUrls(goldDetail.iconFile, goldDetail.localFile)} name={goldDetail.name} size={96} className="hidden sm:block" rounded />
                </div>
                <div>
                  <h3 className="font-display italic text-lg sm:text-2xl font-bold text-[var(--ink)] leading-tight">{goldDetail.name}</h3>
                  <div className="text-[11px] sm:text-xs text-[var(--ink-mute)] mt-1 sm:mt-1.5 line-clamp-2 max-w-[14rem] sm:max-w-[18rem]">{goldDetail.desc}</div>
                </div>
              </div>
              <button onClick={() => setGoldDetail(null)}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-2)' }}>
                <X size={16} className="text-[var(--ink-soft)] sm:hidden" />
                <X size={20} className="text-[var(--ink-soft)] hidden sm:block" />
              </button>
            </div>

            {goldSeedIds[goldDetail.name] && (
              <div className="p-5 sm:p-6">
                <div className="section-eyebrow mb-2">成长阶段 · 黄金变异</div>
                <div className="sticker-soft p-3 sm:p-4">
                  <GrowthPhases seedId={goldSeedIds[goldDetail.name]} gold />
                </div>
              </div>
            )}
            </motion.div>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
