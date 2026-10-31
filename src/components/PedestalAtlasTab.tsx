import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, X, ZoomIn } from 'lucide-react';
import collectionData from '../data/collection_atlas.json';
import { RemoteImage, EmptyState, Portal, StatTile, publicUrl } from './shared';

// 藏品展台 —— CollectionPedestal 8 个已配置 + ItemInfo 里 2 个「有道具无配置」（610205/610206）
// 展台通过「展台惊喜礼包」抽奖获得（101614，抽出后不放回）

interface Pedestal {
  pedestalId: number;
  name: string;
  desc: string;
  rarity: number;
  rarityName: string;
  isDefault: boolean;
  iconFile: string;
  localFile: string;
  spineRes: string;
  score: number;
  note?: string;
}

const PEDESTALS = (collectionData as any).pedestals as Pedestal[];
const ORPHANS = (collectionData as any).orphanPedestals as Pedestal[];
const PEDESTAL_SCORE = (collectionData as any).score?.pedestalScore as number[];

const RARITY_ACCENT: Record<number, { bg: string; deep: string }> = {
  1: { bg: 'var(--leaf-bg)', deep: 'var(--leaf-deep)' },
  2: { bg: 'var(--sky-bg)', deep: 'var(--sky-deep)' },
  3: { bg: 'var(--plum-bg)', deep: 'var(--plum-deep)' },
  4: { bg: 'var(--sun-bg)', deep: 'var(--sun-deep)' },
};

function Card({ p, onOpen }: { p: Pedestal; onOpen: (p: Pedestal) => void; key?: React.Key }) {
  const accent = RARITY_ACCENT[p.rarity] || RARITY_ACCENT[1];
  return (
    <button type="button" onClick={() => onOpen(p)}
      className="sticker sticker-press p-2.5 flex flex-col gap-1.5 text-left group cursor-zoom-in">
      <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{ background: accent.bg }}>
        <RemoteImage urls={[publicUrl(`item_images/${p.localFile}`)]} name={p.name}
          className="w-[82%] h-[82%]" rounded />
        {p.isDefault && (
          <span className="chip absolute top-1.5 left-1.5"
            style={{ fontSize: '0.55rem', padding: '0.05rem 0.4rem', background: 'rgba(255,255,255,.9)', color: 'var(--ink-soft)' }}>
            默认
          </span>
        )}
        <span className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.94)' }}>
          <ZoomIn size={11} className="text-[var(--ink-soft)]" />
        </span>
      </div>
      <div className="px-0.5">
        <div className="font-bold text-[11px] sm:text-xs text-[var(--ink)] leading-snug line-clamp-1">{p.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px]" style={{ color: accent.deep }}>{p.rarityName}</span>
          {p.score > 0 && <span className="text-[9px] text-[var(--ink-mute)]">· 评分 {p.score}</span>}
        </div>
      </div>
    </button>
  );
}

export default function PedestalAtlasTab() {
  const [detail, setDetail] = React.useState<Pedestal | null>(null);
  const all = [...PEDESTALS, ...ORPHANS];

  return (
    <div className="space-y-5 fade-in pt-3">
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--sun-bg)', color: 'var(--sun-deep)' }}>
          <Box size={11} strokeWidth={2.5} /> 展台图鉴
        </span>
        <h2 className="page-header-title">藏品展台 · {all.length} 个</h2>
        <p className="page-header-subtitle">已配置 {PEDESTALS.length} 个 · 待放出 {ORPHANS.length} 个</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="可用展台" value={PEDESTALS.length} color="sun" />
        <StatTile label="待放出" value={ORPHANS.length} color="sky" />
        <StatTile label="默认" value={PEDESTALS.filter(p => p.isDefault).length} color="leaf" />
      </div>

      <section>
        <div className="section-eyebrow mb-3">已配置展台</div>
        <div className="grid grid-cols-3 gap-2">
          {PEDESTALS.map(p => <Card key={p.pedestalId} p={p} onOpen={setDetail} />)}
        </div>
      </section>

      {ORPHANS.length > 0 && (
        <section>
          <div className="section-eyebrow mb-3">有道具、展台表未配置（待活动）</div>
          <div className="grid grid-cols-3 gap-2">
            {ORPHANS.map(p => <Card key={p.pedestalId} p={p} onOpen={setDetail} />)}
          </div>
          <p className="text-[10px] text-[var(--ink-mute)] mt-2 px-1 leading-relaxed">
            这两件在 `ItemInfo`（type 34）里已存在，但 `CollectionPedestal` 表里没有对应行 —— 大概率随活动/礼包后续放出。
          </p>
        </section>
      )}

      <section>
        <div className="section-eyebrow mb-3">展台评分</div>
        <div className="sticker-lg p-3">
          <div className="grid grid-cols-4 gap-2">
            {['普通', '稀有', '珍品', '天工'].map((name, i) => (
              <div key={name} className="rounded-xl py-2 text-center" style={{ background: 'var(--bg-2)' }}>
                <div className="text-[9px] font-bold" style={{ color: (RARITY_ACCENT[i + 1] || RARITY_ACCENT[1]).deep }}>{name}</div>
                <div className="font-mono font-bold text-sm text-[var(--ink)] mt-0.5">{PEDESTAL_SCORE?.[i] ?? 0}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--ink-mute)] mt-2 leading-relaxed">
            展台评分直接计入藏品总分（`CollectionScore.pedestal_score`），与藏品本体评分一起决定评分等级奖励。
          </p>
        </div>
      </section>

      <Portal>
        <AnimatePresence>
          {detail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(15,23,42,.55)' }}
              onClick={() => setDetail(null)}>
              <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 12 }}
                className="sticker-lg w-full max-w-xs overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-display italic font-bold text-base text-[var(--ink)]">{detail.name}</h3>
                      <span className="chip" style={{
                        fontSize: '0.55rem', padding: '0.05rem 0.4rem',
                        background: (RARITY_ACCENT[detail.rarity] || RARITY_ACCENT[1]).bg,
                        color: (RARITY_ACCENT[detail.rarity] || RARITY_ACCENT[1]).deep,
                      }}>{detail.rarityName}</span>
                    </div>
                    <button onClick={() => setDetail(null)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-2)] flex-shrink-0">
                      <X size={13} className="text-[var(--ink-mute)]" />
                    </button>
                  </div>
                  <div className="rounded-2xl flex items-center justify-center py-4"
                    style={{ background: (RARITY_ACCENT[detail.rarity] || RARITY_ACCENT[1]).bg }}>
                    <RemoteImage urls={[publicUrl(`item_images/${detail.localFile}`)]} name={detail.name}
                      className="w-32 h-32" rounded />
                  </div>
                  <p className="text-[11px] text-[var(--ink-soft)] leading-relaxed">{detail.desc || '—'}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="chip chip-sun" style={{ fontSize: '0.6rem' }}>评分 +{detail.score}</span>
                    {detail.isDefault && <span className="chip" style={{ fontSize: '0.6rem' }}>默认展台</span>}
                    {detail.note && <span className="chip chip-berry" style={{ fontSize: '0.6rem' }}>{detail.note}</span>}
                  </div>
                  {detail.spineRes && (
                    <div className="text-[9px] text-[var(--ink-mute)] font-mono break-all">{detail.spineRes}</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {!all.length && <EmptyState emoji="🪴" title="暂无展台数据" hint="该版本还没上藏品展台" />}
    </div>
  );
}
