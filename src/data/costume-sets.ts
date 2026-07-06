// 从现有 costume_atlas.json 派生"套装"维度分类。
// 不修改数据；纯函数：输入 categories[]，输出 { default, events, themes }。

const SUFFIXES = [
  '小屋', '木牌', '栅栏', '塔', '仓库', '街道',
  '狗屋', '围栏', '篱栏', '粮仓', '步道', '迎宾牌', '府邸',
];

function stripGoldPrefix(name: string): string {
  return name.startsWith('黄金·') ? name.slice(3) : name;
}

function parseBasePrefix(name: string): string {
  const n = stripGoldPrefix(name);
  for (const s of SUFFIXES) {
    if (n.endsWith(s) && n.length > s.length) return n.slice(0, -s.length);
  }
  return n;
}

// 手动把"视觉/主题上属于同一套"的前缀合并到目标套。
// 数据中前缀可能略有差异（如"金穗御景"与"金穗至尊"），按用户要求合并。
const SET_ALIASES: Record<string, string> = {
  '金穗御景': '金穗至尊',
  '哈哈南瓜塔': '哈哈南瓜',
  '月华宝荷': '枕水听荷',
};

function canonicalSetName(name: string): string {
  return SET_ALIASES[name] || name;
}

const NON_EVENT_KEYWORDS = new Set(['商店', '装扮']);

function parseEventName(desc: string): string | null {
  const m = desc.match(/【([^】]+)】/);
  if (!m) return null;
  if (NON_EVENT_KEYWORDS.has(m[1])) return null;
  return m[1];
}

// 顶级 section 排序键：YYYY-MM(-DD)。未列出的项排到末尾。
const EVENT_DATES: Record<string, string> = {
  '荷风十里蝉初鸣': '2026-06',
  '夏野农家': '2026-05-30',
  '南瓜乐翻天': '2026-05',
};

export type TopSection =
  | { kind: 'event'; event: EventGroup }
  | { kind: 'theme'; set: CostumeSet };

export function buildOrderedSections(
  events: EventGroup[],
  themes: CostumeSet[]
): TopSection[] {
  const items: { date: string; section: TopSection }[] = [
    ...events.map(e => ({
      date: EVENT_DATES[e.name] || '0000-00',
      section: { kind: 'event', event: e } as TopSection,
    })),
    ...themes.map(s => ({
      date: EVENT_DATES[s.name] || '0000-00',
      section: { kind: 'theme', set: s } as TopSection,
    })),
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date)).map(x => x.section);
}

export interface CostumeItem {
  name: string;
  tag: string;
  desc: string;
  img: string;
  category: string;
}

export interface CostumeSet {
  name: string;
  items: CostumeItem[];
}

export interface EventGroup {
  name: string;
  sets: CostumeSet[];
}

export interface GroupedCostumes {
  default: CostumeSet;
  events: EventGroup[];
  themes: CostumeSet[];
}

export function groupCostumesBySet(
  categories: Array<{ name: string; items: Array<Omit<CostumeItem, 'category'>> }>
): GroupedCostumes {
  const allItems: CostumeItem[] = categories.flatMap(c =>
    c.items.map(i => ({ ...i, category: c.name }))
  );

  const defaultItems: CostumeItem[] = [];
  const eventMap = new Map<string, Map<string, CostumeItem[]>>();
  const themeMap = new Map<string, CostumeItem[]>();

  // Pass 1: 先按 desc 中的【活动名】建立 event -> set 索引。
  // 这让 pass 2 中 desc 缺活动名、但 alias 后能合并到已有活动套的 item 自动归位。
  for (const item of allItems) {
    if (item.tag === '默认') continue;
    const event = parseEventName(item.desc);
    if (!event) continue;
    const prefix = canonicalSetName(parseBasePrefix(item.name));
    if (!eventMap.has(event)) eventMap.set(event, new Map());
    const setMap = eventMap.get(event)!;
    if (!setMap.has(prefix)) setMap.set(prefix, []);
    setMap.get(prefix)!.push(item);
  }

  // Pass 2: 处理 tag=默认 和 desc 无【活动名】的。
  // 当 SET_ALIASES 把 prefix 改名后，先看改名结果是否已在 event 下；若否则入主题套。
  const findEventForSet = (setName: string): string | null => {
    for (const [evName, setMap] of eventMap) {
      if (setMap.has(setName)) return evName;
    }
    return null;
  };

  for (const item of allItems) {
    if (item.tag === '默认') {
      defaultItems.push(item);
      continue;
    }
    if (parseEventName(item.desc)) continue;  // pass 1 已处理
    const prefix = canonicalSetName(parseBasePrefix(item.name));
    const ev = findEventForSet(prefix);
    if (ev) {
      eventMap.get(ev)!.get(prefix)!.push(item);
    } else {
      if (!themeMap.has(prefix)) themeMap.set(prefix, []);
      themeMap.get(prefix)!.push(item);
    }
  }

  const events: EventGroup[] = Array.from(eventMap.entries()).map(([name, setMap]) => ({
    name,
    sets: Array.from(setMap.entries()).map(([name, items]) => ({ name, items })),
  }));

  const themes: CostumeSet[] = Array.from(themeMap.entries())
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'));

  return {
    default: { name: '默认系列', items: defaultItems },
    events,
    themes,
  };
}
