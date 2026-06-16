import React from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, Layers3, TrendingUp } from 'lucide-react';
import landsData from '../data/lands_atlas.json';

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

const landTypes = [
  {
    name: '普通土地', lv: 'Lv.1', accent: 'earth', tile: 'tile-orange',
    valid: 'land_valid1.png', dry: 'land_dry1.png',
    y: '0%', t: '0%', e: '0%', m: '0%',
  },
  {
    name: '红土地', lv: 'Lv.2', accent: 'berry', tile: 'tile-berry',
    valid: 'land_valid2.png', dry: 'land_dry2.png',
    y: '+100%', t: '0%', e: '0%', m: '0%',
  },
  {
    name: '黑土地', lv: 'Lv.3', accent: 'ink', tile: 'tile-orange',
    valid: 'land_valid3.png', dry: 'land_dry3.png',
    y: '+200%', t: '-10%', e: '0%', m: '0%',
  },
  {
    name: '金土地', lv: 'Lv.4', accent: 'sun', tile: 'tile-sun',
    valid: 'land_valid4.png', dry: 'land_dry4.png',
    y: '+300%', t: '-20%', e: '+20%', m: '0%',
  },
  {
    name: '紫晶土地', lv: 'Lv.5', accent: 'plum', tile: 'tile-plum',
    valid: 'land_valid5.png', dry: 'land_dry5.png',
    y: '+300%', t: '-20%', e: '+25%', m: '+120%',
    note: '启用时间 2026-04-15',
  },
];

const specialStates = [
  { name: '荒地', icon: '🏜️', desc: '尚未开垦的地块', file: 'land_locked.png' },
  { name: '可开垦', icon: '➕', desc: '达条件可点击开垦', file: 'land_extend.png' },
  { name: '选中', icon: '✅', desc: '当前选中的地块外观', file: 'land_valid_selected.png' },
];

type UpgradeAccent = 'berry' | 'ink' | 'sun' | 'plum';
type UpgradeType = '红土地' | '黑土地' | '金土地' | '紫晶土地';

const upgradeMeta: Record<UpgradeType, { emoji: string; accent: UpgradeAccent; borderVar: string; bgVar: string; deepVar: string; textVar: string; lv: string; g: string }> = {
  '红土地': { emoji: '🟥', accent: 'berry', borderVar: '--berry', bgVar: '--berry-bg', deepVar: '--berry-deep', textVar: '--berry-deep', lv: 'Lv 28-57', g: '20w-230w' },
  '黑土地': { emoji: '⬛', accent: 'ink', borderVar: '--ink', bgVar: '--bg-2', deepVar: '--ink', textVar: '--ink', lv: 'Lv 40-69', g: '60w-860w' },
  '金土地': { emoji: '🟨', accent: 'sun', borderVar: '--sun', bgVar: '--sun-bg', deepVar: '--sun-deep', textVar: '--sun-deep', lv: 'Lv 58-87', g: '100w-1700w' },
  '紫晶土地': { emoji: '🟪', accent: 'plum', borderVar: '--plum', bgVar: '--plum-bg', deepVar: '--plum-deep', textVar: '--plum-deep', lv: 'Lv 90-159', g: '5000w-5.1亿' },
};
const upgradeTypes: readonly UpgradeType[] = ['红土地', '黑土地', '金土地', '紫晶土地'];

export default function LandAtlasTab() {
  const [level, setLevel] = React.useState(90);
  const [tab, setTab] = React.useState<'plots' | 'upgrades'>('plots');

  return (
    <div className="space-y-6 fade-in">
      {/* Hero */}
      <header>
        <div className="chip chip-orange mb-2"><MapIcon size={11} strokeWidth={2.5} /> 土地图鉴</div>
        <h2 className="font-display italic text-3xl font-bold text-[var(--ink)] leading-tight">
          24 块地 · 5 种土壤
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mt-1">从开垦到升级的全套数据</p>
      </header>

      {/* Land Types */}
      <section>
        <div className="section-eyebrow mb-3">单块土地类型</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {landTypes.map((lt, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="sticker-lg overflow-hidden"
              style={{ borderColor: `var(--${lt.accent === 'ink' ? 'line-strong' : lt.accent})` }}>

              <div className={`${lt.tile} p-4 flex justify-center gap-4 items-center`}>
                <div className="flex flex-col items-center gap-1">
                  <LandImage file={lt.valid} alt={`${lt.name}正常`} className="w-14 h-14" />
                  <span className="text-[9px] font-bold text-[var(--ink-soft)] uppercase tracking-wide">正常</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <LandImage file={lt.dry} alt={`${lt.name}干裂`} className="w-14 h-14" dim />
                  <span className="text-[9px] font-bold text-[var(--ink-soft)] uppercase tracking-wide">干裂</span>
                </div>
              </div>

              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display italic text-base font-bold text-[var(--ink)]">{lt.name}</h3>
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
        <div className="grid grid-cols-3 gap-2.5">
          {specialStates.map((ss, i) => (
            <div key={i} className="sticker p-3 text-center">
              <LandImage file={ss.file} alt={ss.name} className="w-14 h-14 mx-auto mb-2" />
              <div className="text-xs font-bold text-[var(--ink)]">{ss.icon} {ss.name}</div>
              <div className="text-[10px] text-[var(--ink-mute)] mt-1 leading-snug">{ss.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tab toggle */}
      <div className="flex gap-1.5 p-1.5 sticker-pop rounded-full">
        <button onClick={() => setTab('plots')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs transition-all"
          style={tab === 'plots'
            ? { background: 'var(--orange)', color: 'white', boxShadow: '0 2px 0 var(--orange-deep)' }
            : { color: 'var(--ink-soft)' }}>
          <Layers3 size={14} strokeWidth={2.5} /> 地块布局
        </button>
        <button onClick={() => setTab('upgrades')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs transition-all"
          style={tab === 'upgrades'
            ? { background: 'var(--plum)', color: 'white', boxShadow: '0 2px 0 var(--plum-deep)' }
            : { color: 'var(--ink-soft)' }}>
          <TrendingUp size={14} strokeWidth={2.5} /> 升级需求
        </button>
      </div>

      {tab === 'plots' && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="section-eyebrow">地块开垦顺序</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-mute)]">参考等级</span>
              <input type="number" value={level} onChange={e => setLevel(Number(e.target.value) || 1)}
                className="w-16 input-pop text-center"
                style={{ padding: '0.4rem 0.5rem', fontSize: '0.9rem' }}
                min={1} max={200} />
            </div>
          </div>
          <div className="sticker-lg p-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {landsData.plots.map((plot, i) => {
                const unlocked = plot.initialUnlock || plot.unlockLevel <= level;
                return (
                  <motion.div key={plot.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
                    className="text-center p-2 rounded-xl"
                    style={{
                      background: unlocked ? 'var(--leaf-bg)' : 'var(--sun-bg)',
                      border: `1.5px solid ${unlocked ? 'var(--leaf-soft)' : 'var(--sun-soft)'}`,
                    }}>
                    <LandImage
                      file={unlocked ? 'land_valid1.png' : 'land_locked.png'}
                      alt=""
                      className="w-10 h-10 mx-auto mb-1" />
                    <div className="font-mono font-black text-sm" style={{ color: unlocked ? 'var(--leaf-deep)' : 'var(--sun-deep)' }}>
                      #{plot.id}
                    </div>
                    <div className="text-[9px] font-bold mt-0.5" style={{ color: unlocked ? 'var(--leaf-deep)' : 'var(--sun-deep)' }}>
                      {plot.initialUnlock ? '初始' : `Lv.${plot.unlockLevel}`}
                    </div>
                    {!plot.initialUnlock && (
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
          {/* 单条紧凑图例条：4 个色 chip 横向并排 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
            {upgradeTypes.map(ut => {
              const meta = upgradeMeta[ut];
              return (
                <span key={ut}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
                  style={{ background: `var(${meta.bgVar})`, color: `var(${meta.textVar})` }}>
                  <span>{meta.emoji}</span>
                  <span>{ut}</span>
                  <span className="font-mono opacity-70">{meta.lv}</span>
                </span>
              );
            })}
          </div>

          {/* 表格：白底单一表，单元格内无主题色，仅靠表头颜色识别列；未达等级行半透 */}
          <div className="sticker-lg overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="w-12 text-left font-bold text-[10px] uppercase tracking-widest text-[var(--ink-mute)] px-3 py-2.5"
                    style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>地块</th>
                  {upgradeTypes.map(ut => {
                    const meta = upgradeMeta[ut];
                    return (
                      <th key={ut} className="text-right font-bold text-[10px] uppercase tracking-widest px-3 py-2.5 whitespace-nowrap"
                        style={{ background: 'var(--bg-2)', color: `var(${meta.textVar})`, borderBottom: '1.5px solid var(--line)' }}>
                        <span className="mr-1">{meta.emoji}</span>{ut}
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
    </div>
  );
}

function BuffPill({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[10px]"
      style={{ background: `var(--${accent}-bg)` }}>
      <span className="text-[var(--ink-soft)]">{emoji} {label}</span>
      <span className="font-mono font-bold tnum" style={{ color: `var(--${accent}-deep)` }}>{value}</span>
    </div>
  );
}

function formatGold(g: number): string {
  if (g >= 100000000) return `${(g / 100000000).toFixed(2)}亿`;
  if (g >= 10000) return `${(g / 10000).toFixed(1)}w`;
  return g.toLocaleString();
}
