import React from 'react';
import { Search, X } from 'lucide-react';
import seedsData from '../data/seeds.json';
import { CropImage } from './shared';

const seedsList = Array.isArray(seedsData) ? seedsData : (seedsData.rows || []);

export default function CropAtlasTab() {
  const [search, setSearch] = React.useState('');
  const [seasonFilter, setSeasonFilter] = React.useState(0);
  const [detail, setDetail] = React.useState<any>(null);

  const filtered = seedsList.filter(s => {
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
        {filtered.map(s => (
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
            <div className="text-[10px] text-gray-400">
              💰购买:{s.price} | 果实:{s.fruitCount}个
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 text-sm">未找到匹配的作物</div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative glass-panel rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <CropImage seedId={detail.seedId} name={detail.name} size={56} />
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{detail.name}</h3>
                <div className="text-xs text-gray-500">Lv.{detail.requiredLevel} · {detail.seasons === 2 ? '双季作物' : '单季作物'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
                <div className="text-gray-500 mb-1">购买价格</div>
                <div className="font-bold text-amber-600">{detail.price} 金币</div>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
                <div className="text-gray-500 mb-1">生长经验</div>
                <div className="font-bold text-purple-600">{detail.exp} 经验</div>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
                <div className="text-gray-500 mb-1">生长时间</div>
                <div className="font-bold text-blue-600">{detail.growTimeStr}</div>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
                <div className="text-gray-500 mb-1">果实产量</div>
                <div className="font-bold text-green-600">{detail.fruitCount} 个/季</div>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
                <div className="text-gray-500 mb-1">每小时经验</div>
                <div className="font-bold text-purple-500">{detail.expPerHour?.toFixed(1)}</div>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
                <div className="text-gray-500 mb-1">经验/金币比</div>
                <div className="font-bold text-amber-500">{detail.expPerGold?.toFixed(3)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}