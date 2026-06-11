import React from 'react';
import { Leaf } from 'lucide-react';
import seedMapping from '../data/seed_mapping.json';
import plantData from '../data/Plant.json';
import itemsData from '../data/items.json';
import costumeData from '../data/costume_atlas.json';

const BASE = (import.meta as any).env?.BASE_URL || '/';
const CLEAN_BASE = BASE.endsWith('/') ? BASE : BASE + '/';

const CDN = 'https://jsq.gptvip.chat/images';

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
      <div className={`inline-flex items-center justify-center bg-black/10 dark:bg-white/10 shrink-0 ${rounded ? 'rounded-lg' : 'rounded-full'} ${className}`}
        style={size ? { width: size, height: size } : undefined}>
        <Leaf size={(size || 32) * 0.5} className="text-green-500/50" />
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

export function CropImage({ seedId, name, size = 32, className = '' }: {
  seedId?: number; name: string; size?: number; className?: string;
}) {
  const sid = seedId || 0;
  const cn = sid ? getCropNum(sid) : 0;
  const sname = sid ? getSeedName(sid) : name;
  const fileName = (sid && seedImageMap[sid]) || seedNameImageMap[name];

  const urls: string[] = [];
  if (fileName) urls.push(`${CLEAN_BASE}seed_images_named/${fileName}`);
  if (cn) {
    urls.push(
      `${CDN}/plant/model/v4/Crop_${cn}_Seed.png`,
      `${CDN}/plant/model/v4/Crop_${cn}_6.png`,
      `${CDN}/plant/model/v4/Crop_${cn}_1.png`,
    );
  }
  if (sid) {
    urls.push(`${CDN}/plant/model/v4/Crop_${sid}_Seed.png`);
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
  // CDN
  urls.push(`${CDN}/plant/model/v4/${pfx}Crop_${cn}_${phase}.png`);
  urls.push(`${CDN}/plant/model/v4/${pfx}Crop_${seedId}_${phase}.png`);
  return urls;
}

function sanitize(n: string): string { return n.replace(/[<>:"/\\|?*]/g, '_'); }

export function GrowthPhases({ seedId, gold = false }: { seedId: number; gold?: boolean }) {
  const phaseNames = [
    { label: '种子', phase: 'Seed' },
    { label: '阶段2', phase: '2' },
    { label: '阶段3', phase: '3' },
    { label: '阶段4', phase: '4' },
    { label: '阶段5', phase: '5' },
    { label: '成熟', phase: '6' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {phaseNames.map((p, i) => (
        <React.Fragment key={i}>
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5 flex items-center justify-center overflow-hidden">
              <MultiImage urls={resolvePhaseUrls(seedId, p.phase, gold)} alt={p.label} size={32} rounded />
            </div>
            <div className="text-[8px] text-gray-400">{p.label}</div>
          </div>
          {i < phaseNames.length - 1 && <span className="text-gray-300 text-xs flex-shrink-0">→</span>}
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

export function itemImageUrls(iconFile: string, localFile?: string): string[] {
  const urls: string[] = [];
  if (localFile) urls.push(`${CLEAN_BASE}item_images/${localFile}`);
  if (iconFile) urls.push(`${CDN}/${iconFile}`);
  return urls;
}

export function costumeImageUrls(imgPath: string, name: string): string[] {
  const urls: string[] = [];
  const safe = sanitize(name);
  urls.push(`${CLEAN_BASE}item_images/costume_${safe}.png`);
  if (imgPath) urls.push(`${CDN}/${imgPath}`);
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
  if (iconPath) urls.push(`${CDN}/${iconPath}`);
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
