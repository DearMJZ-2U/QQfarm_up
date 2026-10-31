import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ZoomIn, Lock } from 'lucide-react';
import collectionData from '../data/collection_atlas.json';
import { RemoteImage, EmptyState, PillTabGroup, Portal, StatTile, publicUrl } from './shared';

// 藏品图鉴 —— 5 系列 × 6 件 = 30 件（2026-10-31 蓝晶土地版本）
// 数据来自 collection_atlas.json（extract_from_wxapkg.ts 的 generateCollectionAtlasData 生成）
// 藏品只能通过「蓝晶土地 + 藏品变异」获得，概率按作物时长/品质分 7 组（CollectionGroup.public_probability，单位 ‱）

interface StarScore { star: number; score: number }
interface CollectionItem {
  itemId: number;
  seriesId: number;
  name: string;
  desc: string;
  rarity: number;
  rarityName: string;
  rarityColor: string;
  iconFile: string;
  localFile: string;
  displayOrder: number;
  starScores: StarScore[];
}
interface Group {
  groupName: string;
  sourceRarity: number;
  sourceRarityName: string;
  poolId: number;
  probabilityRaw: number;
  probabilityPct: string;
  guarantee: number;
}
interface StarLevel { starLevel: number; needItems: number; gold: number }
interface Series {
  seriesId: number;
  name: string;
  rarity: number;
  rarityName: string;
  desc: string;
  iconFile: string;
  bigIconFile: string;
  isDisplay: boolean;
  displayOrder: number;
  groups: Group[];
  starLevels: StarLevel[];
  items: CollectionItem[];
}

const SERIES = (collectionData as any).series as Series[];
const SCORE = (collectionData as any).score as {
  starScores: Array<{ starLevel: number; scores: number[] }>;
  pedestalScore: number[];
  rewards: Array<{ level: number; score: number; rewards: string | null }>;
};
const BUFFS = (collectionData as any).buffs as Array<{ id: number; level: number; attrId: string; value: number }>;
const SUMMARY = (collectionData as any).summary as {
  seriesCount: number; itemCount: number; pedestalCount: number; scoreLevels: number; scoreMax: number;
};

const RARITY_ACCENT: Record<number, { bg: string; deep: string }> = {
  1: { bg: 'var(--leaf-bg)', deep: 'var(--leaf-deep)' },
  2: { bg: 'var(--sky-bg)', deep: 'var(--sky-deep)' },
  3: { bg: 'var(--plum-bg)', deep: 'var(--plum-deep)' },
  4: { bg: 'var(--sun-bg)', deep: 'var(--sun-deep)' },
};

const fmtGold = (g: number) => {
  if (!g) return '—';
  if (g >= 100000000) return `${(g / 100000000).toFixed(2)}亿`;
  if (g >= 10000) return `${(g / 10000).toFixed(0)}万`;
  return g.toLocaleString();
};

function ItemCard({ item, onOpen }: { item: CollectionItem; onOpen: (i: CollectionItem) => void; key?: React.Key }) {
  const accent = RARITY_ACCENT[item.rarity] || RARITY_ACCENT[1];
  return (
    <button type="button" onClick={() => onOpen(item)}
      className="sticker sticker-press p-2.5 flex flex-col gap-1.5 text-left group cursor-zoom-in">
      <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--surface-soft)' }}>
        <RemoteImage urls={[publicUrl(`item_images/${item.localFile}`)]} name={item.name}
          className="w-[84%] h-[84%]" rounded />
        <span className="chip absolute top-1.5 left-1.5"
          style={{ fontSize: '0.55rem', padding: '0.05rem 0.4rem', background: accent.bg, color: accent.deep }}>
          {item.rarityName}
        </span>
        <span className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.94)' }}>
          <ZoomIn size={11} className="text-[var(--ink-soft)]" />
        </span>
      </div>
      <div className="px-0.5">
        <div className="font-bold text-[11px] sm:text-xs text-[var(--ink)] leading-snug line-clamp-1">{item.name}</div>
        <div className="text-[9px] text-[var(--ink-mute)] mt-0.5">基础 {item.starScores[0]?.score || 0} 分</div>
      </div>
    </button>
  );
}

function SeriesCard({ s, onOpen }: { s: Series; onOpen: (i: CollectionItem) => void; key?: React.Key }) {
  const accent = RARITY_ACCENT[s.rarity] || RARITY_ACCENT[1];
  const [open, setOpen] = React.useState(true);
  return (
    <div className="sticker-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent.bg }}>
          <RemoteImage urls={[publicUrl(`item_images/collect_series_${s.seriesId}.png`)]} name={s.name}
            className="w-10 h-10" rounded />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display italic font-bold text-sm text-[var(--ink)]">{s.name}</span>
            <span className="chip" style={{ fontSize: '0.55rem', padding: '0.05rem 0.4rem', background: accent.bg, color: accent.deep }}>
              {s.rarityName}
            </span>
            {s.isDisplay && (
              <span className="chip chip-sun" style={{ fontSize: '0.55rem', padding: '0.05rem 0.4rem' }}>首页展示</span>
            )}
          </div>
          <div className="text-[10px] text-[var(--ink-soft)] mt-0.5 line-clamp-1">
            {s.desc || '活动限定系列（不走变异概率）'}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono font-bold text-sm text-[var(--ink)]">{s.items.length}</div>
          <div className="text-[9px] text-[var(--ink-mute)]">件</div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3">
              {/* 概率组 */}
              {s.groups.length > 0 && (
                <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-2)' }}>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">触发概率（蓝晶土地专属）</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {s.groups.map(g => (
                      <div key={g.poolId} className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--ink-soft)] truncate">{g.groupName}</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--berry-deep)' }}>
                          {g.probabilityPct}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-[var(--ink-mute)] mt-1.5">
                    保底：{s.groups.map(g => `${g.groupName.split('·')[0]} ${g.guarantee} 次`).join(' · ')}（各档独立累计）
                  </div>
                </div>
              )}

              {/* 星级需求 */}
              <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-2)' }}>
                <div className="text-[9px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">星级升级需求</div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {s.starLevels.map(st => (
                    <div key={st.starLevel} className="flex-shrink-0 rounded-lg px-2 py-1 text-center"
                      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                      <div className="text-[9px] font-bold" style={{ color: 'var(--sun-deep)' }}>{'★'.repeat(st.starLevel)}</div>
                      <div className="text-[9px] text-[var(--ink-soft)] mt-0.5 whitespace-nowrap">
                        {st.needItems} 件
                      </div>
                      {st.gold > 0 && <div className="text-[9px] text-[var(--ink-mute)] whitespace-nowrap">{fmtGold(st.gold)}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* 藏品网格 */}
              <div className="grid grid-cols-3 gap-2">
                {s.items.map(it => <ItemCard key={it.itemId} item={it} onOpen={onOpen} />)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CollectionAtlasTab() {
  const [filter, setFilter] = React.useState<string>('all');
  const [detail, setDetail] = React.useState<CollectionItem | null>(null);

  const shown = filter === 'all' ? SERIES : SERIES.filter(s => String(s.seriesId) === filter);
  const totalGroups = SERIES.reduce((n, s) => n + s.groups.length, 0);

  return (
    <div className="space-y-5 fade-in pt-3">
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--plum-bg)', color: 'var(--plum-deep)' }}>
          <Sparkles size={11} strokeWidth={2.5} /> 藏品图鉴
        </span>
        <h2 className="page-header-title">珍藏室 · {SUMMARY.itemCount} 件藏品</h2>
        <p className="page-header-subtitle">{SUMMARY.seriesCount} 个系列 · 蓝晶土地藏品变异产出</p>
      </header>

      <div className="grid grid-cols-4 gap-2">
        <StatTile label="系列" value={SUMMARY.seriesCount} color="plum" />
        <StatTile label="藏品" value={SUMMARY.itemCount} color="sun" />
        <StatTile label="概率组" value={totalGroups} color="berry" />
        <StatTile label="评分级" value={SUMMARY.scoreLevels} color="sky" />
      </div>

      {/* 系列筛选 */}
      <PillTabGroup
        items={[
          { id: 'all', label: '全部', emoji: '🏺' },
          ...SERIES.map(s => ({ id: String(s.seriesId), label: s.name, emoji: '✨' })),
        ]}
        value={filter}
        onChange={setFilter}
        accent="plum"
        size="md"
      />

      <div className="space-y-3">
        {shown.map(s => <SeriesCard key={s.seriesId} s={s} onOpen={setDetail} />)}
      </div>

      {/* 评分奖励 */}
      <section>
        <div className="section-eyebrow mb-3">藏品评分奖励（{SCORE.rewards.length} 级）</div>
        <div className="sticker-lg overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-mute)]"
            style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
            <span>等级</span>
            <span className="text-right">所需评分</span>
            <span className="text-right">奖励</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {SCORE.rewards.map(r => (
              <div key={r.level} className="grid grid-cols-3 px-4 py-2 text-xs"
                style={{ borderBottom: '1px solid var(--line)' }}>
                <span className="font-mono font-bold text-[var(--ink)]">Lv{r.level}</span>
                <span className="font-mono text-right text-[var(--ink-soft)] tnum">{r.score.toLocaleString()}</span>
                <span className="text-right text-[10px]" style={{ color: r.rewards ? 'var(--sun-deep)' : 'var(--ink-mute)' }}>
                  {r.rewards || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 藏品属性 buff */}
      <section>
        <div className="section-eyebrow mb-3">藏品属性加成（{BUFFS.length} 条）</div>
        <div className="sticker-lg overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-mute)]"
            style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
            <span>评分等级</span>
            <span className="pl-3">属性</span>
            <span className="text-right">数值</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {BUFFS.map(b => (
              <div key={b.id} className="grid grid-cols-[auto_1fr_auto] px-4 py-2 text-xs items-center"
                style={{ borderBottom: '1px solid var(--line)' }}>
                <span className="font-mono font-bold text-[var(--ink)] w-12">Lv{b.level}</span>
                <span className="pl-3 text-[10px] text-[var(--ink-soft)]">{b.attrId}</span>
                <span className="font-mono font-bold text-right tnum" style={{ color: 'var(--leaf-deep)' }}>
                  +{b.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-[var(--ink-mute)] mt-2 px-1 leading-relaxed">
          「节省10%肥料」数值为万分比累加；「蓝晶土地藏品变异概率提升」「额外产出概率提升」「经验提升」为百分比加成。
        </p>
      </section>

      {/* 详情弹窗 */}
      <Portal>
        <AnimatePresence>
          {detail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(15,23,42,.55)' }}
              onClick={() => setDetail(null)}>
              <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 12 }}
                className="sticker-lg w-full max-w-sm overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-3 p-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-soft)' }}>
                    <RemoteImage urls={[publicUrl(`item_images/${detail.localFile}`)]} name={detail.name}
                      className="w-16 h-16" rounded />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-display italic font-bold text-base text-[var(--ink)]">{detail.name}</h3>
                      <span className="chip" style={{
                        fontSize: '0.55rem', padding: '0.05rem 0.4rem',
                        background: (RARITY_ACCENT[detail.rarity] || RARITY_ACCENT[1]).bg,
                        color: (RARITY_ACCENT[detail.rarity] || RARITY_ACCENT[1]).deep,
                      }}>{detail.rarityName}</span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-soft)] mt-1 leading-relaxed">{detail.desc}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-2)] flex-shrink-0">
                    <X size={13} className="text-[var(--ink-mute)]" />
                  </button>
                </div>
                <div className="px-4 pb-4">
                  <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-2)' }}>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">各星级单件评分</div>
                    <div className="flex gap-1.5">
                      {detail.starScores.map(s => (
                        <div key={s.star} className="flex-1 rounded-lg py-1 text-center"
                          style={{ background: 'var(--surface)' }}>
                          <div className="text-[9px] font-bold" style={{ color: 'var(--sun-deep)' }}>{'★'.repeat(s.star)}</div>
                          <div className="font-mono text-[10px] font-bold text-[var(--ink)]">{s.score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] text-[var(--ink-mute)] mt-2 flex items-center gap-1">
                    <Lock size={9} /> 仅在蓝晶土地上触发藏品变异后获得，不可被好友偷取
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {!shown.length && <EmptyState emoji="🏺" title="没有匹配的系列" hint="切换上方的系列筛选试试" />}
    </div>
  );
}
