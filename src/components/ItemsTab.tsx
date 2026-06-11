import React from 'react';
import { X } from 'lucide-react';
import itemsData from '../data/items.json';
import { CropImage, GrowthPhases, RemoteImage, itemImageUrls, goldSeedIds } from './shared';

const categories = itemsData.categories;

interface GoldDetail { name: string; desc: string; iconFile: string; localFile?: string; }

export default function ItemsTab() {
  const [catId, setCatId] = React.useState('05');
  const [goldDetail, setGoldDetail] = React.useState<GoldDetail | null>(null);

  const cat = categories.find(c => c.id === catId);
  const isSeed = catId === '05';

  return (
    <div className="flex gap-3 h-full fade-in">
      <div className="w-28 flex-shrink-0 space-y-0.5">
        {categories.map(c => (
          <button key={c.id} onClick={() => setCatId(c.id)}
            className={`w-full text-left text-xs py-2 px-2.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${catId === c.id ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' : 'text-gray-500 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5'}`}>
            <span>{c.icon}</span><span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>{cat?.icon}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{cat?.name}</span>
            <span className="text-[10px] text-gray-500 ml-auto">{cat?.count} 个道具</span>
          </div>

          <div className="space-y-1 max-h-[65vh] overflow-y-auto">
            {!cat ? (
              <div className="text-xs text-gray-400 text-center py-8">数据整理中</div>
            ) : cat.count === 0 ? (
              <div className="text-xs text-gray-400 text-center py-8">暂无数据</div>
            ) : cat.items.map((item) => {
              if (isSeed) {
                const seedPrice = item.sells ? parseInt(item.sells.split(':')[1]) || 0 : 0;
                return (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] hover:bg-green-500/5 transition-colors">
                    <CropImage seedId={item.id} name={item.name} size={32} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-[9px] text-gray-400">
                        Lv{item.level} · 🌱{item.exp}经验 · {item.seasons > 1 ? `🔄${item.seasons}季` : ''}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 shrink-0">💰{seedPrice}</span>
                  </div>
                );
              }

              return (
                <div key={item.id}
                  onClick={() => catId === '17' ? setGoldDetail({ name: item.name, desc: item.desc, iconFile: item.iconFile, localFile: (item as any).localFile }) : undefined}
                  className={`flex items-center gap-3 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] transition-colors ${catId === '17' ? 'cursor-pointer hover:shadow-md' : 'hover:bg-green-500/5'}`}>
                  <RemoteImage urls={itemImageUrls(item.iconFile, (item as any).localFile)} name={item.name} size={40} rounded />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{item.name}</div>
                    {item.desc && <div className="text-[9px] text-gray-400">{item.desc}</div>}
                  </div>
                  {item.level > 0 && <span className="text-[9px] font-bold text-gray-400 shrink-0">Lv.{item.level}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {goldDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setGoldDetail(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative glass-panel rounded-2xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setGoldDetail(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-10"><X size={18} /></button>
            <div className="flex items-center gap-3 mb-4">
              <RemoteImage urls={itemImageUrls(goldDetail.iconFile, goldDetail.localFile)} name={goldDetail.name} size={48} rounded />
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{goldDetail.name}</h3>
                <div className="text-xs text-gray-500">{goldDetail.desc}</div>
              </div>
            </div>
            {goldSeedIds[goldDetail.name] && (
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-white/40 mb-2">✨ 成长阶段（黄金变异）</div>
                <GrowthPhases seedId={goldSeedIds[goldDetail.name]} gold />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
