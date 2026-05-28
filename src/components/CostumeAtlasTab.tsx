import React from 'react';

const costumeCategories = [
  {
    icon: '🏠', name: '小屋', items: [
      { name: '默认小屋', tag: '默认', desc: '默认装扮' },
      { name: '南瓜小屋', tag: '活动', desc: '【南瓜乐翻天】活动限定装扮' },
    ]
  },
  {
    icon: '🪧', name: '木牌', items: [
      { name: '默认木牌', tag: '默认', desc: '默认装扮' },
      { name: '南瓜木牌', tag: '活动', desc: '【南瓜乐翻天】活动限定装扮' },
    ]
  },
  {
    icon: '🪵', name: '栅栏', items: [
      { name: '默认栅栏', tag: '默认', desc: '默认装扮' },
      { name: '南瓜栅栏', tag: '活动', desc: '【南瓜乐翻天】活动限定装扮' },
    ]
  },
  {
    icon: '🪴', name: '盆栽', items: [
      { name: '默认盆栽', tag: '默认', desc: '默认装扮' },
      { name: '哈哈南瓜塔', tag: '活动', desc: '卖给商人后可以获得金币' },
      { name: '黄金·哈哈南瓜塔', tag: '黄金', desc: '卖给商人后可以获得金豆豆' },
    ]
  },
  {
    icon: '📦', name: '仓库', items: [
      { name: '默认仓库', tag: '默认', desc: '默认装扮' },
      { name: '哈哈南瓜仓库', tag: '活动', desc: '【南瓜乐翻天】活动限定装扮' },
    ]
  },
  {
    icon: '🛤️', name: '道路', items: [
      { name: '默认道路', tag: '默认', desc: '默认装扮' },
      { name: '哈哈南瓜道路', tag: '活动', desc: '【南瓜乐翻天】活动限定装扮' },
    ]
  },
];

const tagColors: Record<string, string> = {
  '默认': 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  '活动': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  '黄金': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
};

export default function CostumeAtlasTab() {
  return (
    <div className="space-y-4 fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-green-500">13</div>
          <div className="text-[10px] text-gray-500">总装扮数</div>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-blue-500">6</div>
          <div className="text-[10px] text-gray-500">分类</div>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-orange-500">6</div>
          <div className="text-[10px] text-gray-500">活动款</div>
        </div>
      </div>

      {costumeCategories.map((cat, i) => (
        <div key={i} className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{cat.icon}</span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h3>
            <span className="text-[10px] text-gray-500 ml-auto">{cat.items.length} 个</span>
          </div>
          <div className="space-y-2">
            {cat.items.map((item, j) => (
              <div key={j} className="flex items-center gap-3 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="text-2xl">🖼️</div>
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