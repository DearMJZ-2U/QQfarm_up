import React from 'react';
import landsData from '../data/lands_atlas.json';

const landStyles: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  '普通土地': { bg: 'bg-gradient-to-b from-amber-700 to-amber-900', color: 'text-amber-200', icon: '🟫', label: '普通' },
  '红土地': { bg: 'bg-gradient-to-b from-red-600 to-red-800', color: 'text-red-200', icon: '🟥', label: '红土' },
  '黑土地': { bg: 'bg-gradient-to-b from-gray-700 to-gray-950', color: 'text-gray-200', icon: '⬛', label: '黑土' },
  '金土地': { bg: 'bg-gradient-to-b from-yellow-500 to-yellow-700', color: 'text-yellow-100', icon: '🟨', label: '金土' },
  '紫晶土地': { bg: 'bg-gradient-to-b from-purple-500 to-purple-800', color: 'text-purple-100', icon: '🟪', label: '紫晶' },
};

const upgradeIcons: Record<string, string> = { '红土地':'🟥','黑土地':'⬛','金土地':'🟨','紫晶土地':'🟪' }; 
const upgradeTypes = ['红土地','黑土地','金土地','紫晶土地'] as const;

export default function LandAtlasTab() {
  const [level, setLevel] = React.useState(90);
  const [tab, setTab] = React.useState<'plots' | 'upgrades'>('plots');

  return (
    <div className="space-y-4 fade-in">
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">🏞️ 土地图鉴 · 24块</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">参考等级</span>
            <input type="number" value={level} onChange={e => setLevel(Number(e.target.value)||1)} className="w-20 glass-input rounded-lg p-1.5 text-center text-sm font-bold" min={1} max={200} />
          </div>
        </div>

        {/* Land Type Cards */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {landsData.landTypes.map((lt, i) => {
            const s = landStyles[lt.name];
            return (
              <div key={i} className={`${s?.bg || 'bg-gray-300'} rounded-xl p-2 text-center border border-white/10 shadow-inner`}>
                <div className={`text-lg mb-1`}>{s?.icon || '🟫'}</div>
                <div className={`text-[9px] font-bold ${s?.color || 'text-white'}`}>{s?.label || lt.name}</div>
                <div className="text-[8px] text-white/60 leading-tight mt-0.5">
                  {lt.yieldBonus > 0 && <div>产+{lt.yieldBonus}%</div>}
                  {lt.timeReduction > 0 && <div>速-{lt.timeReduction}%</div>}
                  {lt.expBonus > 0 && <div>经+{lt.expBonus}%</div>}
                  {lt.mutationBonus > 0 && <div>🧬+{lt.mutationBonus}%</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-[10px] text-center">
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2"><div className="font-black text-green-500">24</div><div className="text-gray-500">总地块</div></div>
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2"><div className="font-black text-blue-500">6/18</div><div className="text-gray-500">初始/可开垦</div></div>
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2"><div className="font-black text-orange-500">Lv39</div><div className="text-gray-500">最高开垦</div></div>
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2"><div className="font-black text-purple-500">Lv90</div><div className="text-gray-500">紫晶起始</div></div>
        </div>
      </div>

      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        <button onClick={() => setTab('plots')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${tab==='plots'?'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm':'text-gray-500'}`}>🗺️ 地块布局</button>
        <button onClick={() => setTab('upgrades')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${tab==='upgrades'?'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm':'text-gray-500'}`}>⬆️ 升级需求</button>
      </div>

      {tab === 'plots' && (
        <>
          <div className="glass-panel rounded-xl p-4">
            <div className="grid grid-cols-4 gap-2">
              {landsData.plots.map(plot => {
                const unlocked = plot.initialUnlock || plot.unlockLevel <= level;
                return (
                  <div key={plot.id} className={`text-center p-2 rounded-lg border text-[10px] leading-tight transition-all ${unlocked ? 'bg-green-500/10 border-green-500/40 text-green-800 dark:text-green-300' : 'bg-black/[0.03] dark:bg-white/[0.03] border-black/5 dark:border-white/5 text-gray-400'}`}>
                    <div className="font-black text-sm">#{plot.id}</div>
                    <div>{plot.initialUnlock ? '初始' : `Lv${plot.unlockLevel}`}</div>
                    {!plot.initialUnlock && <div className="text-[9px] opacity-60">💰{plot.gold.toLocaleString()}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'upgrades' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {upgradeTypes.map(ut => {
              const lb = ut === '红土地' ? 'Lv28-57 20w-230w' : ut === '黑土地' ? 'Lv40-69 60w-860w' : ut === '金土地' ? 'Lv58-87 100w-1700w' : 'Lv90-159 5000w-5.1亿';
              return (
                <div key={ut} className="glass-panel rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">{upgradeIcons[ut]}</div>
                  <div className="text-[10px] font-bold text-gray-600 dark:text-white/60">{ut}</div>
                  <div className="text-[8px] text-gray-400 leading-tight mt-0.5">{lb}</div>
                </div>
              );
            })}
          </div>

          <div className="glass-panel rounded-xl overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 dark:text-white/30 bg-black/[0.03] dark:bg-white/[0.03]">
                  <th className="p-2 text-left">#</th>
                  {upgradeTypes.map(ut => <th key={ut} className="p-2 text-right">{upgradeIcons[ut]}</th>)}
                </tr>
              </thead>
              <tbody>
                {landsData.upgrades.map(pu => (
                  <tr key={pu.plotId} className="border-b border-black/[0.02] dark:border-white/[0.02] hover:bg-green-500/5">
                    <td className="p-2 font-bold">#{pu.plotId}</td>
                    {upgradeTypes.map(ut => {
                      const u = pu.upgrades.find(u => u.type === ut);
                      const active = u && level >= u.level;
                      return (
                        <td key={ut} className={`p-2 text-right ${active ? 'bg-green-500/10' : ''}`}>
                          {u ? (
                            <div className={active ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400'}>
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
        </>
      )}
    </div>
  );
}