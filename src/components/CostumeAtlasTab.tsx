import React from 'react';
import { motion } from 'motion/react';
import { Home, Package, FolderTree } from 'lucide-react';
import costumeData from '../data/costume_atlas.json';
import { groupCostumesBySet, buildOrderedSections, type CostumeItem, type CostumeSet } from '../data/costume-sets';
import { RemoteImage, costumeImageUrls, RowCard, EmptyState, PillTabGroup } from './shared';

const tagChip: Record<string, string> = {
  '默认': 'chip-ink',
  '活动': 'chip-orange',
  '黄金': 'chip-sun',
};

const catAccents = ['leaf', 'orange', 'sun', 'berry', 'sky', 'plum'] as const;
type Accent = typeof catAccents[number];

type ViewTab = 'functional' | 'set';

function ItemCard({ item }: { item: CostumeItem; key?: React.Key }) {
  return (
    <RowCard>
      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface)' }}>
        <RemoteImage urls={costumeImageUrls(item.img, item.name)} name={item.name} className="w-28 h-28 sm:w-36 sm:h-36" rounded />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold text-sm sm:text-base text-[var(--ink)]">{item.name}</span>
          <span className={`chip ${tagChip[item.tag] || tagChip['默认']} flex-shrink-0`} style={{ fontSize: '0.65rem' }}>
            {item.tag}
          </span>
        </div>
        <div className="text-[11px] sm:text-xs text-[var(--ink-soft)] leading-snug">{item.desc}</div>
      </div>
    </RowCard>
  );
}

function ItemGrid({ items }: { items: CostumeItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
      {items.map((item, j) => (
        <ItemCard key={`${item.name}-${j}`} item={item} />
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
          <motion.section key={cat.name}
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

              <div className="p-3 sm:p-4">
                {cat.items.length === 0 ? (
                  <EmptyState emoji="🎒" title="该分类暂无装扮" />
                ) : (
                  <ItemGrid items={cat.items.map(item => ({ ...item, category: cat.name }))} />
                )}
              </div>
            </div>
          </motion.section>
        );
      })}
    </>
  );
}

function SetRow({ set, accent }: { set: CostumeSet; accent: Accent; key?: React.Key }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: `var(--${accent})` }} />
        <span className="font-bold text-sm text-[var(--ink)]">{set.name}</span>
        <span className="chip chip-ink flex-shrink-0" style={{ fontSize: '0.65rem' }}>{set.items.length} 件</span>
      </div>
      <ItemGrid items={set.items} />
    </div>
  );
}

function Section({ title, desc, icon, count, accent, children }: {
  title: string; desc?: string; icon: string; count: string; accent: Accent | 'ink';
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

        <div className="p-3 sm:p-4">
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

export default function CostumeAtlasTab() {
  const [view, setView] = React.useState<ViewTab>('set');
  const { categories } = costumeData;
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-5 fade-in">
      {/* Hero */}
      <header className="page-header">
        <span className="page-header-chip" style={{ background: 'var(--sky-bg)', color: 'var(--sky-deep)' }}>
          <Home size={11} strokeWidth={2.5} /> 装扮图鉴
        </span>
        <h2 className="page-header-title">打扮你的农场</h2>
        <p className="page-header-subtitle">{categories.length} 大类装扮共 {totalItems} 件</p>
      </header>

      <PillTabGroup
        items={[
          { id: 'set',        label: '套装分类', emoji: '🎁' },
          { id: 'functional', label: '功能分类', emoji: '🗂️' },
        ]}
        value={view}
        onChange={(id) => setView(id as ViewTab)}
        accent="orange"
        size="md"
      />

      {view === 'set' && <SetView />}
      {view === 'functional' && <FunctionalView />}
    </div>
  );
}
