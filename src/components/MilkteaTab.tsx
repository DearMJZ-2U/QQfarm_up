import React from 'react';
import { motion } from 'motion/react';
import { Info, TrendingUp, Users, Clock, Sparkles, AlertTriangle, ChevronDown } from 'lucide-react';
import milkteaData from '../data/milktea_atlas.json';
import { RemoteImage, StatTile, getGrade, publicUrl } from './shared';

// 奶茶店收益（S4「奶茶热销中」）—— 数据来自 milktea_atlas.json
// 数据源：delayRes 明文配置表 MilkTea*（配方/店铺等级/特长/雇佣时长/互动）
// 兑换商店价目（2026-10-16 游戏内实录）+ 黄金芽种子判定：exchangeShop / seedVerdict 字段
// 图标：extraRes 的 gui/texture/icon/icon_s4_milktea_N（public/item_images/milktea_N.png）
// ⚠ 玩法公式（销量 = 热卖值）在服务端执行，此处展示的是「配置口径 + 活动实测交叉验证」的结果。
//
// 排版规范（与全站一致）：
//   标题      → font-display italic
//   小标签    → text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)]
//   正文      → text-xs
//   数字      → font-mono tnum
//   段落小注  → text-[11px]

interface Recipe {
  id: number;
  name: string;
  price: number;              // 奶茶券 / 杯
  fruitId: number;
  fruitName: string;
  fruitPerCup: number;
  fruitGold: number;          // 活动期外直接卖果实的金币价
  fruitRarity: number;
  fruitRarityColor: string;
  fruitRequiredLevel: number;
  seedId: number;
  seedName: string;
  seedGold: number;
  growTimeSec: number;
  fruitPerHarvest: number;
  coinFormula: number[];
  unlockLevel: number;
  drinkIcon: string;
  desc: string;
}
interface StoreLevel {
  level: number;
  revenueRequired: number;
  basePopularity: number;      // 杯 / 小时
  advancedPricePercent: number; // /100 = %
  employeeSlots: number;
  recipeIds: number[];
}
interface Talent { id: number; name: string; type: number; desc: string }
interface HireDuration { id: number; sec: number; hours: number; cost: number; costPerHour: number; minRemainSec: number }
interface Interaction { id: number; name: string; desc: string; winWord: string; loseWord: string }

const DATA = milkteaData as any;
const RECIPES: Recipe[] = DATA.recipes;
const LEVELS: StoreLevel[] = DATA.storeLevels;
const TALENTS: Talent[] = DATA.talents;
const DURATIONS: HireDuration[] = DATA.hireDurations;
const INTERACTIONS: Interaction[] = DATA.interactions;
const TASTE_COUNT: Array<{ durationId: number; count: number }> = DATA.tasteDrinkCount;
const FORMULA: { sales: string; revenue: string; note: string } = DATA.formula;

// ── 兑换商店（价目为 2026-10-16 游戏内实录） ─────────────────
interface ExchangeItem { name: string; price: number; unlockLevel: number; limit: string }

const SHOP = (DATA.exchangeShop ?? null) as null | {
  exportedAt: string;
  note: string;
  costumeTotal: number;
  costumes: ExchangeItem[];
  projection: {
    anchor: string;
    scenarios: Array<{ label: string; total: number; note: string }>;
    levelTimeline: Array<{ level: number; day: number }>;
  };
};
const VERDICT = (DATA.seedVerdict ?? null) as null | {
  seedName: string;
  price: number;
  dailyLimit?: number;
  rows: Array<{ k: string; v: string }>;
  conclusion: string;
};

// ── 2026-10-16 新增：心愿保底 / 种子来源审计 / 账号推演 ──────────
const WISH = (DATA.wishGuarantee ?? null) as null | {
  source: string;
  crop: string;
  rule: string[];
  needPlantings: number;
  targets: Array<{ name: string; itemId: number; illustratedValue: number; guarantee: number; note: string }>;
  why: string;
  naturalRate: Array<{ name: string; prob: string; expect: string; within30: string; within60: string }>;
  naturalNote: string;
};

const SEED_SRC = (DATA.seedSources ?? null) as null | {
  auditedAt: string;
  method: string;
  freeTotal: number;
  needTotal: number;
  rows: Array<{
    source: string; where: string; content: string; cost: string; limit: string;
    seeds: number; paid: boolean; zeroCost: boolean;
  }>;
  findings: string[];
  note: string;
};

const PROJ = (DATA.accountProjection ?? null) as null | {
  measuredAt: string;
  taskIncludedAt?: string;
  ratePoints: Array<{ account: string; time: string; revenue: number; rate: string }>;
  rateNote: string;
  model: string;
  costNote: string;
  rows: Array<{
    account: string; scenario: string; revenue: number; taskCoupons?: number;
    balance?: number; afterCost: number; finalLeft?: number;
    seedsBuyable: number; plantings: number; result: string; ok: boolean; highlight?: boolean;
  }>;
  thresholds: Array<{ label: string; rate: number; note: string }>;
  conclusion: string;
};

/** 装扮按解锁等级聚合为档位（无锁 → Lv4 → …），带小计与累计 */
const SHOP_TIERS = (() => {
  if (!SHOP) return [] as Array<{ unlockLevel: number; label: string; items: ExchangeItem[]; subtotal: number; cumulative: number }>;
  const groups = new Map<number, ExchangeItem[]>();
  for (const c of SHOP.costumes) {
    const lv = c.unlockLevel || 0;
    if (!groups.has(lv)) groups.set(lv, []);
    groups.get(lv)!.push(c);
  }
  let acc = 0;
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([lv, items]) => {
    const subtotal = items.reduce((s, x) => s + x.price, 0);
    acc += subtotal;
    return { unlockLevel: lv, label: lv === 0 ? '无锁（Lv1 起）' : `店铺 Lv${lv}`, items, subtotal, cumulative: acc };
  });
})();

/** 收入情景 + 全套装目标线（合并后按金额降序） */
type ShopProj = { label: string; total: number; note?: string; color: string; isTarget?: boolean };
const SHOP_PROJ: ShopProj[] = (() => {
  if (!SHOP) return [];
  const palette = ['var(--leaf)', 'var(--sun)', 'var(--sky)', 'var(--ink-mute)'];
  const items: ShopProj[] = SHOP.projection.scenarios.map((s, i) => ({
    label: s.label, total: s.total, note: s.note, color: palette[i] ?? 'var(--ink-mute)',
  }));
  items.push({ label: '全套装目标', total: SHOP.costumeTotal, color: 'var(--orange)', isTarget: true });
  return items.sort((a, b) => b.total - a.total);
})();
const SHOP_PROJ_MAX = Math.max(...SHOP_PROJ.map((x) => x.total), 1);

/** 总预算 = 13 件装扮 + 24 颗补购种子（8,000/颗） */
const TOTAL_BUDGET = (SHOP?.costumeTotal ?? 0) + 24 * (VERDICT?.price ?? 8000);
/** 每日任务：3 个任务全做完 = 3,000 券/天（2026-10-18 复核确认） */
const DAILY = DATA.dailyTask;
const DAILY_COUPONS = DAILY?.dailyCoupons ?? 3000;
const DAILY_TOTAL = DAILY?.totalCoupons ?? 84000;

/** 小号（不氪金）现状：累计营业额 / 可用余额（营业额 + 每日任务券）/ 全拿所需 / 全拿后剩余 */
const SMALL_ROW = PROJ?.rows.find((r) => r.account.includes('小号') && r.scenario.includes('现状'));
const SMALL_NOW = SMALL_ROW?.revenue ?? 0;
const SMALL_BALANCE = SMALL_ROW?.balance ?? SMALL_NOW + DAILY_TOTAL;
/** 全拿所需 = 13 件装扮 + 24 颗补购种子（v4：0 员工也能全拿，所以不含工资） */
const SMALL_NEED = TOTAL_BUDGET;
const SMALL_LEFT = SMALL_ROW?.finalLeft ?? SMALL_BALANCE - SMALL_NEED;
/** 1000000 → "100"；631000 → "63.1" */
function fmtWan(n: number): string {
  return n % 10000 === 0 ? String(n / 10000) : (n / 10000).toFixed(1);
}

const MAX_LEVEL = LEVELS[LEVELS.length - 1]?.level ?? 13;
const PLOT_COUNT = 24;

/** 互动文案里的 {0} 占位：宣传推广固定 40 杯；招牌试饮随雇佣时长 4/12/24 杯 */
function fillInteractionDesc(it: Interaction, durationId: number): string {
  if (it.id === 1) return it.desc.replace('{0}', '40');
  if (it.id === 3) {
    const n = TASTE_COUNT.find((t) => t.durationId === durationId)?.count ?? 0;
    return it.desc.replace('{0}', String(n));
  }
  return it.desc;
}

// 特长 → 热卖值加成（只有「热卖值」类特长直接作用于销量）
const TALENT_POP_BONUS: Record<string, number> = { '金牌宣传': 0.10, '默默搬砖': 0.05 };

// ── 排版原子 ────────────────────────────────────────────────

const LABEL_CLS = 'text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)]';
const MINI_BTN = 'px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors';

// ── 卡片折叠 ────────────────────────────────────────────────
// 每张卡片默认收起（整页 11 张全展开太长、太乱），点标题或右侧箭头展开。
// 「全部展开 / 全部收起」由页面下发一个信号（对象身份变化即触发），卡片各自持有开合状态，
// 这样单张手动点开/收起不会被其它卡片的动作带偏。
// 折叠用 grid-template-rows 0fr↔1fr 做动画，内容始终挂在 DOM 里 ——
// 计算器里填过的数字不会因为收起再展开而丢失。
type BulkSignal = { v: boolean; n: number };
const BulkCtx = React.createContext<BulkSignal | null>(null);

function SectionCard({ icon, title, sub, accent = 'orange', action, children, collapsible = true }: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  accent?: 'orange' | 'leaf' | 'sky' | 'sun' | 'plum' | 'berry';
  action?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const bulk = React.useContext(BulkCtx);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (bulk) setOpen(bulk.v); }, [bulk]);
  const expanded = collapsible ? open : true;
  const toggle = () => { if (collapsible) setOpen((v) => !v); };

  return (
    <section className="sticker p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={toggle} aria-expanded={expanded}
          className={`flex items-center gap-2.5 min-w-0 flex-1 text-left ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[15px]"
            style={{ background: `var(--${accent})`, color: 'white', boxShadow: `0 2px 0 var(--${accent}-deep)` }}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-display italic text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">{title}</span>
            {sub && <span className="block text-[11px] text-[var(--ink-mute)] truncate">{sub}</span>}
          </div>
        </button>
        {action}
        {collapsible && (
          <button type="button" onClick={toggle} aria-label={expanded ? `收起「${title}」` : `展开「${title}」`}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-mute)' }}>
            <ChevronDown size={14} strokeWidth={2.5}
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s ease' }} />
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease' }}>
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function DrinkIcon({ recipe, size = 48 }: { recipe: Recipe; size?: number }) {
  return (
    <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--surface-soft)', width: size, height: size }}>
      <RemoteImage urls={[publicUrl(`item_images/${recipe.drinkIcon}`)]} name={recipe.name}
        size={Math.round(size * 0.86)} className="drop-shadow-sm" />
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
      <table className="w-full border-collapse" style={{ border: '1.5px solid var(--line)', borderRadius: 12 }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] whitespace-nowrap ${className}`}
      style={{ background: 'var(--bg-2)' }}>
      {children}
    </th>
  );
}

function Td({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <td className={`px-3 py-2 text-xs text-[var(--ink-soft)] whitespace-nowrap ${className}`} style={style}>{children}</td>
  );
}

/** 卡片里的「小标签 + 等宽数字」原子（宽表在窄屏会被挤变形，改用卡片） */
function Metric({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-[var(--ink-mute)] leading-tight">{label}</div>
      <div className="font-mono tnum text-xs font-bold truncate" style={{ color: color || 'var(--ink)' }}>{value}</div>
    </div>
  );
}

/** 卡片右上角的语义徽标 */
function Badge({ tone, children }: { tone: 'leaf' | 'berry' | 'sun' | 'sky' | 'orange' | 'plum'; children: React.ReactNode }) {
  return (
    <span className="chip flex-shrink-0"
      style={{ fontSize: '0.6rem', background: `var(--${tone})`, color: 'white', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

type SeedRow = {
  source: string; where: string; content: string; cost: string; limit: string;
  seeds: number; paid: boolean; zeroCost: boolean;
};

/** 种子来源卡（窄屏友好，替代宽表格） */
function SeedSourceCard({ row }: { row: SeedRow; key?: React.Key }) {
  const tone = row.paid ? 'berry' : row.zeroCost ? 'leaf' : 'sun';
  return (
    <div className="rounded-2xl p-3"
      style={{ background: `var(--${tone}-bg)`, border: `1.5px solid var(--${tone}-soft)` }}>
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-[var(--ink)]">{row.source}</span>
            <Badge tone={tone}>{row.paid ? '需充值' : row.zeroCost ? '零成本' : '花券'}</Badge>
          </div>
          <div className="text-[10px] text-[var(--ink-mute)] mt-0.5">{row.where}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono tnum text-2xl font-black leading-none"
            style={{ color: `var(--${tone}-deep)` }}>{row.seeds}</div>
          <div className="text-[10px] font-bold text-[var(--ink-mute)] mt-0.5">颗种子</div>
        </div>
      </div>
      <div className="text-[11px] text-[var(--ink-soft)] leading-relaxed mt-2">{row.content}</div>
      <div className="text-[10px] text-[var(--ink-mute)] mt-1.5">
        代价 <b className="font-mono tnum text-[var(--ink-soft)]">{row.cost}</b>
        <span className="mx-1.5 opacity-50">·</span>
        限购 <b className="text-[var(--ink-soft)]">{row.limit}</b>
      </div>
    </div>
  );
}

/** 需求进度条：白送 vs 自购 */
function SeedNeedBar({ free, need }: { free: number; need: number }) {
  const gap = Math.max(need - free, 0);
  const freePct = (free / need) * 100;
  return (
    <div className="mt-2.5">
      <div className="flex h-7 rounded-lg overflow-hidden" style={{ border: '1.5px solid var(--line)' }}>
        <div className="flex items-center justify-center text-[10px] font-bold whitespace-nowrap"
          style={{ width: `${freePct}%`, background: 'var(--leaf)', color: 'white' }}>白送 {free}</div>
        {gap > 0 && (
          <div className="flex items-center justify-center text-[10px] font-bold whitespace-nowrap"
            style={{ width: `${100 - freePct}%`, background: 'var(--orange)', color: 'white' }}>自购 {gap}</div>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--ink-mute)] mt-1">
        <span>0</span>
        <span>心愿保底线 {need} 颗</span>
      </div>
    </div>
  );
}

// ── 奶茶收益计算器 ──────────────────────────────────────────
//
// 供给口径 = 你背包里**实际有的果实**（按种类逐项填数量），不再用「24 块地」这种估法。
//
// 模型：
//   ① 1 果实 → 1 杯（带售价倍率的果实按倍率翻倍，这里按 1:1 保守计）；
//   ② 只有**店铺等级已解锁**的配方能开工，没解锁的果实算不进去（会在下面单独提示）；
//   ③ 店铺自动售卖，速度恒为「热卖值」（杯/小时）；高级奶茶**高价优先**售出，
//      卖完后由不限量的普通奶茶（3 券/杯）兜底 —— 所以售卖顺序不影响总收益，只影响瞬时单价；
//   ④ 因此「库存期」的奶茶券/小时 = 热卖值 × 加权平均单价（= 总收益 ÷ 总杯数）。

/** 背包默认示例数量（按你实际情况改；点「清空」可归零） */
const DEMO_STOCK: Record<number, number> = { 2: 120, 3: 120, 4: 80, 5: 60, 6: 60, 7: 40, 8: 40, 9: 20 };

function formatHours(h: number): string {
  if (!isFinite(h) || h <= 0) return '—';
  if (h < 1) return `${Math.round(h * 60)} 分钟`;
  if (h < 48) return `${h.toFixed(1)} 小时`;
  return `${(h / 24).toFixed(1)} 天`;
}

function Calculator() {
  const [lv, setLv] = React.useState<number>(MAX_LEVEL);
  const [t1, setT1] = React.useState<string>('金牌宣传');
  const [t2, setT2] = React.useState<string>('金牌宣传');
  const [interactionId, setInteractionId] = React.useState<number>(3);
  const [stock, setStock] = React.useState<Record<number, number>>({ ...DEMO_STOCK });

  const level = LEVELS.find((l) => l.level === lv) || LEVELS[0];
  const interaction = INTERACTIONS.find((i) => i.id === interactionId);

  // 互动对「老板收益」的价格加成
  const interactionPriceBonus = interactionId === 2 ? 0.10 : interactionId === 3 ? 0.20 : 0;
  const popBonus = level.employeeSlots >= 2
    ? (TALENT_POP_BONUS[t1] || 0) + (TALENT_POP_BONUS[t2] || 0)
    : (TALENT_POP_BONUS[t1] || 0);
  const popularity = level.basePopularity * (1 + popBonus);
  const priceCoeff = 1 + level.advancedPricePercent / 10000 + interactionPriceBonus;

  // 逐种奶茶结算（普通奶茶不消耗果实，单独作保底）
  const rows = React.useMemo(() => RECIPES.filter((r) => r.id > 1).map((r) => {
    const unlocked = level.level >= r.unlockLevel;
    const fruit = Math.max(0, Math.floor(stock[r.id] || 0));
    const perCup = Math.max(1, r.fruitPerCup);
    const cups = unlocked ? Math.floor(fruit / perCup) : 0;
    const unitPrice = r.price * priceCoeff;
    return { recipe: r, fruit, unlocked, cups, unitPrice, subtotal: cups * unitPrice };
  }), [level.level, stock, priceCoeff]);

  const sellable = rows.filter((x) => x.cups > 0).sort((a, b) => b.unitPrice - a.unitPrice);
  const totalCups = rows.reduce((s, x) => s + x.cups, 0);
  const totalCoin = rows.reduce((s, x) => s + x.subtotal, 0);
  const avgPrice = totalCups > 0 ? totalCoin / totalCups : 0;
  const perHour = popularity * avgPrice;
  const hours = popularity > 0 ? totalCups / popularity : 0;
  const baselinePerHour = popularity * RECIPES[0].price;   // 普通奶茶 3 券/杯 保底
  const lockedWithStock = rows.filter((x) => !x.unlocked && x.fruit > 0);
  const maxSubtotal = Math.max(...sellable.map((x) => x.subtotal), 1);

  const setCount = (id: number, v: number) =>
    setStock((s) => ({ ...s, [id]: Math.max(0, Math.floor(Number.isFinite(v) ? v : 0)) }));

  const btnCls = 'px-2 py-1 rounded-full text-[10px] font-bold transition-colors';

  // 参数下拉：.input-pop 是为「数字输入框」设计的（1.1rem + 等宽字体），拿它装中文选项会撑爆，
  // 这里局部覆盖成小号正文体 —— 只作用于本页的 select，不动全局样式。
  const selStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    padding: '0.55rem 0.55rem',
  };

  return (
    <div className="space-y-3">
      {/* 店铺 / 员工参数 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <label className="block">
          <div className={`${LABEL_CLS} mb-1.5`}>店铺等级</div>
          <select className="input-pop" style={selStyle} value={lv} onChange={(e) => setLv(Number(e.target.value))}>
            {LEVELS.map((l) => (
              <option key={l.level} value={l.level}>Lv{l.level} · 热卖 {l.basePopularity}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className={`${LABEL_CLS} mb-1.5`}>员工互动</div>
          <select className="input-pop" style={selStyle} value={interactionId} onChange={(e) => setInteractionId(Number(e.target.value))}>
            <option value={0}>无</option>
            {INTERACTIONS.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className={`${LABEL_CLS} mb-1.5`}>员工 1 特长{level.employeeSlots < 2 && '（仅 1 个员工位）'}</div>
          <select className="input-pop" style={selStyle} value={t1} onChange={(e) => setT1(e.target.value)}>
            <option value="无">无</option>
            {TALENTS.map((t) => <option key={t.id} value={t.name} title={t.desc}>{t.name}</option>)}
          </select>
        </label>
        <label className="block">
          <div className={`${LABEL_CLS} mb-1.5`}>员工 2 特长</div>
          <select className="input-pop" style={level.employeeSlots < 2 ? { ...selStyle, opacity: 0.5 } : selStyle}
            value={t2} disabled={level.employeeSlots < 2}
            onChange={(e) => setT2(e.target.value)}>
            <option value="无">无</option>
            {TALENTS.map((t) => <option key={t.id} value={t.name} title={t.desc}>{t.name}</option>)}
          </select>
        </label>
      </div>

      {/* 背包果实 */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className={LABEL_CLS}>背包果实 · 按种类填数量</div>
          <div className="flex items-center gap-1.5">
            <button type="button" className={btnCls}
              style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}
              onClick={() => setStock({ ...DEMO_STOCK })}>示例</button>
            <button type="button" className={btnCls}
              style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}
              onClick={() => setStock({})}>清空</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {rows.map((x) => (
            <div key={x.recipe.id} className="rounded-xl p-2.5"
              style={{
                background: x.unlocked ? 'var(--bg-2)' : 'var(--surface-soft)',
                border: `1.5px solid ${x.unlocked && x.cups > 0 ? 'var(--orange)' : 'var(--line)'}`,
                opacity: x.unlocked ? 1 : 0.55,
              }}>
              <div className="flex items-center gap-2">
                <DrinkIcon recipe={x.recipe} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[var(--ink)] truncate">{x.recipe.name}</div>
                  <div className="text-[10px] text-[var(--ink-mute)] truncate">
                    {x.unlocked ? `${x.recipe.fruitName} · ${x.recipe.price} 券/杯` : `Lv${x.recipe.unlockLevel} 解锁`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" min={0} disabled={!x.unlocked}
                  className="input-pop text-center flex-1 tnum"
                  style={{ padding: '0.35rem 0.4rem', fontSize: '0.85rem' }}
                  value={x.unlocked ? (stock[x.recipe.id] ?? 0) : ''}
                  placeholder={x.unlocked ? '0' : '未解锁'}
                  onChange={(e) => setCount(x.recipe.id, Number(e.target.value))}
                  aria-label={`${x.recipe.fruitName}数量`} />
                <span className="text-[10px] font-bold whitespace-nowrap"
                  style={{ color: x.cups > 0 ? 'var(--orange-deep)' : 'var(--ink-mute)' }}>
                  → {x.cups} 杯
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 结果 */}
      <motion.div key={`${lv}-${t1}-${t2}-${interactionId}-${totalCups}-${totalCoin}`}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-3.5 sm:p-4"
        style={{ background: 'linear-gradient(135deg, var(--orange-bg) 0%, var(--sun-bg) 100%)', border: '1.5px solid var(--orange-soft)' }}>

        <div className="flex items-center gap-3">
          <DrinkIcon recipe={(sellable[0]?.recipe) || RECIPES[0]} size={56} />
          <div className="min-w-0 flex-1">
            <div className={LABEL_CLS} style={{ color: 'var(--orange-deep)' }}>
              预估收益 · 库存期平均{sellable[0] && totalCups > 0 ? ` · 高价优先卖 ${sellable[0].recipe.name}` : ''}
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tnum text-3xl sm:text-4xl font-black text-[var(--orange-deep)] leading-none">
                {Math.round(perHour).toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[var(--ink-mute)]">奶茶券 / 小时</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <StatTile label="可做高级奶茶" value={`${totalCups} 杯`} color="sky" />
          <StatTile label="这批果子总收益" value={`${Math.round(totalCoin).toLocaleString()} 券`} color="orange" />
          <StatTile label="卖完耗时" value={formatHours(hours)} color="sun" />
          <StatTile label="卖完后保底" value={`${Math.round(baselinePerHour).toLocaleString()} 券/时`} color="leaf" />
        </div>

        {totalCups > 0 && (
          <div className="mt-3 space-y-2">
            {sellable.map((x) => (
              <div key={x.recipe.id} className="flex items-center gap-2.5">
                <DrinkIcon recipe={x.recipe} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[var(--ink)] truncate">{x.recipe.name}</span>
                    <span className="font-mono tnum text-xs font-bold flex-shrink-0" style={{ color: 'var(--ink-soft)' }}>
                      {x.cups} 杯 × {x.unitPrice.toFixed(1)} = {Math.round(x.subtotal).toLocaleString()} 券
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.max(3, (x.subtotal / maxSubtotal) * 100)}%`, background: 'var(--orange)', transition: 'width .3s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-3">
          热卖值 = <span className="font-mono tnum">{level.basePopularity}</span> × (1 +{' '}
          <span className="font-mono tnum">{(popBonus * 100).toFixed(0)}%</span>) ={' '}
          <b className="font-mono tnum">{popularity.toFixed(1)}</b> 杯/时；价格系数 = 1 +{' '}
          <span className="font-mono tnum">{(level.advancedPricePercent / 100).toFixed(0)}%</span> 定价 +{' '}
          <span className="font-mono tnum">{(interactionPriceBonus * 100).toFixed(0)}%</span> 互动。
          {totalCups > 0 ? (
            <>
              {' '}你这批果子共 <b className="font-mono tnum">{totalCups}</b> 杯，加权平均单价{' '}
              <b className="font-mono tnum">{avgPrice.toFixed(1)}</b> 券/杯，按 {popularity.toFixed(0)} 杯/时 的售速约{' '}
              <b>{formatHours(hours)}</b> 卖完。
            </>
          ) : (
            <> 把背包里每种果实的数量填进去，就能算出这批果子能赚多少、要卖多久。</>
          )}
          {interaction && <> 当前互动「{interaction.name}」。</>}
        </p>

        {lockedWithStock.length > 0 && (
          <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid var(--sky-soft)' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sky-deep)' }} />
            <div className="text-xs text-[var(--ink-soft)] leading-relaxed">
              背包里的 <b>{lockedWithStock.map((x) => x.recipe.fruitName).join('、')}</b> 因为店铺等级不够暂时做不了，
              已排除在外：{lockedWithStock.map((x) => `${x.recipe.name}需 Lv${x.recipe.unlockLevel}`).join('，')}。
            </div>
          </div>
        )}

        {totalCups === 0 && (
          <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid var(--berry-soft)' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--berry-deep)' }} />
            <div className="text-xs text-[var(--ink-soft)] leading-relaxed">
              还没有可做的高级奶茶 —— 此时店铺只能卖不限量的普通奶茶，收益恒为{' '}
              <b className="font-mono tnum">{Math.round(baselinePerHour).toLocaleString()}</b> 券/小时。
              想提收益就去种活动作物（推荐天工「森野黄金芽」做金露云酪，45 券/杯）。
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── 主页面 ──────────────────────────────────────────────────

export default function MilkteaTab() {
  const [rankMode, setRankMode] = React.useState<'plot' | 'cup'>('plot');

  const ranked = React.useMemo(() => {
    return RECIPES.map((r) => {
      const cupsPerHourPerPlot = r.growTimeSec > 0 ? r.fruitPerHarvest / (r.growTimeSec / 3600) : 0;
      return {
        ...r,
        coinPerHourAllPlots: cupsPerHourPerPlot * PLOT_COUNT * r.price,
      };
    }).sort((a, b) =>
      rankMode === 'plot' ? b.coinPerHourAllPlots - a.coinPerHourAllPlots : b.price - a.price);
  }, [rankMode]);

  const maxAll = Math.max(...ranked.map((r) => r.coinPerHourAllPlots), 1);

  // 全部展开 / 收起：靠对象身份变化把信号广播给每张卡片
  const [bulk, setBulk] = React.useState<BulkSignal | null>(null);
  const bulkAll = (v: boolean) => setBulk((s) => ({ v, n: (s?.n ?? 0) + 1 }));

  return (
    <BulkCtx.Provider value={bulk}>
    <div className="space-y-5 fade-in">
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--orange-bg)', color: 'var(--orange-deep)' }}>
          <Sparkles size={11} strokeWidth={2.5} /> 奶茶店收益
        </span>
        <h2 className="page-header-title">奶茶工坊，能赚多少、能不能全拿？</h2>
        <p className="page-header-subtitle">
          {RECIPES.length} 种奶茶 · 店铺 Lv1→{MAX_LEVEL} · 兑换商店 13 件装扮 + 变异心愿保底 ·
          已计入每日任务 {DAILY_COUPONS.toLocaleString()} 券/天 · 数据来自游戏配置表与活动实测
        </p>
      </header>

      {/* 折叠提示 + 一键开合 */}
      <div className="flex items-center justify-between gap-2 -mt-3">
        <span className="text-[11px] text-[var(--ink-mute)]">点卡片标题即可展开 / 收起</span>
        <div className="flex items-center gap-1.5">
          <button type="button" className={MINI_BTN}
            style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}
            onClick={() => bulkAll(true)}>全部展开</button>
          <button type="button" className={MINI_BTN}
            style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}
            onClick={() => bulkAll(false)}>全部收起</button>
        </div>
      </div>

      {/* 奶茶收益计算器 —— 置顶，进页即可调参 */}
      <SectionCard icon={<span>🧮</span>} title="奶茶收益计算器" sub="按背包里的果实数量算，看能赚多少 / 卖多久">
        <Calculator />
      </SectionCard>

      {/* 先看这里：一句话答案 + 活动目标总览 */}
      <SectionCard icon={<span>⭐</span>} title="先看这里：不氪金能不能全拿？" accent="sun"
        sub={`已计入每日任务 ${DAILY_COUPONS.toLocaleString()} 券/天 · ${DAILY?.verifiedAt ?? '2026-10-18'} 复核`}>
        {/* 一句话答案 */}
        <div className="rounded-2xl p-3.5 mb-3"
          style={{ background: 'linear-gradient(135deg, var(--leaf-bg), var(--sun-bg))', border: '1.5px solid var(--leaf-soft)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Info size={14} className="flex-shrink-0" style={{ color: 'var(--leaf-deep)' }} />
            <span className="font-display italic text-sm font-bold" style={{ color: 'var(--leaf-deep)' }}>一句话答案</span>
          </div>
          <p className="text-sm font-bold text-[var(--ink)] leading-relaxed">
            不氪金、不雇员工、也不用死磕热卖值 —— 只要每天把 3 个每日任务做完，
            <b style={{ color: 'var(--leaf-deep)' }}>13 件装扮 + 2 件变异装扮果实可以全拿</b>，
            最后还剩 <b className="font-mono tnum">{SMALL_LEFT.toLocaleString()}</b> 券。
          </p>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-2">
            注意：<b className="text-[var(--ink)]">这 {DAILY_TOTAL.toLocaleString()} 券只是「每日任务」这一项，不是全部收入。</b>
            真正的大头是店铺经营本身（约 {fmtWan(SMALL_NOW)} 万券）。下面把这笔账拆开给你看。
          </p>
        </div>

        {/* 收支账本：钱从哪来 → 花到哪去 */}
        <div className="rounded-2xl p-3.5 mb-3" style={{ background: 'var(--surface-soft)', border: '1.5px solid var(--line)' }}>
          <div className={LABEL_CLS}>到 11-14 营业期结束，钱从哪来</div>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--ink-soft)]">店铺经营累计（含当前余额，随升级越卖越快）</span>
              <span className="font-mono tnum font-bold text-[var(--ink)] flex-shrink-0">+{SMALL_NOW.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--ink-soft)]">每日任务（{DAILY_COUPONS.toLocaleString()} 券/天 × {DAILY?.totalDays ?? 28} 天）</span>
              <span className="font-mono tnum font-bold flex-shrink-0" style={{ color: 'var(--leaf-deep)' }}>+{DAILY_TOTAL.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs pt-1.5" style={{ borderTop: '1.5px dashed var(--line)' }}>
              <span className="font-bold text-[var(--ink)]">合计可用余额</span>
              <span className="font-mono tnum font-black flex-shrink-0" style={{ color: 'var(--ink)' }}>{(SMALL_NOW + DAILY_TOTAL).toLocaleString()}</span>
            </div>
          </div>

          <div className={`${LABEL_CLS} mt-3`}>钱花到哪去</div>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--ink-soft)]">{SHOP?.costumes?.length ?? 13} 件缤纷奶茶装扮（全都要）</span>
              <span className="font-mono tnum font-bold flex-shrink-0" style={{ color: 'var(--berry-deep)' }}>−{SHOP?.costumeTotal?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--ink-soft)]">补购 24 颗黄金芽种子（{VERDICT?.price?.toLocaleString() ?? '8,000'} 券/颗）</span>
              <span className="font-mono tnum font-bold flex-shrink-0" style={{ color: 'var(--berry-deep)' }}>−{(24 * (VERDICT?.price ?? 8000)).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs pt-1.5" style={{ borderTop: '1.5px dashed var(--line)' }}>
              <span className="font-bold text-[var(--ink)]">合计要花</span>
              <span className="font-mono tnum font-black flex-shrink-0" style={{ color: 'var(--ink)' }}>−{TOTAL_BUDGET.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5" style={{ borderTop: '1.5px solid var(--line)' }}>
            <span className="text-xs font-bold text-[var(--ink)]">最后还剩</span>
            <span className="font-mono tnum font-black text-base" style={{ color: 'var(--leaf-deep)' }}>{SMALL_LEFT.toLocaleString()} 券</span>
          </div>
        </div>

        {/* 四个关键数字 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatTile label="每日任务" value={DAILY_COUPONS.toLocaleString()} hint="券 / 天（白给）" color="leaf" />
          <StatTile label={`${DAILY?.totalDays ?? 28} 天任务合计`} value={DAILY_TOTAL.toLocaleString()} hint="券（只占一小部分）" color="sun" />
          <StatTile label="全拿总预算" value={TOTAL_BUDGET.toLocaleString()} hint="券（装扮 + 种子）" color="orange" />
          <StatTile label="全拿后还剩" value={SMALL_LEFT.toLocaleString()} hint="券（小号 · 0 员工）" color="berry" />
        </div>

        {/* 两个目标 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className="rounded-2xl p-3" style={{ background: 'var(--surface-soft)', border: '1.5px solid var(--line)' }}>
            <div className={LABEL_CLS}>目标 1 · 装扮</div>
            <div className="text-xs text-[var(--ink-soft)] leading-relaxed mt-1">
              <b className="font-mono tnum text-[var(--ink)]">13 件</b>缤纷奶茶装扮，
              合计 <b className="font-mono tnum text-[var(--ink)]">{SHOP?.costumeTotal.toLocaleString()}</b> 券。
              最贵的一件要 <b>店铺 Lv12</b> 才解锁 —— 所以得先把店升上去。
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'var(--surface-soft)', border: '1.5px solid var(--line)' }}>
            <div className={LABEL_CLS}>目标 2 · 变异装扮果实</div>
            <div className="text-xs text-[var(--ink-soft)] leading-relaxed mt-1">
              种满 <b className="font-mono tnum text-[var(--ink)]">{WISH?.needPlantings ?? 60}</b> 次森野黄金芽，
              心愿保底必出 2 件。免费只给 <b className="font-mono tnum text-[var(--ink)]">{SEED_SRC?.freeTotal ?? 36}</b> 颗，
              差的 <b className="font-mono tnum text-[var(--ink)]">24 颗</b>要去商店买。
            </div>
          </div>
        </div>

        {/* 阅读顺序 */}
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--sky-bg)', border: '1.5px solid var(--sky-soft)' }}>
          <div className="font-display italic text-sm font-bold mb-2" style={{ color: 'var(--sky-deep)' }}>这页怎么读</div>
          <ol className="text-xs text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
            <li><b className="text-[var(--ink)]">① 想先算自己的收益</b> —— 最上面的「奶茶收益计算器」直接调，填背包里的果实数量就能出数。</li>
            <li><b className="text-[var(--ink)]">② 想知道活动能不能全拿</b> —— 看「每日任务」和「全套装扮能拿到吗」，这两张是攻略核心。</li>
            <li><b className="text-[var(--ink)]">③ 想知道钱怎么花、种子怎么凑</b> —— 看兑换商店 / 心愿保底 / 种子从哪来。</li>
            <li><b className="text-[var(--ink)]">④ 想抠细节</b> —— 价格、等级、员工、公式在最后，按需翻。</li>
          </ol>
        </div>
      </SectionCard>

      {/* 每日任务：每天白捡 3,000 券 */}
      {DAILY && (
        <SectionCard icon={<span>📅</span>} title={`每日任务：每天白捡 ${DAILY_COUPONS.toLocaleString()} 券`} accent="leaf"
          sub={`3 个任务一起做 · ${DAILY.window} · 共 ${DAILY_TOTAL.toLocaleString()} 券`}>
          {/* 为什么这条最划算 */}
          <div className="rounded-2xl p-3.5 mb-3"
            style={{ background: 'var(--leaf-bg)', border: '1.5px solid var(--leaf-soft)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="flex-shrink-0" style={{ color: 'var(--leaf-deep)' }} />
              <span className="font-display italic text-sm font-bold" style={{ color: 'var(--leaf-deep)' }}>这是全活动性价比最高的一件事</span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              {DAILY.why}
            </p>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-2 pt-2" style={{ borderTop: '1.5px dashed var(--line)' }}>
              <b className="text-[var(--ink)]">别误会：{DAILY_TOTAL.toLocaleString()} 券不是「全活动的钱」。</b>
              全拿要 {TOTAL_BUDGET.toLocaleString()} 券，其中约 {fmtWan(SMALL_NOW)} 万来自店铺经营，
              这 {fmtWan(DAILY_TOTAL)} 万只是<b className="text-[var(--ink)]">补上最后缺口</b>的那一笔 ——
              但恰恰是这笔，把「差 6%」变成了「刚好够」。
            </p>
          </div>

          {/* 3 个任务 */}
          <div className={`${LABEL_CLS} mb-1.5`}>三个任务 · 一起做完才算一份</div>
          <div className="space-y-2 mb-3">
            {DAILY.tasks.map((t: { name: string; effort: string; note: string }, i: number) => (
              <div key={t.name} className="rounded-2xl p-3 flex items-start gap-3"
                style={{ background: 'var(--surface-soft)', border: '1.5px solid var(--line)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-black"
                  style={{ background: 'var(--leaf)', color: 'white' }}>{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--ink)]">{t.name}</span>
                    <span className="chip chip-leaf" style={{ fontSize: '0.6rem' }}>{t.effort}</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-mute)] mt-0.5 leading-relaxed">{t.note}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 折合多少 */}
          <div className={`${LABEL_CLS} mb-1.5`}>折合下来是多少</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {DAILY.equivalents.map((e: { k: string; v: string }, i: number) => (
              <div key={i} className="rounded-xl p-2.5 text-xs leading-relaxed flex items-start gap-2"
                style={{ background: 'var(--sun-bg)', border: '1.5px solid var(--sun-soft)' }}>
                <span className="font-mono text-[11px] font-black flex-shrink-0" style={{ color: 'var(--sun-deep)' }}>{i + 1}</span>
                <span className="min-w-0">
                  <b className="block text-[var(--ink)] text-[11px] mb-0.5">{e.k}</b>
                  <span className="text-[var(--ink-soft)]">{e.v}</span>
                </span>
              </div>
            ))}
          </div>

          {/* 陷阱 */}
          <div className="rounded-2xl p-3.5 mb-3"
            style={{ background: 'var(--berry-bg)', border: '1.5px solid var(--berry-soft)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={14} className="flex-shrink-0" style={{ color: 'var(--berry-deep)' }} />
              <span className="font-display italic text-sm font-bold" style={{ color: 'var(--berry-deep)' }}>唯一要注意的坑</span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{DAILY.pitfall}</p>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-1.5">
              <b className="text-[var(--ink)]">但漏几天没关系：</b>{DAILY.tolerance?.note}
            </p>
          </div>

          {/* 敏感性：卡片式，手机上一屏能看完（表格 5 列在窄屏会被挤出去） */}
          <div className={`${LABEL_CLS} mb-1.5`}>万一每天拿不到 3,000 券？（敏感性）</div>
          <div className="space-y-1.5">
            {DAILY.sensitivity.map((s: { daily: number; total: number; left: number; plantings: number; ok: boolean; note?: string }) => {
              const isNow = s.daily === DAILY_COUPONS;
              const seedsBuy = Math.max(0, Math.floor((SMALL_NOW + s.total - (SHOP?.costumeTotal ?? 0)) / (VERDICT?.price ?? 8000)));
              return (
                <div key={s.daily} className="rounded-xl px-3 py-2"
                  style={{
                    background: isNow ? 'var(--leaf-bg)' : s.ok ? 'var(--surface-soft)' : 'var(--berry-bg)',
                    border: `1.5px solid ${isNow ? 'var(--leaf-soft)' : s.ok ? 'var(--line)' : 'var(--berry-soft)'}`,
                  }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono tnum text-xs font-black text-[var(--ink)]">{s.daily.toLocaleString()}</span>
                      <span className="text-[11px] text-[var(--ink-mute)]">券/天</span>
                      {isNow && <span className="chip chip-leaf" style={{ fontSize: '0.55rem' }}>当前</span>}
                    </div>
                    <span className="text-[11px] font-bold flex-shrink-0"
                      style={{ color: s.ok ? 'var(--leaf-deep)' : 'var(--berry-deep)' }}>
                      {s.ok ? (s.left >= 0 ? `✅ 全拿 · 余 ${s.left.toLocaleString()}` : '✅ 全拿') : `❌ 差 ${Math.abs(s.left).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--ink-mute)] font-mono tnum">
                    <span>余额 {(SMALL_NOW + s.total).toLocaleString()}</span>
                    <span>·</span>
                    <span>种子 {seedsBuy} 颗</span>
                    <span>·</span>
                    <span>种 {s.plantings}/{WISH?.needPlantings ?? 60}</span>
                    {s.note && <><span>·</span><span className="truncate">{s.note}</span></>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--ink-mute)] mt-2 leading-relaxed">
            临界线在 <b className="text-[var(--ink-soft)]">2,400 券/天</b> —— 高于它就能全拿（2,400 时只剩 358 券，等于刚好卡线）。
            低于它就开始掉：2,100 差 2 颗，完全不做到只剩 51/60。
          </p>

          {/* 取证 */}
          <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg-2)', border: '1.5px solid var(--line)' }}>
            <div className={LABEL_CLS}>怎么确认的</div>
            <p className="text-[11px] text-[var(--ink-mute)] leading-relaxed mt-1">{DAILY.evidence}</p>
          </div>
        </SectionCard>
      )}

      {/* 全套装扮能拿到吗：大号 / 小号双轨推演 */}
      {PROJ && (
        <SectionCard icon={<span>📈</span>} title="全套装扮能拿到吗？不氪金 vs 氪金"
          sub={`实测标定 ${PROJ.measuredAt} · 边际速率 ≈490 券/小时`}>
          {/* 一句话结论 */}
          <div className="rounded-2xl p-3.5 mb-3"
            style={{ background: 'linear-gradient(135deg, var(--sun-bg), var(--orange-bg))', border: '1.5px solid var(--sun-soft)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Info size={14} className="flex-shrink-0" style={{ color: 'var(--orange-deep)' }} />
              <span className="font-display italic text-sm font-bold" style={{ color: 'var(--orange-deep)' }}>一句话结论</span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{PROJ.conclusion}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <StatTile label="实测速率" value="≈490" hint="券 / 小时" color="sky" />
            <StatTile label="小号店铺经营" value={fmtWan(SMALL_NOW)} hint="万券（大头）" color="sun" />
            <StatTile label="+ 每日任务" value={fmtWan(DAILY_TOTAL)} hint="万券（补缺口）" color="leaf" />
            <StatTile label="全拿需要" value={fmtWan(SMALL_NEED)} hint="万券" color="berry" />
          </div>

          {/* 账号对比卡：只留 3 个关键数字 */}
          <div className="space-y-2">
            {PROJ.rows.filter((r) => !r.scenario.includes('恒定')).map((r) => (
              <div key={r.account + r.scenario} className="rounded-2xl p-3"
                style={{
                  background: r.ok ? 'var(--leaf-bg)' : 'var(--berry-bg)',
                  border: `1.5px solid ${r.ok ? 'var(--leaf-soft)' : 'var(--berry-soft)'}`,
                }}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-[var(--ink)]">{r.account}</div>
                    <div className="text-[11px] text-[var(--ink-mute)] mt-0.5">{r.scenario}</div>
                  </div>
                  <Badge tone={r.ok ? 'leaf' : 'berry'}>
                    {r.ok ? '能全拿' : `差 ${(SEED_SRC?.needTotal ?? 60) - r.plantings} 颗`}
                  </Badge>
                </div>
                <div className="text-[11px] font-bold mt-2 leading-relaxed"
                  style={{ color: r.ok ? 'var(--leaf-deep)' : 'var(--berry-deep)' }}>{r.result}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 mt-2.5">
                  <Metric label="店铺经营收入" value={`${fmtWan(r.revenue)} 万`} />
                  <Metric label="每日任务" value={r.taskCoupons ? `+${fmtWan(r.taskCoupons)} 万` : '—'} color="var(--leaf-deep)" />
                  <Metric label="买完装扮后剩" value={`${fmtWan(r.afterCost)} 万`} />
                  <Metric label="能买种子" value={`${r.seedsBuyable} 颗`} color="var(--orange-deep)" />
                </div>
              </div>
            ))}
          </div>

          {/* 算式对账：把「为什么够」摊开成一行加法 */}
          <div className="mt-3 rounded-2xl p-3 text-xs leading-relaxed"
            style={{ background: 'var(--surface-soft)', border: '1.5px solid var(--line)' }}>
            <div className={LABEL_CLS}>小号这笔账，加一遍就清楚了</div>
            <div className="mt-1.5 font-mono tnum text-[var(--ink-soft)] space-y-0.5">
              <div>店铺经营 <b className="text-[var(--ink)]">{SMALL_NOW.toLocaleString()}</b></div>
              <div>+ 每日任务 <b style={{ color: 'var(--leaf-deep)' }}>{DAILY_TOTAL.toLocaleString()}</b></div>
              <div className="pt-1" style={{ borderTop: '1.5px dashed var(--line)' }}>
                = 可用 <b className="text-[var(--ink)]">{(SMALL_NOW + DAILY_TOTAL).toLocaleString()}</b>
                <span className="text-[var(--ink-mute)]"> ＞ 要花 {TOTAL_BUDGET.toLocaleString()}</span>
              </div>
              <div>余 <b style={{ color: 'var(--leaf-deep)' }}>{SMALL_LEFT.toLocaleString()}</b></div>
            </div>
          </div>


          <div className="mt-3 rounded-2xl p-3.5"
            style={{ background: 'var(--sky-bg)', border: '1.5px solid var(--sky-soft)' }}>
            <div className="font-display italic text-sm font-bold mb-1.5" style={{ color: 'var(--sky-deep)' }}>
              为什么之前说「差 6%」，现在又说够了？
            </div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              因为之前那版<b>只算了店铺卖奶茶的收入</b>，漏掉了每日任务。
              把 3,000 券/天算进来之后，临界速率从
              <b className="font-mono tnum text-[var(--ink)]"> 521 券/时</b> 降到
              <b className="font-mono tnum text-[var(--ink)]"> 482 券/时</b> ——
              而实测是 <b className="font-mono tnum text-[var(--ink)]">490</b>，
              <b style={{ color: 'var(--leaf-deep)' }}>已经过线</b>（余量很薄，约 1.7%，所以任务别漏）。
            </p>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-2">
              换个说法：<b className="text-[var(--ink)]">3,000 券/天 ≈ 125 券/小时 ≈ 热卖值永久 +25.5%</b>，
              比雇 2 个「金牌宣传」（+20%，还要付工资）还强，而且<b>不占员工位、不花一分钱</b>。
              所以「雇 2 个金牌宣传」从「必选项」降级成「想更稳可以加，不加也能全拿」。
            </p>
          </div>

          {/* 三档对照 */}
          <div className={`${LABEL_CLS} mt-3 mb-1.5`}>不同打法的临界速率（含每日任务）</div>
          <TableWrap>
            <thead>
              <tr>
                <Th className="text-left">目标</Th>
                <Th className="text-right">需要的速率</Th>
                <Th className="text-left">结论</Th>
              </tr>
            </thead>
            <tbody>
              {(PROJ.thresholds ?? []).map((t: { label: string; rate: number; note: string }, i: number) => (
                <tr key={t.label} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                  <Td className="text-left font-bold text-[var(--ink)]" style={{ whiteSpace: 'normal' }}>{t.label}</Td>
                  <Td className="text-right font-mono tnum">{t.rate > 0 ? `${t.rate} 券/时` : '不需要'}</Td>
                  <Td className="text-left" style={{ whiteSpace: 'normal' }}>{t.note}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <p className="text-[10px] text-[var(--ink-mute)] mt-3 leading-relaxed">
            口径：店铺速率由 13:16 / 15:01 / 15:33 三个读数两两算出（488~491 券/时，稳定）；累计均值 980 是开服爆发期拉高的，不能用来外推。
            推演按「券/小时 ∝ 热卖值 ×(1 + 高级定价%)」从 10-16 15:33 推到 11-14 24:00（704 小时），
            再叠加每日任务 {DAILY_TOTAL.toLocaleString()} 券；已扣掉 13 件装扮 {SHOP?.costumeTotal.toLocaleString()} 与雇员工资（若有）。
          </p>
        </SectionCard>
      )}

      {/* 兑换商店：全套成本与兑换路线（2026-10-16 实录价目） */}
      {SHOP && (
        <SectionCard icon={<span>🛍️</span>} title="兑换商店：全套成本与兑换路线"
          sub={`13 件装扮合计 ${SHOP.costumeTotal.toLocaleString()} 券 · ${SHOP.exportedAt} 游戏内实录`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <StatTile label={`${SHOP.costumes.length} 件装扮合计`} value={`${SHOP.costumeTotal.toLocaleString()} 券`} color="orange" />
            <StatTile label="补购 24 颗种子" value={`${(24 * (VERDICT?.price ?? 8000)).toLocaleString()} 券`} color="sun" />
            <StatTile label="总预算" value={`${fmtWan(TOTAL_BUDGET)} 万券`} color="berry" />
            <StatTile label="解锁门槛" value="最高 Lv12" color="sky" />
          </div>

          <div className="mb-3 flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'var(--sky-bg)', border: '1.5px solid var(--sky-soft)' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sky-deep)' }} />
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              这 {TOTAL_BUDGET.toLocaleString()} 券不是靠每日任务凑的 ——
              每日任务总共只给 <b className="font-mono tnum text-[var(--ink)]">{DAILY_TOTAL.toLocaleString()}</b> 券（占 {Math.round(DAILY_TOTAL / TOTAL_BUDGET * 100)}%），
              大头是<b className="text-[var(--ink)]">店铺经营攒下的约 {fmtWan(SMALL_NOW)} 万券</b>。
              每日任务的作用是「补上最后那点缺口」，让不氪金也能刚好够。
            </p>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th className="text-left">档位</Th>
                <Th className="text-left">包含装扮</Th>
                <Th>小计</Th>
                <Th>累计</Th>
              </tr>
            </thead>
            <tbody>
              {SHOP_TIERS.map((t, i) => (
                <tr key={t.unlockLevel} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                  <Td className="text-left font-bold text-[var(--ink)]">{t.label}</Td>
                  <Td className="text-left" style={{ whiteSpace: 'normal' }}>
                    {t.items.map((x) => `${x.name} ${x.price.toLocaleString()}`).join(' · ')}
                  </Td>
                  <Td className="font-mono tnum">{t.subtotal.toLocaleString()}</Td>
                  <Td className="font-mono tnum font-bold">{t.cumulative.toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <div className="mt-4">
            <div className="space-y-2.5">
              {SHOP_PROJ.map((x) => {
                const pct = Math.max(3, Math.min(100, (x.total / SHOP_PROJ_MAX) * 100));
                return (
                  <div key={x.label} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs"
                          style={{ color: x.isTarget ? 'var(--orange-deep)' : 'var(--ink)' }}>
                          {x.label}{x.note ? <span className="font-normal text-[var(--ink-mute)]"> · {x.note}</span> : null}
                        </span>
                        <span className="font-mono tnum text-xs font-bold flex-shrink-0"
                          style={{ color: x.isTarget ? 'var(--orange-deep)' : 'var(--ink-soft)' }}>
                          {fmtWan(x.total)} 万券
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-2)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: x.color, transition: 'width .3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SHOP.projection.levelTimeline.map((t) => (
                <span key={t.level} className="chip" style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>
                  Lv{t.level} · 约第 {t.day} 天
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'var(--leaf-bg)', border: '1.5px solid var(--leaf-soft)' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--leaf-deep)' }} />
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              装扮不影响经营数值 —— 建议留到 <b>11-13 ~ 11-16 结算期按余额一次性采购</b>。
              真正有「时间墙」的是黄金芽种子（每日限购 1 颗），必须先买，详见下面两节。
              <br />
              <b>11-14 24:00</b> 后停止营业与种子购买，<b>兑换持续到 11-16 24:00</b>。
            </p>
          </div>
        </SectionCard>
      )}

      {/* 变异装扮 · 心愿保底 */}
      {WISH && (
        <SectionCard icon={<span>🎯</span>} title="变异装扮 · 心愿保底"
          sub={`${WISH.crop} · 种满 ${WISH.needPlantings} 次，保底拿 2 件变异装扮果实`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <StatTile label="需要种植" value={`${WISH.needPlantings} 次`} color="berry" />
            <StatTile label="不氪金免费种子" value={`${SEED_SRC?.freeTotal ?? 36} 颗`} color="leaf" />
            <StatTile label="需补购" value={`${WISH.needPlantings - (SEED_SRC?.freeTotal ?? 36)} 颗`} color="sun" />
            <StatTile label="补购成本"
              value={`${((WISH.needPlantings - (SEED_SRC?.freeTotal ?? 36)) * (VERDICT?.price ?? 8000)).toLocaleString()} 券`}
              color="orange" />
          </div>

          <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--berry-bg)', border: '1.5px solid var(--berry-soft)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={14} className="flex-shrink-0" style={{ color: 'var(--berry-deep)' }} />
              <span className="font-display italic text-sm font-bold" style={{ color: 'var(--berry-deep)' }}>一句话看懂</span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              种<span className="font-bold text-[var(--ink)]">森野黄金芽</span>每 1 颗 = 两条心愿各 +1：
              种满 <b>30 颗</b> 必出【金露云酪】，种满 <b>60 颗</b> 必出【黄金·金露云酪】。
              <b>两条计数同步走，所以种满 60 颗 = 两件一起到手</b>（最坏 61 颗）。
            </p>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th className="text-left">目标装扮果实</Th>
                <Th>道具 id</Th>
                <Th>图鉴进度值</Th>
                <Th>心愿保底</Th>
              </tr>
            </thead>
            <tbody>
              {WISH.targets.map((t, i) => (
                <tr key={t.itemId} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                  <Td className="text-left" style={{ whiteSpace: 'normal' }}>
                    <div className="font-bold text-[var(--ink)]">{t.name}</div>
                    <div className="text-[10px] text-[var(--ink-mute)] mt-0.5">{t.note}</div>
                  </Td>
                  <Td className="font-mono tnum">{t.itemId}</Td>
                  <Td className="font-mono tnum">{t.illustratedValue}</Td>
                  <Td className="font-mono tnum font-bold" style={{ color: 'var(--berry-deep)' }}>{t.guarantee} 颗</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <div className="mt-4">
            <div className={`${LABEL_CLS} mb-1.5`}>如果不用保底，靠自然变异要多久？</div>
            <TableWrap>
              <thead>
                <tr>
                  <Th className="text-left">变异（公布概率）</Th>
                  <Th>期望次数</Th>
                  <Th>30 次内出</Th>
                  <Th>60 次内出</Th>
                </tr>
              </thead>
              <tbody>
                {WISH.naturalRate.map((n, i) => (
                  <tr key={n.name} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                    <Td className="text-left" style={{ whiteSpace: 'normal' }}>
                      <div className="font-bold text-[var(--ink)]">{n.name}</div>
                      <div className="font-mono tnum text-[10px] text-[var(--ink-mute)] mt-0.5">{n.prob}</div>
                    </Td>
                    <Td className="font-mono tnum">{n.expect}</Td>
                    <Td className="font-mono tnum">{n.within30}</Td>
                    <Td className="font-mono tnum font-bold" style={{ color: 'var(--leaf-deep)' }}>{n.within60}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="text-[11px] text-[var(--ink-mute)] mt-2.5 leading-relaxed">{WISH.naturalNote}</p>
          </div>
        </SectionCard>
      )}

      {/* 黄金芽种子：从哪来 + 要不要买 */}
      {(SEED_SRC || VERDICT) && (
        <SectionCard icon={<span>🌱</span>} title="森野黄金芽种子：从哪来？"
          sub={SEED_SRC ? `${SEED_SRC.method} · 不氪金免费 ${SEED_SRC.freeTotal} 颗` : undefined}>
          {SEED_SRC && (
            <>
              {/* 痛点卡：先把「不够用 + 有时间墙」摆出来 */}
              <div className="rounded-2xl p-3.5 mb-3"
                style={{ background: 'var(--berry-bg)', border: '1.5px solid var(--berry-soft)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={14} className="flex-shrink-0" style={{ color: 'var(--berry-deep)' }} />
                  <span className="font-display italic text-sm font-bold" style={{ color: 'var(--berry-deep)' }}>
                    痛点：白送的种子不够用，而且买它有「时间墙」
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                  心愿保底要 <b className="text-[var(--ink)]">{SEED_SRC.needTotal} 颗</b>，白送只有
                  <b className="text-[var(--ink)]"> {SEED_SRC.freeTotal} 颗</b> → 剩下
                  <b className="text-[var(--ink)]"> {SEED_SRC.needTotal - SEED_SRC.freeTotal} 颗</b>只能去兑换商店买，
                  共 <b className="font-mono tnum text-[var(--ink)]">
                    {((SEED_SRC.needTotal - SEED_SRC.freeTotal) * (VERDICT?.price ?? 8000)).toLocaleString()}
                  </b> 券。
                </p>
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-1.5">
                  ⏰ 更关键的是<b>每天限购 1 颗</b> —— 想买满 {SEED_SRC.needTotal - SEED_SRC.freeTotal} 颗就得买满
                  {' '}{SEED_SRC.needTotal - SEED_SRC.freeTotal} 天，<b className="text-[var(--ink)]">10-19 就得开始每天买</b>，
                  拖到 11 月初就来不及了（11-14 停止购买，11-16 停止兑换）。
                </p>
                <SeedNeedBar free={SEED_SRC.freeTotal} need={SEED_SRC.needTotal} />
              </div>

              <div className={`${LABEL_CLS} mb-1.5`}>白送（零成本）· 合计 {SEED_SRC.freeTotal} 颗</div>
              <div className="space-y-2 mb-3">
                {SEED_SRC.rows.filter((r) => r.zeroCost).map((r) => <SeedSourceCard key={r.source} row={r} />)}
              </div>

              <div className={`${LABEL_CLS} mb-1.5`}>要花钱的（不氪金可跳过）</div>
              <div className="space-y-2">
                {SEED_SRC.rows.filter((r) => !r.zeroCost).map((r) => <SeedSourceCard key={r.source} row={r} />)}
              </div>
            </>
          )}

          {VERDICT && (
            <div className="mt-4">
              {/* 痛点：单价 + 每日限购 */}
              <div className="rounded-2xl p-3.5 mb-3"
                style={{ background: 'var(--sun-bg)', border: '1.5px solid var(--sun-soft)' }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle size={15} className="flex-shrink-0" style={{ color: 'var(--sun-deep)' }} />
                  <span className="font-display italic text-base font-black text-[var(--ink)]">那要不要买？</span>
                </div>
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <div className="font-mono tnum text-3xl font-black leading-none text-[var(--ink)]">
                      {VERDICT.price.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-[var(--ink-soft)] mt-1">券 / 颗</div>
                  </div>
                  <div className="w-px self-stretch" style={{ background: 'var(--sun-soft)' }} />
                  <div>
                    <div className="font-mono tnum text-3xl font-black leading-none"
                      style={{ color: 'var(--berry-deep)' }}>{VERDICT.dailyLimit ?? 1}</div>
                    <div className="text-xs font-bold mt-1" style={{ color: 'var(--berry-deep)' }}>颗 / 天（限购）</div>
                  </div>
                </div>
                <p className="text-xs font-bold leading-relaxed mt-2.5" style={{ color: 'var(--berry-deep)' }}>
                  ⏰ 买 24 颗要买满 24 天 —— 10-19 就得开买（最晚 10-21，再晚就凑不满 24 天）。
                </p>
              </div>
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="text-left">维度</Th>
                    <Th className="text-left">结果</Th>
                  </tr>
                </thead>
                <tbody>
                  {VERDICT.rows.map((r, i) => (
                    <tr key={r.k} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                      <Td className="text-left font-bold text-[var(--ink)]" style={{ whiteSpace: 'normal' }}>{r.k}</Td>
                      <Td className="text-left" style={{ whiteSpace: 'normal' }}>{r.v}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'var(--sun-bg)', border: '1.5px solid var(--sun-soft)' }}>
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sun-deep)' }} />
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{VERDICT.conclusion}</p>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* 店铺等级 */}
      <SectionCard icon={<span>🏪</span>} title="店铺等级表" sub={`升到 Lv${MAX_LEVEL} 共需 69.4 万营业额`}>
        <TableWrap>
          <thead>
            <tr>
              <Th>等级</Th>
              <Th>所需营业额</Th>
              <Th>基础热卖值</Th>
              <Th>高级定价</Th>
              <Th>员工位</Th>
              <Th className="text-left">解锁配方</Th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l, i) => (
              <tr key={l.level} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                <Td className="font-mono tnum font-bold text-[var(--ink)]">Lv{l.level}</Td>
                <Td className="font-mono tnum">{l.revenueRequired.toLocaleString()}</Td>
                <Td className="font-mono tnum font-bold">{l.basePopularity} 杯/时</Td>
                <Td className="font-mono tnum" style={{ color: l.advancedPricePercent ? 'var(--leaf-deep)' : 'var(--ink-mute)' }}>
                  {l.advancedPricePercent ? `+${(l.advancedPricePercent / 100).toFixed(0)}%` : '—'}
                </Td>
                <Td className="font-mono tnum">{l.employeeSlots}</Td>
                <Td className="text-left">
                  {l.recipeIds.map((id) => RECIPES.find((r) => r.id === id)?.name).filter(Boolean).join('、')}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </SectionCard>

      {/* 员工特长 */}
      <SectionCard icon={<Users size={15} strokeWidth={2.5} />} title="员工「特长」" sub="好友每天刷新；Lv3 起有 2 个员工位">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TALENTS.map((t) => {
            const popBonus = TALENT_POP_BONUS[t.name] || 0;
            const isBest = t.name === '金牌宣传';
            return (
              <div key={t.id} className="rounded-2xl p-3"
                style={{
                  background: isBest ? 'var(--orange-bg)' : 'var(--bg-2)',
                  border: `1.5px solid ${isBest ? 'var(--orange)' : 'var(--line)'}`,
                }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--ink)]">{t.name}</span>
                  {isBest && <span className="chip" style={{ fontSize: '0.6rem', background: 'var(--orange)', color: 'white' }}>首选</span>}
                  {popBonus > 0 && (
                    <span className="chip chip-leaf ml-auto">奶茶券 ×{(1 + popBonus).toFixed(2)}</span>
                  )}
                </div>
                <div className="text-xs text-[var(--ink-soft)] mt-1.5 leading-relaxed">{t.desc}</div>
                <div className="text-[11px] text-[var(--ink-mute)] mt-1.5 leading-relaxed">
                  {popBonus > 0
                    ? '作用于销量速度：库存充足时直接多赚，库存吃紧时只加快卖完。'
                    : t.type === 1
                      ? '只加金币结算部分，不影响奶茶券。'
                      : '折算成宣传喇叭（= 1 小时基础销量）。'}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
          style={{ background: 'var(--sun-bg)', border: '1.5px solid var(--sun-soft)' }}>
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sun-deep)' }} />
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            <b>分清「销量」和「收益」</b>：热卖值加的是卖货速度（杯/小时），不加单杯价格。
            库存充足（如还在刷普通奶茶保底）→ 热卖值加成 = 直接多赚；库存受限（果子就那么多）→ 总收益被产量封顶，
            热卖值只让你更快卖完，此时该优先抬单价。
          </p>
        </div>
      </SectionCard>

      {/* 雇佣时长 + 互动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard icon={<Clock size={15} strokeWidth={2.5} />} title="雇佣时长与工资" sub="工资由老板支付给员工">
          <TableWrap>
            <thead>
              <tr>
                <Th>时长</Th>
                <Th>工资</Th>
                <Th>折合每小时</Th>
                <Th>招牌试饮送</Th>
              </tr>
            </thead>
            <tbody>
              {DURATIONS.map((d, i) => (
                <tr key={d.id} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                  <Td className="font-mono tnum font-bold text-[var(--ink)]">{d.hours} 小时</Td>
                  <Td className="font-mono tnum">{d.cost} 券</Td>
                  <Td className="font-mono tnum font-bold"
                    style={{ color: d.hours === 24 ? 'var(--leaf-deep)' : 'var(--ink-soft)' }}>
                    {d.costPerHour} / 时
                  </Td>
                  <Td className="font-mono tnum">
                    {TASTE_COUNT.find((t) => t.durationId === d.id)?.count ?? 0} 杯
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="text-[11px] text-[var(--ink-mute)] mt-2.5 leading-relaxed">
            24 小时档单位时间工资最高（11.25 券/时），且招牌试饮送 24 杯。
          </p>
        </SectionCard>

        <SectionCard icon={<span>💬</span>} title="打工互动（工作事项）" sub="员工被雇佣后可选">
          <div className="space-y-2">
            {INTERACTIONS.map((it) => (
              <div key={it.id} className="rounded-xl p-2.5"
                style={{ background: 'var(--bg-2)', border: '1.5px solid var(--line)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[var(--ink)]">{it.name}</span>
                  {(it.id === 3 || it.id === 5) && (
                    <span className="chip chip-leaf" style={{ fontSize: '0.6rem' }}>员工收益最高</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--ink-soft)] mt-1 leading-relaxed">
                  {fillInteractionDesc(it, 1)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--ink-mute)] mt-2.5 leading-relaxed">
            括号内数值按 4 小时档展示（招牌试饮 12 / 24 小时档分别送 12 / 24 杯）。
            互动的「收益加成」作用于老板未来 2~3 小时，老板应保证该窗口内卖的是高价奶茶。
          </p>
        </SectionCard>
      </div>

      {/* 奶茶价格 */}
      <SectionCard icon={<span>🧋</span>} title="各种奶茶的价格" sub="单位：奶茶券 / 杯（活动代币）">
        <TableWrap>
          <thead>
            <tr>
              <Th className="text-left">奶茶</Th>
              <Th>券 / 杯</Th>
              <Th className="text-left">消耗果实</Th>
              <Th>果实售价</Th>
              <Th>种子价</Th>
              <Th>1 颗种子产量</Th>
              <Th>解锁</Th>
            </tr>
          </thead>
          <tbody>
            {RECIPES.map((r, i) => {
              const grade = r.fruitName ? getGrade(r.fruitRarity, r.fruitRarityColor) : null;
              return (
                <tr key={r.id} style={{ borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
                  <Td className="text-left">
                    <div className="flex items-center gap-3">
                      <DrinkIcon recipe={r} size={48} />
                      <span className="font-bold text-[var(--ink)]">{r.name}</span>
                    </div>
                  </Td>
                  <Td className="font-mono tnum font-bold">
                    <span style={{ color: r.price >= 40 ? 'var(--sun-deep)' : 'var(--ink)' }}>{r.price}</span>
                  </Td>
                  <Td className="text-left">
                    {r.fruitName ? (
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold" style={{ color: `#${grade?.color}` }}>{r.fruitName}</span>
                        <span className="chip" style={{ fontSize: '0.6rem', padding: '0.05rem 0.4rem', background: `#${grade?.color}22`, color: `#${grade?.color}` }}>
                          {grade?.name}
                        </span>
                      </span>
                    ) : <span className="text-[var(--ink-mute)]">不限量供应</span>}
                  </Td>
                  <Td className="font-mono tnum">{r.fruitGold ? r.fruitGold.toLocaleString() : '—'}</Td>
                  <Td className="font-mono tnum">{r.seedGold ? r.seedGold.toLocaleString() : '—'}</Td>
                  <Td className="font-mono tnum">{r.fruitPerHarvest ? `${r.fruitPerHarvest} 杯` : '—'}</Td>
                  <Td className="font-mono tnum">Lv{r.unlockLevel}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
        <p className="text-[11px] text-[var(--ink-mute)] mt-2.5 leading-relaxed">
          1 果实 → 1 杯（<span className="font-mono">normal_output_count = 1</span>）；「带有售价倍率的果实，产量按相同倍率提升」——
          变异果实（冰冻 ×3 / 暗化 ×2 等）1 颗可做多杯。活动作物统一 12 小时成熟、每次收获 10 个果实。
        </p>
      </SectionCard>

      {/* 单位时间收益排行 */}
      <SectionCard
        icon={<TrendingUp size={15} strokeWidth={2.5} />}
        title="单位时间收益排行"
        sub="单块地 12 小时产出一茬"
        action={
          <div className="pill-tab-group" style={{ '--accent': 'var(--orange)', '--accent-deep': 'var(--orange-deep)' } as React.CSSProperties}>
            <button type="button" onClick={() => setRankMode('plot')}
              className={`pill-tab ${rankMode === 'plot' ? 'pill-tab-active pill-tab-accent' : ''}`}>
              按奶茶券产出
            </button>
            <button type="button" onClick={() => setRankMode('cup')}
              className={`pill-tab ${rankMode === 'cup' ? 'pill-tab-active pill-tab-accent' : ''}`}>
              按单杯价格
            </button>
          </div>
        }>
        <div className="space-y-2.5">
          {ranked.map((r, i) => {
            const val = rankMode === 'plot' ? r.coinPerHourAllPlots : r.price;
            const pct = rankMode === 'plot' ? Math.max(3, (val / maxAll) * 100) : Math.max(3, (val / 45) * 100);
            const unit = rankMode === 'plot' ? '券/时（24 块地）' : '券/杯';
            return (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono tnum font-black text-xs"
                  style={{ background: i === 0 ? 'var(--sun)' : 'var(--bg-2)', color: i === 0 ? 'white' : 'var(--ink-mute)' }}>
                  {i + 1}
                </div>
                <DrinkIcon recipe={r} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[var(--ink)] truncate">{r.name}</span>
                    <span className="font-mono tnum text-xs font-bold flex-shrink-0"
                      style={{ color: i === 0 ? 'var(--orange-deep)' : 'var(--ink-soft)' }}>
                      {rankMode === 'plot' ? Math.round(val).toLocaleString() : val}{' '}
                      <span className="text-[11px] font-normal text-[var(--ink-mute)]">{unit}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-2)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: i === 0 ? 'var(--orange)' : 'var(--sun)', transition: 'width .3s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--ink-mute)] mt-2.5 leading-relaxed">
          按「1 颗种子 → 10 杯 / 12 小时」估算，未计变异倍率与土地加成；普通奶茶不限量但只有 3 券，只作保底。
        </p>
      </SectionCard>

      {/* 核心公式 */}
      <SectionCard icon={<Info size={15} strokeWidth={2.5} />} title="算法公式" sub="配置口径 + 活动实测交叉验证">
        <div className="space-y-2">
          <div className="rounded-xl p-3 font-mono text-xs leading-relaxed overflow-x-auto"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>
            {FORMULA.sales}
          </div>
          <div className="rounded-xl p-3 font-mono text-xs leading-relaxed overflow-x-auto"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>
            {FORMULA.revenue}
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
          style={{ background: 'var(--leaf-bg)', border: '1.5px solid var(--leaf-soft)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--leaf-deep)' }} />
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            <b>热卖值 = 销量（杯/小时）</b>，不是钱。实测「Lv1 热卖值 40 → Lv2 45 杯/小时」与配置表
            <span className="font-mono"> base_popularity </span>逐级吻合；「招牌试饮 +20% 后 45 券的天工奶茶卖 54 券」= 45 × 1.2。
            <br />
            {FORMULA.note}
          </p>
        </div>
      </SectionCard>

      {/* 结论 */}
      <SectionCard icon={<Sparkles size={15} strokeWidth={2.5} />} title="结论：照着这 5 条做就行" accent="plum">
        {/* 最优先：每日任务 */}
        <div className="rounded-2xl p-3.5 mb-3"
          style={{ background: 'linear-gradient(135deg, var(--leaf-bg), var(--sun-bg))', border: '1.5px solid var(--leaf-soft)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="flex-shrink-0" style={{ color: 'var(--leaf-deep)' }} />
            <span className="font-display italic text-sm font-bold" style={{ color: 'var(--leaf-deep)' }}>第一优先：每天清完 3 个每日任务</span>
          </div>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            这是全活动<b className="text-[var(--ink)]">唯一「白给」的收入</b>：不花券、不花钻石、不占员工位、不看热卖值，
            每天 {DAILY_COUPONS.toLocaleString()} 券，{DAILY?.totalDays ?? 28} 天共{' '}
            <b className="font-mono tnum text-[var(--ink)]">{DAILY_TOTAL.toLocaleString()}</b> 券。
            就是因为这笔钱，<b style={{ color: 'var(--leaf-deep)' }}>不氪金也能全拿</b>。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--leaf-bg)', border: '1.5px solid var(--leaf-soft)' }}>
            <div className="font-display italic text-sm font-bold text-[var(--leaf-deep)] mb-1.5">老板视角（奶茶券 / 小时最大）</div>
            <ul className="text-xs text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
              <li>· <b>每天做满 3 个每日任务</b>（3,000 券/天，白给，优先级最高）</li>
              <li>· <b>10-19 起每天买 1 颗黄金芽种子</b>（限购 1/1，最晚 10-21）→ 冲 60 次心愿保底</li>
              <li>· 卖最贵的 <b>金露云酪（45 券/杯）</b>，且 Lv1 就能做；普通奶茶 3 券只作保底</li>
              <li>· 冲满 <b>13 级店铺</b>（高级定价 +40%），高峰期打 <b>招牌试饮（+20%）</b></li>
              <li>· 员工特长首选 <b>金牌宣传（热卖值 +10%）</b>—— 但现在是「可选加稳」，不是必选项</li>
              <li>· <b>宣传喇叭</b>留到卖金露云酪时用（白送 1 小时基础销量）</li>
            </ul>
          </div>
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--sky-bg)', border: '1.5px solid var(--sky-soft)' }}>
            <div className="font-display italic text-sm font-bold text-[var(--sky-deep)] mb-1.5">打工人视角（单位时间收益最高）</div>
            <ul className="text-xs text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
              <li>· <b>招牌试饮</b> 最赚：工资 ×1.3 + 4 杯高级奶茶（4h 档 ≈ 92 券 ≈ 23 券/时）</li>
              <li>· 次选 <b>申请涨薪</b>：期望 1.4 倍工资（≈ 14 券/时）</li>
              <li>· 求稳选 <b>花式摇杯 / 宣传推广</b>；<b>划水摸鱼</b> 只在赌喇叭时用</li>
              <li>· 雇佣时长优先 <b>24 小时</b>（11.25 券/时，比 4 小时档高 12.5%）</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 rounded-2xl p-3.5"
          style={{ background: 'linear-gradient(135deg, var(--sun-bg), var(--orange-bg))', border: '1.5px solid var(--sun-soft)' }}>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            <b>一句话最优解：</b>每天清完 3 个每日任务（3,000 券/天）→ 10-19 起每天买 1 颗黄金芽种子 →
            种满森野黄金芽 → 全部做成金露云酪（45 券/杯）→ 店铺冲满 13 级（+40% 定价）→
            高峰期打「招牌试饮（+20%）」并用宣传喇叭清库存。
            <b>（雇 2 个「金牌宣传」是可选的加稳手段，不雇也能全拿。）</b>
          </p>
        </div>

        {PROJ && (
          <div className="mt-3 rounded-2xl p-3.5"
            style={{ background: 'var(--berry-bg)', border: '1.5px solid var(--berry-soft)' }}>
            <div className="font-display italic text-sm font-bold text-[var(--berry-deep)] mb-1.5">活动目标：能不能拿全？</div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              两个目标 —— <b>13 件缤纷奶茶装扮（{SHOP?.costumeTotal.toLocaleString()} 券）</b> ＋
              <b> 2 件变异装扮果实（种满 {WISH?.needPlantings ?? 60} 次）</b>，
              总预算 <b className="font-mono tnum">{TOTAL_BUDGET.toLocaleString()}</b> 券（含补购 24 颗种子）。
            </p>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-1.5">{PROJ.conclusion}</p>
          </div>
        )}
      </SectionCard>

    </div>
    </BulkCtx.Provider>
  );
}
