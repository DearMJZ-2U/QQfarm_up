import React from 'react';
import costumeData from '../data/costume_atlas.json';
import { RemoteImage, costumeImageUrls } from './shared';

const tagColors: Record<string, string> = { '默认': 'bg-gray-200 text-gray-600', '活动': 'bg-orange-100 text-orange-700', '黄金': 'bg-amber-100 text-amber-700' };

export default function CostumeAtlasTab() {
  const { categories } = costumeData;
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const defaultCount = categories.reduce((s, c) => s + c.items.filter(i => i.tag === '默认').length, 0);
  const eventCount = categories.reduce((s, c) => s + c.items.filter(i => i.tag === '活动').length, 0);

  return (
    <div className="space-y-4 fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-green-500">{totalItems}</div><div className="text-[10px] text-gray-500">总装扮数</div></div>
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-blue-500">{categories.length}</div><div className="text-[10px] text-gray-500">分类</div></div>
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-orange-500">{eventCount}</div><div className="text-[10px] text-gray-500">活动款</div></div>
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-gray-500">{defaultCount}</div><div className="text-[10px] text-gray-500">默认款</div></div>
      </div>

      {categories.map((cat, i) => (
        <div key={i} className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{cat.icon}</span>
            <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h3><p className="text-[10px] text-gray-500">{cat.desc}</p></div>
            <span className="text-[10px] text-gray-500 ml-auto">{cat.items.length} 个</span>
          </div>
          <div className="space-y-2">
            {cat.items.map((item, j) => (
              <div key={j} className="flex items-center gap-3 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                <RemoteImage urls={costumeImageUrls(item.img, item.name)} name={item.name} size={48} rounded />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{item.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${tagColors[item.tag] || tagColors['默认']}`}>{item.tag}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-white/40">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
