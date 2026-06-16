import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, Sparkles, X, BookOpen } from 'lucide-react';
import mutationData from '../data/mutation_atlas.json';
import { CropImage, GrowthPhases, RemoteImage, mutationIconUrls, goldenAtlasImageUrls, goldSeedIds, Portal } from './shared';
import { MUTATION_RULES, MUTATION_PROBABILITIES, getProbabilitiesFor } from '../data/mutation-rules';

interface GoldenEntry {
  name: string; seedId: number; cropId: number; points: number; exp: number; fruit: number;
  desc: string; note?: string;
}

function GoldenDetail({ item, onClose }: { item: GoldenEntry; onClose: () => void }) {
  const isGold = item.name.startsWith('黄金');
  const detailUrls = goldenAtlasImageUrls(item.name);
  const showGrowth = goldSeedIds[item.name] !== undefined;

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
            className="relative w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>

          <div className="sticky top-0 z-10 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between"
            style={{ background: 'var(--bg-paper)', borderBottom: '1.5px solid var(--line)' }}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center"
                style={{ background: isGold ? 'var(--sun-bg)' : 'var(--berry-bg)' }}>
                {detailUrls.length > 0 ? (
                  <RemoteImage urls={detailUrls} name={item.name} size={56} className="sm:hidden" rounded />
                ) : (
                  <CropImage seedId={item.seedId} name={item.name.replace(/^黄金·/, '')} size={56} className="sm:hidden" />
                )}
                {detailUrls.length > 0 ? (
                  <RemoteImage urls={detailUrls} name={item.name} size={96} className="hidden sm:block" rounded />
                ) : (
                  <CropImage seedId={item.seedId} name={item.name.replace(/^黄金·/, '')} size={96} className="hidden sm:block" />
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
              style={{ background: 'var(--bg-2)' }}>
              <X size={16} className="text-[var(--ink-soft)] sm:hidden" />
              <X size={20} className="text-[var(--ink-soft)] hidden sm:block" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-2xl p-3 sm:p-4" style={{ background: 'var(--plum-bg)', border: '1.5px solid var(--plum-soft)' }}>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-[var(--plum-deep)] mb-0.5 sm:mb-1">经验</div>
                <div className="font-mono tnum text-xl sm:text-2xl font-bold text-[var(--plum-deep)]">{item.exp}</div>
              </div>
              <div className="rounded-2xl p-3 sm:p-4" style={{ background: 'var(--leaf-bg)', border: '1.5px solid var(--leaf-soft)' }}>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-[var(--leaf-deep)] mb-0.5 sm:mb-1">果实</div>
                <div className="font-mono tnum text-xl sm:text-2xl font-bold text-[var(--leaf-deep)]">{item.fruit} 个</div>
              </div>
            </div>

            {showGrowth && (
              <div>
                <div className="section-eyebrow mb-2">成长阶段 {isGold && '· 黄金变异'}</div>
                <div className="sticker-soft p-3 sm:p-4">
                  {isGold ? (
                    <GrowthPhases seedId={goldSeedIds[item.name]} gold={isGold} />
                  ) : (
                    <div className="flex justify-center">
                      <RemoteImage urls={goldenAtlasImageUrls(item.name)} name={item.name} size={160} rounded />
                    </div>
                  )}
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
  const [tab, setTab] = React.useState<'types' | 'golden'>('types');
  const [goldenTab, setGoldenTab] = React.useState<'goldenFruit' | 'costumeFruit' | 'eventFruit'>('goldenFruit');
  const [detail, setDetail] = React.useState<GoldenEntry | null>(null);

  const { mutationTypes, goldenAtlas } = mutationData;

  const tabs = [
    { id: 'types' as const, label: '变异宝典', emoji: '🧬', accent: 'berry' },
    { id: 'golden' as const, label: '超变图鉴', emoji: '✨', accent: 'sun' },
  ];

  const goldenTabs = [
    { id: 'goldenFruit' as const, label: '黄金果实', count: goldenAtlas.goldenFruit.length, accent: 'sun' },
    { id: 'costumeFruit' as const, label: '装扮果实', count: goldenAtlas.costumeFruit.length, accent: 'plum' },
    { id: 'eventFruit' as const, label: '活动果实', count: goldenAtlas.eventFruit.length, accent: 'orange' },
  ];

  return (
    <div className="space-y-5 fade-in">
      {/* Hero */}
      <header>
        <div className="chip chip-berry mb-2"><Dna size={11} strokeWidth={2.5} /> 变异图鉴</div>
        <h2 className="font-display italic text-3xl font-bold text-[var(--ink)] leading-tight">
          稀有变种与超变
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mt-1">10 种变异 · 50 件黄金/装扮/活动果实</p>
      </header>

      {/* Main tab toggle */}
      <div className="flex gap-1.5 p-1.5 sticker-pop rounded-full">
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs transition-all"
              style={active
                ? { background: `var(--${t.accent})`, color: 'white', boxShadow: `0 2px 0 var(--${t.accent}-deep)` }
                : { color: 'var(--ink-soft)' }}>
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'types' && (
        <>
          {/* 规则说明 */}
          <div className="sticker p-4" style={{ borderLeft: '4px solid var(--berry)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} strokeWidth={2.5} className="text-[var(--berry-deep)]" />
              <span className="text-[11px] font-bold text-[var(--berry-deep)] uppercase tracking-wide">变异规则</span>
            </div>
            <ol className="space-y-1.5 text-[11px] text-[var(--ink-soft)] leading-relaxed list-decimal list-inside">
              {MUTATION_RULES.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>

          {/* 变异卡片网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {mutationTypes.map((mt, i) => {
              const probs = getProbabilitiesFor(mt.name);
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="sticker p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--berry-bg)' }}>
                    <RemoteImage urls={mutationIconUrls(mt.icon, mt.name)} name={mt.name} size={40} className="sm:hidden" pixel rounded />
                    <RemoteImage urls={mutationIconUrls(mt.icon, mt.name)} name={mt.name} size={56} className="hidden sm:block" pixel rounded />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[var(--ink)]">{mt.name}</span>
                      <span className="chip chip-berry" style={{ fontSize: '0.6rem' }}>{mt.effectType}</span>
                      {probs.map((p, k) => (
                        <span key={k} className="chip chip-sun flex-shrink-0 font-mono tnum"
                          style={{ fontSize: '0.6rem' }} title={`${p.quality} 品质触发概率`}>
                          {p.quality !== '无' ? `${p.quality} ` : ''}{p.rate}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] sm:text-sm font-mono font-bold text-[var(--berry-deep)] tnum">{mt.effectValue}</div>
                    <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] mt-0.5 sm:mt-1 leading-snug">{mt.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 概率展示表（照搬游戏 UI） */}
          <div className="sticker overflow-hidden">
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-2"
              style={{ background: 'var(--berry-bg)', borderBottom: '1.5px solid var(--berry-soft)' }}>
              <span className="text-base sm:text-lg">📊</span>
              <h3 className="font-display italic text-base sm:text-lg font-bold text-[var(--berry-deep)]">概率展示</h3>
              <span className="chip chip-berry ml-auto" style={{ fontSize: '0.65rem' }}>{MUTATION_PROBABILITIES.length} 行</span>
            </div>
            <div className="px-4 sm:px-5 pt-3 pb-1.5 grid grid-cols-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-[var(--ink-mute)]">
              <div>变异类型</div>
              <div>品质</div>
              <div className="text-right">概率</div>
            </div>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              {MUTATION_PROBABILITIES.map((p, i) => (
                <div key={i} className="grid grid-cols-3 py-2.5 sm:py-3 text-sm sm:text-base items-center"
                  style={{ borderTop: i === 0 ? 'none' : '1px dashed var(--line)' }}>
                  <div className="font-bold text-[var(--ink)]">{p.name}</div>
                  <div><span className="chip chip-ink" style={{ fontSize: '0.65rem' }}>{p.quality}</span></div>
                  <div className="text-right font-mono tnum font-bold text-[var(--berry-deep)]">{p.rate}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'golden' && (
        <>
          {/* Golden sub-tabs */}
          <div className="flex gap-1.5 p-1.5 sticker-pop rounded-full">
            {goldenTabs.map(t => {
              const active = goldenTab === t.id;
              return (
                <button key={t.id} onClick={() => setGoldenTab(t.id)}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-full font-bold transition-all"
                  style={active
                    ? { background: `var(--${t.accent}-deep)`, color: 'white', boxShadow: `0 2px 0 color-mix(in srgb, var(--${t.accent}-deep) 70%, black)` }
                    : { color: 'var(--ink-soft)' }}>
                  <span className="text-[10px]">{t.label}</span>
                  <span className="font-mono text-[9px] opacity-80">{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            {((goldenAtlas[goldenTab] || []) as any[]).slice().reverse().map((g, i) => {
              const atlasUrls = goldenAtlasImageUrls(g.name);
              const isGold = g.name.startsWith('黄金');
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => setDetail({ ...g, seedId: g.seedId, cropId: g.cropId, points: g.points, exp: g.exp, fruit: g.fruit, desc: g.desc, note: (g as any).note })}
                  className="sticker sticker-press p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isGold ? 'var(--sun-bg)' : 'var(--plum-bg)' }}>
                    {atlasUrls.length > 0 ? (
                      <RemoteImage urls={atlasUrls} name={g.name} size={56} className="sm:hidden" rounded />
                    ) : (
                      <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={56} className="sm:hidden" />
                    )}
                    {atlasUrls.length > 0 ? (
                      <RemoteImage urls={atlasUrls} name={g.name} size={96} className="hidden sm:block" rounded />
                    ) : (
                      <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={96} className="hidden sm:block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <span className="font-bold text-sm sm:text-base text-[var(--ink)] truncate">{g.name}</span>
                      <span className="chip chip-sun flex-shrink-0">+{g.points}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] font-mono tnum">
                      经验 <span className="font-bold text-[var(--plum-deep)]">{g.exp}</span>
                      <span className="mx-1.5 opacity-40">·</span>
                      果实 <span className="font-bold text-[var(--leaf-deep)]">{g.fruit}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[var(--ink-soft)] mt-0.5 sm:mt-1 line-clamp-1">{g.desc}</div>
                  </div>
                  <Sparkles size={14} className="text-[var(--ink-mute)] flex-shrink-0 sm:hidden" />
                  <Sparkles size={18} className="text-[var(--ink-mute)] flex-shrink-0 hidden sm:block" />
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {detail && <GoldenDetail item={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
