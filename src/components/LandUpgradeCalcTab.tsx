import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Sparkles, Coins, ArrowRight, Layers, Sprout } from 'lucide-react';
import levelExpData from '../data/level_exp.json';
import landsData from '../data/lands_atlas.json';
import { EmptyState, StatTile } from './shared';

type LandType = '红土地' | '黑土地' | '金土地' | '紫晶土地';

const landTypeKey: Record<LandType, 'red' | 'black' | 'gold' | 'purple'> = {
  '红土地': 'red',
  '黑土地': 'black',
  '金土地': 'gold',
  '紫晶土地': 'purple',
};
const landTypeColor: Record<LandType, 'berry' | 'ink' | 'sun' | 'plum'> = {
  '红土地': 'berry',
  '黑土地': 'ink',
  '金土地': 'sun',
  '紫晶土地': 'plum',
};
const landTypeOrder: LandType[] = ['红土地', '黑土地', '金土地', '紫晶土地'];

interface UpgradeEvent {
  plotId: number;
  type: LandType;
  level: number;
  gold: number;
  beans: number;
}

function formatGold(g: number): string {
  if (g >= 100000000) return `${(g / 100000000).toFixed(2)}亿`;
  if (g >= 10000) return `${(g / 10000).toFixed(1)}w`;
  return g.toLocaleString();
}

function formatExp(e: number): string {
  if (e >= 100000000) return `${(e / 100000000).toFixed(2)}亿`;
  if (e >= 10000) return `${(e / 10000).toFixed(1)}w`;
  return e.toLocaleString();
}

export default function LandUpgradeCalcTab() {
  const [currentLevel, setCurrentLevel] = React.useState<number>(50);
  const [targetLevel, setTargetLevel] = React.useState<number>(90);

  const safeCurrent = Math.max(1, Math.min(200, currentLevel || 1));
  const safeTarget = Math.max(safeCurrent, Math.min(200, targetLevel || safeCurrent));
  const rangeInvalid = (targetLevel || 0) < safeCurrent;

  const levelExpMap = React.useMemo(() => {
    const m = new Map<number, { cumulativeExp: number; levelUpExp: number }>();
    for (const l of levelExpData) m.set(l.level, { cumulativeExp: l.cumulativeExp, levelUpExp: l.levelUpExp });
    return m;
  }, []);

  const expRequired = React.useMemo(() => {
    const cur = levelExpMap.get(safeCurrent);
    const tgt = levelExpMap.get(safeTarget);
    if (!cur || !tgt) return 0;
    return Math.max(0, tgt.cumulativeExp - cur.cumulativeExp);
  }, [safeCurrent, safeTarget, levelExpMap]);

  const events = React.useMemo<UpgradeEvent[]>(() => {
    const evts: UpgradeEvent[] = [];
    for (const pu of landsData.upgrades) {
      for (const u of pu.upgrades) {
        if (u.level > safeCurrent && u.level <= safeTarget) {
          evts.push({
            plotId: pu.plotId,
            type: u.type as LandType,
            level: u.level,
            gold: u.gold,
            beans: 'beans' in u ? (u.beans as number) : 0,
          });
        }
      }
    }
    return evts.sort((a, b) => a.level - b.level || a.plotId - b.plotId);
  }, [safeCurrent, safeTarget]);

  const totalGold = events.reduce((s, e) => s + e.gold, 0);
  const totalBeans = events.reduce((s, e) => s + e.beans, 0);

  const byType = React.useMemo(() => {
    const map: Record<LandType, { count: number; gold: number; beans: number }> = {
      '红土地': { count: 0, gold: 0, beans: 0 },
      '黑土地': { count: 0, gold: 0, beans: 0 },
      '金土地': { count: 0, gold: 0, beans: 0 },
      '紫晶土地': { count: 0, gold: 0, beans: 0 },
    };
    for (const e of events) {
      map[e.type].count += 1;
      map[e.type].gold += e.gold;
      map[e.type].beans += e.beans;
    }
    return map;
  }, [events]);

  const quickPicks: Array<{ label: string; from: number; to: number; type: 'red' | 'black' | 'gold' | 'purple' }> = [
    { label: '红土阶段',  from: 28,  to: 40,  type: 'red'    },
    { label: '黑土阶段',  from: 40,  to: 58,  type: 'black'  },
    { label: '金土阶段',  from: 58,  to: 90,  type: 'gold'   },
    { label: '紫晶起步',  from: 90,  to: 120, type: 'purple' },
    { label: '满级紫晶',  from: 120, to: 160, type: 'purple' },
  ];

  return (
    <div className="space-y-5 fade-in pt-3">
      {/* Hero */}
      <header className="page-header">
        <span className="page-header-chip"><TrendingUp size={11} strokeWidth={2.5} /> 土地升级所需</span>
        <h2 className="page-header-title">升到目标等级 · 所需一览</h2>
        <p className="page-header-subtitle">输入当前 / 目标等级，自动算出经验、金币、金豆</p>
      </header>

      {/* Inputs */}
      <div className="sticker-pop p-4 space-y-3.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <div className="section-eyebrow mb-1.5">当前等级</div>
            <input type="number" value={currentLevel}
              onChange={e => setCurrentLevel(Number(e.target.value) || 1)}
              className="w-full input-pop text-center font-mono font-bold"
              style={{ padding: '0.7rem 0.5rem', fontSize: '1.1rem' }}
              min={1} max={200} />
          </div>
          <div className="flex items-end pb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--plum)', color: 'white', boxShadow: '0 2px 0 var(--plum-deep)' }}>
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="section-eyebrow mb-1.5">目标等级</div>
            <input type="number" value={targetLevel}
              onChange={e => setTargetLevel(Number(e.target.value) || safeCurrent)}
              className="w-full input-pop text-center font-mono font-bold"
              style={{
                padding: '0.7rem 0.5rem',
                fontSize: '1.1rem',
                borderColor: rangeInvalid ? 'var(--berry)' : 'var(--plum-soft)',
              }}
              min={1} max={200} />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
          {quickPicks.map((q, i) => (
            <button key={i}
              onClick={() => { setCurrentLevel(q.from); setTargetLevel(q.to); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
              style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>
              <span>{q.label}</span>
              <span className="font-mono opacity-70">{q.from}→{q.to}</span>
            </button>
          ))}
        </div>

        {rangeInvalid && (
          <div className="text-[11px] text-center text-[var(--berry-deep)] font-bold">
            ⚠️ 目标等级需大于当前等级
          </div>
        )}
      </div>

      {/* 3 核心结果卡 */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile
          label="所需经验"
          value={formatExp(expRequired)}
          hint={`Lv${safeCurrent} → Lv${safeTarget}`}
          color="leaf"
          muted={rangeInvalid}
          icon={<Sparkles size={12} strokeWidth={2.5} style={{ color: 'var(--leaf-deep)' }} />}
        />
        <StatTile
          label="所需金币"
          value={formatGold(totalGold)}
          hint={`共 ${events.length} 次升级`}
          color="sun"
          muted={rangeInvalid}
          icon={<Coins size={12} strokeWidth={2.5} style={{ color: 'var(--sun-deep)' }} />}
        />
        <StatTile
          label="所需金豆"
          value={totalBeans.toLocaleString()}
          hint={totalBeans > 0 ? `含紫晶 ${byType['紫晶土地'].count} 次` : '当前区间无需金豆'}
          color="plum"
          muted={rangeInvalid}
        />
      </div>

      {/* 按土地类型分布 */}
      <section>
        <div className="section-eyebrow mb-2.5 px-1 flex items-center gap-1.5">
          <Layers size={11} strokeWidth={2.5} /> 按土地类型
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {landTypeOrder.map(lt => {
            const color = landTypeColor[lt];
            const key = landTypeKey[lt];
            const s = byType[lt];
            const has = s.count > 0;
            return (
              <div key={lt}
                className={`stat-tile stat-tile-${color === 'ink' ? 'ink' : color} relative`}
                style={{ opacity: has ? 1 : 0.5 }}>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.85)', color: `var(--${color}-deep)` }}>
                  {has ? '配置' : '剩余'}
                </span>
                <div className="flex items-center gap-1.5 pr-12">
                  <span className="text-sm font-bold truncate" style={{ color: `var(--${color}-deep)` }}>{lt}</span>
                </div>
                <div className="text-[10px] font-mono tnum font-bold leading-relaxed" style={{ color: `var(--${color}-deep)` }}>
                  💰 {has ? formatGold(s.gold) : '—'}
                  <span className="opacity-50 mx-1">·</span>
                  🫘 {s.beans > 0 ? s.beans.toLocaleString() : '—'}
                </div>
                <div className="font-mono tnum text-2xl font-black mt-1" style={{ color: 'var(--ink)' }}>
                  {s.count}
                  <span className="text-[10px] font-bold text-[var(--ink-mute)] ml-1">次</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 升级事件明细 */}
      <section>
        <div className="section-eyebrow mb-2.5 px-1 flex items-center gap-1.5">
          <Sprout size={11} strokeWidth={2.5} /> 升级事件明细
          <span className="text-[var(--ink-mute)] font-mono tnum ml-auto">{events.length} 条</span>
        </div>
        <div className="sticker-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-mute)]"
            style={{ background: 'var(--bg-2)', borderBottom: '1.5px solid var(--line)' }}>
            <span className="w-8">地块</span>
            <span className="w-14 text-center">等级</span>
            <span className="flex-1">升级到</span>
            <span className="w-20 text-right">金币</span>
            <span className="w-14 text-right">金豆</span>
          </div>
          {events.length === 0 ? (
            <EmptyState emoji="🌾" title="当前等级到目标等级之间没有升级事件" hint={rangeInvalid ? '检查等级输入' : '试试更大的等级区间'} />
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              {events.map((e, i) => {
                const color = landTypeColor[e.type];
                return (
                  <motion.div key={`${e.plotId}-${e.type}-${e.level}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.25) }}
                    className="grid grid-cols-[2.25rem_3.5rem_1fr_5rem_3.5rem] items-center gap-2 px-4 py-2.5 text-xs"
                    style={{ borderBottom: i < events.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <div className="font-mono font-bold text-[var(--ink-mute)]">#{e.plotId}</div>
                    <div className="flex justify-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md font-mono tnum text-[10px] font-bold"
                        style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>
                        Lv{e.level}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md font-bold text-[10px]"
                        style={{ background: `var(--${color}-bg)`, color: `var(--${color}-deep)` }}>
                        {e.type}
                      </span>
                    </div>
                    <div className="text-right font-mono tnum text-[10px] font-bold" style={{ color: 'var(--sun-deep)' }}>
                      {formatGold(e.gold)}
                    </div>
                    <div className="text-right font-mono tnum text-[10px] font-bold" style={{ color: e.beans > 0 ? 'var(--plum-deep)' : 'var(--ink-mute)' }}>
                      {e.beans > 0 ? e.beans.toLocaleString() : '—'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
