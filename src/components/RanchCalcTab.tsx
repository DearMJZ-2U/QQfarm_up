import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Zap, Coins, Clock, Leaf, Home, FlaskConical, Wheat } from 'lucide-react';
import rawCalc from '../data/ranch_calc.json';
import { RemoteImage, PillTabGroup, StatTile, EmptyState, publicUrl } from './shared';

/* ────────────────────────────────────────────────────────────
 * 牧场收益计算器
 * 数据：src/data/ranch_calc.json（scripts/build_ranch_calc_data.mjs 生成）
 * 口径：
 *   周期 = 幼崽 + 成长 + 产出轮数 × 每轮时长（可被罐头压缩）
 *   收益 = 轮数 ×（主产物价 × 数量 + 副产物价 × 数量）×（1 + 建筑售价加成）
 *   经验 = 轮数 × 产出经验 + 收获经验（1 + 建筑经验加成）
 *   牧草 = ceil(周期 / 每份牧草可喂养秒数)，按「购买 / 自种 / 混合」计价
 *   净金券 = 收益 − 牧草成本(金券部分) − 幼崽价 − 罐头成本
 * ──────────────────────────────────────────────────────────── */

interface Sells { cid: number; price: number }
interface AnimalRow {
  id: number; name: string; type: '窝' | '棚'; unlockLevel: number;
  infantSec: number; growSec: number; matureSec: number; roundSec: number; dropSec: number;
  maxCount: number; grassSec: number; produceExp: number; harvestExp: number;
  main: { id: number; name: string; price: number; count: number };
  by: { id: number; name: string; price: number; count: number };
  cub: { id: number; name: string; price: number; currency: number };
  image: string | null;
}
interface FacilityRow { id: number; level: number; capacity: number | null; cost: { currency: number; count: number }; secs: number; reqLevel: number | null; next: number | null }
interface CityRow extends FacilityRow { open: number; quota: Record<string, number> }
interface CalcData {
  levels: Array<[number, number]>;
  animals: AnimalRow[];
  buildings: { coop: FacilityRow[]; shed: FacilityRow[]; grass: FacilityRow[]; city: CityRow[]; lab: Array<{ level: number; slots: number; reduceBp: number }> };
  bonuses: { coop: Array<{ level: number; priceBp: number; byPriceBp: number }>; shed: Array<{ level: number; expBp: number; byExpBp: number }> };
  grass: {
    item: { id: number; name: string };
    shop: { price: number; currency: number };
    crop: { name: string; growSec: number; yieldCount: number; exp: number; seedPrice: number };
  };
  cans: { list: Array<{ id: number; feedType: string; secs: number; name: string }>; normal: { name: string; desc: string }; organic: { name: string; desc: string } };
}
const DATA = rawCalc as unknown as CalcData;

const GRASS_SEED_PRICE = DATA.grass.crop.seedPrice || 10;   // 金币/包
const GRASS_PER_PACK = DATA.grass.crop.yieldCount || 20;
const GRASS_COIN_PER_UNIT = GRASS_SEED_PRICE / GRASS_PER_PACK;      // 0.5 金币/份
const GRASS_SHOP_PRICE = DATA.grass.shop.price || 60;               // 金券/份
const GRASS_SEC_PER_UNIT = DATA.grass.crop.growSec / GRASS_PER_PACK; // 30 地秒/份

const fmt = (n: number, digits = 0) =>
  !isFinite(n) ? '—' : n.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const fmtSec = (sec: number) => {
  if (!isFinite(sec) || sec <= 0) return '—';
  if (sec < 60) return `${Math.round(sec)}秒`;
  if (sec < 3600) return `${Math.round(sec / 60)}分钟`;
  const h = sec / 3600;
  if (h < 24) return `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)}小时`;
  const d = Math.floor(h / 24);
  const rest = h - d * 24;
  return rest < 0.1 ? `${d}天` : `${d}天${rest.toFixed(0)}小时`;
};

/** 紧凑数字输入：标签 + 小输入框 + 单位，用在罐头/成本这类一行里挤很多字段的位置。
 *  不设隐藏的小数位数限制 —— 罐头时长按任意小时（可小数）填。 */
function MiniNum({
  label,
  unit,
  value,
  onChange,
  min = 0,
  max,
  step = 0.5,
  w = 54,
}: {
  label: string;
  unit?: string;
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  w?: number;
}) {
  return (
    <label className="flex items-center gap-1 text-[10px] font-mono text-[var(--ink-mute)] whitespace-nowrap">
      <span className="font-bold">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        style={{ width: w }}
        className="input-pop input-mini font-mono" />
      {unit && <span>{unit}</span>}
    </label>
  );
}

const bonusAt = <T extends { level: number }>(rows: T[], lv: number): T => rows.find(r => r.level === lv) || rows[0];

function maxAllowedLevel(rows: FacilityRow[], ranchLevel: number) {
  let lv = 1;
  for (const r of rows) {
    if (r.reqLevel === null || r.reqLevel <= ranchLevel) lv = Math.max(lv, r.level);
  }
  return lv;
}
function cumulativeCost(rows: FacilityRow[], toLevel: number) {
  let cost = 0, secs = 0;
  for (const r of rows) {
    if (r.level > 1 && r.level <= toLevel) {
      cost += r.cost.count;
      secs += r.secs;
    }
  }
  return { cost, secs };
}

/** 罐头压缩：普通罐头每只每轮 1 个（削最长阶段）；有机罐头按「每轮用量」逐个削最长阶段，单阶段保留 30 秒操作时间 */
function stageSeconds(a: AnimalRow, normalHours: number, organicHours: number, organicCans: number) {
  const stages = [a.infantSec, a.growSec, ...Array(Math.max(1, a.maxCount)).fill(a.roundSec)].map(Number);
  const FLOOR = 30;
  if (normalHours > 0) {
    let idx = 0;
    for (let i = 1; i < stages.length; i++) if (stages[i] > stages[idx]) idx = i;
    stages[idx] = Math.max(FLOOR, stages[idx] - normalHours * 3600);
  }
  if (organicHours > 0 && organicCans > 0) {
    let budget = organicHours * 3600 * organicCans;
    for (let guard = 0; guard < 40 && budget > 0; guard++) {
      let idx = 0;
      for (let i = 1; i < stages.length; i++) if (stages[i] > stages[idx]) idx = i;
      if (stages[idx] <= FLOOR) break;
      const cut = Math.min(budget, stages[idx] - FLOOR);
      stages[idx] -= cut;
      budget -= cut;
    }
  }
  return stages;
}

interface Ctx {
  ranchLevel: number;
  coopLevel: number;
  shedLevel: number;
  grassMode: 'buy' | 'grow' | 'mix';
  growShare: number;   // 0..100 自种比例
  normalHours: number;
  organicHours: number;
  organicCans: number; // 每轮有机罐头个数
  normalPrice: number; // 券/个
  organicPrice: number;// 券/个
}

interface Metrics {
  a: AnimalRow;
  cycleSec: number;
  baseCycleSec: number;
  grassPerCycle: number;
  grassPerHour: number;
  revenue: number;
  expCycle: number;
  couponCost: number;
  coinCost: number;
  netCycle: number;
  netPerHour: number;
  expPerHour: number;
  grossPerHour: number;
  paybackH: number | null;
  priceBp: number;
  expBp: number;
}

function metricsOf(a: AnimalRow, ctx: Ctx): Metrics {
  const stages = stageSeconds(a, ctx.normalHours, ctx.organicHours, ctx.organicCans);
  const baseStages = [a.infantSec, a.growSec, ...Array(Math.max(1, a.maxCount)).fill(a.roundSec)];
  const baseCycleSec = baseStages.reduce((x, y) => x + y, 0);
  const cycleSec = Math.max(1, stages.reduce((x, y) => x + y, 0), baseCycleSec * 0.5);
  // 牧草按「连续消耗」计：一份草喂 grassSec 秒，周期内的消耗是小数，可跨轮结转
  const grassUnits = cycleSec / a.grassSec;
  const grassPerCycle = grassUnits;
  const grassPerHour = 3600 / a.grassSec;
  const priceBp = a.type === '窝' ? bonusAt(DATA.bonuses.coop, ctx.coopLevel).priceBp : 0;
  const byPriceBp = a.type === '窝' ? bonusAt(DATA.bonuses.coop, ctx.coopLevel).byPriceBp : 0;
  const expBp = a.type === '棚' ? bonusAt(DATA.bonuses.shed, ctx.shedLevel).expBp : 0;
  const revenue =
    a.maxCount * (a.main.price * a.main.count * (1 + priceBp / 10000) +
      a.by.price * a.by.count * (1 + byPriceBp / 10000));
  const expCycle = a.maxCount * a.produceExp * (1 + expBp / 10000) + a.harvestExp * (1 + expBp / 10000);
  const buyShare = ctx.grassMode === 'buy' ? 1 : ctx.grassMode === 'grow' ? 0 : 1 - ctx.growShare / 100;
  const growShare = 1 - buyShare;
  const couponCost = grassPerCycle * GRASS_SHOP_PRICE * buyShare;
  const coinCost = grassPerCycle * GRASS_COIN_PER_UNIT * growShare;
  const canCost = (ctx.normalHours > 0 ? ctx.normalPrice : 0) + (ctx.organicHours > 0 ? ctx.organicCans * ctx.organicPrice : 0);
  const netCycle = revenue - couponCost - a.cub.price - canCost;
  const perHour = 3600 / cycleSec;
  return {
    a,
    cycleSec,
    baseCycleSec,
    grassPerCycle,
    grassPerHour,
    revenue,
    expCycle,
    couponCost,
    coinCost,
    netCycle,
    netPerHour: netCycle * perHour,
    expPerHour: expCycle * perHour,
    grossPerHour: revenue * perHour,
    paybackH: netCycle > 0 ? a.cub.price / (netCycle * perHour) : null,
    priceBp,
    expBp,
  };
}

const RANKS = [
  { bg: 'linear-gradient(135deg,#FFD75E,#F5A623)', medal: '🥇' },
  { bg: 'linear-gradient(135deg,#E6EAF2,#B9C2D4)', medal: '🥈' },
  { bg: 'linear-gradient(135deg,#F2C79A,#CE8A4E)', medal: '🥉' },
];

export default function RanchCalcTab() {
  const [ranchLevel, setRanchLevel] = useState<number | ''>(9);
  const [cityLevel, setCityLevel] = useState<number | ''>(1);
  const [coopLevel, setCoopLevel] = useState(2);
  const [shedLevel, setShedLevel] = useState(1);
  const [grassLevel, setGrassLevel] = useState(1);
  const [grassMode, setGrassMode] = useState<'buy' | 'grow' | 'mix'>('grow');
  const [growShare, setGrowShare] = useState(70);
  const [canOn, setCanOn] = useState(false);
  const [normalCanH, setNormalCanH] = useState<number | ''>(12);
  const [organicCanH, setOrganicCanH] = useState<number | ''>(4);
  const [organicCans, setOrganicCans] = useState(1);
  const [normalPrice, setNormalPrice] = useState<number | ''>(0);
  const [organicPrice, setOrganicPrice] = useState<number | ''>(0);
  const [target, setTarget] = useState<'coupon' | 'exp'>('coupon');
  const [plan, setPlan] = useState<'money' | 'exp'>('money');
  const [showFormula, setShowFormula] = useState(false);

  const lv = typeof ranchLevel === 'number' ? Math.max(1, Math.min(65, ranchLevel)) : 1;
  const cityLv = typeof cityLevel === 'number' ? Math.max(1, Math.min(12, cityLevel)) : 1;

  const maxCoop = useMemo(() => maxAllowedLevel(DATA.buildings.coop, lv), [lv]);
  const maxShed = useMemo(() => maxAllowedLevel(DATA.buildings.shed, lv), [lv]);
  const maxGrass = useMemo(() => maxAllowedLevel(DATA.buildings.grass, lv), [lv]);
  // 牧场等级降下来后，建筑等级不能高于该级可达上限（避免「降」按钮点了没反应）
  useEffect(() => {
    if (coopLevel > maxCoop) setCoopLevel(maxCoop);
  }, [coopLevel, maxCoop]);
  useEffect(() => {
    if (shedLevel > maxShed) setShedLevel(maxShed);
  }, [shedLevel, maxShed]);
  useEffect(() => {
    if (grassLevel > maxGrass) setGrassLevel(maxGrass);
  }, [grassLevel, maxGrass]);

  const coopLv = Math.min(coopLevel, maxCoop);
  const shedLv = Math.min(shedLevel, maxShed);
  const grassLv = Math.min(grassLevel, maxGrass);

  // 罐头时长按浮点小时算：实际用的时候不会卡整点，0.5h 粒度就够
  const nCanH = typeof normalCanH === 'number' ? Math.max(0, Math.min(24, normalCanH)) : 0;
  const oCanH = typeof organicCanH === 'number' ? Math.max(0, Math.min(24, organicCanH)) : 0;
  const normalHours = canOn ? nCanH : 0;
  const organicHours = canOn ? oCanH : 0;

  const ctx: Ctx = {
    ranchLevel: lv, coopLevel: coopLv, shedLevel: shedLv, grassMode, growShare,
    normalHours, organicHours, organicCans,
    normalPrice: typeof normalPrice === 'number' ? normalPrice : 0,
    organicPrice: typeof organicPrice === 'number' ? organicPrice : 0,
  };

  const rows = useMemo(
    () => DATA.animals
      .filter(a => a.unlockLevel <= lv)
      .map(a => metricsOf(a, ctx))
      .sort((x, y) => target === 'exp'
      ? (y.expPerHour - x.expPerHour) || (x.cycleSec - y.cycleSec)
      : (y.netPerHour - x.netPerHour) || (x.cycleSec - y.cycleSec)),
    [lv, coopLv, shedLv, grassMode, growShare, normalHours, organicHours, organicCans, normalPrice, organicPrice, target],
  );

  const allRows = useMemo(() => DATA.animals.map(a => metricsOf(a, ctx)), [coopLv, shedLv, grassMode, growShare, normalHours, organicHours, organicCans, normalPrice, organicPrice]);
  const byType = (t: '窝' | '棚') => allRows.filter(r => r.a.type === t && r.a.unlockLevel <= lv);
  const bestCouponCoop = [...byType('窝')].sort((x, y) => y.netPerHour - x.netPerHour)[0];
  const bestCouponShed = [...byType('棚')].sort((x, y) => y.netPerHour - x.netPerHour)[0];
  const bestExpCoop = [...byType('窝')].sort((x, y) => y.expPerHour - x.expPerHour)[0];
  const bestExpShed = [...byType('棚')].sort((x, y) => y.expPerHour - x.expPerHour)[0];

  const coopNode = DATA.buildings.coop.find(r => r.level === coopLv) || DATA.buildings.coop[0];
  const shedNode = DATA.buildings.shed.find(r => r.level === shedLv) || DATA.buildings.shed[0];
  const grassNode = DATA.buildings.grass.find(r => r.level === grassLv) || DATA.buildings.grass[0];
  const cityNode = DATA.buildings.city.find(r => r.level === cityLv) || DATA.buildings.city[0];
  const quota = cityNode?.quota || {};
  const coopCount = quota.coop || 0;
  const shedCount = quota.shed || 0;
  const coopSlots = coopCount * (coopNode.capacity || 0);
  const shedSlots = shedCount * (shedNode.capacity || 0);
  const slots = coopSlots + shedSlots;

  const moneyCouponPerHour = coopSlots * (bestCouponCoop?.netPerHour || 0) + shedSlots * (bestCouponShed?.netPerHour || 0);
  const expPerHourTotal = coopSlots * (bestExpCoop?.expPerHour || 0) + shedSlots * (bestExpShed?.expPerHour || 0);
  const coinPerHourTotal = coopSlots * (bestCouponCoop?.coinCost || 0) / (bestCouponCoop?.cycleSec || 1) * 3600
    + shedSlots * (bestCouponShed?.coinCost || 0) / (bestCouponShed?.cycleSec || 1) * 3600;
  const grassPerDayTotal =
    coopSlots * (bestCouponCoop?.grassPerHour || 0) * 24 +
    shedSlots * (bestCouponShed?.grassPerHour || 0) * 24;
  const grassDays = grassPerDayTotal > 0 && grassNode.capacity ? grassNode.capacity / grassPerDayTotal : null;

  const buildCost =
    coopCount * cumulativeCost(DATA.buildings.coop, coopLv).cost +
    shedCount * cumulativeCost(DATA.buildings.shed, shedLv).cost +
    cumulativeCost(DATA.buildings.grass, grassLv).cost +
    cumulativeCost(DATA.buildings.city, cityLv).cost;
  const buildPayback = moneyCouponPerHour > 0 ? buildCost / moneyCouponPerHour : null;

  const curExp = DATA.levels.find(([l]) => l === lv)?.[1] ?? 0;
  const nextExp = DATA.levels.find(([l]) => l === lv + 1)?.[1];
  const needExp = nextExp !== undefined ? nextExp - curExp : null;
  const hoursToNext = needExp !== null && expPerHourTotal > 0 ? needExp / expPerHourTotal : null;

  const ranked = [...rows];
  const winnerCoupon = [...rows].sort((x, y) => (y.netPerHour - x.netPerHour) || (x.cycleSec - y.cycleSec))[0];
  const winnerExp = [...rows].sort((x, y) => (y.expPerHour - x.expPerHour) || (x.cycleSec - y.cycleSec))[0];

  const canParts = [
    normalHours > 0 ? `普通 ${fmt(normalHours, 1)}h/只` : '',
    organicHours > 0 ? `有机 ${fmt(organicHours, 1)}h × ${organicCans}/轮` : '',
  ].filter(Boolean);
  const canLabel = canParts.length ? canParts.join(' + ') : '不使用罐头';

  const grassLabel = grassMode === 'buy' ? '金券直购'
    : grassMode === 'grow' ? '农场自种'
      : '混合模式';

  const coopBp = bonusAt(DATA.bonuses.coop, coopLv).priceBp;
  const shedBp = bonusAt(DATA.bonuses.shed, shedLv).expBp;
  const coopCaption = coopBp ? `窝 Lv${coopLv} 售价 +${coopBp / 100}%` : `窝 Lv${coopLv} 暂无加成（Lv5 起 +10%）`;
  const shedCaption = shedBp ? `棚 Lv${shedLv} 经验 +${shedBp / 100}%` : `棚 Lv${shedLv} 暂无加成（Lv5 起 +10%）`;
  const bonusCap = [coopBp ? coopCaption : '', shedBp ? shedCaption : ''].filter(Boolean).join(' · ')
    || '窝/棚 Lv5 起才有加成（+10%~40%）';

  const facilityTiles = [
    {
      key: 'coop', name: '窝', emoji: '🏠', node: coopNode, level: coopLv, max: maxCoop,
      set: setCoopLevel, rows: DATA.buildings.coop, count: coopCount,
      note: `${coopCount} 座 × ${coopNode.capacity} 只 = ${coopSlots} 栏`,
      bonusText: bonusAt(DATA.bonuses.coop, coopLv).priceBp ? `售价 +${bonusAt(DATA.bonuses.coop, coopLv).priceBp / 100}%` : '暂无加成（Lv5 起 +10%）',
      color: 'leaf' as const,
    },
    {
      key: 'shed', name: '棚', emoji: '🏚️', node: shedNode, level: shedLv, max: maxShed,
      set: setShedLevel, rows: DATA.buildings.shed, count: shedCount,
      note: shedCount ? `${shedCount} 座 × ${shedNode.capacity} 只 = ${shedSlots} 栏` : '主城 Lv2 起解锁 1 座',
      bonusText: shedCount
        ? (bonusAt(DATA.bonuses.shed, shedLv).expBp ? `经验 +${bonusAt(DATA.bonuses.shed, shedLv).expBp / 100}%` : '暂无加成（Lv5 起 +10%）')
        : '当前没有棚位',
      color: 'orange' as const,
    },
    {
      key: 'grass', name: '牧草机', emoji: '🌾', node: grassNode, level: grassLv, max: maxGrass,
      set: setGrassLevel, rows: DATA.buildings.grass, count: quota.grass || 1,
      note: grassDays ? `满栏日耗 ${fmt(grassPerDayTotal)} 份` : '满栏无消耗',
      bonusText: grassDays ? `草仓可撑 ${fmt(grassDays, 1)} 天` : '不占草仓',
      color: 'sun' as const,
    },
  ];

  const labNode = DATA.buildings.lab.find(r => r.level === 1) || DATA.buildings.lab[0];

  return (
    <div className="container-app pb-24 px-3 sm:px-4 fade-in space-y-6">
      {/* HERO */}
      <header className="pt-4 pb-2 text-center sm:text-left">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 chip chip-leaf mb-4">
            <Sparkles size={12} strokeWidth={2.5} /> 牧场收益实验室
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.3] tracking-tight text-[var(--ink)]">
            养什么<span className="shine-text">最赚</span><span className="ml-2">？</span>
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-4 max-w-xl mx-auto sm:mx-0 leading-relaxed">
            按牧场等级、建筑、牧草与罐头一起算 —— 每小时经验、每小时金券、完整收益排行榜，一次看清。
          </p>
        </motion.div>
      </header>

      {/* CONFIG */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="sticker-lg p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">牧场等级</label>
            <input type="number" value={ranchLevel} min={1} max={65}
              onChange={e => setRanchLevel(e.target.value === '' ? '' : Number(e.target.value))}
              className="input-pop text-center" />
            <div className="text-[10px] text-[var(--ink-mute)] mt-1 text-center">1 – 65（种植 25 级解锁牧场）</div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">主城等级</label>
            <input type="number" value={cityLevel} min={1} max={12}
              onChange={e => setCityLevel(e.target.value === '' ? '' : Number(e.target.value))}
              className="input-pop text-center" />
            <div className="text-[10px] text-[var(--ink-mute)] mt-1 text-center">决定窝/棚/草机的建造配额</div>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1.5">牧草来源</label>
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <PillTabGroup
                  items={[{ id: 'buy', label: '买草' }, { id: 'grow', label: '自种' }, { id: 'mix', label: '混合' }]}
                  value={grassMode} onChange={id => setGrassMode(id as 'buy' | 'grow' | 'mix')}
                  accent="leaf" size="sm" />
              </div>
              {/* 单价靠右贴着三个 pill，顶掉原来单独一行的「牧草 店买/自种」 */}
              <div className="ml-auto flex-shrink-0 text-right text-[9px] font-mono leading-[1.35] text-[var(--ink-mute)]">
                <div className="flex items-center justify-end gap-1">
                  <Leaf size={9} strokeWidth={2.5} className="text-[var(--leaf-deep)]" />
                  店买 {GRASS_SHOP_PRICE} 券/份
                </div>
                <div>自种 {GRASS_COIN_PER_UNIT} 金币/份</div>
              </div>
            </div>
            {/* 当前口径（混合模式在这行多一个比例滑杆） */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono text-[var(--ink-mute)]">
              <span>{grassLabel}</span>
              {grassMode === 'mix' && (
                <span className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="whitespace-nowrap">自种 {growShare}%</span>
                  <input type="range" min={0} max={100} step={5} value={growShare}
                    onChange={e => setGrowShare(Number(e.target.value))}
                    className="flex-1 min-w-[80px] accent-[var(--leaf-deep)]" />
                  <span className="whitespace-nowrap">买 {fmt(GRASS_SHOP_PRICE * (1 - growShare / 100), 1)} 券 / 种 {fmt(GRASS_COIN_PER_UNIT * growShare / 100, 2)} 金币</span>
                </span>
              )}
            </div>
          </div>
        </div>

{/* 罐头 —— 两行紧凑数字输入：时长可填小数，不再按整点排按钮 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="section-eyebrow">罐头加速</div>
            <button type="button" onClick={() => setCanOn(v => !v)} aria-pressed={canOn}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition"
              style={{
                background: canOn ? 'var(--berry)' : 'var(--bg-2)',
                color: canOn ? '#fff' : 'var(--ink-soft)',
                border: `1.5px solid ${canOn ? 'var(--berry)' : 'var(--line)'}`,
                boxShadow: canOn ? '0 2px 0 var(--berry-deep)' : 'none',
              }}>
              <span className="text-[11px] leading-none">🥫</span>
              <span>启用罐头</span>
            </button>
            <div className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[var(--ink-mute)] whitespace-nowrap">
              {canOn && winnerCoupon && (
                <>
                  <span>周期</span>
                  <span className="tnum">{fmtSec(winnerCoupon.baseCycleSec)}</span>
                  <span>→</span>
                  <span className="tnum font-bold text-[var(--ink)]">{fmtSec(winnerCoupon.cycleSec)}</span>
                  {winnerCoupon.baseCycleSec > winnerCoupon.cycleSec && (
                    <span className="chip chip-berry !text-[9px] !px-1.5 !py-0">
                      -{fmt(100 - (winnerCoupon.cycleSec / winnerCoupon.baseCycleSec) * 100, 0)}%
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <MiniNum label="普通" unit="小时/只" value={normalCanH} max={24} step={0.5} w={46}
              onChange={v => { setNormalCanH(v); if (!canOn) setCanOn(true); }} />
            <MiniNum label="有机" unit="小时/个" value={organicCanH} max={24} step={0.5} w={46}
              onChange={v => { setOrganicCanH(v); if (!canOn) setCanOn(true); }} />
            <MiniNum label="×" unit="个" value={organicCans} min={1} max={6} step={1} w={38}
              onChange={v => setOrganicCans(Math.max(1, Math.min(6, Number(v) || 1)))} />
          </div>

          {canOn && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-[var(--ink-mute)]">
              <span className="font-mono">罐头成本</span>
              <MiniNum label="普通" unit="券/个" value={normalPrice} min={0} step={1}
                onChange={setNormalPrice} />
              <MiniNum label="有机" unit="券/个" value={organicPrice} min={0} step={1}
                onChange={setOrganicPrice} />
              <span className="text-[9px]">0 券 = 免费/库存充足（理论上限）</span>
            </div>
          )}
        </div>
      </motion.section>

      {/* 建筑 */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5">
          {facilityTiles.map(t => {
            const next = t.rows.find(r => r.level === t.level + 1);
            const gated = next ? (next.reqLevel !== null && next.reqLevel > lv) : false;
            const hint = t.count === 0
              ? '主城 Lv2 起才有棚位'
              : t.level >= t.max
                ? `已达上限 · 牧场 Lv${lv}`
                : !next
                  ? '已满级'
                  : gated
                    ? `需牧场 Lv${next.reqLevel}`
                    : `升 Lv${next.level} ${fmt(next.cost.count)}券`;
            return (
              <div key={t.key} className="rounded-xl p-2 sm:p-3.5 flex flex-col"
                style={{ background: `var(--${t.color}-bg)`, border: `1.5px solid var(--${t.color})` }}>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[13px] sm:text-base leading-none">{t.emoji}</span>
                    <span className="text-[11px] sm:text-xs font-bold text-[var(--ink)] truncate">{t.name}</span>
                  </div>
                  <span className="chip flex-shrink-0 !text-[9px] !px-1.5 !py-0"
                    style={{ background: 'rgba(255,255,255,.7)', color: 'var(--ink)' }}>Lv{t.level}</span>
                </div>
                <div className="font-mono tnum text-lg sm:text-2xl font-bold text-[var(--ink)] leading-none mt-1.5">
                  {t.key === 'grass' ? fmt(t.node.capacity || 0) : (t.node.capacity ?? t.count)}
                  <span className="text-[9px] sm:text-[10px] font-bold text-[var(--ink-soft)] ml-1">{t.key === 'grass' ? '份仓量' : '栏/座'}</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[var(--ink-soft)] mt-1 leading-tight truncate">{t.note}</div>
                <div className="text-[9px] sm:text-[10px] text-[var(--leaf-deep)] font-bold mt-0.5 leading-tight truncate">{t.bonusText}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  <button className="btn btn-sm btn-ghost flex-1 !py-0.5 !text-[10px] !min-h-0"
                    onClick={() => t.set(Math.max(1, t.level - 1))} disabled={t.level <= 1}>降</button>
                  <button className="btn btn-sm btn-ghost flex-1 !py-0.5 !text-[10px] !min-h-0"
                    onClick={() => t.set(Math.min(t.max, t.level + 1))} disabled={t.level >= t.max}>升</button>
                </div>
                <div className="text-[8.5px] sm:text-[9px] text-[var(--ink-mute)] mt-1 leading-tight truncate">{hint}</div>
              </div>
            );
          })}
          <div className="rounded-xl p-2 sm:p-3.5 flex flex-col" style={{ background: 'var(--bg-2)', border: '1.5px solid var(--line)' }}>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <FlaskConical size={13} strokeWidth={2.5} className="text-[var(--plum-deep)] flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-[var(--ink)] truncate">实验室</span>
              </div>
              <span className="chip flex-shrink-0 !text-[9px] !px-1.5 !py-0"
                style={{ background: 'var(--plum-bg)', color: 'var(--plum-deep)' }}>1 座</span>
            </div>
            <div className="font-mono tnum text-lg sm:text-2xl font-bold text-[var(--ink)] leading-none mt-1.5">
              {labNode.slots}
              <span className="text-[9px] sm:text-[10px] font-bold text-[var(--ink-soft)] ml-1">研究位</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-[var(--ink-soft)] mt-1 leading-tight truncate">
              研究缩短 {labNode.reduceBp / 100}%（满级 20%）
            </div>
            <div className="text-[9px] sm:text-[10px] text-[var(--plum-deep)] font-bold mt-0.5 leading-tight truncate">
              只影响研究，不影响动物产出
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-[var(--ink-mute)] mt-1 leading-tight truncate">
              恒有 1 座 · 不计入收益
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 text-[10px] text-[var(--ink-mute)] font-mono">
          配额：窝 {coopCount} · 棚 {shedCount} · 草机 {quota.grass || 0} · 实验室 {quota.lab || 0}（主城 Lv{cityLv}）· {bonusCap}
        </div>
      </motion.section>

      {/* 满栏总账 */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="sticker-lg p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Home size={14} strokeWidth={2.5} className="text-[var(--leaf-deep)]" />
            <span className="font-display italic text-sm font-bold text-[var(--ink)]">我的牧场满栏总账</span>
          </div>
          <PillTabGroup items={[{ id: 'money', label: '赚钱配置', emoji: '🎟️' }, { id: 'exp', label: '冲级配置', emoji: '⚡' }]}
            value={plan} onChange={id => setPlan(id as 'money' | 'exp')} accent={plan === 'money' ? 'sun' : 'leaf'} size="sm" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {plan === 'money' ? (
            <>
              <StatTile label="金券 / 小时" value={`${fmt(moneyCouponPerHour)}`} hint={`${slots} 栏全养最优`} color="sun" />
              <StatTile label="金券 / 天" value={`${fmt(moneyCouponPerHour * 24)}`} hint="满栏 24 小时" color="orange" />
              <StatTile label="金币成本 / 天" value={`${fmt(coinPerHourTotal * 24)}`} hint="自种牧草那部分" color="leaf" />
              <StatTile label="建筑回本" value={buildPayback ? `${fmt(buildPayback, 1)} 小时` : '—'} hint={`总投入 ${fmt(buildCost)} 券`} color="ink" muted={!buildPayback} />
            </>
          ) : (
            <>
              <StatTile label="经验 / 小时" value={`${fmt(expPerHourTotal)}`} hint={`${slots} 栏全养最优`} color="leaf" />
              <StatTile label="经验 / 天" value={`${fmt(expPerHourTotal * 24)}`} hint="满栏 24 小时" color="sky" />
              <StatTile label="升下一级" value={needExp !== null ? `${fmt(needExp)}` : '满级'} hint={needExp !== null ? `牧场 Lv${lv} → Lv${lv + 1}` : '已达当前上限'} color="plum" />
              <StatTile label="升级耗时" value={hoursToNext ? fmtSec(hoursToNext * 3600) : '—'} hint="按经验配置满栏跑" color="berry" muted={!hoursToNext} />
            </>
          )}
        </div>
      </motion.section>

      {/* 当前口径之王（赚钱→金券王 / 冲级→经验王） */}
      <div className="grid grid-cols-1 -mt-3">
        {[plan === 'money'
          ? { m: winnerCoupon, kind: 'coupon' as const }
          : { m: winnerExp, kind: 'exp' as const }].map(({ m, kind }) => {
          if (!m) return null;
          const active = (plan === 'money' ? 'coupon' : 'exp') === kind;
          const otherBest = kind === 'exp'
            ? (m.a.type === '窝' ? bestExpShed : bestExpCoop)
            : (m.a.type === '窝' ? bestCouponShed : bestCouponCoop);
          const otherSlots = otherBest ? (otherBest.a.type === '窝' ? coopSlots : shedSlots) : 0;
          return (
            <motion.section key={kind} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-5"
              style={{
                background: kind === 'exp'
                  ? 'linear-gradient(135deg, var(--leaf) 0%, var(--leaf-deep) 100%)'
                  : 'linear-gradient(135deg, var(--sun-deep) 0%, var(--orange-deep) 100%)',
                boxShadow: kind === 'exp' ? '0 8px 32px -8px rgba(45,157,61,.45)' : '0 8px 32px -8px rgba(255,138,61,.45)',
              }}>
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                    <Trophy size={12} strokeWidth={2.5} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/85 truncate">
                    {kind === 'exp' ? '经验王' : '金券王'} · {m.a.type} · 牧场 Lv{m.a.unlockLevel}
                  </span>
                  {active && (
                    <span className="ml-auto flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
                      style={{ background: 'rgba(255,255,255,.92)', color: kind === 'exp' ? 'var(--leaf-deep)' : 'var(--orange-deep)' }}>
                      {m.a.type}内最优
                    </span>
                  )}
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-2xl bg-white/95 flex items-center justify-center shadow-lg flex-shrink-0"
                      style={{ width: 76, height: 76 }}>
                      {m.a.image
                        ? <RemoteImage urls={[publicUrl(m.a.image)]} name={m.a.name} size={64} eager />
                        : <span className="text-2xl">🐾</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display italic text-xl sm:text-2xl font-bold text-white truncate leading-tight">{m.a.name}</h2>
                      <div className="font-mono tnum text-2xl sm:text-3xl font-black text-white mt-0.5">
                        {kind === 'exp' ? fmt(m.expPerHour, 1) : fmt(m.netPerHour)}
                        <span className="text-xs font-bold text-white/70 ml-1">{kind === 'exp' ? '经验/小时' : '净金券/小时'}</span>
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-white/85 mt-0.5 truncate">
                        另 {kind === 'exp' ? `${fmt(m.netPerHour)} 券/时` : `${fmt(m.expPerHour, 1)} 经验/时`}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 lg:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/20 lg:pl-6 lg:min-w-[380px] lg:flex-shrink-0">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-white/70 mb-0.5">周期</div>
                      <div className="font-mono text-[11px] sm:text-sm font-bold text-white flex items-center gap-1">
                        <Clock size={10} strokeWidth={2.5} className="opacity-70" />{fmtSec(m.cycleSec)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-white/70 mb-0.5">每轮产出</div>
                      <div className="font-mono tnum text-[11px] sm:text-sm font-bold text-white">{fmt(m.revenue)} 券</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-white/70 mb-0.5">牧草</div>
                      <div className="font-mono tnum text-[11px] sm:text-sm font-bold text-white">{fmt(m.grassPerCycle)} 份/轮</div>
                    </div>
                  </div>
                </div>
                {otherBest && otherSlots > 0 && (
                  <div className="mt-2 text-[9px] font-mono text-white/60 truncate">
                    搭配 {otherBest.a.type}内最优 · {otherBest.a.name} · {fmt(kind === 'exp' ? otherBest.expPerHour : otherBest.netPerHour, kind === 'exp' ? 1 : 0)} {kind === 'exp' ? '经验' : '券'}/时
                  </div>
                )}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* 排行榜 */}
      {ranked.length > 0 ? (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
          className="sticker-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 flex-wrap gap-2"
            style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">🏆</span>
              <span className="font-display italic text-base font-bold text-[var(--ink)]">排行榜</span>
              <PillTabGroup
                items={[{ id: 'coupon', label: '金券榜', emoji: '🎟️' }, { id: 'exp', label: '经验榜', emoji: '⚡' }]}
                value={target} onChange={id => setTarget(id as 'coupon' | 'exp')}
                accent={target === 'coupon' ? 'sun' : 'leaf'} size="sm" />
              <span className="chip chip-ink">Lv{lv} 可养 {ranked.length} 种</span>
              <span className="chip" style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>只显示前 10</span>
              <span className="chip" style={{ background: 'var(--leaf-bg)', color: 'var(--leaf-deep)' }}>{grassLabel}</span>
              {canParts.length > 0 && <span className="chip" style={{ background: 'var(--berry-bg)', color: 'var(--berry-deep)' }}>{canLabel}</span>}
            </div>
            <span className="text-[10px] font-mono text-[var(--ink-mute)]">
              按{target === 'exp' ? '经验/时' : '净金券/时'}降序 · 净收益 = 产物 − 牧草(券) − 幼崽 − 罐头
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th className="text-center w-12">#</th>
                  <th>动物</th>
                  <th className="text-center whitespace-nowrap hidden sm:table-cell">门槛</th>
                  <th className="text-center">周期</th>
                  <th className="text-right whitespace-nowrap" style={target === 'exp' ? { color: 'var(--leaf-deep)' } : undefined}>
                    经验/时{target === 'exp' ? ' ▲' : ''}
                  </th>
                  <th className="text-right whitespace-nowrap" style={target === 'coupon' ? { color: 'var(--sun-deep)' } : undefined}>
                    净金券/时{target === 'coupon' ? ' ▲' : ''}
                  </th>
                  <th className="text-right hidden sm:table-cell">牧草/时</th>
                  <th className="text-right hidden md:table-cell">幼崽回本</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 10).map((row, i) => {
                  const rank = RANKS[i];
                  return (
                    <tr key={row.a.id} className="group">
                      <td className="text-center">
                        {rank ? (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mx-auto" style={{ background: rank.bg }}>
                            <span>{rank.medal}</span>
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs text-[var(--ink-mute)] mx-auto"
                            style={{ background: 'var(--bg-2)' }}>{i + 1}</div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {row.a.image
                            ? <RemoteImage urls={[publicUrl(row.a.image)]} name={row.a.name} size={42} rounded />
                            : <div className="w-10 h-10 rounded bg-[var(--bg-2)] flex items-center justify-center">🐾</div>}
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[var(--ink)] leading-tight truncate">
                              {row.a.name}
                              {row.a.type === '棚' && row.expBp > 0 && (
                                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: 'var(--orange-bg)', color: 'var(--orange-deep)' }}>棚经验+{row.expBp / 100}%</span>
                              )}
                              {row.a.type === '窝' && row.priceBp > 0 && (
                                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: 'var(--leaf-bg)', color: 'var(--leaf-deep)' }}>窝售价+{row.priceBp / 100}%</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--ink-mute)] leading-tight hidden sm:block">
                              {row.a.type} · {row.a.maxCount} 轮 · {row.a.main.name} {fmt(row.a.main.price)} + {row.a.by.name} {fmt(row.a.by.price)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center hidden sm:table-cell">
                        <span className="font-mono tnum text-xs font-bold text-[var(--ink-soft)]">Lv{row.a.unlockLevel}</span>
                      </td>
                      <td className="text-center text-[10px] font-mono text-[var(--ink-mute)] whitespace-nowrap">{fmtSec(row.cycleSec)}</td>
                      <td className="text-right">
                        <span className="font-mono tnum text-sm font-bold" style={{ color: 'var(--leaf-deep)' }}>{fmt(row.expPerHour, 1)}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-mono tnum text-sm font-bold" style={{ color: row.netPerHour >= 0 ? 'var(--orange-deep)' : 'var(--berry-deep)' }}>
                          {fmt(row.netPerHour)}
                        </span>
                      </td>
                      <td className="text-right hidden sm:table-cell">
                        <span className="font-mono tnum text-xs text-[var(--ink-soft)]">{fmt(row.grassPerHour, 2)}/时</span>
                      </td>
                      <td className="text-right hidden md:table-cell">
                        <span className="font-mono tnum text-xs text-[var(--ink-soft)]">{row.paybackH ? `${fmt(row.paybackH, 1)}h` : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>
      ) : (
        <EmptyState emoji="🐄" title="当前等级还没有可养动物" hint="调高牧场等级，或在图鉴里确认动物解锁条件" />
      )}

      {/* 公式 */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sticker-lg p-4 sm:p-5">
        <button onClick={() => setShowFormula(v => !v)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Zap size={14} strokeWidth={2.5} className="text-[var(--sun-deep)]" />
            <span className="font-display italic text-sm font-bold text-[var(--ink)]">口径与假设（点开看全）</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--ink-mute)]">{showFormula ? '收起 ▲' : '展开 ▼'}</span>
        </button>
        {showFormula && (
          <div className="mt-3 text-[11px] text-[var(--ink-soft)] leading-relaxed space-y-2">
            <p><b>周期</b> = 幼崽期 + 成长期 + 产出轮数 × 每轮时长；牧草按「一份草喂 X 秒」连续扣，周期内的份数是小数（可跨轮结转），所以短周期动物不会被整份草吃掉收益。</p>
            <p><b>收益</b> = 轮数 ×（主产物价 × 个数 + 副产物价 × 个数）×（1 + 建筑售价加成）；窝 Lv5/6/7/8 售价 +10/20/30/40%，棚 Lv5/6/7/8 经验 +10/20/30/40%。</p>
            <p><b>经验</b> = 轮数 × 产出经验 + 收获经验（同一个建筑加成），所以「经验王」多半出在棚。</p>
            <p><b>牧草</b>：饲料店 {GRASS_SHOP_PRICE} 金券/份；自种一包 {GRASS_SEED_PRICE} 金币（{fmtSec(DATA.grass.crop.growSec)} 收 {GRASS_PER_PACK} 份），折 {GRASS_COIN_PER_UNIT} 金币/份，金券口径记 0。混合模式按自种比例拆两本账。每只动物每小时吃 3600 ÷（每份可喂秒数）份草。</p>
            <p><b>罐头</b>：普通罐头每只每轮 1 个，直接削掉最长阶段对应小时数；有机罐头按「每轮用量」逐个削最长阶段（单阶段保底 30 秒操作时间，整轮周期最多压到原始的一半，避免出现「罐头无限刷」的失真值）。两者都会缩短周期、减少牧草消耗，从而抬高每小时收益；单价填 0 表示按免费/库存充足算，显示的是理论上限。</p>
            <p><b>建筑</b>：主城等级决定窝/棚/草机的配额，窝/棚等级决定单座容量与加成；升级门槛是牧场等级（RANCH_LEVEL）。改上面的牧场等级，经验王/金券王与排行榜会即时按该级重算。</p>
            <p><b>未纳入</b>：巨大化动物（产物结算为松果，不是金券）、偷菜/放蚊子/帮忙清理的社交收益、牧场订单与图鉴收集奖励。</p>
            <p className="text-[10px] text-[var(--ink-mute)]">
              数据快照：{new Date((rawCalc as any).generatedAt).toLocaleString('zh-CN')} · 动物 {DATA.animals.length} 种 · 牧场等级曲线 1–{DATA.levels.length}
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
