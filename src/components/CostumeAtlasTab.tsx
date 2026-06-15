import React from 'react';
import { motion } from 'motion/react';
import { Home, Package, FolderTree } from 'lucide-react';
import costumeData from '../data/costume_atlas.json';
import { groupCostumesBySet, buildOrderedSections, type CostumeItem, type CostumeSet } from '../data/costume-sets';
import { RemoteImage, costumeImageUrls } from './shared';

const tagChip: Record<string, string> = {
  '默认': 'chip-ink',
  '活动': 'chip-orange',
  '黄金': 'chip-sun',
};

const catAccents = ['leaf', 'orange', 'sun', 'berry', 'sky', 'plum'];

type ViewTab = 'functional' | 'set';

function ItemCard({ item }: { item: CostumeItem; key?: React.Key }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: 'var(--bg-2)' }}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface)' }}>
        <RemoteImage urls={costumeImageUrls(item.img, item.name)} name={item.name} size={48} rounded />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-bold text-sm text-[var(--ink)] truncate">{item.name}</span>
          <span className={`chip ${tagChip[item.tag] || tagChip['默认']} flex-shrink-0`} style={{ fontSize: '0.6rem' }}>
            {item.tag}
          </span>
        </div>
        <div className="text-[10px] text-[var(--ink-mute)] leading-snug">{item.desc}</div>
      </div>
    </div>
  );
}

function ItemGrid({ items }: { items: CostumeItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, j) => (
        <ItemCard key={j} item={item} />
      ))}
    </div>
  );
}

function FunctionalView() {
  const { categories } = costumeData;
  return (
    <>
      {categories.map((cat, i) => {
        const accent = catAccents[i % catAccents.length];
        return (
          <motion.section key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}>
            <div className="sticker-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3"
                style={{ background: `var(--${accent}-bg)`, borderBottom: `1.5px solid var(--${accent}-soft)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(255,255,255,0.8)' }}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display italic text-base font-bold" style={{ color: `var(--${accent}-deep)` }}>
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-[var(--ink-soft)]">{cat.desc}</p>
                </div>
                <span className="chip" style={{ background: 'rgba(255,255,255,0.7)', color: `var(--${accent}-deep)` }}>
                  {cat.items.length} 件
                </span>
              </div>

              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.items.map((item, j) => (
                  <ItemCard key={j} item={{ ...item, category: cat.name }} />
                ))}
              </div>
            </div>
          </motion.section>
        );
      })}
    </>
  );
}

function SetRow({ set, accent }: { set: CostumeSet; accent: string; key?: React.Key }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: `var(--${accent})` }} />
        <span className="font-bold text-sm text-[var(--ink)]">{set.name}</span>
        <span className="chip chip-ink flex-shrink-0" style={{ fontSize: '0.6rem' }}>{set.items.length} 件</span>
      </div>
      <ItemGrid items={set.items} />
    </div>
  );
}

function Section({ title, desc, icon, count, accent, children }: {
  title: string; desc?: string; icon: string; count: string; accent: string;
  children: React.ReactNode; key?: React.Key;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <div className="sticker-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ background: `var(--${accent}-bg)`, borderBottom: `1.5px solid var(--${accent}-soft)` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(255,255,255,0.8)' }}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-display italic text-base font-bold" style={{ color: `var(--${accent}-deep)` }}>
              {title}
            </h3>
            {desc && <p className="text-[10px] text-[var(--ink-soft)]">{desc}</p>}
          </div>
          <span className="chip" style={{ background: 'rgba(255,255,255,0.7)', color: `var(--${accent}-deep)` }}>
            {count}
          </span>
        </div>

        <div className="p-3">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function SetView() {
  const grouped = React.useMemo(
    () => groupCostumesBySet(costumeData.categories as any),
    []
  );

  // 顶级 section 共享 6 色循环：默认 = ink；活动 / 主题套按排序后顺序循环分配。
  const ordered = React.useMemo(
    () => buildOrderedSections(grouped.events, grouped.themes),
    [grouped]
  );
  const topAccents = (idx: number) => catAccents[idx % catAccents.length];

  return (
    <>
      {ordered.map((sec, i) => {
        const accent = topAccents(i);
        if (sec.kind === 'event') {
          const ev = sec.event;
          const totalItems = ev.sets.reduce((s, x) => s + x.items.length, 0);
          return (
            <Section key={`e:${ev.name}`} title={ev.name} icon="🎉" accent={accent} count={`${ev.sets.length} 套 · ${totalItems} 件`}>
              <div className="space-y-4 pl-3 border-l border-[var(--line)]">
                {ev.sets.map((set, j) => (
                  <SetRow key={j} set={set} accent={accent} />
                ))}
              </div>
            </Section>
          );
        }
        const set = sec.set;
        return (
          <Section key={`t:${set.name}`} title={set.name} icon="🎨" accent={accent} count={`${set.items.length} 件`}>
            <ItemGrid items={set.items} />
          </Section>
        );
      })}

      <Section title="默认系列" icon="🎒" accent="ink" count={`${grouped.default.items.length} 件`}>
        <ItemGrid items={grouped.default.items} />
      </Section>
    </>
  );
}

function StatCard({ accent, emoji, label, value }: { accent: string; emoji: string; label: string; value: number | string }) {
  return (
    <div className="sticker p-3 text-center"
      style={accent !== 'ink' ? { borderColor: `var(--${accent})` } : undefined}>
      <div className="text-xl mb-1">{emoji}</div>
      <div className="font-mono tnum text-2xl font-black"
        style={{ color: accent === 'ink' ? 'var(--ink)' : `var(--${accent}-deep)` }}>
        {value}
      </div>
      <div className="text-[10px] text-[var(--ink-mute)] mt-0.5 font-bold uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function CostumeAtlasTab() {
  const [view, setView] = React.useState<ViewTab>('functional');
  const { categories } = costumeData;
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const defaultCount = categories.reduce((s, c) => s + c.items.filter(i => i.tag === '默认').length, 0);
  const eventCount = categories.reduce((s, c) => s + c.items.filter(i => i.tag === '活动').length, 0);

  const tabs: { id: ViewTab; label: string; emoji: string; accent: string; icon: React.ElementType }[] = [
    { id: 'functional', label: '功能分类', emoji: '🗂️', accent: 'sky', icon: FolderTree },
    { id: 'set', label: '套装分类', emoji: '🎁', accent: 'orange', icon: Package },
  ];

  return (
    <div className="space-y-5 fade-in">
      {/* Hero */}
      <header>
        <div className="chip chip-sky mb-2"><Home size={11} strokeWidth={2.5} /> 装扮图鉴</div>
        <h2 className="font-display italic text-3xl font-bold text-[var(--ink)] leading-tight">
          打扮你的农场
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mt-1">{categories.length} 大类装扮共 {totalItems} 件</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard accent="leaf" emoji="🏡" label="总装扮" value={totalItems} />
        <StatCard accent="sky" emoji="📂" label="分类" value={categories.length} />
        <StatCard accent="orange" emoji="🎉" label="活动款" value={eventCount} />
        <StatCard accent="ink" emoji="🎒" label="默认款" value={defaultCount} />
      </div>

      {/* View tab toggle */}
      <div className="flex gap-1.5 p-1.5 sticker-pop rounded-full">
        {tabs.map(t => {
          const active = view === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setView(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs transition-all"
              style={active
                ? { background: `var(--${t.accent})`, color: 'white', boxShadow: `0 2px 0 var(--${t.accent}-deep)` }
                : { color: 'var(--ink-soft)' }}>
              <Icon size={13} strokeWidth={2.5} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {view === 'functional' && <FunctionalView />}
      {view === 'set' && <SetView />}
    </div>
  );
}
