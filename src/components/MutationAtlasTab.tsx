import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, Sparkles, X, BookOpen, TrendingUp } from 'lucide-react';
import mutationData from '../data/mutation_atlas.json';
import bonusData from '../data/super_atlas_bonus.json';
import { CropImage, GrowthPhases, RemoteImage, mutationIconUrls, goldenAtlasImageUrls, goldSeedIds, Portal, StatTile, PillTabGroup, EmptyState } from './shared';
import { MUTATION_RULES, MUTATION_PROBABILITIES, getProbabilitiesFor } from '../data/mutation-rules';

type BonusType = 'exp' | 'steal' | 'fert' | 'gold';

// 概率展示的品质配色：与游戏内稀有度一一对应。
// 颜色依据 = 游戏自己的品质图标（extraRes `gui/texture/icon/img_item_rarity{n}` 实测均色）：
//   rarity1 普通 #e2daca(灰白) · rarity2 稀有 #89daf6(蓝) · rarity3 珍品 #d6aafd(紫) · rarity4 天工 #f9d264(金)
// 即 **金=天工 / 紫=珍品 / 蓝=稀有**（此前天工与珍品配色写反了，已修正）。
const QUALITY_META: Record<string, { chip: string; bar: string; label: string }> = {
  '天工': { chip: 'chip-sun',   bar: 'var(--sun)',   label: '天工' },
  '珍品': { chip: 'chip-plum',  bar: 'var(--plum)',  label: '珍品' },
  '稀有': { chip: 'chip-sky',   bar: 'var(--sky)',   label: '稀有' },
  '普通': { chip: 'chip-leaf',  bar: 'var(--leaf)',  label: '普通' },
  '无':   { chip: 'chip-ink',   bar: 'var(--ink-mute)', label: '不分品质' },
};

function qualityMeta(q: string) {
  return QUALITY_META[q] || QUALITY_META['无'];
}

/** 由 "9.26%" 形式解析出数值，用于画概率条 */
function rateValue(rate: string): number {
  const n = parseFloat(rate.replace('%', ''));
  return Number.isFinite(n) ? n : 0;
}

const BONUS_META: Record<BonusType, { label: string; color: 'leaf' | 'sky' | 'orange' | 'sun'; chip: string; emoji: string }> = {
  exp:   { label: '经验',  color: 'leaf',   chip: 'chip-leaf',   emoji: '🌱' },
  steal: { label: '偷菜',  color: 'sky',    chip: 'chip-sky',    emoji: '🥷' },
  fert:  { label: '肥料',  color: 'orange', chip: 'chip-orange', emoji: '🧪' },
  gold:  { label: '黄金',  color: 'sun',    chip: 'chip-sun',    emoji: '✨' },
};

interface GoldenEntry {
  name: string; seedId: number; cropId: number; points: number; exp: number; fruit: number;
  desc: string; note?: string;
  /** 以下来自 Plant 表（提取脚本写入 mutation_atlas.json） */
  growTimeSec?: number; growTimeStr?: string; seasons?: number;
  growPhases?: Array<{ name: string; sec: number }>;
}

const GOLD_PREFIX_RE = /^黄金·?/;

function stripGoldPrefix(name: string) {
  return name.replace(GOLD_PREFIX_RE, '');
}

function GoldenDetail({ item, onClose }: { item: GoldenEntry; onClose: () => void }) {
  const isGold = item.name.startsWith('黄金');
  const detailUrls = goldenAtlasImageUrls(item.name);
  // 有高清 spine 渲染阶段图（hasRenderPhases）或能映射到种子时，展示成长阶段条
  const showGrowth = goldSeedIds[item.name] !== undefined || !!(item as any).hasRenderPhases;

  return (
    <Portal>
      <motion.div
        key="mutation-modal"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}>
        <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" />
          <motion.div
            key="mutation-modal-panel"
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
                style={{ background: isGold ? 'var(--sun-bg)' : 'var(--berry-bg)' }}>
                {detailUrls.length > 0 ? (
                  <RemoteImage urls={detailUrls} name={item.name} className="w-16 h-16 sm:w-28 sm:h-28" rounded />
                ) : (
                  <CropImage seedId={item.seedId} name={stripGoldPrefix(item.name)} className="w-16 h-16 sm:w-28 sm:h-28" />
                )}
              </div>
              <div>
                <h3 className="font-display italic text-lg sm:text-2xl font-bold text-[var(--ink)] leading-tight">{item.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                  <span className="chip chip-sun">+{item.points} 点</span>
                  {isGold && <span className="chip chip-orange">黄金</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-2)' }}
              aria-label="关闭">
              <X size={16} className="text-[var(--ink-soft)] sm:hidden" />
              <X size={20} className="text-[var(--ink-soft)] hidden sm:block" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatTile label="经验" value={item.exp > 0 ? item.exp : '—'} color="plum" />
              <StatTile label="果实" value={`${item.fruit} 个`} color="leaf" />
              <StatTile label="成长时长" value={item.growTimeStr || '—'} color="sun" />
              <StatTile label="季数" value={`${item.seasons || 1} 季`} color="sky" />
            </div>

            {showGrowth ? (
              <div>
                <div className="section-eyebrow mb-2">成长阶段 {isGold && '· 黄金变异'}</div>
                  <div className="sticker-soft p-3 sm:p-4">
                    <GrowthPhases
                      seedId={goldSeedIds[item.name]}
                      cropNum={item.cropId}
                      gold={isGold}
                      timings={item.growPhases}
                    />
                  </div>
              </div>
            ) : detailUrls.length > 0 && (
              <div>
                <div className="section-eyebrow mb-2">成长阶段</div>
                  <div className="sticker-soft p-3 sm:p-4">
                    <div className="flex justify-center">
                      <RemoteImage urls={detailUrls} name={item.name} className="w-48 h-48 sm:w-56 sm:h-56" rounded />
                    </div>
                  </div>
              </div>
            )}

            {item.desc && (
              <div className="rounded-2xl p-3 sm:p-4 text-[11px] sm:text-xs text-[var(--ink-soft)] leading-relaxed"
                style={{ background: 'var(--bg-2)', border: '1.5px solid var(--line)' }}>
                {item.desc}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Portal>
  );
}

export default function MutationAtlasTab() {
  const [tab, setTab] = React.useState<'types' | 'golden' | 'bonus'>('types');
  const [goldenTab, setGoldenTab] = React.useState<'goldenFruit' | 'costumeFruit' | 'eventFruit'>('goldenFruit');
  const [detail, setDetail] = React.useState<GoldenEntry | null>(null);

  const { mutationTypes, goldenAtlas } = mutationData;

  // 概率按品质分组：顺序固定为 天工 → 珍品 → 稀有 → 普通 → 不分品质（高稀有度在前）
  // 概率分组：品质由高到低（天工>珍品>稀有>普通>不分品质）；
  // 每档内部再按**变异发布新→旧**排序（releaseOrder = mutant_effect.id，越大越新）。
  const probabilityGroups = React.useMemo(() => {
    const ORDER = ['天工', '珍品', '稀有', '普通', '无'];
    const map = new Map<string, typeof MUTATION_PROBABILITIES>();
    for (const p of MUTATION_PROBABILITIES) {
      const key = ORDER.includes(p.quality) ? p.quality : '无';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => (b.releaseOrder ?? 0) - (a.releaseOrder ?? 0));
    }
    return ORDER.filter((q) => map.has(q)).map((q) => ({ quality: q, rows: map.get(q)! }));
  }, []);

  const goldenTabs: Array<{ id: 'goldenFruit' | 'costumeFruit' | 'eventFruit'; label: string; count: number }> = [
    { id: 'goldenFruit',  label: '黄金果实', count: goldenAtlas.goldenFruit.length },
    { id: 'costumeFruit', label: '装扮果实', count: goldenAtlas.costumeFruit.length },
    { id: 'eventFruit',   label: '活动果实', count: goldenAtlas.eventFruit.length },
  ];

  return (
    <div className="space-y-5 fade-in">
      {/* Hero */}
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--berry-bg)', color: 'var(--berry-deep)' }}>
          <Dna size={11} strokeWidth={2.5} /> 变异图鉴
        </span>
        <h2 className="page-header-title">稀有变种与超变</h2>
        <p className="page-header-subtitle">{mutationTypes.length} 种变异 · {goldenAtlas.goldenFruit.length + goldenAtlas.costumeFruit.length + goldenAtlas.eventFruit.length} 件黄金/装扮/活动果实</p>
      </header>

      {/* Main tab toggle */}
      <PillTabGroup
        items={[
          { id: 'types',  label: '变异宝典',     emoji: '🧬' },
          { id: 'golden', label: '超变图鉴',     emoji: '✨' },
          { id: 'bonus',  label: '属性加成',     emoji: '📈', count: bonusData.levels.length },
        ]}
        value={tab}
        onChange={(id) => setTab(id as 'types' | 'golden' | 'bonus')}
        accent="berry"
        size="md"
      />

      {tab === 'types' && (
        <>
          <div className="sticker p-4" style={{ borderLeft: '4px solid var(--berry)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} strokeWidth={2.5} className="text-[var(--berry-deep)]" />
              <span className="text-[11px] font-bold text-[var(--berry-deep)] uppercase tracking-wide">变异规则</span>
            </div>
            <ol className="space-y-1.5 text-[11px] text-[var(--ink-soft)] leading-relaxed list-decimal list-inside">
              {MUTATION_RULES.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* mutationTypes 已由提取脚本按「变异发布新→旧」排好（releaseOrder = mutant_effect.id 降序），
                直接按数组序渲染即可，新的（比熊/乐园/晶辉…）排在前面 */}
            {mutationTypes.map((mt, i) => {
              const probs = getProbabilitiesFor(mt.name);
              return (
                <motion.div key={mt.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="sticker p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--berry-bg)' }}>
                    <RemoteImage urls={mutationIconUrls(mt.icon, mt.name)} name={mt.name} className="w-14 h-14 sm:w-16 sm:h-16" rounded />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[var(--ink)]">{mt.name}</span>
                      <span className="chip chip-berry" style={{ fontSize: '0.65rem' }}>{mt.effectType}</span>
                      {probs.map((p, k) => {
                        const meta = qualityMeta(p.quality);
                        return (
                          <span key={k} className={`chip ${meta.chip} flex-shrink-0 font-mono tnum`}
                            style={{ fontSize: '0.65rem' }} title={`${p.quality} 品质触发概率`}>
                            {p.quality !== '无' ? `${p.quality} ` : ''}{p.rate}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-[11px] sm:text-sm font-mono font-bold text-[var(--berry-deep)] tnum">{mt.effectValue}</div>
                    <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] mt-0.5 sm:mt-1 leading-snug">{mt.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── 概率展示 ──
              设计要点（提高区分度）：
                1. 按品质分组（天工 / 珍品 / 稀有 / 不分品质），每组一个彩色标题条
                2. 每行左侧放变异名，中间是概率条，右侧是概率数值
                3. 概率条按该品质组内的最大值归一化，长度差异一眼可见 */}
          <div className="sticker overflow-hidden">
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-2"
              style={{ background: 'var(--berry-bg)', borderBottom: '1.5px solid var(--berry-soft)' }}>
              <span className="text-base sm:text-lg">📊</span>
              <h3 className="font-display italic text-base sm:text-lg font-bold text-[var(--berry-deep)]">概率展示</h3>
              <span className="chip chip-berry ml-auto" style={{ fontSize: '0.65rem' }}>
                {MUTATION_PROBABILITIES.length} 行 · {probabilityGroups.length} 档品质
              </span>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {probabilityGroups.map((group) => {
                const meta = qualityMeta(group.quality);
                const maxRate = Math.max(...group.rows.map((r) => rateValue(r.rate)), 0.01);
                return (
                  <div key={group.quality} className="rounded-2xl overflow-hidden"
                    style={{ border: '1.5px solid var(--line)' }}>
                    {/* 组标题：品质徽标 + 该档行数 */}
                    <div className="px-3 py-2 flex items-center gap-2"
                      style={{ background: 'var(--bg-2)' }}>
                      <span className={`chip ${meta.chip}`} style={{ fontSize: '0.7rem' }}>{meta.label}</span>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-[var(--ink-mute)]">
                        {group.quality === '无' ? '不区分品质' : '品质'}
                      </span>
                      <span className="ml-auto text-[10px] sm:text-[11px] font-mono tnum text-[var(--ink-mute)]">
                        {group.rows.length} 项 · 发布新→旧
                      </span>
                    </div>

                    {/* 组内每一行：按变异发布新→旧 */}
                    <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                      {group.rows.map((p, ri) => {
                        const pct = (rateValue(p.rate) / maxRate) * 100;
                        return (
                          <div key={`${p.name}-${p.quality}-${ri}`}
                            className="px-3 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 transition-colors hover:bg-[var(--surface-soft)]">
                            {/* 发布序次：第 1 项=最新 */}
                            <div className="w-4 flex-shrink-0 text-center text-[9px] sm:text-[10px] font-mono tnum"
                              style={{ color: ri === 0 ? meta.bar : 'var(--ink-mute)', opacity: ri === 0 ? 1 : 0.5 }}
                              title={ri === 0 ? '本档最新发布' : `本档第 ${ri + 1} 新`}>
                              {ri + 1}
                            </div>
                            {/* 变异名 */}
                            <div className="w-14 sm:w-16 flex-shrink-0 font-bold text-sm sm:text-base text-[var(--ink)] truncate">
                              {p.name}
                            </div>
                            {/* 概率条 */}
                            <div className="flex-1 min-w-0 h-2.5 sm:h-3 rounded-full overflow-hidden"
                              style={{ background: 'var(--line)' }}>
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 2)}%`, background: meta.bar }} />
                            </div>
                            {/* 概率数值 */}
                            <div className="w-14 sm:w-16 flex-shrink-0 text-right font-mono tnum font-bold text-sm sm:text-base"
                              style={{ color: meta.bar === 'var(--ink-mute)' ? 'var(--ink)' : meta.bar }}>
                              {p.rate}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 sm:px-5 py-2.5 text-[10px] sm:text-[11px] text-[var(--ink-mute)] leading-relaxed"
              style={{ background: 'var(--bg-2)', borderTop: '1.5px solid var(--line)' }}>
              排序：品质由高到低（天工 &gt; 珍品 &gt; 稀有 &gt; 普通 &gt; 不分品质），同一品质内按变异发布新→旧（左侧序次，1 = 本档最新）。横条长度按该档最高概率归一化，只反映相对高低；数值来源为游戏 MutantPublicity 表（万分比换算）。
            </div>
          </div>
        </>
      )}

      {tab === 'golden' && (
        <>
          <PillTabGroup
            items={goldenTabs.map(t => ({ id: t.id, label: t.label, count: t.count }))}
            value={goldenTab}
            onChange={(id) => setGoldenTab(id as 'goldenFruit' | 'costumeFruit' | 'eventFruit')}
            accent="sun"
            size="md"
          />

          <div className="space-y-2 sm:space-y-2.5">
            {((goldenAtlas[goldenTab] || []) as any[]).length === 0 ? (
              <EmptyState emoji="✨" title="该分类暂无数据" />
            ) : (
              ((goldenAtlas[goldenTab] || []) as any[]).slice().reverse().map((g, i) => {
                const atlasUrls = goldenAtlasImageUrls(g.name);
                const isGold = g.name.startsWith('黄金');
                return (
                  <motion.div key={g.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => setDetail({ ...g, seedId: g.seedId, cropId: g.cropId, points: g.points, exp: g.exp, fruit: g.fruit, desc: g.desc, note: (g as any).note })}
                    className="sticker sticker-press p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isGold ? 'var(--sun-bg)' : 'var(--plum-bg)' }}>
                      {atlasUrls.length > 0 ? (
                        <RemoteImage urls={atlasUrls} name={g.name} className="w-16 h-16 sm:w-24 sm:h-24" rounded />
                      ) : (
                        <CropImage seedId={g.seedId} name={stripGoldPrefix(g.name)} className="w-16 h-16 sm:w-24 sm:h-24" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                        <span className="font-bold text-sm sm:text-base text-[var(--ink)] truncate">{g.name}</span>
                        <span className="chip chip-sun flex-shrink-0">+{g.points}</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] font-mono tnum">
                        经验 <span className="font-bold text-[var(--plum-deep)]">{g.exp > 0 ? g.exp : '—'}</span>
                        <span className="mx-1.5 opacity-40">·</span>
                        果实 <span className="font-bold text-[var(--leaf-deep)]">{g.fruit}</span>
                        {g.growTimeStr && (
                          <>
                            <span className="mx-1.5 opacity-40">·</span>
                            <span className="text-[var(--sun-deep)]">{g.growTimeStr}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-[var(--ink-soft)] mt-0.5 sm:mt-1 line-clamp-1">{g.desc}</div>
                    </div>
                    <Sparkles size={14} className="text-[var(--ink-mute)] flex-shrink-0" />
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}

      {tab === 'bonus' && (
        <>
          <div className="sticker p-3 sm:p-4" style={{ borderLeft: '4px solid var(--sun)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={12} strokeWidth={2.5} className="text-[var(--sun-deep)]" />
              <span className="text-[11px] font-bold text-[var(--sun-deep)] uppercase tracking-wide">{bonusData.title}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--ink-soft)] leading-relaxed">
              {bonusData.desc}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(BONUS_META).map(([k, m]) => (
                <span key={k} className={`chip ${m.chip}`} style={{ fontSize: '0.65rem' }}>
                  {m.emoji} {m.label}
                </span>
              ))}
            </div>
          </div>

          <div className="sticker overflow-hidden">
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-2"
              style={{ background: 'var(--sun-bg)', borderBottom: '1.5px solid var(--sun-soft)' }}>
              <span className="text-base sm:text-lg">📈</span>
              <h3 className="font-display italic text-base sm:text-lg font-bold text-[var(--sun-deep)]">等级加成一览</h3>
              <span className="chip chip-sun ml-auto" style={{ fontSize: '0.65rem' }}>{bonusData.levels.length} 级</span>
            </div>
            <div className="px-4 sm:px-5 pt-3 pb-1.5 hidden sm:grid grid-cols-12 gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide text-[var(--ink-mute)]">
              <div className="col-span-2">等级</div>
              <div className="col-span-3">所需图鉴进度</div>
              <div className="col-span-2">类型</div>
              <div className="col-span-5">属性加成</div>
            </div>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              {bonusData.levels.map((row, i) => {
                const meta = BONUS_META[row.type as BonusType] || BONUS_META.exp;
                const isMilestone = row.level % 5 === 0;
                return (
                  <div key={row.level}
                    className="grid grid-cols-12 gap-2 py-2.5 sm:py-3 text-sm sm:text-base items-center transition-colors hover:bg-[var(--surface-soft)]"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                    <div className="col-span-2 font-mono tnum font-bold"
                      style={{ color: isMilestone ? 'var(--sun-deep)' : 'var(--ink)' }}>
                      Lv.{row.level}
                    </div>
                    <div className="col-span-3 font-mono tnum font-bold text-[var(--leaf-deep)] flex items-center gap-1">
                      <span>🌿</span>
                      <span>{row.leaves.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`chip ${meta.chip}`} style={{ fontSize: '0.65rem' }}>
                        {meta.emoji} {meta.label}
                      </span>
                    </div>
                    <div className="col-span-5 text-[var(--ink)] font-medium leading-snug">
                      {row.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {detail && <GoldenDetail item={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
