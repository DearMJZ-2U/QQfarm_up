import React from 'react';
import { createPortal } from 'react-dom';
import { Leaf, ArrowRight } from 'lucide-react';
import seedMapping from '../data/seed_mapping.json';
import plantData from '../data/Plant.json';
import itemsData from '../data/items.json';
import costumeData from '../data/costume_atlas.json';
import landsData from '../data/lands_atlas.json';

const BASE = (import.meta as any).env?.BASE_URL || '/';
const CLEAN_BASE = BASE.endsWith('/') ? BASE : BASE + '/';

// ── 种子映射 ──────────────────────────────────────────────

const seedImageMap: Record<number, string> = {};
const seedNameImageMap: Record<string, string> = {};
const seedCropNumber: Record<number, number> = {};
const seedNameMap: Record<number, string> = {};
for (const m of seedMapping) {
  const sid = Number(m.seedId);
  if (sid > 0 && m.fileName) seedImageMap[sid] = m.fileName;
  if (m.name && m.fileName && m.name !== '未知') seedNameImageMap[m.name] = m.fileName;
  if (sid > 0 && m.cropNumber) seedCropNumber[sid] = m.cropNumber;
  if (sid > 0 && m.name && m.name !== '未知') seedNameMap[sid] = m.name;
}

function getCropNum(seedId: number): number {
  return seedCropNumber[seedId] || (seedId % 10000);
}

function getSeedName(seedId: number): string {
  return seedNameMap[seedId] || '';
}

// ── 通用多级图片组件 ────────────────────────────────────

function MultiImage({ urls, alt, size, className = '', rounded = false, pixel = false }: {
  urls: string[];
  alt: string;
  size?: number;
  className?: string;
  rounded?: boolean;
  pixel?: boolean;
}) {
  const [idx, setIdx] = React.useState(0);
  const hasSize = className === '' && size != null;
  if (idx >= urls.length) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${rounded ? 'rounded-lg' : 'rounded-full'} ${className}`}
        style={hasSize ? { background: 'var(--bg-2)', width: size, height: size } : { background: 'var(--bg-2)' }}>
        <Leaf size={(size || 32) * 0.5} style={{ color: 'var(--leaf)', opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <img src={urls[idx]} alt={alt}
      className={`object-contain shrink-0 ${rounded ? 'rounded-lg' : ''} ${pixel ? 'pixel-art' : ''} ${className}`}
      loading="lazy"
      style={hasSize ? { width: size, height: size } : undefined}
      onError={() => setIdx(idx + 1)}
    />
  );
}

// ── 种子图片 ──────────────────────────────────────────────
// 默认显示成熟阶段图（phase 6 / Crop_X_6.png），更易识别
// 像 哈哈南瓜、琉璃宝荷 这种 seed 阶段几乎不可见的作物会优先展示成熟形态

// 白名单：seed 阶段几乎不可见、必须展示成熟图的作物
const MATURE_FORCE_SEED_IDS = new Set<number>([
  21032, // 琉璃宝荷
  20416, // 哈哈南瓜
]);

export function CropImage({ seedId, name, size = 32, className = '' }: {
  seedId?: number; name: string; size?: number; className?: string;
}) {
  const sid = seedId || 0;
  const cn = sid ? getCropNum(sid) : 0;
  const sname = sid ? getSeedName(sid) : name;
  const fileName = (sid && seedImageMap[sid]) || seedNameImageMap[name];
  // 本地 phase 6 文件：把 Seed.png 换成 6.png
  const matureLocal = fileName ? fileName.replace(/_Seed\.png$/, '_6.png') : '';
  const forceMature = sid > 0 && MATURE_FORCE_SEED_IDS.has(sid);

  const urls: string[] = [];
  if (forceMature) {
    // 白名单作物：直接用成熟图
    if (matureLocal && matureLocal !== fileName) {
      urls.push(`${CLEAN_BASE}seed_images_named/${matureLocal}`);
    }
  } else {
    // 1) 本地 Seed 图（默认展示种子阶段）
    if (fileName) urls.push(`${CLEAN_BASE}seed_images_named/${fileName}`);
    // 2) 本地成熟图（少数天工/特殊作物 fallback）
    if (matureLocal && matureLocal !== fileName) {
      urls.push(`${CLEAN_BASE}seed_images_named/${matureLocal}`);
    }
  }

  return <MultiImage urls={urls} alt={sname || name} size={size} className={`drop-shadow-md ${className}`} />;
}

// ── 生长阶段图 ──────────────────────────────────────────

function resolvePhaseUrls(seedId: number, phase: string, gold: boolean): string[] {
  const cn = getCropNum(seedId);
  const sname = sanitize(getSeedName(seedId));
  const localPfx = `${CLEAN_BASE}seed_images_named/`;

  const urls: string[] = [];
  if (gold) {
    // 黄金变体: 优先 .cache 本地 gold/ 目录(extractor 已下载)
    if (cn) urls.push(`${localPfx}gold/Crop_${cn}_${phase}.png`);
    // 兜底: 正常版(extractor 漏下或 gold 缺失时, 如 CN=416/9001 缺 阶段 2-6)
    if (sname) urls.push(`${localPfx}${seedId}_${sname}_Crop_${cn}_${phase}.png`);
  } else {
    if (sname) urls.push(`${localPfx}${seedId}_${sname}_Crop_${cn}_${phase}.png`);
  }
  return urls;
}

function sanitize(n: string): string { return n.replace(/[<>:"/\\|?*]/g, '_'); }

export function GrowthPhases({ seedId, gold = false }: { seedId: number; gold?: boolean }) {
  const phaseNames = [
    { label: '种子', phase: 'Seed' },
    { label: '阶段 2', phase: '2' },
    { label: '阶段 3', phase: '3' },
    { label: '阶段 4', phase: '4' },
    { label: '阶段 5', phase: '5' },
    { label: '成熟', phase: '6' },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-1">
      {phaseNames.map((p, i) => (
        <React.Fragment key={i}>
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: gold ? 'var(--sun-bg)' : 'var(--leaf-bg)',
                border: `1.5px solid ${gold ? 'var(--sun-soft)' : 'var(--leaf-soft)'}`,
              }}>
              <MultiImage urls={resolvePhaseUrls(seedId, p.phase, gold)} alt={p.label} size={64} className="sm:hidden" rounded />
              <MultiImage urls={resolvePhaseUrls(seedId, p.phase, gold)} alt={p.label} size={80} className="hidden sm:block lg:hidden" rounded />
              <MultiImage urls={resolvePhaseUrls(seedId, p.phase, gold)} alt={p.label} size={96} className="hidden lg:block" rounded />
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--ink-mute)] tracking-tight">{p.label}</div>
          </div>
          {i < phaseNames.length - 1 && (
            <span className="text-[var(--ink-mute)]/60 text-lg sm:text-xl lg:text-2xl flex-shrink-0 -mt-5 sm:-mt-6" aria-hidden>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── 通用装扮/道具/变异图片 ──────────────────────────────

export function RemoteImage({ urls, name, size = 40, className = '', rounded = false, pixel = false }: {
  urls: string[];
  name: string;
  size?: number;
  className?: string;
  rounded?: boolean;
  pixel?: boolean;
}) {
  return <MultiImage urls={urls} alt={name} size={size} className={className} rounded={rounded} pixel={pixel} />;
}

export function itemImageUrls(_iconFile: string, localFile?: string): string[] {
  const urls: string[] = [];
  if (localFile) urls.push(`${CLEAN_BASE}item_images/${localFile}`);
  return urls;
}

export function costumeImageUrls(_imgPath: string, name: string): string[] {
  const urls: string[] = [];
  const safe = sanitize(name);
  urls.push(`${CLEAN_BASE}item_images/costume_${safe}.png`);
  return urls;
}

// ── 超变图鉴图片查找 ──────────────────────────────────────

const itemByName: Record<string, { iconFile: string; localFile: string }> = {};
for (const cat of itemsData.categories) {
  for (const item of cat.items) {
    if (item.name) {
      itemByName[item.name] = { iconFile: item.iconFile, localFile: (item as any).localFile || '' };
    }
  }
}

const costumeImgByName: Record<string, string> = {};
for (const cat of costumeData.categories) {
  for (const item of cat.items) {
    if (item.name) {
      costumeImgByName[item.name] = item.img;
    }
  }
}

export function goldenAtlasImageUrls(name: string): string[] {
  const item = itemByName[name];
  if (item) return itemImageUrls(item.iconFile, item.localFile);
  const costumeImg = costumeImgByName[name];
  if (costumeImg !== undefined) return costumeImageUrls(costumeImg, name);
  return [];
}

// ── 超变图鉴成长阶段 ──────────────────────────────────────

export const goldSeedIds: Record<string, number> = {
  '黄金·哈哈南瓜': 20416, '黄金·风信子': 20112, '黄金·银杏树苗': 20025, '黄金·蔷薇': 20121,
  '黄金·蝴蝶兰': 20109, '黄金·昙花': 20224, '黄金·荷包牡丹': 20249, '黄金·艾草': 21135,
  '黄金·卡特兰': 20184, '黄金·红云飞片': 20193, '黄金·石竹花': 20256, '黄金·针垫花': 20261,
  '黄金·孔雀草': 20257, '黄金·欧石楠': 20258, '黄金·黄金果': 20304, '黄金·爱心果': 20046,
  '黄金·丁香花': 20122, '黄金·欢乐糖果': 20167, '黄金·似何莲': 20185, '黄金·凤仙花': 20133,
  '黄金·金银花': 20176, '黄金·米兰': 20186, '黄金·鹭草': 20251, '黄金·地涌金莲': 20267,
  '黄金·繁星花': 21044, '黄金·香彩雀': 21038, '黄金·荷青花': 21474, '黄金·芹叶铁线莲': 20243,
  '黄金·菖蒲': 21134, '黄金·凌霄花': 26127, '黄金·哈哈小南瓜': 20416, '哈哈小南瓜': 20416,
  '黄金·琉璃宝荷': 21032, '哈哈南瓜塔': 20416, '黄金·哈哈南瓜塔': 20416,
  '月华宝荷': 21032, '黄金·月华宝荷': 21032,
  '荷花': 26109, '黄金·荷花': 26109, '绵绵糖果': 20167,
  '黄金·绿牡丹': 20134, '黄金·糖槭树花': 20139, '黄金·象牙红': 20140,
  '黄金·七里香': 20144, '黄金·月桂花': 20154, '黄金·夏蜡梅': 20223,
  '黄金·石莲花': 20199, '黄金·帝王花': 20262, '黄金·天竺葵': 20263, '黄金·桔梗花': 20269,
};

export function mutationIconUrls(iconPath: string, name: string): string[] {
  const urls: string[] = [];
  const iconBasename = iconPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || sanitize(name);
  urls.push(`${CLEAN_BASE}item_images/mutant_${iconBasename}.png`);
  return urls;
}

// ── 阶段解析 ──────────────────────────────────────────────

export function parseGrowPhases(growPhases: string) {
  if (!growPhases) return [];
  return growPhases.split(';').map(x => x.trim()).filter(Boolean).map(seg => {
    const parts = seg.split(':');
    return parts.length >= 2 ? (Number(parts[1]) || 0) : 0;
  }).filter(sec => sec > 0);
}

export const plantPhaseMap: Record<number, number> = {};
export const plantLastPhaseMap: Record<number, number> = {};
export const plantAllPhasesMap: Record<number, number[]> = {};
for (const p of plantData) {
  const seedId = Number(p.seed_id);
  if (seedId > 0 && !plantPhaseMap[seedId]) {
    const phases = parseGrowPhases(p.grow_phases);
    if (phases.length > 0) {
      plantPhaseMap[seedId] = phases[0];
      plantLastPhaseMap[seedId] = phases[phases.length - 1];
      plantAllPhasesMap[seedId] = phases;
    }
  }
}

export function formatSec(sec: number) {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r > 0 ? `${m}分${r}秒` : `${m}分钟`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}小时${mm}分` : `${h}小时`;
}

export const LAND_BUFFS = {
  normal: { time: 1.0, exp: 1.0, yield: 1.0 },
  red: { time: 1.0, exp: 1.0, yield: 2.0 },
  black: { time: 0.9, exp: 1.0, yield: 3.0 },
  gold: { time: 0.8, exp: 1.2, yield: 4.0 },
  purple: { time: 0.8, exp: 1.25, yield: 4.0 },
};

export const NO_FERT_PLANT_SPEED = 9;
export const NORMAL_FERT_PLANT_SPEED = 6;

// ── 按等级算出该等级下应配置的土地数量 ─────────────────────
// 基于 lands_atlas.json 中每块地的实际升级等级表（plot 1-24）：
//   红 Lv28-57 · 黑 Lv40-69 · 金 Lv58-87 · 紫 Lv90-159
// 例如 Lv114 时，plot 1-8 的紫晶解锁在 90-111（已升级），
// plot 9 紫晶解锁 114（恰好刚解锁，默认不计入），plot 10+ 还需 Lv117+。
// 所以 Lv114 自动配：8 紫晶 + 16 金 = 24。
export function calcBestLands(level: number, total: number) {
  const upgrades = (landsData as any).upgrades as Array<{ plotId: number; upgrades: Array<{ type: string; level: number }> }>;
  const tierOrder: Array<{ key: 'purple' | 'gold' | 'black' | 'red'; type: string }> = [
    { key: 'purple', type: '紫晶土地' },
    { key: 'gold',   type: '金土地' },
    { key: 'black',  type: '黑土地' },
    { key: 'red',    type: '红土地' },
  ];
  const counts = { normal: 0, red: 0, black: 0, gold: 0, purple: 0 };
  const max = Math.min(total, 24);
  for (let i = 0; i < max; i++) {
    const plot = upgrades[i];
    if (!plot) { counts.normal++; continue; }
    let assigned = false;
    for (const t of tierOrder) {
      const u = plot.upgrades.find(x => x.type === t.type);
      // 严格 >：刚到解锁等级的那一级算"刚解锁但还未升级"
      if (u && level > u.level) {
        counts[t.key]++;
        assigned = true;
        break;
      }
    }
    if (!assigned) counts.normal++;
  }
  return counts;
}

// ── React Portal wrapper：把弹窗渲染到 document.body 避开 transform 影响 ──

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ══════════════════════════════════════════════════════════════
// 设计系统共享组件 — 取代各页面里重复造轮子的实现
// ══════════════════════════════════════════════════════════════

// ── EmptyState — 统一空状态 ──────────────────────────────────

export function EmptyState({
  emoji = '🌾',
  title,
  hint,
}: {
  emoji?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-emoji" aria-hidden>{emoji}</div>
      <div className="empty-state-title">{title}</div>
      {hint && <div className="empty-state-hint">{hint}</div>}
    </div>
  );
}

// ── PillTabGroup — 统一 tab / 过滤器 pill 组 ──────────────────
// 用法：
//   <PillTabGroup
//     items={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]}
//     value={tab} onChange={setTab}
//     accent="leaf"
//   />

export interface PillTabItem {
  id: string;
  label: string;
  emoji?: string;
  count?: number;
  disabled?: boolean;
}

export function PillTabGroup({
  items,
  value,
  onChange,
  accent,
  size = 'md',
}: {
  items: PillTabItem[];
  value: string;
  onChange: (id: string) => void;
  /** 选填：accent 决定 active pill 的高亮色。空 = 纯中性。 */
  accent?: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum';
  size?: 'sm' | 'md';
}) {
  const style = accent ? ({ '--accent': `var(--${accent})`, '--accent-deep': `var(--${accent}-deep)` } as React.CSSProperties) : undefined;
  return (
    <div className="pill-tab-group" style={style}>
      {items.map(item => {
        const active = item.id === value;
        const cls = [
          'pill-tab',
          active ? 'pill-tab-active' : '',
          accent && active ? 'pill-tab-accent' : '',
        ].filter(Boolean).join(' ');
        const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => !item.disabled && onChange(item.id)}
            disabled={item.disabled}
            className={cls}
            style={{ fontSize }}
            aria-pressed={active}>
            {item.emoji && <span className="text-sm leading-none">{item.emoji}</span>}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="font-mono tnum opacity-70" style={{ fontSize: '0.65rem' }}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── 品级（天工 / 珍品 / 稀有 / 普通）─────────────────────────
// 道具图鉴里 05 种子 + 17 超变果实 的名字会按 rarity 上色 + hover 显示品级。
// 颜色优先用 items.json 里的 rarityColor，缺失时按 rarity 走默认映射。

export type GradeName = '天工' | '珍品' | '稀有' | '普通';

const GRADE_COLOR_BY_RARITY: Record<number, string> = {
  4: 'D1A21E',
  3: 'B09DED',
  2: 'A8C1F4',
  1: 'D2C5AC',
};

const GRADE_NAME_BY_RARITY: Record<number, GradeName> = {
  4: '天工',
  3: '珍品',
  2: '稀有',
  1: '普通',
};

export function getGrade(rarity: number | string | undefined, rarityColor?: string): {
  name: GradeName;
  color: string;
} {
  const r = Number(rarity) || 1;
  const color = (rarityColor && String(rarityColor).trim()) || GRADE_COLOR_BY_RARITY[r] || '334155';
  const name = GRADE_NAME_BY_RARITY[r] || '普通';
  return { name, color };
}

// ── RowCard — 统一行卡片 ─────────────────────────────────────

export function RowCard({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
} & React.AriaAttributes) {
  const cls = ['row-card', onClick ? 'row-card-press' : '', className].filter(Boolean).join(' ');
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    );
  }
  return <div className={cls}>{children}</div>;
}

// ── StatTile — 统一小统计卡 ──────────────────────────────────

export function StatTile({
  label,
  value,
  hint,
  color,
  muted,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  /** 选填：语义色。会同时给底色 + 边框。 */
  color?: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' | 'ink';
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  const colorCls = color ? `stat-tile-${color}` : '';
  const cls = ['stat-tile', colorCls, muted ? 'stat-tile-muted' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="flex items-center justify-between gap-2">
        <div className="stat-tile-label">{label}</div>
        {icon}
      </div>
      <div className="stat-tile-value">{value}</div>
      {hint && <div className="stat-tile-hint">{hint}</div>}
    </div>
  );
}

// ── LandSwatch — 统一土地色块 ───────────────────────────────

export function LandSwatch({ type, size = 20 }: { type: 'normal' | 'red' | 'black' | 'gold' | 'purple'; size?: number }) {
  const labels: Record<string, string> = { normal: '普', red: '红', black: '黑', gold: '金', purple: '紫' };
  return (
    <span
      className={`land-swatch land-swatch-${type}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={labels[type]}>
      {labels[type]}
    </span>
  );
}

// ── ToggleCard — 农场风开关（复选框 + emoji + 标题 + 提示） ────
// Calculator / CropAtlas 重复实现两次，现统一。

export function ToggleCard({
  checked,
  onChange,
  disabled,
  emoji,
  label,
  hint,
  color,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  emoji: string;
  label: string;
  hint: string;
  color: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum';
} & React.AriaAttributes) {
  return (
    <label
      className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all border-1.5 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--bg-2)]'
      }`}
      style={{
        background: checked ? `var(--${color}-bg)` : 'var(--bg-2)',
        border: `1.5px solid ${checked ? `var(--${color})` : 'var(--line)'}`,
      }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="farm-check mt-0.5"
        style={checked && !disabled ? { background: `var(--${color})`, borderColor: `var(--${color})` } : {}}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
          <span className="text-sm sm:text-base leading-none">{emoji}</span>
          <span className="text-xs font-bold text-[var(--ink)]">{label}</span>
        </div>
        <div className="text-[10px] text-[var(--ink-mute)] leading-snug">{hint}</div>
      </div>
    </label>
  );
}

// ── LevelRangeInput — 等级范围输入（Lv a → Lv b + 快速跳转） ──
// LevelSearchTab 和 LandUpgradeCalcTab 都用。

export function LevelRangeInput({
  from,
  to,
  onFromChange,
  onToChange,
  presets,
  onPreset,
  fromPlaceholder = '当前',
  toPlaceholder = '目标',
  invalid,
}: {
  from: number | '';
  to: number | '';
  onFromChange: (v: number | '') => void;
  onToChange: (v: number | '') => void;
  presets: Array<{ label: string; from: number; to: number }>;
  onPreset: (p: { from: number; to: number }) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  invalid?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1">{fromPlaceholder}</div>
          <input
            type="number"
            value={from}
            onChange={e => onFromChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="input-pop text-center"
            min={1}
            max={200}
            style={invalid ? { borderColor: 'var(--berry)' } : {}}
          />
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-5"
          style={{ background: 'var(--plum-bg)', color: 'var(--plum-deep)' }}>
          <ArrowRight size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--ink-mute)] mb-1">{toPlaceholder}</div>
          <input
            type="number"
            value={to}
            onChange={e => onToChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="input-pop text-center"
            min={1}
            max={200}
            style={invalid ? { borderColor: 'var(--berry)' } : {}}
          />
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onPreset(p)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors"
            style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CategoryNav — 共享分类导航 ──────────────────────────────
// Atlas tab 和 ItemsTab 都用：移动端横滚 pill，桌面端 sticky 侧栏。

export interface CategoryNavItem {
  id: string;
  label: string;
  emoji: string;
  count?: number;
  color: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum';
}

export function CategoryNav({
  items,
  value,
  onChange,
}: {
  items: CategoryNavItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      {/* 移动端：横滚 pill */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {items.map(t => {
            const active = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all"
                style={
                  active
                    ? { background: `var(--${t.color})`, color: 'white', boxShadow: `0 2px 0 var(--${t.color}-deep)` }
                    : { background: 'var(--bg-2)', color: 'var(--ink-soft)' }
                }
                aria-pressed={active}>
                <span className="text-base">{t.emoji}</span>
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className="font-mono tnum opacity-80" style={{ fontSize: '0.65rem' }}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 桌面端：sticky 侧栏 */}
      <div className="hidden lg:block space-y-1.5 sticky" style={{ top: 'calc(var(--header-h) + 1.5rem)' }}>
        <div className="section-eyebrow px-2 pb-2">分类</div>
        {items.map(t => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${!active && 'hover:bg-[var(--bg-2)]'}`}
              style={
                active
                  ? {
                      background: `var(--${t.color}-bg)`,
                      border: `1.5px solid var(--${t.color})`,
                      boxShadow: 'var(--shadow-pop)',
                    }
                  : { border: '1.5px solid transparent' }
              }
              aria-pressed={active}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: active ? 'rgba(255,255,255,0.7)' : `var(--${t.color}-bg)` }}>
                <span>{t.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[var(--ink)] truncate">{t.label}</div>
                {t.count !== undefined && (
                  <div className="text-[11px] font-mono text-[var(--ink-mute)] tnum">{t.count}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
