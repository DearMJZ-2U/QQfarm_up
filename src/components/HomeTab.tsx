import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Calculator, Sprout, Map, Dna, Home as HomeIcon, Coins, Search, Wrench, FlaskConical, Image as ImageIcon, Dog, Bone, Ticket, Diamond, Star, Clock, Trophy, TrendingUp, Zap, BookOpen, ShoppingBag, Layers } from 'lucide-react';
import seedsData from '../data/seeds.json';
import itemsData from '../data/items.json';
import mutationData from '../data/mutation_atlas.json';
import { CropImage, plantAllPhasesMap, plantLastPhaseMap, formatSec, LAND_BUFFS, NO_FERT_PLANT_SPEED, NORMAL_FERT_PLANT_SPEED, calcBestLands, RemoteImage, goldenAtlasImageUrls } from './shared';
import { Calculator as CalcIcon, BookOpen as AtlasIcon, ShoppingBag as ItemsIcon } from 'lucide-react';

type NavHandler = (tab: 'calc' | 'atlas' | 'atlas_mutation' | 'atlas_costume' | 'items_seed' | 'more_level' | 'items_gold') => void;

interface Props {
  onNavigate: NavHandler;
}

function longestPhase(seedId: number): number {
  const phases = plantAllPhasesMap[seedId];
  if (!phases || phases.length < 2) return 0;
  const nonMature = phases.slice(0, -1);
  return Math.max(...nonMature);
}

interface QuickCalcResult {
  name: string;
  seedId: number;
  expPerHour: number;
  goldPerHour: number;
  level: number;
  seasons: number;
  growTimeStr: string;
  gainPercent: number;
}

function runQuickCalc(level: number, totalLands: number): QuickCalcResult | null {
  if (level < 1 || totalLands < 1) return null;
  const seedsList = Array.isArray(seedsData) ? seedsData : (seedsData.rows || []);
  const best = calcBestLands(level, totalLands);
  const { normal, red, black, gold, purple } = best;
  if (normal + red + black + gold + purple === 0) return null;

  const plantSecFert = totalLands / NORMAL_FERT_PLANT_SPEED;
  const landCounts = [
    { count: normal, buff: LAND_BUFFS.normal },
    { count: red, buff: LAND_BUFFS.red },
    { count: black, buff: LAND_BUFFS.black },
    { count: gold, buff: LAND_BUFFS.gold },
    { count: purple, buff: LAND_BUFFS.purple },
  ];

  let bestRow: any = null;
  let bestExp = -1;
  for (const s of seedsList) {
    if (s.requiredLevel > level) continue;
    const seedId = s.seedId;
    const growTimeSec = s.growTimeSec;
    const seasons = s.seasons || 1;
    const lastPhaseSec = plantLastPhaseMap[seedId] || 0;
    const reduceSecFirst = longestPhase(seedId);
    const reduceSecSecond = seasons >= 2 ? longestPhase(seedId) : 0;
    const totalGrowTimeFert = Math.max(1, growTimeSec - reduceSecFirst) + (seasons - 1) * Math.max(1, lastPhaseSec - reduceSecSecond);
    const totalExp = s.exp * seasons;
    let expPerHourFert = 0;
    for (const { count, buff } of landCounts) {
      if (count <= 0) continue;
      const landGrowTimeFert = totalGrowTimeFert * buff.time;
      const cycleFert = landGrowTimeFert + plantSecFert;
      expPerHourFert += (count * totalExp * buff.exp / cycleFert) * 3600;
    }
    if (expPerHourFert > bestExp) {
      bestExp = expPerHourFert;
      const landGrowTimeSec = growTimeSec + (seasons - 1) * lastPhaseSec;
      const cycleNoFert = landGrowTimeSec + totalLands / NO_FERT_PLANT_SPEED;
      let expPerHourNoFert = 0;
      for (const { count, buff } of landCounts) {
        if (count <= 0) continue;
        const t = (growTimeSec + (seasons - 1) * lastPhaseSec) * buff.time;
        expPerHourNoFert += (count * totalExp * buff.exp / (t + plantSecFert)) * 3600;
      }
      bestRow = { ...s, expPerHourFert, expPerHourNoFert, growTimeFert: totalGrowTimeFert, seasons };
    }
  }
  if (!bestRow) return null;
  const gainPercent = bestRow.expPerHourNoFert > 0 ? ((bestRow.expPerHourFert - bestRow.expPerHourNoFert) / bestRow.expPerHourNoFert) * 100 : 0;
  return {
    name: bestRow.name,
    seedId: bestRow.seedId,
    expPerHour: bestRow.expPerHourFert,
    goldPerHour: bestRow.goldPerHourFert || 0,
    level: bestRow.requiredLevel,
    seasons: bestRow.seasons,
    growTimeStr: bestRow.seasons > 1 ? `${formatSec(bestRow.growTimeFert)} (共${bestRow.seasons}季)` : formatSec(bestRow.growTimeFert),
    gainPercent,
  };
}

function StatPill({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className="sticker p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `var(--${accent})`, color: 'white', boxShadow: `0 2px 0 var(--${accent}-deep)` }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-mono tnum text-base sm:text-xl font-black text-[var(--ink)] leading-none">{value}</div>
        <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] font-bold mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}

function CategoryCard({ emoji, label, desc, count, accent, onClick, icon: Icon }: {
  emoji: string; label: string; desc: string; count?: number;
  accent: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' | 'ink';
  onClick: () => void; icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="sticker sticker-press p-3 sm:p-4 text-left w-full group">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-transform group-hover:-rotate-6 group-hover:scale-110"
          style={{ background: `var(--${accent})`, color: 'white', boxShadow: `0 2px 0 var(--${accent}-deep)` }}>
          <span>{emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm sm:text-base text-[var(--ink)] truncate">{label}</span>
            {count !== undefined && (
              <span className="font-mono tnum text-[10px] sm:text-[11px] font-bold text-[var(--ink-mute)] flex-shrink-0">
                {count}
              </span>
            )}
          </div>
          <div className="text-[10px] sm:text-xs text-[var(--ink-mute)] mt-0.5 truncate">{desc}</div>
        </div>
        <ArrowRight size={14} className="text-[var(--ink-mute)] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.button>
  );
}

export default function HomeTab({ onNavigate }: Props) {
  const [level, setLevel] = React.useState<number>(70);
  const [lands, setLands] = React.useState<number>(24);

  const result = useMemo(() => runQuickCalc(level, lands), [level, lands]);

  // 统计
  const stats = useMemo(() => {
    const seedCat = itemsData.categories.find(c => c.id === '05');
    const goldCat = itemsData.categories.find(c => c.id === '17');
    return {
      seeds: seedCat?.items.length || 0,
      goldFruits: (mutationData.goldenAtlas?.goldenFruit?.length || 0) + (mutationData.goldenAtlas?.costumeFruit?.length || 0) + (mutationData.goldenAtlas?.eventFruit?.length || 0),
      mutations: mutationData.mutationTypes?.length || 0,
      lands: 24,
    };
  }, []);

  // 黄金果实 top 3 (按 points 降序)
  const topGold = useMemo(() => {
    const arr = (mutationData.goldenAtlas?.goldenFruit || []) as any[];
    return [...arr].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3);
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6 fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7"
        style={{
          background: 'linear-gradient(135deg, var(--leaf) 0%, var(--leaf-deep) 60%, var(--plum-deep) 130%)',
          boxShadow: '0 8px 32px -8px rgba(45, 157, 61, 0.45)',
        }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-4 right-4 text-5xl sm:text-6xl float-anim opacity-30">🌾</div>

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-3">
            <Sparkles size={10} strokeWidth={2.5} /> QQ 农场 · 一站式指南
          </div>
          <h1 className="font-display italic text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.2] text-white">
            种什么<span className="shine-text">最赚</span><span className="ml-1">？</span>
          </h1>
          <p className="text-sm sm:text-base text-white/85 mt-2 sm:mt-3 max-w-md leading-relaxed">
            收益计算 · 作物图鉴 · 变异大全 · 商店道具 · 等级查询 — 全在一个仪表盘
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 text-center">
              <div className="font-mono tnum text-lg sm:text-2xl font-black text-white leading-none">{stats.seeds}</div>
              <div className="text-[9px] sm:text-[10px] text-white/75 font-bold uppercase tracking-wider mt-1">作物</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 text-center">
              <div className="font-mono tnum text-lg sm:text-2xl font-black text-white leading-none">{stats.goldFruits}</div>
              <div className="text-[9px] sm:text-[10px] text-white/75 font-bold uppercase tracking-wider mt-1">超变</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 text-center">
              <div className="font-mono tnum text-lg sm:text-2xl font-black text-white leading-none">{stats.mutations}</div>
              <div className="text-[9px] sm:text-[10px] text-white/75 font-bold uppercase tracking-wider mt-1">变异</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 text-center">
              <div className="font-mono tnum text-lg sm:text-2xl font-black text-white leading-none">{stats.lands}</div>
              <div className="text-[9px] sm:text-[10px] text-white/75 font-bold uppercase tracking-wider mt-1">地块</div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK CALCULATOR + TOP GOLD (PC: 2 columns, mobile: stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Quick Calculator */}
        <section className="lg:col-span-3 sticker-lg p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--leaf)', color: 'white', boxShadow: '0 2px 0 var(--leaf-deep)' }}>
                <Zap size={14} strokeWidth={2.5} />
              </div>
              <h2 className="font-display italic text-lg sm:text-xl font-bold text-[var(--ink)]">快速计算</h2>
            </div>
            <button onClick={() => onNavigate('calc')}
              className="text-[10px] sm:text-xs font-bold text-[var(--leaf-deep)] flex items-center gap-1 hover:underline">
              完整计算 <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1">账号等级</label>
              <input type="number" value={level}
                onChange={e => setLevel(Number(e.target.value) || 1)}
                className="input-pop text-center" min={1} max={200} style={{ padding: '0.55rem 0.6rem', fontSize: '0.95rem' }} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1">土地总数</label>
              <input type="number" value={lands}
                onChange={e => setLands(Number(e.target.value) || 0)}
                className="input-pop text-center" min={1} max={24} style={{ padding: '0.55rem 0.6rem', fontSize: '0.95rem' }} />
            </div>
          </div>

          {/* Best crop result */}
          {result ? (
            <motion.div key={`${level}-${lands}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-3 sm:p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, var(--leaf-bg) 0%, var(--sun-bg) 100%)', border: '1.5px solid var(--leaf-soft)' }}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/80">
                <CropImage seedId={result.seedId} name={result.name} size={40} className="sm:hidden" />
                <CropImage seedId={result.seedId} name={result.name} size={56} className="hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--leaf-deep)] mb-0.5">最佳推荐</div>
                <div className="font-display italic text-base sm:text-xl font-bold text-[var(--ink)] truncate leading-tight">{result.name}</div>
                <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
                  <span className="font-mono tnum text-lg sm:text-2xl font-black text-[var(--leaf-deep)]">{result.expPerHour.toFixed(0)}</span>
                  <span className="text-[10px] sm:text-xs text-[var(--ink-mute)] font-bold">经验/小时</span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 text-[10px] text-[var(--ink-mute)] font-bold">
                <span className="flex items-center gap-1"><Trophy size={10} /> Lv{result.level}{result.seasons > 1 ? ` · ${result.seasons}季` : ''}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {result.growTimeStr}</span>
                {result.gainPercent > 0 && <span className="flex items-center gap-1 text-[var(--leaf-deep)]"><TrendingUp size={10} /> +{result.gainPercent.toFixed(0)}%</span>}
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl p-4 text-center text-xs text-[var(--ink-mute)]" style={{ background: 'var(--bg-2)' }}>
              请输入有效的等级和土地数
            </div>
          )}
        </section>

        {/* Top Gold Fruits (PC only side panel) */}
        <section className="lg:col-span-2 sticker-lg p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--sun)', color: 'white', boxShadow: '0 2px 0 var(--sun-deep)' }}>
                <Star size={14} strokeWidth={2.5} />
              </div>
              <h2 className="font-display italic text-lg sm:text-xl font-bold text-[var(--ink)]">黄金 Top 3</h2>
            </div>
            <button onClick={() => onNavigate('atlas_mutation')}
              className="text-[10px] sm:text-xs font-bold text-[var(--sun-deep)] flex items-center gap-1 hover:underline">
              全部 <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>
          <div className="space-y-2">
            {topGold.map((g, i) => {
              const atlasUrls = goldenAtlasImageUrls(g.name);
              return (
                <button key={g.name} onClick={() => onNavigate('atlas_mutation')}
                  className="w-full flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-[var(--bg-2)] transition-colors text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-mono font-black text-sm"
                    style={{ background: i === 0 ? 'var(--sun)' : 'var(--bg-2)', color: i === 0 ? 'white' : 'var(--ink-mute)' }}>
                    {i + 1}
                  </div>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--sun-bg)' }}>
                    {atlasUrls.length > 0 ? (
                      <RemoteImage urls={atlasUrls} name={g.name} size={32} className="sm:hidden" rounded />
                    ) : (
                      <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={32} className="sm:hidden" />
                    )}
                    {atlasUrls.length > 0 ? (
                      <RemoteImage urls={atlasUrls} name={g.name} size={40} className="hidden sm:block" rounded />
                    ) : (
                      <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={40} className="hidden sm:block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate">{g.name}</div>
                    <div className="text-[10px] text-[var(--ink-mute)] font-mono tnum">经验 {g.exp} · 果实 {g.fruit}</div>
                  </div>
                  <span className="chip chip-sun flex-shrink-0" style={{ fontSize: '0.6rem' }}>+{g.points}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* CATEGORIES — 图鉴 */}
      <section>
        <div className="section-eyebrow mb-2.5 sm:mb-3 flex items-center justify-between">
          <span>图鉴</span>
          <span className="text-[10px] text-[var(--ink-mute)] tracking-wider">{stats.seeds + stats.goldFruits + stats.lands} 项</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <CategoryCard
            emoji="🌿" label="作物图鉴" desc="134 种作物数据" accent="leaf"
            count={stats.seeds}
            onClick={() => onNavigate('atlas')}
            icon={Sprout} />
          <CategoryCard
            emoji="🏡" label="装扮图鉴" desc="6 大类 38 套" accent="sky"
            count={38}
            onClick={() => onNavigate('atlas_costume')}
            icon={HomeIcon} />
          <CategoryCard
            emoji="🏞️" label="土地图鉴" desc="5 种土壤 + 24 地块" accent="orange"
            count={stats.lands}
            onClick={() => onNavigate('atlas')}
            icon={Map} />
          <CategoryCard
            emoji="🧬" label="变异图鉴" desc="10 变异 + 50 黄金果实" accent="berry"
            count={stats.mutations + stats.goldFruits}
            onClick={() => onNavigate('atlas_mutation')}
            icon={Dna} />
        </div>
      </section>

      {/* CATEGORIES — 商店道具 */}
      <section>
        <div className="section-eyebrow mb-2.5 sm:mb-3 flex items-center justify-between">
          <span>商店道具</span>
          <span className="text-[10px] text-[var(--ink-mute)] tracking-wider">{itemsData.categories.reduce((s, c) => s + c.items.length, 0)} 件</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <CategoryCard
            emoji="🌱" label="种子" desc="Lv 1 → 200 全覆盖" accent="leaf"
            count={stats.seeds}
            onClick={() => onNavigate('items_seed')} />
          <CategoryCard
            emoji="✨" label="黄金果实" desc="超变 / 装扮 / 活动" accent="sun"
            count={stats.goldFruits}
            onClick={() => onNavigate('items_gold')} />
          <CategoryCard
            emoji="💰" label="货币与计数" desc="9 件" accent="sun"
            count={9}
            onClick={() => onNavigate('items_gold')} />
          <CategoryCard
            emoji="🛠️" label="操作工具" desc="8 件" accent="sky"
            count={8}
            onClick={() => onNavigate('items_gold')} />
          <CategoryCard
            emoji="🧪" label="化肥道具" desc="8 件" accent="leaf"
            count={8}
            onClick={() => onNavigate('items_gold')} />
          <CategoryCard
            emoji="🎨" label="头像框与装饰" desc="14 件" accent="plum"
            count={14}
            onClick={() => onNavigate('items_gold')} />
          <CategoryCard
            emoji="🐕" label="狗与看门犬" desc="5 件" accent="orange"
            count={5}
            onClick={() => onNavigate('items_gold')} />
          <CategoryCard
            emoji="🦴" label="狗粮" desc="3 件" accent="orange"
            count={3}
            onClick={() => onNavigate('items_gold')} />
        </div>
      </section>

      {/* TOOLS — 工具 */}
      <section>
        <div className="section-eyebrow mb-2.5 sm:mb-3">工具</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <CategoryCard
            emoji="🧮" label="经验计算器" desc="智能施肥 · 土地自动配置 · 实时推荐" accent="leaf"
            onClick={() => onNavigate('calc')}
            icon={CalcIcon} />
          <CategoryCard
            emoji="📊" label="等级查询" desc="Lv 1-200 累计/升级经验表" accent="plum"
            onClick={() => onNavigate('more_level')}
            icon={Search} />
        </div>
      </section>

      {/* Footer hint */}
      <div className="text-center pt-2 pb-1">
        <div className="text-[10px] text-[var(--ink-mute)] tracking-wider">
          📌 数据截至 2026-06 · 打开 <span className="font-bold text-[var(--ink-soft)]">侧边栏</span> 可快速跳转
        </div>
      </div>
    </div>
  );
}
