import React from 'react';
import landsData from '../data/lands_atlas.json';

const landColors: Record<string, { bg: string; border: string; text: string; darkBg: string }> = {
  '普通土地': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', darkBg: 'dark:bg-amber-900/30' },
  '红土地': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', darkBg: 'dark:bg-red-900/30' },
  '黑土地': { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-800', darkBg: 'dark:bg-gray-800/50' },
  '金土地': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900/30' },
  '紫晶土地': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', darkBg: 'dark:bg-purple-900/30' },
};

const upgradeTypes = ['红土地', '黑土地', '金土地', '紫晶土地'] as const;
const upgradeColors: Record<string, string> = {
  '红土地': '🟥', '黑土地': '⬛', '金土地': '🟨', '紫晶土地': '🟪',
};

export default function LandAtlasTab() {
  const [level, setLevel] = React.useState(90);
  const [tab, setTab] = React.useState<'plots' | 'upgrades'>('plots');

  return (
    <div className="space-y-4 fade-in">
      {/* Level input for filtering */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">🏞️ 土地图鉴</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">参考等级</span>
            <input type="number" value={level} onChange={e => setLevel(Number(e.target.value) || 1)} className="w-20 glass-input rounded-lg p-1.5 text-center text-sm font-bold" min={1} max={200} />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {landsData.landTypes.map((lt, i) => (
            <div key={i} className={`${lt.name === '紫晶土地' ? 'col-span-2' : ''} text-center p-2 rounded-lg ${landColors[lt.name]?.bg || 'bg-gray-100'} ${landColors[lt.name]?.darkBg || ''} border ${landColors[lt.name]?.border || 'border-gray-300'} text-[10px] leading-tight`}>
              <div className={`font-bold ${landColors[lt.name]?.text || ''}`}>{lt.name}</div>
              <div className="text-[9px] opacity-70">产+{lt.yieldBonus}% 速-{lt.timeReduction}% 经+{lt.expBonus}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        <button onClick={() => setTab('plots')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${tab === 'plots' ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500'}`}>地块布局</button>
        <button onClick={() => setTab('upgrades')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${tab === 'upgrades' ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500'}`}>升级需求</button>
      </div>

      {tab === 'plots' && (
        <div className="space-y-4">
          {/* 4x6 grid */}
          <div className="glass-panel rounded-xl p-4 overflow-x-auto">
            <div className="grid grid-cols-4 gap-2 min-w-[280px]">
              {landsData.plots.map(plot => {
                const unlocked = plot.initialUnlock || plot.unlockLevel <= level;
                return (
                  <div key={plot.id} className={`text-center p-2 rounded-lg border text-[10px] leading-tight transition-all ${unlocked ? 'bg-green-500/10 border-green-500/40 text-green-800 dark:text-green-300' : 'bg-black/[0.03] dark:bg-white/[0.03] border-black/5 dark:border-white/5 text-gray-400'}`}>
                    <div className="font-black text-sm">#{plot.id}</div>
                    <div>{plot.initialUnlock ? '初始解锁' : `Lv${plot.unlockLevel}`}</div>
                    {!plot.initialUnlock && <div className="text-[9px] opacity-60">💰{plot.gold.toLocaleString()}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed plot list */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/30 bg-black/[0.03] dark:bg-white/[0.03] px-3 py-2 border-b border-black/5 dark:border-white/5">
              <span>地块</span>
              <span>坐标</span>
              <span>前置</span>
              <span className="text-right">花费</span>
            </div>
            {landsData.plots.map(plot => (
              <div key={plot.id} className="grid grid-cols-4 text-xs px-3 py-2 border-b border-black/[0.02] dark:border-white/[0.02]">
                <span className="font-bold">#{plot.id} {plot.initialUnlock ? '初始' : `Lv${plot.unlockLevel}`}</span>
                <span className="text-gray-500">({plot.coordinate[0]},{plot.coordinate[1]})</span>
                <span className="text-gray-400">{plot.predecessor ? `#${plot.predecessor}` : '—'}</span>
                <span className="text-right font-semibold">{plot.gold > 0 ? plot.gold.toLocaleString() : '免费'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'upgrades' && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-2">
            {upgradeTypes.map(ut => (
              <div key={ut} className="glass-panel rounded-xl p-3 text-center">
                <div className="text-sm">{upgradeColors[ut]}</div>
                <div className="text-[10px] font-bold text-gray-600 dark:text-white/60 mt-1">{ut}</div>
                {ut === '红土地' && <div className="text-[9px] text-gray-500">Lv28-57<br/>20w-230w</div>}
                {ut === '黑土地' && <div className="text-[9px] text-gray-500">Lv40-69<br/>60w-860w</div>}
                {ut === '金土地' && <div className="text-[9px] text-gray-500">Lv58-87<br/>100w-1700w</div>}
                {ut === '紫晶土地' && <div className="text-[9px] text-gray-500">Lv90-159<br/>5000w-5.1亿</div>}
              </div>
            ))}
          </div>

          {/* Upgrade table */}
          <div className="glass-panel rounded-xl overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 dark:text-white/30 bg-black/[0.03] dark:bg-white/[0.03]">
                  <th className="p-2 text-left">#</th>
                  {upgradeTypes.map(ut => <th key={ut} className="p-2 text-right">{upgradeColors[ut]} {ut}</th>)}
                </tr>
              </thead>
              <tbody>
                {landsData.upgrades.map(pu => (
                  <tr key={pu.plotId} className="border-b border-black/[0.02] dark:border-white/[0.02] hover:bg-green-500/5">
                    <td className="p-2 font-bold">#{pu.plotId}</td>
                    {upgradeTypes.map(ut => {
                      const u = pu.upgrades.find(u => u.type === ut);
                      return (
                        <td key={ut} className={`p-2 text-right ${ut === '紫晶土地' && (u && 'beans' in u) && level >= u.level ? 'bg-purple-500/10' : ''}`}>
                          {u ? (
                            <div className={level >= u.level ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400'}>
                              <div>Lv{u.level}</div>
                              <div>💰{u.gold.toLocaleString()}</div>
                              {'beans' in u && <div className="text-purple-500">🫘{u.beans.toLocaleString()}</div>}
                            </div>
                          ) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}