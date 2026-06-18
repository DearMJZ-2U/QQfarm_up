import React from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, Layers3, TrendingUp, BarChart3 } from 'lucide-react';
import landsData from '../data/lands_atlas.json';
import { PillTabGroup, StatTile } from './shared';

const BASE = (import.meta as any).env?.BASE_URL || '/';
const CLEAN_BASE = BASE.endsWith('/') ? BASE : BASE + '/';
const LAND_IMG = (name: string) => `${CLEAN_BASE}land_images/${name}`;

function LandImage({ file, alt, className = '', dim = false }: {
  file: string; alt: string; className?: string; dim?: boolean;
}) {
  return (
    <img src={LAND_IMG(file)} alt={alt}
      className={`object-contain drop-shadow-md ${dim ? 'opacity-70' : ''} ${className}`}
      loading="lazy"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

type LandKey = 'normal' | 'red' | 'black' | 'gold' | 'purple';

const landTypes: Array<{
  name: string; lv: string; accent: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' | 'ink';
  tile: string; key: LandKey; valid: string; dry: string;
  y: string; t: string; e: string; m: string; note?: string;
}> = [
  { name: '普通土地', lv: 'Lv.1', accent: 'ink',   tile: 'tile-orange', key: 'normal', valid: 'land_valid1.png', dry: 'land_dry1.png', y: '0%',     t: '0%',  e: '0%',  m: '0%' },
  { name: '红土地',   lv: 'Lv.2', accent: 'berry', tile: 'tile-berry',  key: 'red',    valid: 'land_valid2.png', dry: 'land_dry2.png', y: '+100%',  t: '0%',  e: '0%',  m: '0%' },
  { name: '黑土地',   lv: 'Lv.3', accent: 'ink',   tile: 'tile-orange', key: 'black',  valid: 'land_valid3.png', dry: 'land_dry3.png', y: '+200%',  t: '-10%', e: '0%',  m: '0%' },
  { name: '金土地',   lv: 'Lv.4', accent: 'sun',   tile: 'tile-sun',    key: 'gold',   valid: 'land_valid4.png', dry: 'land_dry4.png', y: '+300%',  t: '-20%', e: '+20%', m: '0%' },
  { name: '紫晶土地', lv: 'Lv.5', accent: 'plum',  tile: 'tile-plum',   key: 'purple', valid: 'land_valid5.png', dry: 'land_dry5.png', y: '+300%',  t: '-20%', e: '+25%', m: '+120%', note: '启用时间 2026-04-15' },
];

const specialStates = [
  { name: '荒地', icon: '🏜️', desc: '尚未开垦的地块', file: 'land_locked.png' },
  { name: '可开垦', icon: '➕', desc: '达条件可点击开垦', file: 'land_extend.png' },
  { name: '选中', icon: '✅', desc: '当前选中的地块外观', file: 'land_valid_selected.png' },
];

type UpgradeType = '红土地' | '黑土地' | '金土地' | '紫晶土地';
const upgradeKey: Record<UpgradeType, LandKey> = {
  '红土地': 'red', '黑土地': 'black', '金土地': 'gold', '紫晶土地': 'purple',
};
const upgradeColor: Record<UpgradeType, 'berry' | 'ink' | 'sun' | 'plum'> = {
  '红土地': 'berry', '黑土地': 'ink', '金土地': 'sun', '紫晶土地': 'plum',
};
const upgradeMeta: Record<UpgradeType, { lv: string; g: string }> = {
  '红土地': { lv: 'Lv 28-57', g: '20w-230w' },
  '黑土地': { lv: 'Lv 40-69', g: '60w-860w' },
  '金土地': { lv: 'Lv 58-87', g: '100w-1700w' },
  '紫晶土地': { lv: 'Lv 90-159', g: '5000w-5.1亿' },
};
const upgradeTypes: readonly UpgradeType[] = ['红土地', '黑土地', '金土地', '紫晶土地'];

// 偷菜数量权重数据
type StealEntry = { count: number; weight: number; percent: number };
const stealData = (landsData as any).stealWeights as StealEntry[];
const totalStealWeight = stealData.reduce((s, w) => s + w.weight, 0);

function segWeightOf(from: number, to: number): number {
  return stealData.filter(w => w.count >= from && w.count <= to).reduce((s, w) => s + w.weight, 0);
}

// ── 地块当前等级（根据参考等级推算） ───────────────────────

type LandTier = 'normal' | 'red' | 'black' | 'gold' | 'purple' | 'locked';

const TIER_LABEL: Record<LandTier, string> = {
  normal: '普通土地',
  red: '红土地',
  black: '黑土地',
  gold: '金土地',
  purple: '紫晶土地',
  locked: '荒地',
};

const TIER_IMAGE: Record<LandTier, string> = {
  normal: 'land_valid1.png',
  red: 'land_valid2.png',
  black: 'land_valid3.png',
  gold: 'land_valid4.png',
  purple: 'land_valid5.png',
  locked: 'land_locked.png',
};

interface TierStyle {
  bg: string;
  soft: string;
  deep: string;
}

const TIER_STYLE: Record<LandTier, TierStyle> = {
  normal: { bg: 'var(--leaf-bg)',  soft: 'var(--leaf-soft)',  deep: 'var(--leaf-deep)' },
  red:    { bg: 'var(--berry-bg)', soft: 'var(--berry-soft)', deep: 'var(--berry-deep)' },
  black:  { bg: '#E5E7E8',        soft: '#9CA3AF',           deep: '#1F2937' },
  gold:   { bg: 'var(--sun-bg)',   soft: 'var(--sun-soft)',   deep: 'var(--sun-deep)' },
  purple: { bg: 'var(--plum-bg)',  soft: 'var(--plum-soft)',  deep: 'var(--plum-deep)' },
  locked: { bg: 'var(--sun-bg)',   soft: 'var(--sun-soft)',   deep: 'var(--sun-deep)' },
};

function getPlotState(plot: any, level: number, upgrades: any[]): LandTier {
  if (!plot.initialUnlock && plot.unlockLevel > level) return 'locked';
  const pu = upgrades.find(u => u.plotId === plot.id);
  if (!pu) return 'normal';
  // upgrades 数组顺序固定为：红 < 黑 < 金 < 紫晶（按等级递增）
  const typeToTier: Record<string, LandTier> = {
    '红土地': 'red',
    '黑土地': 'black',
    '金土地': 'gold',
    '紫晶土地': 'purple',
  };
  let current: LandTier = 'normal';
  for (const u of pu.upgrades) {
    const tier = typeToTier[u.type];
    if (tier && level >= u.level) current = tier;
  }
  return current;
}

export default function LandAtlasTab() {
  const [level, setLevel] = React.useState(90);
  const [tab, setTab] = React.useState<'plots' | 'upgrades' | 'steal' | 'multiGrid'>('plots');

  return (
    <div className="space-y-6 fade-in">
      {/* Hero */}
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--orange-bg)', color: 'var(--orange-deep)' }}>
          <MapIcon size={11} strokeWidth={2.5} /> 土地图鉴
        </span>
        <h2 className="page-header-title">24 块地 · 5 种土壤</h2>
        <p className="page-header-subtitle">从开垦到升级的全套数据</p>
      </header>

      {/* Land Types */}
      <section>
        <div className="section-eyebrow mb-3">单块土地类型</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {landTypes.map((lt, i) => (
            <motion.div key={lt.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="sticker-lg overflow-hidden"
              style={{ borderColor: `var(--${lt.accent === 'ink' ? 'line-strong' : lt.accent})` }}>

              <div className={`${lt.tile} p-4 flex justify-center gap-4 items-center`}>
                <div className="flex flex-col items-center gap-1.5">
                  <LandImage file={lt.valid} alt={`${lt.name}正常`} className="w-20 h-20" />
                  <span className="text-[9px] font-bold text-[var(--ink-soft)] uppercase tracking-wide">正常</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <LandImage file={lt.dry} alt={`${lt.name}干裂`} className="w-20 h-20" dim />
                  <span className="text-[9px] font-bold text-[var(--ink-soft)] uppercase tracking-wide">干裂</span>
                </div>
              </div>

              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display italic text-base font-bold text-[var(--ink)]">
                    {lt.name}
                  </h3>
                  <span className="chip" style={{
                    background: `var(--${lt.accent === 'ink' ? 'bg-2' : lt.accent + '-bg'})`,
                    color: `var(--${lt.accent === 'ink' ? 'ink' : lt.accent + '-deep'})`,
                  }}>{lt.lv}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <BuffPill emoji="🌾" label="产量" value={lt.y} accent="leaf" />
                  <BuffPill emoji="⏱️" label="时间" value={lt.t} accent="sky" />
                  <BuffPill emoji="⭐" label="经验" value={lt.e} accent="plum" />
                  <BuffPill emoji="🧬" label="变异" value={lt.m} accent="berry" />
                </div>
                {lt.note && <div className="text-[10px] text-[var(--ink-mute)] italic">📅 {lt.note}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Special States */}
      <section>
        <div className="section-eyebrow mb-3">特殊土地状态</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {specialStates.map(ss => (
            <div key={ss.name} className="sticker p-3 text-center">
              <LandImage file={ss.file} alt={ss.name} className="w-20 h-20 mx-auto mb-2" />
              <div className="text-xs font-bold text-[var(--ink)]">{ss.icon} {ss.name}</div>
              <div className="text-[10px] text-[var(--ink-mute)] mt-1 leading-snug">{ss.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tab toggle — 统一 PillTabGroup */}
      <PillTabGroup
        items={[
          { id: 'plots',     label: '地块布局', emoji: '🗺️' },
          { id: 'upgrades',  label: '升级需求', emoji: '📈' },
          { id: 'steal',     label: '偷菜权重', emoji: '🥷' },
          { id: 'multiGrid', label: '多格土地', emoji: '🧱' },
        ]}
        value={tab}
        onChange={(id) => setTab(id as 'plots' | 'upgrades' | 'steal' | 'multiGrid')}
        accent="orange"
        size="md"
      />

      {tab === 'plots' && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="section-eyebrow">地块开垦顺序</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-mute)]">参考等级</span>
              <input type="number" value={level} onChange={e => setLevel(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                className="w-16 input-pop text-center"
                style={{ padding: '0.4rem 0.5rem', fontSize: '0.9rem' }}
                min={1} max={200} />
            </div>
          </div>
          <div className="sticker-lg p-4">
            <div className="grid grid-cols-4 gap-2">
              {landsData.plots.map((plot: any, i: number) => {
                const tier = getPlotState(plot, level, landsData.upgrades);
                const style = TIER_STYLE[tier];
                const isLocked = tier === 'locked';
                const isUpgraded = tier !== 'normal' && tier !== 'locked';
                return (
                  <motion.div key={plot.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
                    className="text-center p-2 rounded-xl"
                    style={{
                      background: style.bg,
                      border: `1.5px solid ${style.soft}`,
                    }}>
                    <LandImage
                      file={TIER_IMAGE[tier]}
                      alt=""
                      className="w-14 h-14 mx-auto mb-1" />
                    <div className="font-mono font-black text-sm" style={{ color: style.deep }}>
                      #{plot.id}
                    </div>
                    <div className="text-[9px] font-bold mt-0.5 truncate" style={{ color: style.deep }}>
                      {isLocked ? `Lv.${plot.unlockLevel} 开垦` :
                        isUpgraded ? TIER_LABEL[tier] :
                          plot.initialUnlock ? '初始解锁' : `Lv.${plot.unlockLevel} 解锁`}
                    </div>
                    {(isLocked || (!plot.initialUnlock && !isUpgraded)) && (
                      <div className="text-[9px] font-mono tnum text-[var(--ink-mute)] mt-0.5">
                        {plot.gold >= 10000 ? `${(plot.gold / 10000).toFixed(0)}w` : plot.gold.toLocaleString()}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {tab === 'upgrades' && (
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
            {upgradeTypes.map(ut => {
              const meta = upgradeMeta[ut];
              const color = upgradeColor[ut];
              return (
                <span key={ut}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
                  style={{ background: `var(--${color}-bg)`, color: `var(--${color}-deep)` }}>
                  <span>{ut}</span>
                  <span className="font-mono opacity-70">{meta.lv}</span>
                </span>
              );
            })}
          </div>

          <div className="sticker-lg overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="w-12 text-left font-bold text-[10px] uppercase tracking-widest text-[var(--ink-mute)] px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>地块</th>
                  {upgradeTypes.map(ut => {
                    const color = upgradeColor[ut];
                    return (
                      <th key={ut} className="text-right font-bold text-[10px] uppercase tracking-widest px-3 py-2.5 whitespace-nowrap"
                        style={{ background: 'var(--bg-2)', color: `var(--${color}-deep)`, borderBottom: '1.5px solid var(--line)' }}>
                        <span className="inline-flex items-center gap-1">
                          {ut}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {landsData.upgrades.map(pu => {
                  const byType = new Map<string, any>(pu.upgrades.map(u => [u.type, u]));
                  return (
                    <tr key={pu.plotId}>
                      <td className="font-mono font-black text-sm text-[var(--ink)] px-3 py-2 align-middle"
                        style={{ borderBottom: '1px solid var(--line)' }}>#{pu.plotId}</td>
                      {upgradeTypes.map(ut => {
                        const u = byType.get(ut);
                        return (
                          <td key={ut} className="px-3 py-2 align-middle text-right"
                            style={{ borderBottom: '1px solid var(--line)' }}>
                            {u ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-mono tnum text-[10px] font-bold" style={{ color: 'var(--ink-soft)' }}>
                                  Lv{u.level}
                                </span>
                                <span className="font-mono tnum text-[11px] font-bold" style={{ color: 'var(--ink)' }}>
                                  {formatGold(u.gold)}
                                </span>
                                {'beans' in u && u.beans > 0 && (
                                  <span className="font-mono tnum text-[10px] font-bold flex items-center gap-0.5" style={{ color: 'var(--ink-soft)' }}>
                                    <span aria-hidden="true">🫘</span>
                                    {u.beans.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono text-[10px] text-[var(--ink-mute)]/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'steal' && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatTile
              label="总权重"
              value={totalStealWeight.toLocaleString()}
              hint="所有 count 权重之和"
              color="ink"
              icon={<BarChart3 size={12} strokeWidth={2.5} style={{ color: 'var(--ink-soft)' }} />}
            />
            <StatTile
              label="1-7 累计"
              value={`${(segWeightOf(1, 7) / totalStealWeight * 100).toFixed(2)}%`}
              hint="抽中 1-7 个"
              color="sun"
            />
            <StatTile
              label="8-20 累计"
              value={`${(segWeightOf(8, 20) / totalStealWeight * 100).toFixed(2)}%`}
              hint="抽中 8-20 个"
              color="sky"
            />
            <StatTile
              label="21-40 累计"
              value={`${(segWeightOf(21, 40) / totalStealWeight * 100).toFixed(2)}%`}
              hint="抽中 21-40 个"
              color="plum"
            />
          </div>

          <div className="sticker-lg overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="w-12 text-center font-bold text-[10px] uppercase tracking-widest px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-mute)', borderBottom: '1.5px solid var(--line)' }}>#</th>
                  <th className="text-left font-bold text-[10px] uppercase tracking-widest px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-mute)', borderBottom: '1.5px solid var(--line)' }}>偷取数量</th>
                  <th className="text-right font-bold text-[10px] uppercase tracking-widest px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-mute)', borderBottom: '1.5px solid var(--line)' }}>权重</th>
                  <th className="text-right font-bold text-[10px] uppercase tracking-widest px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-mute)', borderBottom: '1.5px solid var(--line)' }}>单次概率</th>
                  <th className="text-right font-bold text-[10px] uppercase tracking-widest px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-mute)', borderBottom: '1.5px solid var(--line)' }}>累计概率</th>
                </tr>
              </thead>
              <tbody>
                {stealData.map((w, i) => {
                  const isHigh = w.count <= 7;
                  const cumWeight = stealData.slice(0, i + 1).reduce((s, x) => s + x.weight, 0);
                  const cumPercent = (cumWeight / totalStealWeight) * 100;
                  const showHighEdge = isHigh && (i === stealData.length - 1 || stealData[i + 1].count > 7);
                  return (
                    <tr key={w.count}
                      style={{ background: isHigh ? 'var(--sun-bg)' : 'transparent' }}>
                      <td className="font-mono tnum text-[10px] font-bold text-center px-3 py-2 text-[var(--ink-mute)]"
                        style={{ borderBottom: showHighEdge ? '1.5px solid var(--sun-soft)' : '1px solid var(--line)' }}>{i + 1}</td>
                      <td className="text-xs px-3 py-2"
                        style={{
                          color: isHigh ? 'var(--sun-deep)' : 'var(--ink)',
                          fontWeight: isHigh ? 700 : 500,
                          borderBottom: showHighEdge ? '1.5px solid var(--sun-soft)' : '1px solid var(--line)',
                        }}>
                        偷 {w.count} 个
                      </td>
                      <td className="font-mono tnum text-[11px] font-bold text-right px-3 py-2 text-[var(--ink)]"
                        style={{ borderBottom: showHighEdge ? '1.5px solid var(--sun-soft)' : '1px solid var(--line)' }}>{w.weight}</td>
                      <td className="font-mono tnum text-[11px] font-bold text-right px-3 py-2"
                        style={{
                          color: isHigh ? 'var(--sun-deep)' : 'var(--ink-soft)',
                          borderBottom: showHighEdge ? '1.5px solid var(--sun-soft)' : '1px solid var(--line)',
                        }}>
                        {w.percent}%
                      </td>
                      <td className="font-mono tnum text-[10px] font-bold text-right px-3 py-2 text-[var(--ink-mute)]"
                        style={{ borderBottom: showHighEdge ? '1.5px solid var(--sun-soft)' : '1px solid var(--line)' }}>
                        {cumPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-[var(--ink-mute)] italic text-center mt-1 px-2">
            💡 高亮 1-7 个为高概率段（{totalStealWeight > 0 ? (segWeightOf(1, 7) / totalStealWeight * 100).toFixed(2) : 0}%）。单次概率 = 权重 ÷ 总权重（{totalStealWeight.toLocaleString()}）。
          </div>
        </section>
      )}

      {tab === 'multiGrid' && (
        <section className="space-y-3">
          <div className="section-eyebrow px-1 flex items-center gap-1.5">
            <Layers3 size={11} strokeWidth={2.5} /> 多格土地
            <span className="text-[var(--ink-mute)] font-mono tnum ml-auto">
              {(landsData as any).multiGridLands.length} 种
            </span>
          </div>
          <div className="space-y-3">
            {(landsData as any).multiGridLands.map((mgl: any, i: number) => {
              const m = mgl.size.match(/^(\d+)×(\d+)$/);
              const cols = m ? Number(m[1]) : 0;
              const rows = m ? Number(m[2]) : 0;
              const blocks = cols * rows;
              const colorKey = (i === 0 ? 'orange' : i === 1 ? 'leaf' : 'sky') as 'orange' | 'leaf' | 'sky';
              const squares = Array.from({ length: blocks }, (_, idx) => idx);
              return (
                <motion.div key={mgl.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="sticker-lg overflow-hidden">
                  <div className="px-4 py-3.5 flex items-center justify-between gap-4"
                    style={{ background: `var(--${colorKey}-bg)`, borderBottom: `1.5px solid var(--line)` }}>
                    <div className="min-w-0">
                      <h3 className="font-display italic text-xl font-bold text-[var(--ink)] leading-tight">
                        {mgl.name}
                      </h3>
                      <div className="text-[11px] text-[var(--ink-soft)] mt-1 font-bold">
                        尺寸 {mgl.size}，覆盖 {blocks} 块地，共 {mgl.levels.length} 个资源档位。
                      </div>
                    </div>
                    <div className="grid gap-1 flex-shrink-0"
                      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                      {squares.map(idx => (
                        <div key={idx} className="w-6 h-6 rounded-md"
                          style={{
                            background: `var(--${colorKey})`,
                            boxShadow: '0 1.5px 0 var(--line-strong)',
                          }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3.5 grid grid-cols-2 gap-1.5 sm:gap-2.5">
                    {mgl.levels.map((lv: any) => {
                      const isTop = lv.level === mgl.levels.length;
                      return (
                        <div key={lv.level} className="rounded-xl p-2.5 sm:p-3 flex flex-col"
                          style={{
                            background: isTop ? 'var(--plum-bg)' : 'var(--bg-2)',
                            border: `1.5px solid ${isTop ? 'var(--plum-soft)' : 'var(--line)'}`,
                          }}>
                          <div className="text-center pb-1.5" style={{ borderBottom: '1px dashed var(--line)' }}>
                            <div className="font-display italic text-base font-bold leading-none"
                              style={{ color: isTop ? 'var(--plum-deep)' : 'var(--ink)' }}>
                              Lv{lv.level}
                            </div>
                            {isTop && (
                              <div className="text-[9px] text-[var(--plum-deep)] mt-0.5 font-bold tracking-wide">· 顶级 ·</div>
                            )}
                          </div>
                          <div className="flex flex-col mt-1.5">
                            <BuffRow label="产量" value={formatBuff(lv.yieldBonus)} color="leaf" />
                            <BuffRow label="时间" value={formatBuff(-lv.timeReduction)} color="sky" />
                            <BuffRow label="经验" value={formatBuff(lv.expBonus)} color="plum" />
                            <BuffRow label="变异" value={formatBuff(lv.mutationBonus)} color="berry" last />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function BuffPill({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' | 'ink' }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[10px]"
      style={{ background: `var(--${accent}-bg)` }}>
      <span className="text-[var(--ink-soft)]">{emoji} {label}</span>
      <span className="font-mono font-bold tnum" style={{ color: `var(--${accent}-deep)` }}>{value}</span>
    </div>
  );
}

function BuffRow({ label, value, color, last = false }: {
  label: string; value: string; color: 'leaf' | 'sky' | 'plum' | 'berry'; last?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm"
      style={last ? {} : { borderBottom: '1px solid var(--line)' }}>
      <span className="text-[var(--ink-soft)] font-bold">{label}</span>
      <span className="font-mono font-bold tnum"
        style={{ color: `var(--${color}-deep)` }}>{value}</span>
    </div>
  );
}

function formatGold(g: number): string {
  if (g >= 100000000) return `${(g / 100000000).toFixed(2)}亿`;
  if (g >= 10000) return `${(g / 10000).toFixed(1)}w`;
  return g.toLocaleString();
}

function formatBuff(value: number): string {
  if (value === 0) return '0%';
  return value > 0 ? `+${value}%` : `${value}%`;
}
