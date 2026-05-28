import React from 'react';
import { Search, X } from 'lucide-react';
import seedsData from '../data/seeds.json';
import plantData from '../data/Plant.json';
import { CropImage, GrowthPhases } from './shared';

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
  const [seasonFilter, setSeasonFilter] = React.useState(0);
  const [detail, setDetail] = React.useState<any>(null);

  const filtered = seedsList.filter((s: any) => {
    if (search && !s.name.includes(search)) return false;
    if (seasonFilter === 1 && s.seasons !== 1) return false;
    if (seasonFilter === 2 && s.seasons !== 2) return false;
    return true;
  });

  return (
    <div className="space-y-4 fade-in">
      <div className="glass-panel rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索作物名称..." className="bg-transparent outline-none text-sm flex-1 text-gray-900 dark:text-white placeholder:text-gray-400" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[0,1,2].map(s => (
            <button key={s} onClick={() => setSeasonFilter(s)} className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${seasonFilter === s ? 'bg-green-500 text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}>
              {s === 0 ? '全部' : s === 1 ? '一季' : '两季'}
            </button>
          ))}
          <span className="flex-shrink-0 text-[10px] text-gray-400 px-3 py-1.5">共 {filtered.length} 种</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((s: any) => (
          <div key={s.seedId} onClick={() => setDetail(s)} className="glass-panel rounded-xl p-3 hover:shadow-lg transition-shadow cursor-pointer flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-white/40 font-bold">Lv{s.requiredLevel}</span>
              {s.seasons === 2 && <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">双季</span>}
            </div>
            <div className="flex items-center gap-2">
              <CropImage seedId={s.seedId} name={s.name} size={36} className="shrink-0" />
              <span className="font-bold text-sm text-gray-900 dark:text-white">{s.name}</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-white/40 flex items-center gap-2">
              <span>🌱 {s.exp}经验</span>
              <span>🕒 {s.growTimeStr}</span>
            </div>
            <div className="text-[10px] text-gray-400">💰{s.price} | 果实{s.fruitCount}个</div>
          </div>
        ))}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative glass-panel rounded-2xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-10"><X size={18} /></button>

            <div className="flex items-center gap-3 mb-4">
              <CropImage seedId={detail.seedId} name={detail.name} size={56} />
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{detail.name}</h3>
                <div className="text-xs text-gray-500">Lv.{detail.requiredLevel} · {detail.seasons === 2 ? '双季作物' : '单季作物'} · {detail.growTimeStr}</div>
              </div>
            </div>

            {/* Growth Phase Images */}
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 dark:text-white/40 mb-2">🌱 成长阶段</div>
              <GrowthPhases seedId={detail.seedId} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <div className="text-amber-600/70 dark:text-amber-400/60 mb-0.5">💰 购买价格</div>
                <div className="font-bold text-amber-700 dark:text-amber-300">{detail.price}</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
                <div className="text-purple-600/70 dark:text-purple-400/60 mb-0.5">⭐ 生长经验</div>
                <div className="font-bold text-purple-700 dark:text-purple-300">{detail.exp}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <div className="text-green-600/70 dark:text-green-400/60 mb-0.5">📦 果实产量</div>
                <div className="font-bold text-green-700 dark:text-green-300">{detail.fruitCount}个/季</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <div className="text-blue-600/70 dark:text-blue-400/60 mb-0.5">⚡ 经验/时</div>
                <div className="font-bold text-blue-700 dark:text-blue-300">{detail.expPerHour?.toFixed(1)}</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                <div className="text-orange-600/70 dark:text-orange-400/60 mb-0.5">🎯 可行获季数</div>
                <div className="font-bold text-orange-700 dark:text-orange-300">{detail.seasons}季</div>
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3">
                <div className="text-teal-600/70 dark:text-teal-400/60 mb-0.5">📊 经验/金币</div>
                <div className="font-bold text-teal-700 dark:text-teal-300">{detail.expPerGold?.toFixed(4)}</div>
              </div>
            </div>

            {/* Growth Phases */}
            {(() => {
              const phases = getPhases(detail.seedId);
              if (phases.length === 0) return null;
              const totalSec = phases.reduce((a: number, b: any) => a + b.sec, 0);
              return (
                <div>
                  <div className="text-xs font-bold text-gray-500 dark:text-white/40 mb-2">🌱 生长阶段</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {phases.map((p, i) => {
                      const isMature = p.sec === 0;
                      const bg = isMature ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30';
                      const fg = isMature ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300';
                      return (
                        <span key={i} className={`${bg} ${fg} text-xs px-2 py-1 rounded-lg font-medium`}>
                          {p.name}{p.sec > 0 ? ` ${fmtSec(p.sec)}` : ''}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-gray-400">总时长: {fmtSec(totalSec)}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}