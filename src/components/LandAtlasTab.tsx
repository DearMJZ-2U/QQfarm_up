import React from 'react';
import landsData from '../data/lands_atlas.json';

const IMG = (p: string) => `https://jsq.gptvip.chat/images/${p}`;

const landTypes = [
  { name: '普通土地', lv: 'Lv.1', border: 'border-amber-200', bg: 'from-amber-50 to-yellow-50', valid: IMG('extraRes/model/v3/land_valid1.png'), dry: IMG('extraRes/model/v3/land_dry1.png'), y: '0%', t: '0%', e: '0%', m: '0%' },
  { name: '红土地', lv: 'Lv.2', border: 'border-red-300', bg: 'from-red-50 to-orange-50', valid: IMG('extraRes/model/v3/land_valid2.png'), dry: IMG('extraRes/model/v3/land_dry2.png'), y: '+100%', t: '0%', e: '0%', m: '0%' },
  { name: '黑土地', lv: 'Lv.3', border: 'border-slate-400', bg: 'from-slate-100 to-gray-50', valid: IMG('extraRes/model/v3/land_valid3.png'), dry: IMG('extraRes/model/v3/land_dry3.png'), y: '+200%', t: '-10%', e: '0%', m: '0%' },
  { name: '金土地', lv: 'Lv.4', border: 'border-yellow-400', bg: 'from-yellow-50 to-amber-100', valid: IMG('extraRes/model/v3/land_valid4.png'), dry: IMG('extraRes/model/v3/land_dry4.png'), y: '+300%', t: '-20%', e: '+20%', m: '0%' },
  { name: '紫晶土地', lv: 'Lv.5', border: 'border-violet-400', bg: 'from-violet-50 to-fuchsia-100', valid: IMG('cutouts/lands/land_valid5.png'), dry: IMG('cutouts/lands/land_dry5.png'), y: '+300%', t: '-20%', e: '+25%', m: '+120%', note: '启用时间：2026-04-15 12:00:00' },
];

const specialStates = [
  { name: '荒地', icon: '🏜️', desc: '尚未开垦的地块，达到等级并支付金币后才能启用。', img: IMG('extraRes/model/v3/land_locked.png') },
  { name: '可开垦', icon: '➕', desc: '达到条件后可点击开垦的待解锁地块。', img: IMG('extraRes/model/v3/land_extend.png') },
  { name: '选中状态', icon: '✅', desc: '当前被高亮选中的地块外观。', img: IMG('extraRes/model/v3/land_valid_selected.png') },
];

const upgradeIcons: Record<string, string> = { '红土地': '🟥', '黑土地': '⬛', '金土地': '🟨', '紫晶土地': '🟪' };
const upgradeTypes = ['红土地', '黑土地', '金土地', '紫晶土地'] as const;

export default function LandAtlasTab() {
  const [level, setLevel] = React.useState(90);
  const [tab, setTab] = React.useState<'plots' | 'upgrades'>('plots');

  return (
    <div className="space-y-6 fade-in">
      {/* Hero Stats */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-700 via-orange-600 to-yellow-500">
        <h1 className="text-xl font-bold text-white mb-3">🏞️ 土地图鉴</h1>
        <p className="text-white/80 text-xs mb-4">单块地、多格地、开垦顺序与升级需求。</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/20 rounded-xl p-2">
            <div className="text-lg font-black text-white">24</div><div className="text-[9px] text-white/80">总地块</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2">
            <div className="text-lg font-black text-white">6/18</div><div className="text-[9px] text-white/80">初始/可开垦</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2">
            <div className="text-lg font-black text-white">Lv39</div><div className="text-[9px] text-white/80">最高开垦</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2">
            <div className="text-lg font-black text-white">Lv90-159</div><div className="text-[9px] text-white/80">紫晶升级</div>
          </div>
        </div>
      </div>

      {/* Land Types */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">🌾 单块土地类型</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {landTypes.map((lt, i) => (
            <div key={i} className={`glass-panel rounded-xl overflow-hidden border-2 ${lt.border}`}>
              <div className={`bg-gradient-to-br ${lt.bg} p-3 flex justify-center gap-6 items-center`}>
                <div className="flex flex-col items-center gap-1">
                  <img src={lt.valid} alt={`${lt.name}正常`} className="w-14 h-14 object-contain drop-shadow" loading="lazy" />
                  <span className="text-[9px] text-gray-500">正常</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <img src={lt.dry} alt={`${lt.name}干裂`} className="w-14 h-14 object-contain drop-shadow" loading="lazy" />
                  <span className="text-[9px] text-gray-500">干裂</span>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{lt.name}</span>
                  <span className="text-[9px] bg-white/80 dark:bg-white/10 rounded-full px-2 py-0.5 font-bold text-gray-600 dark:text-white/60">{lt.lv}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="flex justify-between bg-green-50 dark:bg-green-900/20 rounded px-2 py-1"><span>🌾产量</span><span className="font-bold text-green-600 dark:text-green-400">{lt.y}</span></div>
                  <div className="flex justify-between bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1"><span>⏱️时间</span><span className="font-bold text-blue-600 dark:text-blue-400">{lt.t}</span></div>
                  <div className="flex justify-between bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1"><span>⭐经验</span><span className="font-bold text-purple-600 dark:text-purple-400">{lt.e}</span></div>
                  <div className="flex justify-between bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded px-2 py-1"><span>🧬变异</span><span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">{lt.m}</span></div>
                </div>
                {lt.note && <div className="text-[8px] text-gray-400">{lt.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special States */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">🔒 特殊土地状态</h2>
        <div className="grid grid-cols-3 gap-2">
          {specialStates.map((ss, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 text-center">
              <img src={ss.img} alt={ss.name} className="w-12 h-12 mx-auto object-contain mb-2" loading="lazy" />
              <div className="text-[10px] font-bold text-gray-900 dark:text-white">{ss.icon} {ss.name}</div>
              <div className="text-[8px] text-gray-500 mt-1 leading-tight">{ss.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plot Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">🗺️ 地块开垦顺序</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">参考等级</span>
            <input type="number" value={level} onChange={e => setLevel(Number(e.target.value)||1)} className="w-16 glass-input rounded-lg p-1 text-center text-xs font-bold" min={1} max={200} />
          </div>
        </div>
        <div className="glass-panel rounded-xl p-3">
          <div className="grid grid-cols-4 gap-2">
            {landsData.plots.map(plot => {
              const unlocked = plot.initialUnlock || plot.unlockLevel <= level;
              return (
                <div key={plot.id} className={`text-center p-2 rounded-xl border-2 text-[10px] leading-tight ${unlocked ? 'bg-green-500/10 border-green-400 text-green-800 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-800 dark:text-amber-300'}`}>
                  <img src={unlocked ? IMG('extraRes/model/v3/land_valid1.png') : IMG('extraRes/model/v3/land_locked.png')} alt="" className="w-8 h-8 mx-auto mb-1 object-contain" loading="lazy" />
                  <div className="font-black text-xs">#{plot.id}</div>
                  <div>{plot.initialUnlock ? '初始解锁' : `Lv.${plot.unlockLevel} 开垦`}</div>
                  {!plot.initialUnlock && <div className="text-[9px] font-semibold">{plot.gold.toLocaleString()} 金</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upgrades Toggle */}
      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        <button onClick={() => setTab('plots')} className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors ${tab==='plots'?'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm':'text-gray-500'}`}>🗺️ 地块布局</button>
        <button onClick={() => setTab('upgrades')} className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors ${tab==='upgrades'?'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm':'text-gray-500'}`}>⬆️ 升级需求</button>
      </div>

      {tab === 'upgrades' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {upgradeTypes.map(ut => {
              let rng: Record<string, string> = {};
              if (ut === '红土地') rng = { lv: 'Lv28-57', g: '20w-230w' };
              else if (ut === '黑土地') rng = { lv: 'Lv40-69', g: '60w-860w' };
              else if (ut === '金土地') rng = { lv: 'Lv58-87', g: '100w-1700w' };
              else rng = { lv: 'Lv90-159', g: '5000w-5.1亿' };
              return (
                <div key={ut} className="glass-panel rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">{upgradeIcons[ut]}</div>
                  <div className="text-[10px] font-bold text-gray-600 dark:text-white/60">{ut}</div>
                  <div className="text-[8px] text-gray-400 leading-tight mt-0.5">{rng.lv}<br/>{rng.g}</div>
                </div>
              );
            })}
          </div>
          <div className="glass-panel rounded-xl overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 dark:text-white/30 bg-black/[0.03] dark:bg-white/[0.03]">
                  <th className="p-2 text-left">#</th>
                  {upgradeTypes.map(ut => <th key={ut} className="p-2 text-right">{upgradeIcons[ut]} {ut}</th>)}
                </tr>
              </thead>
              <tbody>
                {landsData.upgrades.map(pu => (
                  <tr key={pu.plotId} className="border-b border-black/[0.02] dark:border-white/[0.02]">
                    <td className="p-2 font-bold">#{pu.plotId}</td>
                    {upgradeTypes.map(ut => {
                      const u = pu.upgrades.find(u => u.type === ut);
                      const active = u && level >= u.level;
                      return (
                        <td key={ut} className={`p-2 text-right ${active ? 'bg-green-500/10 font-bold text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                          {u ? <><div>Lv{u.level}</div><div>💰{u.gold.toLocaleString()}</div>{'beans' in u && <div className="text-purple-500">🫘{u.beans.toLocaleString()}</div>}</> : '-'}
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