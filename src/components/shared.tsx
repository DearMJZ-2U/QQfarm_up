import React from 'react';
import { createPortal } from 'react-dom';
import { Leaf } from 'lucide-react';
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

function MultiImage({ urls, alt, size, className = '', rounded = false }: {
  urls: string[];
  alt: string;
  size?: number;
  className?: string;
  rounded?: boolean;
}) {
  const [idx, setIdx] = React.useState(0);
  if (idx >= urls.length) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${rounded ? 'rounded-lg' : 'rounded-full'} ${className}`}
        style={{
          background: 'var(--bg-2)',
          ...(size ? { width: size, height: size } : {})
        }}>
        <Leaf size={(size || 32) * 0.5} style={{ color: 'var(--leaf)', opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <img src={urls[idx]} alt={alt}
      className={`object-contain shrink-0 ${rounded ? 'rounded-lg' : ''} ${className}`}
      loading="lazy"
      style={size ? { width: size, height: size } : undefined}
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
  const pfx = gold ? 'gold/' : '';
  const localPfx = `${CLEAN_BASE}seed_images_named/`;

  const urls: string[] = [];
  // 本地图片（以 seedId_name_cropNumber 命名）
  if (sname) urls.push(`${localPfx}${seedId}_${sname}_Crop_${cn}_${phase}.png`);
  // Gold 变体：QQfarm_up 本地暂无，由 extractor 后续补全（见 extractor 改造任务）
  if (gold && cn) urls.push(`${localPfx}gold/Crop_${cn}_${phase}.png`);
  if (gold && seedId) urls.push(`${localPfx}gold/Crop_${seedId}_${phase}.png`);
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
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
      {phaseNames.map((p, i) => (
        <React.Fragment key={i}>
          <div className="flex-shrink-0 flex flex-col items-center gap-1 sm:gap-1.5">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center overflow-hidden"
              style={{
                background: gold ? 'var(--sun-bg)' : 'var(--leaf-bg)',
                border: `1.5px solid ${gold ? 'var(--sun-soft)' : 'var(--leaf-soft)'}`,
              }}>
              <MultiImage urls={resolvePhaseUrls(seedId, p.phase, gold)} alt={p.label} size={40} className="sm:hidden" rounded />
              <MultiImage urls={resolvePhaseUrls(seedId, p.phase, gold)} alt={p.label} size={64} className="hidden sm:block" rounded />
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--ink-mute)] tracking-tight">{p.label}</div>
          </div>
          {i < phaseNames.length - 1 && (
            <span className="text-[var(--ink-mute)]/60 text-lg sm:text-xl flex-shrink-0 -mt-3 sm:-mt-4" aria-hidden>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── 通用装扮/道具/变异图片 ──────────────────────────────

export function RemoteImage({ urls, name, size = 40, className = '', rounded = false }: {
  urls: string[];
  name: string;
  size?: number;
  className?: string;
  rounded?: boolean;
}) {
  return <MultiImage urls={urls} alt={name} size={size} className={className} rounded={rounded} />;
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
