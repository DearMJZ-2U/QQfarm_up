import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Sprout, Coins, Star, Package, Clock, Repeat } from 'lucide-react';
import seedsData from '../data/seeds.json';
import plantData from '../data/Plant.json';
import { CropImage, GrowthPhases, Portal, EmptyState, StatTile as StatTileBase, PillTabGroup } from './shared';

const seedsList = Array.isArray(seedsData) ? seedsData : (seedsData.rows || []);

function getPhases(seedId: number): { name: string; sec: number }[] {
  const pd = plantData.find((p: any) => Number(p.seed_id) === seedId);
  if (!pd?.grow_phases) return [];
  return pd.grow_phases.split(';').filter((x: string) => x.trim()).map((seg: string) => {
    const [name, s] = seg.split(':');
    return { name: name.trim(), sec: parseInt(s) || 0 };
  });
}

function fmtSec(sec: number) {
  if (sec < 60) return `${sec}秒`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  if (m < 60) return r > 0 ? `${m}分${r}秒` : `${m}分钟`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}小时${mm}分` : `${h}小时`;
}

export default function CropAtlasTab() {
  const [search, setSearch] = React.useState('');
  const [seasonFilter, setSeasonFilter] = React.useState<'all' | '1' | '2'>('all');
  const [detail, setDetail] = React.useState<any>(null);

  const filtered = seedsList
    .filter((s: any) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (seasonFilter === '1' && s.seasons !== 1) return false;
      if (seasonFilter === '2' && s.seasons !== 2) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      // 按品级降序：天工(4) > 珍品(3) > 稀有(2) > 普通(1)
      const ra = a.rarity || 1;
      const rb = b.rarity || 1;
      if (rb !== ra) return rb - ra;
      // 同品级内按等级升序
      return (a.requiredLevel || 0) - (b.requiredLevel || 0);
    });

  return (
    <div className="space-y-4 fade-in">
      {/* Hero */}
      <header className="page-header">
        <span className="page-header-chip"><Sprout size={11} strokeWidth={2.5} /> 作物图鉴</span>
        <h2 className="page-header-title">
          全部 <span style={{ color: 'var(--leaf-deep)' }}>{seedsList.length}</span> 种作物
        </h2>
        <p className="page-header-subtitle">点开任意作物查看成长阶段与详细属性</p>
      </header>

      {/* Search + Filter */}
      <div className="sticker-pop p-3 space-y-2.5">
        <div className="flex items-center gap-2 px-2">
          <Search size={16} strokeWidth={2.5} className="text-[var(--ink-mute)] flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索作物名称…"
            className="input-line text-sm py-1" />
          {search && (
            <button onClick={() => setSearch('')}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-2)]"
              aria-label="清空搜索">
              <X size={12} className="text-[var(--ink-mute)]" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PillTabGroup
            items={[
              { id: 'all', label: '全部', emoji: '🌿' },
              { id: '1',   label: '单季', emoji: '🌾' },
              { id: '2',   label: '双季', emoji: '🔁' },
            ]}
            value={seasonFilter}
            onChange={(id) => setSeasonFilter(id as 'all' | '1' | '2')}
            accent="leaf"
            size="sm"
          />
          <span className="ml-auto text-[10px] font-mono text-[var(--ink-mute)] tnum">显示 {filtered.length}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((s: any, idx: number) => (
          <motion.div key={s.seedId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(idx * 0.01, 0.3) }}
            onClick={() => setDetail(s)}
            className="sticker sticker-press p-3 sm:p-4 cursor-pointer relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="chip chip-leaf" style={{ fontSize: '0.6rem' }}>Lv{s.requiredLevel}</span>
              {s.seasons === 2 && <span className="chip chip-berry" style={{ fontSize: '0.6rem' }}>双季</span>}
            </div>
            <div className="flex items-center justify-center my-2 sm:my-3 h-24 sm:h-32">
              <CropImage seedId={s.seedId} name={s.name} className="w-20 h-20 sm:w-32 sm:h-32" />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm sm:text-base text-[var(--ink)] truncate">{s.name}</div>
              <div className="text-[10px] sm:text-[11px] text-[var(--ink-mute)] mt-1 flex items-center justify-center gap-1.5">
                <span className="flex items-center gap-0.5"><Star size={9} className="text-[var(--plum)]" />{s.exp}</span>
                <span className="text-[var(--line-strong)]">·</span>
                <span className="flex items-center gap-0.5"><Coins size={9} className="text-[var(--sun-deep)]" />{s.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState emoji="🔍" title="没找到符合条件的作物" hint="试试别的关键词或切换过滤器" />
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detail && (
          <Portal>
            <motion.div
              key="crop-modal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setDetail(null)}>
              <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" />
              <motion.div
                key="crop-modal-panel"
                initial={{ y: '100%', scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
                style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>

              {/* Header */}
              <div className="sticky top-0 z-10 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between"
                style={{ background: 'var(--bg-paper)', borderBottom: '1.5px solid var(--line)' }}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--leaf-bg)' }}>
                    <CropImage seedId={detail.seedId} name={detail.name} className="w-16 h-16 sm:w-28 sm:h-28" />
                  </div>
                  <div>
                    <h3 className="font-display italic text-xl sm:text-2xl font-bold text-[var(--ink)] leading-tight">{detail.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                      <span className="chip chip-leaf">Lv{detail.requiredLevel}</span>
                      {detail.seasons === 2 ? (
                        <span className="chip chip-berry">双季</span>
                      ) : (
                        <span className="chip chip-ink">单季</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setDetail(null)}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-2)' }}
                  aria-label="关闭">
                  <X size={16} className="text-[var(--ink-soft)] sm:hidden" />
                  <X size={20} className="text-[var(--ink-soft)] hidden sm:block" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                {/* Growth Phases Images */}
                <div>
                  <div className="section-eyebrow mb-2">成长阶段</div>
                  <div className="sticker-soft p-3 sm:p-4">
                    <GrowthPhases seedId={detail.seedId} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div>
                  <div className="section-eyebrow mb-2">作物属性</div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <StatTileBase label="购买价格" value={detail.price} color="sun" icon={<Coins size={12} strokeWidth={2.5} style={{ color: 'var(--sun-deep)' }} />} />
                    <StatTileBase label="生长经验" value={detail.exp} color="plum" icon={<Star size={12} strokeWidth={2.5} style={{ color: 'var(--plum-deep)' }} />} />
                    <StatTileBase label="果实产量" value={`${detail.fruitCount} 个`} color="leaf" icon={<Package size={12} strokeWidth={2.5} style={{ color: 'var(--leaf-deep)' }} />} />
                    <StatTileBase label="种植周期" value={detail.growTimeStr} color="sky" icon={<Clock size={12} strokeWidth={2.5} style={{ color: 'var(--sky-deep)' }} />} />
                    <StatTileBase label="季数" value={`${detail.seasons} 季`} color="orange" icon={<Repeat size={12} strokeWidth={2.5} style={{ color: 'var(--orange-deep)' }} />} />
                    <StatTileBase label="经验/小时" value={detail.expPerHour?.toFixed(0) || '-'} color="berry" icon={<Sprout size={12} strokeWidth={2.5} style={{ color: 'var(--berry-deep)' }} />} />
                  </div>
                </div>

                {/* Detailed Phases */}
                {(() => {
                  const phases = getPhases(detail.seedId);
                  if (phases.length === 0) return null;
                  const totalSec = phases.reduce((a: number, b: any) => a + b.sec, 0);
                  return (
                    <div>
                      <div className="section-eyebrow mb-2">阶段详情</div>
                      <div className="sticker-soft p-3 sm:p-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {phases.map((p, i) => {
                            const isMature = p.sec === 0;
                            return (
                              <span key={i}
                                className={`chip ${isMature ? 'chip-sun' : 'chip-leaf'}`}>
                                {p.name}{p.sec > 0 ? ` · ${fmtSec(p.sec)}` : ''}
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-mono text-[var(--ink-mute)] pt-2 border-t border-[var(--line)]">
                          总时长 <span className="font-bold text-[var(--ink)]">{fmtSec(totalSec)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
