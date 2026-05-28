import React from 'react';
import { Leaf, Search } from 'lucide-react';
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
    { label: '新手村', range: [1, 20], color: 'from-blue-500 to-cyan-500' },
    { label: '初级农场', range: [21, 60], color: 'from-green-500 to-emerald-500' },
    { label: '中高级农场', range: [61, 100], color: 'from-yellow-500 to-amber-500' },
    { label: '精英农场', range: [101, 160], color: 'from-orange-500 to-red-500' },
    { label: '大师级', range: [161, 200], color: 'from-purple-500 to-pink-500' },
  ];

  React.useEffect(() => {
    if (search && filtered.length === 1) {
      const el = document.getElementById(`lv-${filtered[0].level}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [search, filtered]);

  return (
    <div className="space-y-4 fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-green-500">{maxLevel}</div>
          <div className="text-[10px] text-gray-500 dark:text-white/40">总等级数</div>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-lg font-black text-amber-500">{maxCumulative.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 dark:text-white/40">最高累计经验</div>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-lg font-black text-blue-500">{avgExp.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 dark:text-white/40">平均每级经验</div>
        </div>
      </div>

      {/* Search + Range */}
      <div className="glass-panel rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="输入等级号快速定位..."
            className="bg-transparent outline-none text-sm flex-1 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <input type="number" value={rangeStart} onChange={e => setRangeStart(Number(e.target.value) || 1)} className="w-16 glass-input rounded-lg p-1.5 text-center text-xs" min={1} max={200} />
          <span className="text-gray-400">-</span>
          <input type="number" value={rangeEnd} onChange={e => setRangeEnd(Number(e.target.value) || 200)} className="w-16 glass-input rounded-lg p-1.5 text-center text-xs" min={1} max={200} />
          <button onClick={() => { setSearch(''); const el = document.getElementById(`lv-${rangeStart}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="glass-input rounded-lg px-3 py-1.5 text-green-600 dark:text-green-400 font-semibold">定位</button>
        </div>
      </div>

      {/* Section Quick Nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {sectionLevels.map((s, i) => (
          <button key={i} onClick={() => { setRangeStart(s.range[0]); setRangeEnd(s.range[1]); setSearch(''); setTimeout(() => document.getElementById(`lv-${s.range[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }} className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${s.color} text-white whitespace-nowrap`}>
            {s.label} Lv{s.range[0]}-{s.range[1]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/30 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-3 border-b border-black/5 dark:border-white/5">
          <span>等级</span>
          <span className="text-right">累计经验</span>
          <span className="text-right">升级经验</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.filter(l => l.level >= rangeStart && l.level <= rangeEnd).map(l => (
            <div key={l.level} id={`lv-${l.level}`} className={`grid grid-cols-3 text-xs font-medium px-4 py-2.5 border-b border-black/[0.02] dark:border-white/[0.02] hover:bg-green-500/5 transition-colors ${l.level === Number(search) ? 'bg-green-500/10 border-green-500/20' : ''}`}>
              <span className="text-gray-900 dark:text-white font-bold">Lv{l.level}</span>
              <span className="text-right text-gray-600 dark:text-white/60">{l.cumulativeExp.toLocaleString()}</span>
              <span className="text-right text-amber-600 dark:text-amber-400 font-semibold">{l.levelUpExp.toLocaleString()}</span>
            </div>
          ))}
          {filtered.filter(l => l.level >= rangeStart && l.level <= rangeEnd).length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">未找到匹配的等级</div>
          )}
        </div>
      </div>
    </div>
  );
}