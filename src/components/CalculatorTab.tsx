import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Zap, Coins, Clock, TrendingUp, Wand2 } from 'lucide-react';
import seedsData from '../data/seeds.json';
import { CropImage, plantAllPhasesMap, plantLastPhaseMap, formatSec, LAND_BUFFS, NO_FERT_PLANT_SPEED, NORMAL_FERT_PLANT_SPEED, calcBestLands, EmptyState, PillTabGroup, ToggleCard } from './shared';

function longestPhase(seedId: number): number {
  const phases = plantAllPhasesMap[seedId];
  if (!phases || phases.length < 2) return 0;
  const nonMature = phases.slice(0, -1);
  return Math.max(...nonMature);
}

const RANK_COLORS = [
  { bg: 'var(--sun-bg)', fg: 'var(--sun-deep)', medal: '🥇' },
  { bg: 'var(--bg-2)', fg: 'var(--ink-soft)', medal: '🥈' },
  { bg: 'var(--orange-bg)', fg: 'var(--orange-deep)', medal: '🥉' },
];

export default function CalculatorTab() {
  const [level, setLevel] = useState<number | ''>(70);
  const [totalLands, setTotalLands] = useState<number | ''>(24);
  const [redLands, setRedLands] = useState<number | ''>(0);
  const [blackLands, setBlackLands] = useState<number | ''>(0);
  const [goldLands, setGoldLands] = useState<number | ''>(0);
  const [purpleLands, setPurpleLands] = useState<number | ''>(0);
  const [smartFert, setSmartFert] = useState(true);
  const [idealMode, setIdealMode] = useState(false);
  const [secondSeasonFert, setSecondSeasonFert] = useState(true);
  const [target, setTarget] = useState<'exp' | 'gold'>('exp');

  // 按当前等级自动配置土地（红 Lv28+/黑 Lv40+/金 Lv58+/紫 Lv90+）
  // 仅在非理想模式下生效；用户仍可手动调整
  React.useEffect(() => {
    if (idealMode) return;
    const lv = typeof level === 'number' ? level : 0;
    const tot = typeof totalLands === 'number' ? totalLands : 0;
    if (tot <= 0) return;
    const best = calcBestLands(lv, tot);
    setRedLands(best.red);
    setBlackLands(best.black);
    setGoldLands(best.gold);
    setPurpleLands(best.purple);
  }, [level, totalLands, idealMode]);

  const calculatedRows = useMemo(() => {
    const currentLevel = typeof level === 'number' ? level : 1;
    const curTotal = typeof totalLands === 'number' ? totalLands : 0;

    let actualNormal: number, actualRed: number, actualBlack: number, actualGold: number, actualPurple: number;
    if (idealMode) {
      const best = calcBestLands(currentLevel, curTotal);
      actualNormal = best.normal;
      actualRed = best.red;
      actualBlack = best.black;
      actualGold = best.gold;
      actualPurple = best.purple;
    } else {
      const cp = typeof purpleLands === 'number' ? purpleLands : 0;
      const cg = typeof goldLands === 'number' ? goldLands : 0;
      const cb = typeof blackLands === 'number' ? blackLands : 0;
      const cr = typeof redLands === 'number' ? redLands : 0;
      actualPurple = Math.min(cp, curTotal);
      actualGold = Math.min(cg, curTotal - actualPurple);
      actualBlack = Math.min(cb, curTotal - actualPurple - actualGold);
      actualRed = Math.min(cr, curTotal - actualPurple - actualGold - actualBlack);
      actualNormal = Math.max(0, curTotal - actualPurple - actualGold - actualBlack - actualRed);
    }

    const currentLands = actualNormal + actualRed + actualBlack + actualGold + actualPurple;
    if (currentLands === 0) return [];

    const plantSecNoFert = idealMode ? 0 : currentLands / NO_FERT_PLANT_SPEED;
    const plantSecFert = idealMode ? 0 : currentLands / NORMAL_FERT_PLANT_SPEED;
    const seedsList = Array.isArray(seedsData) ? seedsData : (seedsData.rows || []);

    const landCounts = [
      { count: actualNormal, buff: LAND_BUFFS.normal },
      { count: actualRed, buff: LAND_BUFFS.red },
      { count: actualBlack, buff: LAND_BUFFS.black },
      { count: actualGold, buff: LAND_BUFFS.gold },
      { count: actualPurple, buff: LAND_BUFFS.purple },
    ];

    const rows = [];
    for (const s of seedsList) {
      if (s.requiredLevel > currentLevel) continue;
      const seedId = s.seedId;
      const growTimeSec = s.growTimeSec;
      const seasons = s.seasons || 1;
      const lastPhaseSec = plantLastPhaseMap[seedId] || 0;

      const hasSeasons = seasons >= 2;
      let reduceSecFirst = smartFert ? longestPhase(seedId) : (plantAllPhasesMap[seedId]?.[0] || 0);
      let reduceSecSecond = 0;
      if (hasSeasons && secondSeasonFert && smartFert) {
        reduceSecSecond = longestPhase(seedId);
      }

      const totalGrowTimeSec = growTimeSec + (seasons - 1) * lastPhaseSec;
      const totalGrowTimeFert = Math.max(1, growTimeSec - reduceSecFirst) + (seasons - 1) * Math.max(1, lastPhaseSec - reduceSecSecond);
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
  }, [level, totalLands, redLands, blackLands, goldLands, purpleLands, smartFert, idealMode, secondSeasonFert]);

  const sortedFert = [...calculatedRows].sort((a, b) => target === 'exp' ? b.expPerHourFert - a.expPerHourFert : b.goldPerHourFert - a.goldPerHourFert);
  const bestFert = sortedFert[0];

  const getRemaining = (type: string) => {
    const total = typeof totalLands === 'number' ? totalLands : 0;
    const used = (typeof redLands === 'number' ? redLands : 0) + (typeof blackLands === 'number' ? blackLands : 0) + (typeof goldLands === 'number' ? goldLands : 0) + (typeof purpleLands === 'number' ? purpleLands : 0);
    if (type === 'normal') return Math.max(0, total - used);
    const vals: Record<string, number | ''> = { red: redLands, black: blackLands, gold: goldLands, purple: purpleLands };
    return typeof vals[type] === 'number' ? vals[type] : 0;
  };

  const landInputs: Array<{
    key: 'normal' | 'red' | 'black' | 'gold' | 'purple';
    label: string;
    sub: string;
    accent: 'earth' | 'berry' | 'ink' | 'sun' | 'plum';
    color: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' | 'ink' | 'earth';
    readonly?: boolean;
  }> = [
    { key: 'normal', label: '普通地', sub: '无加成', accent: 'earth', color: 'ink', readonly: true },
    { key: 'red',    label: '红土地', sub: '产 +100%',              accent: 'berry', color: 'berry' },
    { key: 'black',  label: '黑土地', sub: '产 +200% · 速 -10%',    accent: 'ink',   color: 'ink' },
    { key: 'gold',   label: '金土地', sub: '产 +300% · 速 -20% · 经 +20%', accent: 'sun', color: 'sun' },
    { key: 'purple', label: '紫晶土地', sub: '产 +300% · 速 -20% · 经 +25%', accent: 'plum', color: 'plum' },
  ];

  const toggles = [
    {
      id: 'smartFert',
      checked: smartFert,
      onChange: (v: boolean) => setSmartFert(v),
      disabled: false,
      emoji: '🧪',
      label: '智能施肥',
      hint: smartFert
        ? '自动选择耗时最长的生长阶段施肥，最大化缩短周期'
        : '关闭后固定施肥第一阶段',
      color: 'leaf' as const,
    },
    {
      id: 'idealMode',
      checked: idealMode,
      onChange: (v: boolean) => setIdealMode(v),
      disabled: false,
      emoji: '✨',
      label: '理想模式',
      hint: idealMode
        ? '忽略种植与施肥操作耗时，仅计算纯生长时间'
        : '计算包含种植和施肥的操作耗时',
      color: 'sun' as const,
    },
    {
      id: 'secondSeasonFert',
      checked: secondSeasonFert && smartFert && typeof level === 'number' && level >= 60,
      onChange: (v: boolean) => setSecondSeasonFert(v),
      disabled: !smartFert || (typeof level === 'number' && level < 60),
      emoji: '🔄',
      label: '第二季施肥',
      hint: secondSeasonFert && smartFert && typeof level === 'number' && level >= 60
        ? '第二季也跳过最长阶段施肥，进一步缩短双季循环'
        : typeof level === 'number' && level < 60
          ? '需 Lv60+ 解锁双季作物'
          : !smartFert
            ? '需先开启智能施肥'
            : '第二季也跳过最长阶段',
      color: 'sky' as const,
    },
  ];

  return (
    <div className="container-app pb-24 px-3 sm:px-4 fade-in space-y-6">
      {/* HERO */}
      <header className="pt-4 pb-2 text-center sm:text-left">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 chip chip-leaf mb-4">
            <Sparkles size={12} strokeWidth={2.5} /> 收益最大化助手
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.3] tracking-tight text-[var(--ink)]">
            种什么<span className="shine-text">最赚</span><span className="ml-2">？</span>
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-4 max-w-md mx-auto sm:mx-0 leading-relaxed">
            输入等级和土地配置，自动为你算出 <span className="font-bold text-[var(--leaf-deep)]">每小时收益最高</span> 的作物方案。
          </p>
        </motion.div>
      </header>

      {/* CONFIG — Level, Lands, Optimization target */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="sticker-lg p-5 sm:p-6 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Level */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">
              账号等级
            </label>
            <input type="number" value={level}
              onChange={e => setLevel(e.target.value === '' ? '' : Number(e.target.value))}
              className="input-pop text-center"
              min={1} max={200} />
          </div>

          {/* Total Lands */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">
              土地总数
            </label>
            <input type="number" value={totalLands}
              onChange={e => setTotalLands(e.target.value === '' ? '' : Number(e.target.value))}
              className="input-pop text-center"
              min={1} max={200} />
          </div>

          {/* Target */}
          <div className="col-span-2">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">
              优化目标
            </label>
            <PillTabGroup
              items={[
                { id: 'exp',  label: '经验', emoji: '⚡' },
                { id: 'gold', label: '金币', emoji: '🪙' },
              ]}
              value={target}
              onChange={(id) => setTarget(id as 'exp' | 'gold')}
              accent={target === 'exp' ? 'leaf' : 'sun'}
              size="md"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {toggles.map(t => (
            <ToggleCard
              key={t.id}
              checked={t.checked}
              onChange={t.onChange}
              disabled={t.disabled}
              emoji={t.emoji}
              label={t.label}
              hint={t.hint}
              color={t.color}
            />
          ))}
        </div>
      </motion.section>

      {/* LAND ALLOCATION */}
      <AnimatePresence mode="wait">
        {!idealMode && (
          <motion.section
            key="lands"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="section-eyebrow">土地配置</div>
              <div className="text-[10px] font-mono text-[var(--ink-mute)] tnum">
                已分配 {(typeof redLands === 'number' ? redLands : 0) + (typeof blackLands === 'number' ? blackLands : 0) + (typeof goldLands === 'number' ? goldLands : 0) + (typeof purpleLands === 'number' ? purpleLands : 0)} / {typeof totalLands === 'number' ? totalLands : 0}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
              {landInputs.map(li => {
                const value = li.key === 'red' ? redLands : li.key === 'black' ? blackLands : li.key === 'gold' ? goldLands : li.key === 'purple' ? purpleLands : 0;
                const tileBg = `var(--${li.color}-bg)`;
                const tileBorder = li.color === 'ink' ? 'var(--line-strong)' : `var(--${li.color})`;
                return (
                  <div key={li.key} className="p-2 sm:p-3 rounded-xl sm:rounded-2xl"
                    style={{
                      background: tileBg,
                      border: `1.5px solid ${tileBorder}`,
                      opacity: li.readonly ? 0.85 : 1,
                    }}>
                    <div className="flex items-center justify-end mb-1.5 sm:mb-2">
                      <span className="chip" style={{ background: 'rgba(255,255,255,0.6)', color: 'var(--ink)' }}>
                        {li.readonly ? '剩余' : '配置'}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-[var(--ink)] leading-none">{li.label}</div>
                    <div className="text-[9px] text-[var(--ink-soft)] mt-0.5 leading-tight h-6">{li.sub}</div>
                    {li.readonly ? (
                      <div className="font-mono tnum text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-1">{getRemaining(li.key)}</div>
                    ) : (
                      <input type="number" placeholder="0"
                        value={value === 0 ? '' : value}
                        className="w-full bg-transparent font-mono tnum text-2xl sm:text-3xl font-bold text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]/40 mt-1"
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          const curTotal = typeof totalLands === 'number' ? totalLands : 0;
                          const others = { red: redLands, black: blackLands, gold: goldLands, purple: purpleLands };
                          const otherSum = Object.entries(others).filter(([k]) => k !== li.key).reduce((a: number, [_, v]) => a + (typeof v === 'number' ? v : 0), 0);
                          const max = Math.max(0, curTotal - otherSum);
                          const setter = li.key === 'red' ? setRedLands : li.key === 'black' ? setBlackLands : li.key === 'gold' ? setGoldLands : setPurpleLands;
                          if (typeof val === 'number') (setter as any)(Math.min(val, max)); else (setter as any)('');
                        }} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* RESULTS */}
      {calculatedRows.length > 0 && bestFert && (
        <>
          {/* Winner Card */}
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-6"
            style={{
              background: target === 'exp'
                ? 'linear-gradient(135deg, var(--leaf) 0%, var(--leaf-deep) 100%)'
                : 'linear-gradient(135deg, var(--sun-deep) 0%, var(--orange-deep) 100%)',
              boxShadow: target === 'exp' ? '0 8px 32px -8px rgba(45, 157, 61, 0.45)' : '0 8px 32px -8px rgba(255, 138, 61, 0.45)',
            }}>

            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 flex items-center justify-center">
                  <Trophy size={12} strokeWidth={2.5} className="text-white sm:hidden" />
                  <Trophy size={14} strokeWidth={2.5} className="text-white hidden sm:block" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/85">
                  最佳推荐 · {smartFert ? '智能施肥' : '自然生长'}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/95 flex items-center justify-center shadow-lg flex-shrink-0">
                  <CropImage seedId={bestFert.seedId} name={bestFert.name} size={64} className="sm:hidden" />
                  <CropImage seedId={bestFert.seedId} name={bestFert.name} size={96} className="hidden sm:block" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="text-white/80 text-[10px] sm:text-xs font-bold tracking-wide mb-0.5">
                    Lv{bestFert.requiredLevel} · {bestFert.seasons > 1 ? `${bestFert.seasons} 季作物` : '单季作物'}
                  </div>
                  <h2 className="font-display italic text-xl sm:text-3xl font-bold text-white truncate leading-tight">
                    {bestFert.name}
                  </h2>
                  <div className="font-mono tnum text-2xl sm:text-4xl font-black text-white mt-0.5 sm:mt-1.5">
                    {(target === 'exp' ? bestFert.expPerHourFert : bestFert.goldPerHourFert).toFixed(0)}
                    <span className="text-xs sm:text-sm font-bold text-white/70 ml-1">/小时</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/70 mb-0.5">每日</div>
                  <div className="font-mono tnum text-sm sm:text-lg font-bold text-white">
                    {Math.round((target === 'exp' ? bestFert.expPerHourFert : bestFert.goldPerHourFert) * 24).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/70 mb-0.5">周期</div>
                  <div className="font-mono text-[11px] sm:text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                    <Clock size={10} strokeWidth={2.5} className="opacity-70 sm:hidden" />
                    <Clock size={11} strokeWidth={2.5} className="opacity-70 hidden sm:block" />
                    {bestFert.growTimeFertStr}
                  </div>
                </div>
                {bestFert.gainPercent > 0 && (
                  <div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/70 mb-0.5">提升</div>
                    <div className="font-mono tnum text-sm sm:text-lg font-bold text-white flex items-center gap-1">
                      <TrendingUp size={12} strokeWidth={2.5} className="opacity-70 sm:hidden" />
                      <TrendingUp size={13} strokeWidth={2.5} className="opacity-70 hidden sm:block" />
                      +{bestFert.gainPercent.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Leaderboard */}
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="sticker-lg overflow-hidden">

            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">🏆</span>
                <span className="font-display italic text-base font-bold text-[var(--ink)]">
                  {target === 'exp' ? '经验天梯榜' : '金币天梯榜'}
                </span>
                <span className="chip chip-ink">TOP 20</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ink-mute)]">共 {sortedFert.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table-clean table-fixed">
                <colgroup>
                  <col className="w-14" />
                  <col />
                  <col className="w-20" />
                  <col className="w-28 hidden sm:table-column" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-center">#</th>
                    <th>作物</th>
                    <th className="text-center">等级</th>
                    <th className="text-center hidden sm:table-cell">周期</th>
                    <th className="text-right">{target === 'exp' ? '经验/小时' : '金币/小时'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFert.slice(0, 20).map((row, i) => {
                    const rank = RANK_COLORS[i];
                    return (
                      <tr key={row.seedId} className="group">
                        <td className="text-center">
                          {rank ? (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mx-auto"
                              style={{ background: rank.bg }}>
                              <span>{rank.medal}</span>
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs text-[var(--ink-mute)] mx-auto"
                              style={{ background: 'var(--bg-2)' }}>
                              {i + 1}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CropImage seedId={row.seedId} name={row.name} size={44} />
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[var(--ink)] leading-tight truncate">{row.name}</div>
                              {row.seasons > 1 && <div className="text-[9px] text-[var(--berry-deep)] font-bold">{row.seasons} 季</div>}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="font-mono tnum text-xs font-bold text-[var(--ink-soft)]">
                            Lv{row.requiredLevel}
                          </span>
                        </td>
                        <td className="text-center text-[10px] font-mono text-[var(--ink-mute)] hidden sm:table-cell whitespace-nowrap">
                          {row.growTimeFertStr}
                        </td>
                        <td className="text-right">
                          <span className="font-mono tnum text-sm font-bold whitespace-nowrap"
                            style={{ color: target === 'exp' ? 'var(--leaf-deep)' : 'var(--orange-deep)' }}>
                            {(target === 'exp' ? row.expPerHourFert : row.goldPerHourFert).toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>
        </>
      )}

      {calculatedRows.length === 0 && (
        <EmptyState
          emoji="🌱"
          title="配置土地后开始计算"
          hint="设置等级、土地数与各类土地分配，结果会出现在这里"
        />
      )}
    </div>
  );
}
