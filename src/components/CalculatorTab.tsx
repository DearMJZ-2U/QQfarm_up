import React, { useState, useMemo } from 'react';
import { Award, Zap, Sprout, Tractor, Crown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import seedsData from '../data/seeds.json';
import { CropImage, plantPhaseMap, plantLastPhaseMap, formatSec, LAND_BUFFS, NO_FERT_PLANT_SPEED, NORMAL_FERT_PLANT_SPEED } from './shared';

export default function CalculatorTab() {
  const [level, setLevel] = useState<number | ''>(70);
  const [totalLands, setTotalLands] = useState<number | ''>(24);
  const [redLands, setRedLands] = useState<number | ''>(0);
  const [blackLands, setBlackLands] = useState<number | ''>(0);
  const [goldLands, setGoldLands] = useState<number | ''>(0);
  const [purpleLands, setPurpleLands] = useState<number | ''>(0);
  const [useFert, setUseFert] = useState(true);
  const [target, setTarget] = useState<'exp' | 'gold'>('exp');

  const calculatedRows = useMemo(() => {
    const currentLevel = typeof level === 'number' ? level : 1;
    const curTotal = typeof totalLands === 'number' ? totalLands : 0;
    const curRed = typeof redLands === 'number' ? redLands : 0;
    const curBlack = typeof blackLands === 'number' ? blackLands : 0;
    const curGold = typeof goldLands === 'number' ? goldLands : 0;
    const curPurple = typeof purpleLands === 'number' ? purpleLands : 0;

    const actualPurple = Math.min(curPurple, curTotal);
    const actualGold = Math.min(curGold, curTotal - actualPurple);
    const actualBlack = Math.min(curBlack, curTotal - actualPurple - actualGold);
    const actualRed = Math.min(curRed, curTotal - actualPurple - actualGold - actualBlack);
    const actualNormal = Math.max(0, curTotal - actualPurple - actualGold - actualBlack - actualRed);

    const currentLands = actualNormal + actualRed + actualBlack + actualGold + actualPurple;
    if (currentLands === 0) return [];

    const plantSecNoFert = currentLands / NO_FERT_PLANT_SPEED;
    const plantSecFert = currentLands / NORMAL_FERT_PLANT_SPEED;
    const rows = [];
    const seedsList = Array.isArray(seedsData) ? seedsData : (seedsData.rows || []);

    const landCounts = [
      { count: actualNormal, buff: LAND_BUFFS.normal },
      { count: actualRed, buff: LAND_BUFFS.red },
      { count: actualBlack, buff: LAND_BUFFS.black },
      { count: actualGold, buff: LAND_BUFFS.gold },
      { count: actualPurple, buff: LAND_BUFFS.purple },
    ];

    for (const s of seedsList) {
      if (s.requiredLevel > currentLevel) continue;
      const seedId = s.seedId;
      const growTimeSec = s.growTimeSec;
      const reduceSec = plantPhaseMap[seedId] || 0;
      const seasons = s.seasons || 1;
      const lastPhaseSec = plantLastPhaseMap[seedId] || 0;
      const totalGrowTimeSec = growTimeSec + (seasons - 1) * lastPhaseSec;
      const totalGrowTimeFert = Math.max(1, growTimeSec - reduceSec) + (seasons - 1) * lastPhaseSec;
      const totalExp = s.exp * seasons;
      const totalGold = s.price * seasons;
      let expPerHourNoFert = 0, expPerHourFert = 0, goldPerHourNoFert = 0, goldPerHourFert = 0;
      for (const { count, buff } of landCounts) {
        if (count <= 0) continue;
        const landGrowTimeSec = totalGrowTimeSec * buff.time;
        const landGrowTimeFert = totalGrowTimeFert * buff.time;
        const cycleNoFert = landGrowTimeSec + plantSecNoFert;
        const cycleFert = landGrowTimeFert + plantSecFert;
        expPerHourNoFert += (count * totalExp * buff.exp / cycleNoFert) * 3600;
        expPerHourFert += (count * totalExp * buff.exp / cycleFert) * 3600;
        goldPerHourNoFert += (count * totalGold * buff.yield / cycleNoFert) * 3600;
        goldPerHourFert += (count * totalGold * buff.yield / cycleFert) * 3600;
      }
      const gainPercent = expPerHourNoFert > 0 ? ((expPerHourFert - expPerHourNoFert) / expPerHourNoFert) * 100 : 0;
      const totalGrowTimeStr = seasons > 1 ? `${formatSec(totalGrowTimeSec)} (共${seasons}季)` : s.growTimeStr;
      rows.push({ ...s, growTimeFert: totalGrowTimeFert, growTimeFertStr: seasons > 1 ? `${formatSec(totalGrowTimeFert)} (共${seasons}季)` : formatSec(totalGrowTimeFert), growTimeStr: totalGrowTimeStr, expPerHourNoFert, expPerHourFert, goldPerHourNoFert, goldPerHourFert, gainPercent });
    }
    return rows;
  }, [level, totalLands, redLands, blackLands, goldLands, purpleLands, useFert]);

  const sortedNoFert = [...calculatedRows].sort((a, b) => target === 'exp' ? b.expPerHourNoFert - a.expPerHourNoFert : b.goldPerHourNoFert - a.goldPerHourNoFert);
  const sortedFert = [...calculatedRows].sort((a, b) => target === 'exp' ? b.expPerHourFert - a.expPerHourFert : b.goldPerHourFert - a.goldPerHourFert);
  const bestNo = sortedNoFert[0];
  const bestFert = sortedFert[0];

  const getRemaining = (type: string) => {
    const vals: Record<string, number | ''> = { normal: 0, red: redLands, black: blackLands, gold: goldLands, purple: purpleLands };
    const total = typeof totalLands === 'number' ? totalLands : 0;
    const used = (typeof redLands === 'number' ? redLands : 0) + (typeof blackLands === 'number' ? blackLands : 0) + (typeof goldLands === 'number' ? goldLands : 0) + (typeof purpleLands === 'number' ? purpleLands : 0);
    if (type === 'normal') return Math.max(0, total - used);
    return typeof vals[type] === 'number' ? vals[type] : 0;
  };

  const landInputs = [
    { key: 'normal', label: '普通地', sub: '无加成', gradient: 'from-[#f5f0eb] to-[#ebe5e0] dark:from-[#1c1814] dark:to-[#120f0d]', textColor: 'text-[#8b6b50] dark:text-[#b89a80]', border: 'border-black/5 dark:border-white/5', readonly: true },
    { key: 'red', label: '红土地', sub: '产+100%', gradient: 'from-[#fcf0f0] to-[#f5e6e6] dark:from-[#2a1313] dark:to-[#1a0c0c]', textColor: 'text-[#d32f2f] dark:text-[#ff8a80]', border: 'border-red-500/20' },
    { key: 'black', label: '黑土地', sub: '产+200%/速+10%', gradient: 'from-[#f5f5f5] to-[#ebebeb] dark:from-[#171717] dark:to-[#0a0a0a]', textColor: 'text-[#455a64] dark:text-[#b0bec5]', border: 'border-gray-300 dark:border-gray-500/20' },
    { key: 'gold', label: '金土地', sub: '产+300%/速+20%/经+20%', gradient: 'from-[#fefce8] to-[#fef9c3] dark:from-[#2b2512] dark:to-[#1f1a0a]', textColor: 'text-[#f57f17] dark:text-[#ffe57f]', border: 'border-yellow-500/20' },
    { key: 'purple', label: '紫晶土地', sub: '产+300%/速+20%/经+25%', gradient: 'from-[#faf5ff] to-[#f3e8ff] dark:from-[#1a1225] dark:to-[#120b1a]', textColor: 'text-[#7c3aed] dark:text-[#c4b5fd]', border: 'border-purple-500/20' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 fade-in pb-16 px-1">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-green-300 via-green-500 to-emerald-700 bg-clip-text text-transparent">QQ农场收益计算器</h1>
        <p className="text-xs text-green-800/60 dark:text-green-100/60 mt-1">输入等级和土地配置，智能规划最高收益方案</p>
      </div>

      {/* Level + Target */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-green-800/70 dark:text-green-100/70 block mb-1">账号等级</label>
            <input type="number" value={level} onChange={e => setLevel(e.target.value === '' ? '' : Number(e.target.value))} className="glass-input w-full p-3 rounded-xl text-sm font-bold" min={1} max={200} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-green-800/70 dark:text-green-100/70 block mb-1">土地总数</label>
            <input type="number" value={totalLands} onChange={e => setTotalLands(e.target.value === '' ? '' : Number(e.target.value))} className="glass-input w-full p-3 rounded-xl text-sm font-bold" min={1} max={200} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-green-800/70 dark:text-green-100/70 block mb-1">优化目标</label>
            <div className="flex bg-white/60 dark:bg-black/20 p-1 rounded-xl border border-black/5 dark:border-white/5">
              <button onClick={() => setTarget('exp')} className={`flex-1 text-xs font-bold rounded-lg py-2 transition-colors ${target === 'exp' ? 'text-green-700 dark:text-green-400 bg-black/10 dark:bg-white/10' : 'text-gray-400'}`}>经验</button>
              <button onClick={() => setTarget('gold')} className={`flex-1 text-xs font-bold rounded-lg py-2 transition-colors ${target === 'gold' ? 'text-yellow-700 dark:text-yellow-400 bg-black/10 dark:bg-white/10' : 'text-gray-400'}`}>金币</button>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs">
          <input type="checkbox" checked={useFert} onChange={e => setUseFert(e.target.checked)} className="rounded" />
          <span className="font-semibold text-green-900/70 dark:text-green-50/70">播种使用普通化肥加速</span>
        </label>
      </div>

      {/* Land Config */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="text-[10px] font-bold text-green-800/70 dark:text-green-100/70 mb-2 uppercase tracking-wider">土地配置</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {landInputs.map(li => (
            <div key={li.key} className={`bg-gradient-to-br ${li.gradient} p-3 rounded-xl border ${li.border} ${li.readonly ? 'opacity-80' : ''}`}>
              <div className={`text-[10px] font-semibold mb-1 flex flex-col gap-0.5 ${li.textColor}`}>{li.label} <span className="text-[8px] opacity-60">{li.sub}</span></div>
              {li.readonly ? (
                <span className="text-xl font-bold text-gray-900 dark:text-white">{getRemaining(li.key)}</span>
              ) : (
                <input type="number" placeholder="0" value={li.key === 'red' ? (redLands === 0 ? '' : redLands) : li.key === 'black' ? (blackLands === 0 ? '' : blackLands) : li.key === 'gold' ? (goldLands === 0 ? '' : goldLands) : (purpleLands === 0 ? '' : purpleLands)} className="w-full bg-transparent text-xl font-bold text-gray-900 dark:text-white outline-none placeholder:text-black/20 dark:placeholder:text-white/10" onChange={e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  const curTotal = typeof totalLands === 'number' ? totalLands : 0;
                  const others = ['purple', 'gold', 'black', 'red'].filter(k => k !== li.key).map(k => typeof (k === 'red' ? redLands : k === 'black' ? blackLands : k === 'gold' ? goldLands : purpleLands) === 'number' ? (k === 'red' ? redLands : k === 'black' ? blackLands : k === 'gold' ? goldLands : purpleLands) as number : 0).reduce((a, b) => a + b, 0);
                  const max = Math.max(0, curTotal - others);
                  const setter = li.key === 'red' ? setRedLands : li.key === 'black' ? setBlackLands : li.key === 'gold' ? setGoldLands : setPurpleLands;
                  if (typeof val === 'number') setter(Math.min(val, max)); else setter('');
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {calculatedRows.length > 0 && (
        <div className="space-y-4">
          {bestNo && (
            <div className="glass-panel rounded-2xl p-4 bg-gradient-to-br from-[#f0fdf4]/80 to-[#dcfce7]/50 dark:from-[#0f1a14]/80 dark:to-[#0a120f]/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-800/60 dark:text-green-300/60">推荐种植方案（{useFert ? '施肥' : '自然'}）</span>
                <span className="text-[10px] text-gray-500">{bestNo.name ? '排行榜 ↓' : 'Loading...'}</span>
              </div>
              {(() => {
                const best = useFert ? bestFert : bestNo;
                if (!best) return null;
                const perHour = target === 'exp' ? (useFert ? best.expPerHourFert : best.expPerHourNoFert) : (useFert ? best.goldPerHourFert : best.goldPerHourNoFert);
                const perDay = perHour * 24;
                return (
                  <div className="flex items-center gap-3">
                    <CropImage seedId={best.seedId} name={best.name} size={48} className="drop-shadow-lg" />
                    <div className="flex-1">
                      <div className="text-lg font-black text-gray-900 dark:text-white">{best.name} <span className="text-xs font-normal text-gray-400">Lv{best.requiredLevel}</span></div>
                      <div className="flex items-center gap-3 mt-1">
                        <div><span className="text-[10px] text-gray-500">{target === 'exp' ? '时均经验' : '时均金币'}</span><div className="text-sm font-bold text-green-700 dark:text-green-400">{perHour.toFixed(2)}</div></div>
                        <div><span className="text-[10px] text-gray-500">每日</span><div className="text-sm font-bold text-gray-600 dark:text-white/60">{Math.round(perDay).toLocaleString()}</div></div>
                        <div><span className="text-[10px] text-gray-500">周期</span><div className="text-[10px] font-semibold text-gray-500">{useFert ? best.growTimeFertStr : best.growTimeStr}</div></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Leaderboard */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{target === 'exp' ? '经验天梯榜 TOP20' : '金币天梯榜 TOP20'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 dark:text-white/30 bg-black/[0.01] dark:bg-white/[0.01]">
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">作物</th>
                    <th className="p-2 text-center">等级</th>
                    <th className="p-2 text-center">耗时</th>
                    <th className="p-2 text-right">{target === 'exp' ? '经验/h' : '金币/h'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(useFert ? sortedFert : sortedNoFert).slice(0, 20).map((row, i) => (
                    <tr key={row.seedId} className="border-b border-black/[0.02] dark:border-white/[0.02] hover:bg-green-500/5">
                      <td className="p-2 font-black text-gray-400">{i + 1}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <CropImage seedId={row.seedId} name={row.name} size={24} />
                          <span className="font-bold text-gray-900 dark:text-white">{row.name}</span>
                        </div>
                      </td>
                      <td className="p-2 text-center font-bold text-gray-500">L{row.requiredLevel}</td>
                      <td className="p-2 text-center text-gray-500">{useFert ? row.growTimeFertStr : row.growTimeStr}</td>
                      <td className="p-2 text-right font-bold text-green-700 dark:text-green-400">{target === 'exp' ? (useFert ? row.expPerHourFert : row.expPerHourNoFert).toFixed(2) : (useFert ? row.goldPerHourFert : row.goldPerHourNoFert).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}