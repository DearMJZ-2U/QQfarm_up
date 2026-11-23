import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, X, ZoomIn } from 'lucide-react';
import ranchData from '../data/ranch_atlas.json';
import ranchSheets from '../data/ranch_sheets.json';
import { RemoteImage, EmptyState, PillTabGroup, Portal, StatTile, publicUrl } from './shared';

// 牧场图鉴 —— 56 只牧场动物（ItemInfo type=105，官方 Illustrated「牧场图鉴」排序）
// 2026-11-16：24 只基础动物 + 4 只新增小型（豪猪/龙猫/孔雀/貂）+ 28 只「巨大化幼崽」（65001-65016 窝 / 75001-75012 棚）
// 数据来自 ranch_atlas.json（随数据快照生成）
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

// 详情用的完整参数：来自「牧场全量手册」页的动物明细（产物/单价/时长/收益/牧草/经验/上限/售价/回本时间…），
// 已整理成 src/data/ranch_sheets.json，比 ranch_atlas.json 详尽得多。
interface RanchSheet { kind: 'animal' | 'giant'; name: string; sub: string; stages: string[]; rows: [string, string][] }
const SHEETS = (ranchSheets as any).sheets as Record<string, RanchSheet>;
const sheetOf = (id: number) => SHEETS[String(id)];

// 顶部大字展示的三项（有就展示，没有就退回原面板）
const HEADLINE_KEYS = ['每小时收益', '一轮收益', '回本时间'];

// 巨大化幼崽（65001-65016 窝 / 75001-75012 棚）是新增的道具条目：
// 官方 sort 缺省为 0，直接按 JSON 顺序会把 28 只巨大化幼崽顶在首位。
// 展示时把「可养动物」放前面、巨大化幼崽归到最后一组，数据文件本身不改。
const isGiant = (a: Animal) => (a.id >= 65000 && a.id < 66000) || (a.id >= 75000 && a.id < 76000);

// 4 个阶段的名称：官方配置里没有单独命名（ItemInfo 只有「幼崽」的整体描述），
// 这里按「幼崽 → 长大」的语义给出可读标签。
const STAGE_NAMES = ['幼崽', '幼年', '成长', '成熟'];

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
  const sheet = sheetOf(animal.id);
  const rows = sheet?.rows || [];
  const headline: [string, string][] = HEADLINE_KEYS
    .map((k) => [k, rows.find((r) => r[0] === k)?.[1] || ''] as [string, string])
    .filter(([, v]) => v);
  const rest = rows.filter((r) => !HEADLINE_KEYS.includes(r[0]));
  const stageNames = sheet && sheet.stages.length === animal.stages.length ? sheet.stages : STAGE_NAMES;
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
          role="dialog"
          aria-modal="true"
          aria-label={`${animal.name} 详情`}
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
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {sheet ? (
                  <span className="chip chip-ink" style={{ fontSize: '0.62rem' }}>{sheet.sub}</span>
                ) : (
                  <>
                    <span className="chip chip-ink" style={{ fontSize: '0.62rem' }}>{animal.category}</span>
                    <span className="chip chip-sky" style={{ fontSize: '0.62rem' }}>Lv.{animal.unlockLevel} 解锁</span>
                  </>
                )}
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
                      <span className="text-[10px] font-bold text-[var(--ink-soft)]">{stageNames[i] || `阶段 ${i + 1}`}</span>
                    </div>
                    {i < animal.stages.length - 1 && (
                      <span className="text-[var(--ink-mute)]/60 text-lg flex-shrink-0 pb-5" aria-hidden>›</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {isGiant(animal) && (
                <p className="text-[10px] text-[var(--ink-mute)] mt-2 leading-relaxed">
                  官方包里这只只有「幼崽 / 成熟」两帧美术，中间两个阶段沿用幼崽图，不是漏抓。
                </p>
              )}
            </div>

            {/* 收益 / 回本：手册里的核心三行，做成大字 */}
            {headline.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {headline.map(([k, v], i) => (
                  <React.Fragment key={k}>
                    <StatTile label={k} value={v} color={(['leaf', 'sun', 'sky'] as const)[i % 3]} />
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* 全部参数（来自牧场全量手册，逐行照抄） */}
            {rest.length > 0 ? (
              <div className="sticker p-3 sm:p-4">
                <div className="section-eyebrow mb-1">全部参数 · {rest.length} 项</div>
                <div>
                  {rest.map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 py-1.5"
                      style={{ borderTop: '1px dashed var(--line)' }}>
                      <span className="text-[11px] sm:text-xs text-[var(--ink-mute)] flex-shrink-0">{k}</span>
                      <span className="text-[11px] sm:text-xs font-bold text-[var(--ink)] text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <StatTile label="长大后产出" value={animal.product || '—'} color="leaf" />
                <StatTile label="解锁等级" value={`Lv.${animal.unlockLevel}`} color="sky" />
                <StatTile label="售价" value={`${animal.price} ${animal.priceUnit}`} color="sun" />
              </div>
            )}

            {animal.desc && (
              <p className="text-[11px] sm:text-xs text-[var(--ink-soft)] leading-relaxed">{animal.desc}</p>
            )}
            {animal.productName && rest.length === 0 && (
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

  const list = React.useMemo(() => {
    const base = filter === 'all' ? ANIMALS : ANIMALS.filter((a) => a.category === filter);
    const normal = base.filter((a) => !isGiant(a));
    const giants = base.filter((a) => isGiant(a));
    return [...normal, ...giants];
  }, [filter]);
  const countOf = (c: CatFilter) => (c === 'all' ? ANIMALS.length : ANIMALS.filter((a) => a.category === c).length);
  const giantCount = ANIMALS.filter(isGiant).length;
  const keepCount = ANIMALS.length - giantCount;

  return (
    <div className="space-y-5 fade-in">
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--leaf-bg)', color: 'var(--leaf-deep)' }}>
          <Sprout size={11} strokeWidth={2.5} /> 牧场图鉴
        </span>
        <h2 className="page-header-title">养大它们，收获产物</h2>
        <p className="page-header-subtitle">
          图鉴 {ANIMALS.length} 条 · 可养 {keepCount} 种（窝 {ANIMALS.filter((a) => a.category === '窝' && !isGiant(a)).length} / 棚 {ANIMALS.filter((a) => a.category === '棚' && !isGiant(a)).length}）· 巨大化幼崽 {giantCount} 只
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
          {(() => {
            const nodes: React.ReactNode[] = [];
            let giantHeaderDone = false;
            for (const a of list) {
              if (isGiant(a) && !giantHeaderDone) {
                giantHeaderDone = true;
                nodes.push(
                  <div key="giant-header" className="col-span-full flex items-center gap-2 pt-1">
                    <span className="section-eyebrow">巨大化幼崽 · {list.filter(isGiant).length} 只</span>
                    <span className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                    <span className="text-[10px] text-[var(--ink-mute)]">入栏后必定长成对应的巨大化动物</span>
                  </div>,
                );
              }
              nodes.push(<AnimalCard key={a.id} animal={a} onOpen={setDetail} />);
            }
            return nodes;
          })()}
        </div>
      )}

      <AnimatePresence>
        {detail && <AnimalDetail animal={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
