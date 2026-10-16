import React from 'react';
import { motion } from 'motion/react';
import { Info, TrendingUp, Users, Clock, Sparkles, AlertTriangle } from 'lucide-react';
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
  rows: Array<{ k: string; v: string }>;
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

/** 30 天收入情景 + 全套装目标线（合并后按金额降序） */
type ShopProj = { label: string; total: number; note?: string; color: string; isTarget?: boolean };
const SHOP_PROJ: ShopProj[] = (() => {
  if (!SHOP) return [];
  const colors = ['var(--leaf)', 'var(--sun)', 'var(--ink-mute)'];
  const items: ShopProj[] = SHOP.projection.scenarios.map((s, i) => ({
    label: s.label, total: s.total, note: s.note, color: colors[i] ?? 'var(--ink-mute)',
  }));
  items.push({ label: '全套装目标', total: SHOP.costumeTotal, color: 'var(--orange)', isTarget: true });
  return items.sort((a, b) => b.total - a.total);
})();
const SHOP_PROJ_MAX = 1400000;

/** 1360000 → "136"；631000 → "63.1" */
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

function SectionCard({ icon, title, sub, accent = 'orange', action, children }: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  accent?: 'orange' | 'leaf' | 'sky' | 'sun' | 'plum' | 'berry';
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="sticker p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[15px]"
          style={{ background: `var(--${accent})`, color: 'white', boxShadow: `0 2px 0 var(--${accent}-deep)` }}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display italic text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">{title}</h3>
          {sub && <div className="text-[11px] text-[var(--ink-mute)] truncate">{sub}</div>}
        </div>
        {action}
      </div>
      {children}
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

  return (
    <div className="space-y-5 fade-in">
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--orange-bg)', color: 'var(--orange-deep)' }}>
          <Sparkles size={11} strokeWidth={2.5} /> 奶茶店收益
        </span>
        <h2 className="page-header-title">奶茶工坊，哪种方式最赚？</h2>
        <p className="page-header-subtitle">
          {RECIPES.length} 种奶茶 · 店铺 Lv1→{MAX_LEVEL} · {TALENTS.length} 种员工特长 · {INTERACTIONS.length} 种打工互动 · 数据来自游戏配置表
        </p>
      </header>

      {/* 奶茶收益计算器 —— 置顶，进页即可调参 */}
      <SectionCard icon={<span>🧮</span>} title="奶茶收益计算器" sub="按背包里的果实数量算，看能赚多少 / 卖多久">
        <Calculator />
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

      {/* 兑换商店：全套成本与兑换路线（2026-10-16 实录价目） */}
      {SHOP && (
        <SectionCard icon={<span>🛍️</span>} title="兑换商店：全套成本与兑换路线"
          sub={`13 件装扮合计 ${SHOP.costumeTotal.toLocaleString()} 券 · ${SHOP.exportedAt} 游戏内实录`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <StatTile label="全套装成本" value={`${SHOP.costumeTotal.toLocaleString()} 券`} color="orange" />
            <StatTile label="装扮件数" value={`${SHOP.costumes.length} 件`} color="sky" />
            <StatTile label="解锁门槛" value="最高 Lv12" color="sun" />
            <StatTile label="30 天预计收入" value="90~136 万券" color="leaf" />
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
          <p className="text-[11px] text-[var(--ink-mute)] mt-2.5 leading-relaxed">
            每件永久限购 1/1，点开锁定商品提示「商品未解锁」。缤纷奶茶小屋为开店免费奖励，不计入套装价。
            {SHOP.note}
          </p>

          <div className="mt-4">
            <div className={`${LABEL_CLS} mb-1.5`}>30 天收入预期 vs 全套装目标</div>
            <p className="text-[11px] text-[var(--ink-soft)] leading-relaxed mb-2.5">{SHOP.projection.anchor}</p>
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
              按实测节奏，631,000 券基本可以全换完；即使节奏腰斩也离目标只差一线（保底拿 Lv10 档 435,000）。
              装扮不影响经营数值——建议留到 <b>11-13 ~ 11-16 结算期前统一采购</b>；11-14 24:00 后停止营业与种子购买，
              兑换持续到 11-16 24:00。
            </p>
          </div>
        </SectionCard>
      )}

      {/* 黄金芽种子判定 */}
      {VERDICT && (
        <SectionCard icon={<span>🌱</span>} title={`${VERDICT.seedName}（${VERDICT.price.toLocaleString()} 券）值不值得买？`}
          sub="结论：先不买 —— 升级奖励白送 32 颗">
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
        </SectionCard>
      )}

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

      {/* 结论 */}
      <SectionCard icon={<Sparkles size={15} strokeWidth={2.5} />} title="结论：单位时间内收益最高的方式">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--leaf-bg)', border: '1.5px solid var(--leaf-soft)' }}>
            <div className="font-display italic text-sm font-bold text-[var(--leaf-deep)] mb-1.5">老板视角（奶茶券 / 小时最大）</div>
            <ul className="text-xs text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
              <li>· 卖最贵的 <b>金露云酪（45 券/杯）</b>，且 Lv1 就能做；普通奶茶 3 券只作保底</li>
              <li>· 冲满 <b>13 级店铺</b>（高级定价 +40%），高峰期让员工打 <b>招牌试饮（+20%）</b></li>
              <li>· 员工特长首选 <b>金牌宣传（热卖值 +10%）</b>，Lv3 起放 2 个 = +20%</li>
              <li>· 库存吃紧时改堆 <b>单价</b>，加「热卖值」无效</li>
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
            <b>一句话最优解：</b>种满森野黄金芽 → 全部做成金露云酪（45 券/杯）→ 店铺冲满 13 级（+40% 定价）→
            雇 2 个「金牌宣传」好友（热卖值 +20%）→ 高峰期打「招牌试饮（+20%）」并用宣传喇叭清库存。
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
