import React from 'react';
import { CropImage } from './shared';

const mutationTypes = [
  { name: '塔塔', desc: '产出哈哈南瓜塔', trigger: '种植哈哈南瓜有概率出现' },
  { name: '哈哈', desc: '产出哈哈小南瓜', trigger: '种植本期活动稀有种子有概率出现' },
  { name: '黄金', desc: '产出黄金果实', trigger: '稀有作物生长过程中随机出现' },
  { name: '冰冻', desc: '售价×3倍', trigger: '作物生长过程中随机出现' },
  { name: '爱心', desc: '数量×3倍', trigger: '作物生长过程中随机出现' },
  { name: '暗化', desc: '售价×2倍', trigger: '作物生长过程中随机出现' },
  { name: '湿润', desc: '数量×2倍', trigger: '作物生长过程中随机出现' },
];

const goldMutationCrops = [
  { name: '银杏树苗', seedId: 20025, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '爱心果', seedId: 20046, rarity: '★4 天工', exp: 3840, fruit: 96, price: 320, prob: 10, note: '2x2 四方福地' },
  { name: '蝴蝶兰', seedId: 20109, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '风信子', seedId: 20112, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '蔷薇', seedId: 20121, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '昙花', seedId: 20224, rarity: '★3 珍品', exp: 840, fruit: 24, price: 280, prob: 10 },
  { name: '荷包牡丹', seedId: 20249, rarity: '★3 珍品', exp: 840, fruit: 24, price: 280, prob: 10 },
  { name: '艾草', seedId: 21135, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
];

const goldenEntries = [
  { name: '黄金·风信子', seedId: 20112, points: 40, exp: 720, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·银杏树苗', seedId: 20025, points: 40, exp: 720, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·蔷薇', seedId: 20121, points: 40, exp: 720, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·蝴蝶兰', seedId: 20109, points: 40, exp: 720, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·艾草', seedId: 21135, points: 40, exp: 720, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·卡特兰', seedId: 20184, points: 40, exp: 1440, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·红云飞片', seedId: 20193, points: 40, exp: 1440, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·石竹花', seedId: 20256, points: 40, exp: 1440, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·针垫花', seedId: 20261, points: 40, exp: 1440, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·昙花', seedId: 20224, points: 80, exp: 840, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·荷包牡丹', seedId: 20249, points: 80, exp: 840, fruit: 24, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·孔雀草', seedId: 20257, points: 80, exp: 1680, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·欧石楠', seedId: 20258, points: 80, exp: 1680, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·黄金果', seedId: 20304, points: 80, exp: 1680, fruit: 10, note: '卖给商人后可以获得金豆豆' },
  { name: '黄金·爱心果', seedId: 20046, points: 200, exp: 3840, fruit: 96, note: '天工作物黄金变异' },
  { name: '黄金·哈哈南瓜', seedId: 20416, points: 200, exp: 15360, fruit: 480, note: '天工作物黄金变异' },
];

export default function MutationAtlasTab() {
  const [tab, setTab] = React.useState<'types' | 'source' | 'golden'>('types');

  return (
    <div className="space-y-4 fade-in">
      {/* Tab toggle */}
      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        {[
          { id: 'types' as const, label: '变异宝典' },
          { id: 'source' as const, label: '黄金超变来源' },
          { id: 'golden' as const, label: '超变图鉴' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors ${tab === t.id ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'types' && (
        <div className="grid grid-cols-2 gap-3">
          {mutationTypes.map((mt, i) => (
            <div key={i} className="glass-panel rounded-xl p-3">
              <div className="font-bold text-sm text-gray-900 dark:text-white">{mt.name}</div>
              <div className="text-[10px] text-gray-500 dark:text-white/40 mt-1">{mt.desc}</div>
              <div className="text-[9px] text-purple-500 dark:text-purple-400 mt-1">触发：{mt.trigger}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'source' && (
        <div className="space-y-3">
            {goldMutationCrops.map((c, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3">
              <CropImage seedId={c.seedId} name={c.name} size={36} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">{c.rarity}</span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-white/40 mt-1">
                  基础经验:{c.exp} | 果实:{c.fruit}个 | 单价:{c.price}金 | 黄金概率:{c.prob}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'golden' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 dark:text-white/40 mb-2">按黄金果实、装扮果实、活动果实整理，共 {goldenEntries.length} 条目</div>
          {goldenEntries.map((g, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3">
              <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={32} />
              <div className="flex-1">
                <div className="font-bold text-xs text-gray-900 dark:text-white">{g.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-white/40">
                  基础经验:{g.exp} | 果实:{g.fruit}个 | 图鉴点数: +{g.points}
                </div>
                <div className="text-[9px] text-purple-500 dark:text-purple-400">{g.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}