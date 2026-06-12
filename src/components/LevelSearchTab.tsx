import React from 'react';
import { motion } from 'motion/react';
import { Search, X, BarChart3, Locate } from 'lucide-react';
import levelExpData from '../data/level_exp.json';

export default function LevelSearchTab() {
  const [search, setSearch] = React.useState('');
  const [rangeStart, setRangeStart] = React.useState<number>(1);
  const [rangeEnd, setRangeEnd] = React.useState<number>(200);

  const filtered = levelExpData.filter(l => {
    if (!search) return true;
    return l.level === Number(search) || String(l.cumulativeExp).includes(search) || String(l.levelUpExp).includes(search);
  });

  const maxLevel = 200;
  const maxCumulative = levelExpData[levelExpData.length - 1]?.cumulativeExp || 0;
  const avgExp = Math.round(maxCumulative / maxLevel);

  const sectionLevels = [
    { label: '新手村', range: [1, 20] as [number, number], emoji: '🌱', accent: 'sky' as const },
    { label: '初级农场', range: [21, 60] as [number, number], emoji: '🌿', accent: 'leaf' as const },
    { label: '中高级', range: [61, 100] as [number, number], emoji: '🌾', accent: 'sun' as const },
    { label: '精英', range: [101, 160] as [number, number], emoji: '⭐', accent: 'orange' as const },
    { label: '大师级', range: [161, 200] as [number, number], emoji: '👑', accent: 'plum' as const },
  ];

  React.useEffect(() => {
    if (search && filtered.length === 1) {
      const el = document.getElementById(`lv-${filtered[0].level}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [search, filtered]);

  return (
    <div className="space-y-5 fade-in pt-3">
      {/* Hero */}
      <header>
        <div className="chip chip-plum mb-2"><BarChart3 size={11} strokeWidth={2.5} /> 等级查询</div>
        <h2 className="font-display italic text-3xl font-bold text-[var(--ink)] leading-tight">
          Lv 1 → Lv 200
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mt-1">完整 200 级经验表 · 累计与升级所需</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="sticker p-3 text-center" style={{ borderColor: 'var(--leaf)' }}>
          <div className="font-mono tnum text-2xl font-black text-[var(--leaf-deep)]">{maxLevel}</div>
          <div className="text-[10px] text-[var(--ink-mute)] font-bold uppercase tracking-wide mt-0.5">总等级数</div>
        </div>
        <div className="sticker p-3 text-center" style={{ borderColor: 'var(--sun-deep)' }}>
          <div className="font-mono tnum text-xl font-black text-[var(--sun-deep)] leading-tight">
            {(maxCumulative / 1_000_000).toFixed(1)}m
          </div>
          <div className="text-[10px] text-[var(--ink-mute)] font-bold uppercase tracking-wide mt-0.5">最高累计</div>
        </div>
        <div className="sticker p-3 text-center" style={{ borderColor: 'var(--sky)' }}>
          <div className="font-mono tnum text-xl font-black text-[var(--sky-deep)] leading-tight">{avgExp.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--ink-mute)] font-bold uppercase tracking-wide mt-0.5">平均每级</div>
        </div>
      </div>

      {/* Search + Range */}
      <div className="sticker-pop p-3 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Search size={16} strokeWidth={2.5} className="text-[var(--ink-mute)] flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="输入等级号快速定位…"
            className="input-line text-sm py-1" />
          {search && (
            <button onClick={() => setSearch('')}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-2)]">
              <X size={12} className="text-[var(--ink-mute)]" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <input type="number" value={rangeStart}
            onChange={e => setRangeStart(Number(e.target.value) || 1)}
            className="w-20 input-pop text-center" style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
            min={1} max={200} />
          <span className="text-[var(--ink-mute)] font-bold">→</span>
          <input type="number" value={rangeEnd}
            onChange={e => setRangeEnd(Number(e.target.value) || 200)}
            className="w-20 input-pop text-center" style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
            min={1} max={200} />
          <button onClick={() => { setSearch(''); const el = document.getElementById(`lv-${rangeStart}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
            className="ml-auto flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold"
            style={{ background: 'var(--leaf)', color: 'white', boxShadow: '0 2px 0 var(--leaf-deep)' }}>
            <Locate size={12} strokeWidth={2.5} /> 定位
          </button>
        </div>
      </div>

      {/* Section Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {sectionLevels.map((s, i) => (
          <motion.button key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            onClick={() => { setRangeStart(s.range[0]); setRangeEnd(s.range[1]); setSearch(''); setTimeout(() => document.getElementById(`lv-${s.range[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs whitespace-nowrap"
            style={{ background: `var(--${s.accent})`, color: 'white', boxShadow: `0 2px 0 var(--${s.accent}-deep)` }}>
            <span>{s.emoji}</span><span>{s.label}</span>
            <span className="font-mono opacity-80">Lv{s.range[0]}–{s.range[1]}</span>
          </motion.button>
        ))}
      </div>

      {/* Table */}
      <div className="sticker-lg overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-mute)]"
          style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
          <span>等级</span>
          <span className="text-right">累计经验</span>
          <span className="text-right">升级所需</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.filter(l => l.level >= rangeStart && l.level <= rangeEnd).map(l => {
            const isMatch = l.level === Number(search);
            return (
              <div key={l.level} id={`lv-${l.level}`}
                className="grid grid-cols-3 px-4 py-2.5 text-xs"
                style={{
                  background: isMatch ? 'var(--leaf-bg)' : 'transparent',
                  borderBottom: '1px solid var(--line)',
                  borderLeft: isMatch ? '3px solid var(--leaf)' : '3px solid transparent',
                }}>
                <span className="font-mono font-bold text-[var(--ink)] tnum">Lv{l.level}</span>
                <span className="font-mono text-right text-[var(--ink-soft)] tnum">{l.cumulativeExp.toLocaleString()}</span>
                <span className="font-mono text-right font-bold tnum" style={{ color: 'var(--orange-deep)' }}>
                  {l.levelUpExp.toLocaleString()}
                </span>
              </div>
            );
          })}
          {filtered.filter(l => l.level >= rangeStart && l.level <= rangeEnd).length === 0 && (
            <div className="p-10 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-sm text-[var(--ink-mute)]">未找到匹配的等级</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
