/**
 * QQ农场数据同步脚本
 * 从配置接口提取最新游戏配置数据，生成项目所需的JSON文件并下载图片资源
 *
 * 用法: npx tsx scripts/sync_data.ts
 *       或 npm run sync-data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const BASE_URL = 'https://jsq.gptvip.chat';
const IMAGE_BASE = `${BASE_URL}/images/`;
const SRC_DATA = path.join(ROOT, 'src', 'data');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'seed_images_named');
const PUBLIC_ITEM_IMAGES = path.join(ROOT, 'public', 'item_images');

// ── 分类定义 ──────────────────────────────────────────────

const CATEGORIES = [
  { id: '05', name: '种子', icon: '🌱' },
  { id: '17', name: '超变果实', icon: '✨' },
  { id: '02', name: '货币与计数', icon: '💰' },
  { id: '04', name: '操作工具', icon: '🛠️' },
  { id: '07', name: '化肥道具', icon: '🧪' },
  { id: '10', name: '头像框与装饰', icon: '🎨' },
  { id: '08', name: '狗与看门犬', icon: '🐕' },
  { id: '09', name: '狗粮', icon: '🦴' },
  { id: '19', name: '活动货币', icon: '🎟' },
  { id: '01', name: '系统占位', icon: '🔧' },
  { id: '03', name: '经验与成长', icon: '⭐' },
  { id: '15', name: '充值货币', icon: '💎' },
];

// ── 类型定义 ──────────────────────────────────────────────

interface RawItem {
  id?: number;
  name?: string;
  desc?: string;
  level?: number;
  rarity?: number;
  layer?: number | null;
  rarity_color?: string;
  _icon_file?: string;
  _seasons?: number;
  _growth_stage_count?: number;
  _exp?: number;
  _exp_per_minute?: number;
  _fruit_count?: number;
  _fruit_sell_price?: number | null;
  _land_level?: number;
  _mutant?: unknown;
  _unlisted?: boolean;
  asset_name?: string;
  sells?: string;
  effectDesc?: string;
  interaction_type?: string;
  type?: number;
  _grow_phases?: string;
  [key: string]: unknown;
}

interface ItemEntry {
  id: number;
  name: string;
  desc: string;
  rarity: number;
  rarityColor: string;
  level: number;
  seasons: number;
  growthStages: number;
  exp: number;
  expPerMin: number;
  fruitCount: number;
  assetName: string;
  iconFile: string;
  growPhases: string;
  sells: string;
  cropNumber: number;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  count: number;
  items: ItemEntry[];
}

// ── 工具函数 ──────────────────────────────────────────────

async function fetchCategory(catId: string): Promise<RawItem[]> {
  const url = `${BASE_URL}/items/${catId}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`  ✗ /items/${catId} HTTP ${response.status}`);
    return [];
  }
  const html = await response.text();
  const match = html.match(/const ITEMS = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error(`  ✗ /items/${catId} 未找到ITEMS数组`);
    return [];
  }
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.error(`  ✗ /items/${catId} JSON解析失败`);
    return [];
  }
}

function normalizeItem(raw: RawItem): ItemEntry {
  const id = raw.id || 0;
  const name = (raw.name || '').replace(/种子$/, '');
  const assetName = raw.asset_name || '';
  const iconFile = raw._icon_file || '';
  const cropMatch = assetName.match(/Crop_(\d+)/);
  const cropNumber = cropMatch ? parseInt(cropMatch[1]) : 0;

  return {
    id,
    name,
    desc: raw.desc || '',
    rarity: raw.rarity || 1,
    rarityColor: raw.rarity_color || '334155',
    level: raw.level || 0,
    seasons: raw._seasons || 1,
    growthStages: raw._growth_stage_count || 0,
    exp: raw._exp || 0,
    expPerMin: raw._exp_per_minute || 0,
    fruitCount: raw._fruit_count || 0,
    assetName,
    iconFile,
    growPhases: raw._grow_phases || '',
    sells: raw.sells || '0:0',
    cropNumber,
  };
}

function parseGrowTimeSec(growPhases: string): number {
  let total = 0;
  for (const seg of growPhases.split(';')) {
    const parts = seg.trim().split(':');
    if (parts.length >= 2) {
      const s = parseInt(parts[1]);
      if (!isNaN(s)) total += s;
    }
  }
  return total;
}

function formatGrowTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r > 0 ? `${m}分${r}秒` : `${m}分钟`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}小时${mm}分` : `${h}小时`;
}

function extractPrice(sells: string): number {
  const parts = sells.split(':');
  if (parts.length >= 2) {
    const p = parseInt(parts[1]);
    if (!isNaN(p)) return p;
  }
  return 0;
}

// ── 图片下载 ──────────────────────────────────────────────

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  if (fs.existsSync(destPath)) return true;
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function downloadSeedImages(items: ItemEntry[]): Promise<void> {
  console.log(`\n  下载种子图片 (共 ${items.length} 个)...`);
  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });

  let done = 0; let fail = 0;
  const CONCURRENCY = 8;

  for (let b = 0; b < items.length; b += CONCURRENCY) {
    const batch = items.slice(b, b + CONCURRENCY);
    const results = await Promise.all(batch.map(async item => {
      const cropNum = item.cropNumber || (item.id % 10000);
      const fileName = `${item.id}_${item.name}_${item.assetName || `Crop_${cropNum}`}_Seed.png`;
      const destPath = path.join(PUBLIC_IMAGES, fileName);

      const urls = [
        `${IMAGE_BASE}plant/model/v4/${item.assetName}_Seed.png`,
        `${IMAGE_BASE}plant/model/v4/Crop_${cropNum}_Seed.png`,
        `${IMAGE_BASE}plant/model/v4/Crop_${cropNum % 10000}_Seed.png`,
      ];
      for (const url of urls) {
        if (await downloadImage(url, destPath)) return { ok: true };
      }
      return { ok: false, name: item.name };
    }));

    for (const r of results) {
      if (r.ok) done++; else { fail++; if ('name' in r) console.log(`    ✗ ${r.name}`); }
    }
    if ((b + CONCURRENCY) % 24 === 0 || b + CONCURRENCY >= items.length) {
      console.log(`    进度: ${b + batch.length}/${items.length}`);
    }
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  console.log(`  种子图片: ${done} 成功, ${fail} 失败`);
}

async function downloadGrowthPhaseImages(items: ItemEntry[]): Promise<void> {
  console.log('\n  下载成长阶段图片...');
  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });

  const phases = ['2', '3', '4', '5', '6'];
  let done = 0; let fail = 0;
  const CONCURRENCY = 6;

  const queue: { item: ItemEntry; phase: string }[] = [];
  for (const item of items) {
    for (const phase of phases) {
      queue.push({ item, phase });
    }
  }

  for (let b = 0; b < queue.length; b += CONCURRENCY) {
    const batch = queue.slice(b, b + CONCURRENCY);
    const results = await Promise.all(batch.map(async ({ item, phase }) => {
      const cropNum = item.cropNumber || (item.id % 10000);
      const phaseName = `_${phase}`;
      const fileName = `${item.id}_${item.name}_${item.assetName || `Crop_${cropNum}`}${phaseName}.png`;
      const destPath = path.join(PUBLIC_IMAGES, fileName);

      const urls = [
        `${IMAGE_BASE}plant/model/v4/Crop_${cropNum}${phaseName}.png`,
        `${IMAGE_BASE}plant/model/v4/Crop_${cropNum % 10000}${phaseName}.png`,
      ];
      for (const url of urls) {
        if (await downloadImage(url, destPath)) return { ok: true };
      }
      return { ok: false };
    }));

    for (const r of results) {
      if (r.ok) done++; else fail++;
    }
    if ((b + CONCURRENCY) % 48 === 0 || b + CONCURRENCY >= queue.length) {
      console.log(`    进度: ${b + batch.length}/${queue.length}`);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  console.log(`  阶段图片: ${done} 成功, ${fail} 失败`);
}

async function downloadItemImages(catId: string, items: ItemEntry[]): Promise<void> {
  fs.mkdirSync(PUBLIC_ITEM_IMAGES, { recursive: true });
  let done = 0; let fail = 0;

  for (const item of items) {
    if (!item.iconFile) continue;
    const ext = path.extname(item.iconFile) || '.png';
    const fileName = `${catId}_${item.id}_${sanitizeFilename(item.name)}${ext}`;
    const destPath = path.join(PUBLIC_ITEM_IMAGES, fileName);
    const url = `${IMAGE_BASE}${item.iconFile}`;

    if (await downloadImage(url, destPath)) done++;
    else { fail++; console.log(`    ✗ ${item.name}`); }

    await new Promise(resolve => setTimeout(resolve, 30));
  }
  if (done + fail > 0) {
    console.log(`  道具图片: ${done} 成功, ${fail} 失败`);
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
}

async function downloadMutationIcons(): Promise<void> {
  const icons = [
    'moon', 'lotus', 'mian', 'haha', 'tata', 'golden', 'frozen', 'love', 'dark', 'moist',
  ];
  console.log('\n  下载变异图标...');
  fs.mkdirSync(PUBLIC_ITEM_IMAGES, { recursive: true });
  let done = 0;
  for (const name of icons) {
    const url = `${IMAGE_BASE}extraRes/gui/texture/mutant/icon/${name}.png`;
    const dest = path.join(PUBLIC_ITEM_IMAGES, `mutant_${name}.png`);
    if (await downloadImage(url, dest)) done++;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  console.log(`  变异图标: ${done}/${icons.length}`);
}

async function downloadCostumeImages(): Promise<void> {
  console.log('  下载装扮图片...');
  fs.mkdirSync(PUBLIC_ITEM_IMAGES, { recursive: true });
  const costumeData = JSON.parse(fs.readFileSync(path.join(SRC_DATA, 'costume_atlas.json'), 'utf-8'));
  let done = 0; let total = 0;
  for (const cat of (costumeData as any).categories) {
    for (const item of cat.items) {
      total++;
      if (!item.img) continue;
      const url = `${IMAGE_BASE}${item.img}`;
      const dest = path.join(PUBLIC_ITEM_IMAGES, `costume_${sanitizeFilename(item.name)}.png`);
      if (await downloadImage(url, dest)) done++;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }
  console.log(`  装扮图片: ${done}/${total}`);
}

// ── 主流程 ────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   QQ农场数据同步工具 v2                    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const exportedAt = new Date().toISOString();

  // ── 1. 获取全部分类数据 ──
  console.log('[1/4] 获取全部分类数据...\n');
  const allCategories: CategoryData[] = [];

  for (const cat of CATEGORIES) {
    process.stdout.write(`  /items/${cat.id} (${cat.name})... `);
    const rawItems = await fetchCategory(cat.id);
    const items = rawItems.map(normalizeItem).filter(i => i.id > 0);
    console.log(`${items.length} 个道具`);

    allCategories.push({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      count: items.length,
      items,
    });
  }

  // ── 2. 生成 seeds.json, Plant.json, seed_mapping.json ──
  console.log('\n[2/4] 生成种子专属数据...');
  const seedCat = allCategories.find(c => c.id === '05')!;
  const seedItems = seedCat.items;

  const rows = seedItems.map(item => {
    const growTimeSec = parseGrowTimeSec(item.growPhases);
    const price = extractPrice(item.sells);
    const expPerHour = growTimeSec > 0 ? Math.round((item.exp / (growTimeSec / 3600)) * 100) / 100 : 0;
    const expPerGold = price > 0 ? Math.round((item.exp / price) * 1000000) / 1000000 : 0;

    return {
      seedId: item.id,
      goodsId: 0,
      plantId: 0,
      name: item.name,
      requiredLevel: item.level,
      price,
      unlocked: false,
      limitCount: 0,
      boughtNum: 0,
      exp: item.exp,
      expPerCycle: item.exp + 1,
      growTimeSec,
      growTimeStr: formatGrowTime(growTimeSec),
      expPerHour,
      expPerGold,
      seasons: item.seasons,
      fruitId: 0,
      fruitCount: item.fruitCount,
    };
  });

  const seedsData = { exportedAt, count: rows.length, rows };

  const plantEntries = seedItems.map(item => ({
    seed_id: item.id,
    name: item.name,
    grow_phases: item.growPhases,
  }));

  const seedMappings = seedItems.map(item => ({
    cropNumber: item.cropNumber || (item.id % 10000),
    seedId: item.id,
    name: item.name,
    fileName: `${item.id}_${item.name}_${item.assetName || `Crop_${item.cropNumber || (item.id % 10000)}`}_Seed.png`,
  }));

  fs.mkdirSync(SRC_DATA, { recursive: true });

  fs.writeFileSync(path.join(SRC_DATA, 'seeds.json'), JSON.stringify(seedsData, null, 2), 'utf-8');
  console.log(`  ✓ seeds.json (${rows.length} 条)`);

  fs.writeFileSync(path.join(SRC_DATA, 'Plant.json'), JSON.stringify(plantEntries, null, 2), 'utf-8');
  console.log(`  ✓ Plant.json (${plantEntries.length} 条)`);

  fs.writeFileSync(path.join(SRC_DATA, 'seed_mapping.json'), JSON.stringify(seedMappings, null, 2), 'utf-8');
  console.log(`  ✓ seed_mapping.json (${seedMappings.length} 条)`);

  // ── 3. 生成 items.json (全量道具统一文件) ──
  console.log('\n[3/4] 生成 items.json...');

  // 为每个item添加本地图片路径
  const itemsData = {
    exportedAt,
    categories: allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      count: cat.count,
      items: cat.items.map(item => {
        const ext = path.extname(item.iconFile) || '.png';
        const localFile = cat.id === '05'
          ? `${item.id}_${item.name}_${item.assetName || `Crop_${item.cropNumber || (item.id % 10000)}`}_Seed.png`
          : `${cat.id}_${item.id}_${sanitizeFilename(item.name)}${ext}`;
        return {
          ...item,
          localFile,
        };
      }),
    })),
  };

  fs.writeFileSync(path.join(SRC_DATA, 'items.json'), JSON.stringify(itemsData, null, 2), 'utf-8');
  console.log(`  ✓ items.json (${allCategories.length} 个分类, ${allCategories.reduce((s, c) => s + c.count, 0)} 个道具)`);

  // ── 4. 下载图片 ──
  console.log('\n[4/4] 同步图片资源...');

  // 种子图片
  await downloadSeedImages(seedItems);

  // 成长阶段图片
  await downloadGrowthPhaseImages(seedItems);

  // 其他分类图片
  for (const cat of allCategories) {
    if (cat.id === '05') continue;
    if (cat.items.length === 0) continue;
    process.stdout.write(`  /items/${cat.id} (${cat.name})... `);
    await downloadItemImages(cat.id, cat.items);
  }

  // 变异图标和装扮图片
  await downloadMutationIcons();
  await downloadCostumeImages();

  // ── 汇总 ──
  console.log('\n═══════════════════════════════════════');
  console.log('  同步完成!');
  console.log(`  seeds.json:          ${rows.length} 种作物`);
  console.log(`  Plant.json:          ${plantEntries.length} 条阶段`);
  console.log(`  seed_mapping.json:   ${seedMappings.length} 条映射`);
  console.log(`  items.json:          ${allCategories.length} 个分类`);
  for (const c of allCategories) {
    console.log(`    ${c.icon} ${c.name}: ${c.count}`);
  }
  console.log(`  导出时间: ${exportedAt}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
  console.error('同步失败:', err);
  process.exit(1);
});
