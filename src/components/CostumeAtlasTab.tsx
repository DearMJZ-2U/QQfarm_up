import React from 'react';
import { CropImage } from './shared';

const IMG = (p: string) => `https://jsq.gptvip.chat/images/${p}`;

const costumeCategories = [
  {
    icon: '🏠', name: '小屋', desc: '农场小屋外观',
    items: [
      { name: '默认小屋', tag: '默认', desc: '默认装扮', img: IMG('extraRes/gui/texture/skinDetail/img_skin_house.png') },
      { name: '南瓜小屋', tag: '活动', desc: '南瓜乐翻天活动限定', img: IMG('extraRes/gui/texture/skinDetail/img_skin_house_1.png') },
    ]
  },
  {
    icon: '🪧', name: '木牌', desc: '门牌与提示木牌',
    items: [
      { name: '默认木牌', tag: '默认', desc: '默认装扮', img: IMG('extraRes/gui/texture/skinDetail/img_skin_board.png') },
      { name: '南瓜木牌', tag: '活动', desc: '南瓜乐翻天活动限定', img: IMG('extraRes/gui/texture/skinDetail/img_skin_board_1.png') },
    ]
  },
  {
    icon: '🪵', name: '栅栏', desc: '农场边界装饰',
    items: [
      { name: '默认栅栏', tag: '默认', desc: '默认装扮', img: IMG('extraRes/gui/texture/skinDetail/img_skin_barrier.png') },
      { name: '南瓜栅栏', tag: '活动', desc: '南瓜乐翻天活动限定', img: IMG('extraRes/gui/texture/skinDetail/img_skin_barrier_1.png') },
    ]
  },
  {
    icon: '🪴', name: '盆栽', desc: '盆栽与塔类摆件',
    items: [
      { name: '默认盆栽', tag: '默认', desc: '默认装扮', img: '' },
      { name: '哈哈南瓜塔', tag: '活动', desc: '卖给商人后可以获得金币', img: IMG('extraRes/gui/texture/skinDetail/img_skin_tower_1.png') },
      { name: '黄金·哈哈南瓜塔', tag: '黄金', desc: '卖给商人后可以获得金豆豆', img: IMG('extraRes/gui/texture/skinDetail/img_skin_tower_1_1.png') },
    ]
  },
  {
    icon: '📦', name: '仓库', desc: '仓库外观',
    items: [
      { name: '默认仓库', tag: '默认', desc: '默认装扮', img: IMG('extraRes/gui/texture/skinDetail/img_skin_warehouse.png') },
      { name: '哈哈南瓜仓库', tag: '活动', desc: '南瓜乐翻天活动限定', img: IMG('extraRes/gui/texture/skinDetail/img_skin_warehouse_1.png') },
    ]
  },
  {
    icon: '🛤️', name: '道路', desc: '道路地面装饰',
    items: [
      { name: '默认道路', tag: '默认', desc: '默认装扮', img: IMG('extraRes/gui/texture/skinDetail/img_skin_road.png') },
      { name: '哈哈南瓜道路', tag: '活动', desc: '南瓜乐翻天活动限定', img: IMG('extraRes/gui/texture/skinDetail/img_skin_road_1.png') },
    ]
  },
];

const tagColors: Record<string, string> = { '默认': 'bg-gray-200 text-gray-600', '活动': 'bg-orange-100 text-orange-700', '黄金': 'bg-amber-100 text-amber-700' };

export default function CostumeAtlasTab() {
  return (
    <div className="space-y-4 fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-green-500">13</div><div className="text-[10px] text-gray-500">总装扮数</div></div>
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-blue-500">6</div><div className="text-[10px] text-gray-500">分类</div></div>
        <div className="glass-panel rounded-xl p-3 text-center"><div className="text-xl font-black text-orange-500">6</div><div className="text-[10px] text-gray-500">活动款</div></div>
      </div>

      {costumeCategories.map((cat, i) => (
        <div key={i} className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{cat.icon}</span>
            <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h3><p className="text-[10px] text-gray-500">{cat.desc}</p></div>
            <span className="text-[10px] text-gray-500 ml-auto">{cat.items.length} 个</span>
          </div>
          <div className="space-y-2">
            {cat.items.map((item, j) => (
              <div key={j} className="flex items-center gap-3 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                {item.img ? (
                  <img src={item.img} alt={item.name} className="w-12 h-12 rounded-xl object-contain shrink-0 bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5" loading="lazy" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">🏡</div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{item.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${tagColors[item.tag]}`}>{item.tag}</span>
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