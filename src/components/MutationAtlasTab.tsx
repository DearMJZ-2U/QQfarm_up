import React from 'react';
import { X } from 'lucide-react';
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

interface CropEntry { name: string; seedId: number; rarity: string; exp: number; fruit: number; price: number; prob: number; note?: string; }

const goldMutationCrops: CropEntry[] = [
  { name: '银杏树苗', seedId: 20025, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '爱心果', seedId: 20046, rarity: '★4 天工', exp: 3840, fruit: 96, price: 320, prob: 10, note: '2x2 四方福地' },
  { name: '蝴蝶兰', seedId: 20109, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '风信子', seedId: 20112, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '蔷薇', seedId: 20121, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
  { name: '昙花', seedId: 20224, rarity: '★3 珍品', exp: 840, fruit: 24, price: 280, prob: 10 },
  { name: '荷包牡丹', seedId: 20249, rarity: '★3 珍品', exp: 840, fruit: 24, price: 280, prob: 10 },
  { name: '艾草', seedId: 21135, rarity: '★2 稀有', exp: 720, fruit: 24, price: 240, prob: 10 },
];

interface GoldenEntry { name: string; seedId: number; points: number; exp: number; fruit: number; note: string; }

const goldenEntries: GoldenEntry[] = [
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

const mutationTypeImages: Record<string, string> = {
  '塔塔': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/tata.png',
  '哈哈': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/haha.png',
  '黄金': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/golden.png',
  '冰冻': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/frozen.png',
  '爱心': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/love.png',
  '暗化': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/dark.png',
  '湿润': 'https://jsq.gptvip.chat/images/extraRes/gui/texture/mutant/icon/moist.png',
};

function DetailModal({ item, onClose }: { item: CropEntry | GoldenEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative glass-panel rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><X size={18} /></button>
        <div className="flex items-center gap-3 mb-4">
          <CropImage seedId={item.seedId} name={item.name.replace(/^黄金·/, '')} size={48} />
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">{item.name}</h3>
            {'rarity' in item && <div className="text-xs text-gray-500">{item.rarity}{item.note ? ' · ' + item.note : ''}</div>}
            {'points' in item && <div className="text-xs text-amber-600">图鉴点数: +{item.points}</div>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">经验</div><div className="font-bold text-purple-600">{item.exp}</div></div>
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">果实</div><div className="font-bold text-green-600">{item.fruit}个</div></div>
          {'price' in item && <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">单价</div><div className="font-bold text-amber-600">{item.price}金</div></div>}
          {'prob' in item && <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">变异概率</div><div className="font-bold text-purple-500">{item.prob}%</div></div>}
          {'note' in item && item.note && <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">详情</div><div className="font-bold text-blue-500">{item.note}</div></div>}
        </div>
      </div>
    </div>
  );
}

export default function MutationAtlasTab() {
  const [tab, setTab] = React.useState<'types' | 'source' | 'golden'>('types');
  const [detail, setDetail] = React.useState<CropEntry | GoldenEntry | null>(null);

  return (
    <div className="space-y-4 fade-in">
      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        {[
          { id: 'types' as const, label: '变异宝典' },
          { id: 'source' as const, label: '黄金超变来源' },
          { id: 'golden' as const, label: '超变图鉴' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors ${tab === t.id ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'types' && (
        <div className="grid grid-cols-2 gap-3">
          {mutationTypes.map((mt, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3">
              {mutationTypeImages[mt.name] ? (
                <img src={mutationTypeImages[mt.name]} alt={mt.name} className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-gray-800 border shrink-0" loading="lazy" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border shrink-0 bg-black/5 dark:bg-white/5">{i === 1 ? '😄' : i === 3 ? '❄️' : i === 5 ? '🌑' : i === 6 ? '💧' : '✨'}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 dark:text-white">{mt.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-white/40">{mt.desc}</div>
                <div className="text-[9px] text-purple-500 dark:text-purple-400">{mt.trigger}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'source' && (
        <div className="space-y-2">
          {goldMutationCrops.map((c, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetail(c)}>
              <CropImage seedId={c.seedId} name={c.name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">{c.rarity}</span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-white/40">
                  经验:{c.exp} · 果实:{c.fruit}个 · 变异:{c.prob}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'golden' && (
        <div className="space-y-2">
          {goldenEntries.map((g, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetail({...g, name: g.name} as GoldenEntry)}>
              <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-gray-900 dark:text-white">{g.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-white/40">
                  经验:{g.exp} · 果实:{g.fruit}个 · 点数:+{g.points}
                </div>
                <div className="text-[9px] text-purple-500 dark:text-purple-400">{g.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && <DetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}