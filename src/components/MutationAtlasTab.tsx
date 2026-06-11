import React from 'react';
import mutationData from '../data/mutation_atlas.json';
import { CropImage, GrowthPhases, RemoteImage, mutationIconUrls, goldenAtlasImageUrls, goldSeedIds } from './shared';

interface GoldenEntry {
  name: string; seedId: number; cropId: number; points: number; exp: number; fruit: number;
  desc: string; note?: string;
}

function GoldenDetail({ item, onClose }: { item: GoldenEntry; onClose: () => void }) {
  const isGold = item.name.startsWith('黄金');
  const detailUrls = goldenAtlasImageUrls(item.name);
  const showGrowth = goldSeedIds[item.name] !== undefined;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative glass-panel-modal rounded-2xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div className="flex items-center gap-3 mb-4">
          {detailUrls.length > 0 ? (
            <RemoteImage urls={detailUrls} name={item.name} size={48} rounded />
          ) : (
            <CropImage seedId={item.seedId} name={item.name.replace(/^黄金·/, '')} size={48} />
          )}
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">{item.name}</h3>
            <div className="text-xs text-amber-600">图鉴点数: +{item.points}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">经验</div><div className="font-bold text-purple-600">{item.exp}</div></div>
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2"><div className="text-gray-500">果实</div><div className="font-bold text-green-600">{item.fruit}个</div></div>
        </div>
        {showGrowth && (
          <>
            <div className="text-xs font-bold text-gray-500 mb-2">✨ 成长阶段{isGold ? '（黄金变异）' : ''}</div>
            <GrowthPhases seedId={goldSeedIds[item.name]} gold={isGold} />
          </>
        )}
        {item.desc && <div className="text-[10px] text-gray-400 mt-2">{item.desc}</div>}
      </div>
    </div>
  );
}

export default function MutationAtlasTab() {
  const [tab, setTab] = React.useState<'types' | 'golden'>('types');
  const [goldenTab, setGoldenTab] = React.useState<'goldenFruit' | 'costumeFruit' | 'eventFruit'>('goldenFruit');
  const [detail, setDetail] = React.useState<GoldenEntry | null>(null);

  const { mutationTypes, goldenAtlas } = mutationData;

  return (
    <div className="space-y-4 fade-in">
      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        {[
          { id: 'types' as const, label: '变异宝典' },
          { id: 'golden' as const, label: '超变图鉴' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors ${tab === t.id ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'types' && (
        <div className="grid grid-cols-2 gap-3">
          {mutationTypes.map((mt, i) => (
            <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3">
              <RemoteImage urls={mutationIconUrls(mt.icon, mt.name)} name={mt.name} size={40} rounded />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 dark:text-white">{mt.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-white/40">{mt.effectType}: {mt.effectValue}</div>
                <div className="text-[9px] text-purple-500 dark:text-purple-400">{mt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'golden' && (
        <>
          <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 text-[10px]">
            {[
              { id: 'goldenFruit' as const, label: `黄金果实 (${goldenAtlas.goldenFruit.length})` },
              { id: 'costumeFruit' as const, label: `装扮果实 (${goldenAtlas.costumeFruit.length})` },
              { id: 'eventFruit' as const, label: `活动果实 (${goldenAtlas.eventFruit.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setGoldenTab(t.id)} className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${goldenTab === t.id ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
            ))}
          </div>
          <div className="space-y-2">
            {(goldenAtlas[goldenTab] || []).map((g, i) => {
               const atlasUrls = goldenAtlasImageUrls(g.name);
               return (
              <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetail({ ...g, seedId: g.seedId, cropId: g.cropId, points: g.points, exp: g.exp, fruit: g.fruit, desc: g.desc, note: (g as any).note })}>
                {atlasUrls.length > 0 ? (
                  <RemoteImage urls={atlasUrls} name={g.name} size={36} rounded />
                ) : (
                  <CropImage seedId={g.seedId} name={g.name.replace(/^黄金·/, '')} size={36} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{g.name}</div>
                  <div className="text-[10px] text-gray-500 dark:text-white/40">经验:{g.exp} · 果实:{g.fruit}个 · 点数:+{g.points}</div>
                  <div className="text-[9px] text-purple-500 dark:text-purple-400">{g.desc}</div>
                </div>
              </div>
               );
            })}
          </div>
        </>
      )}

      {detail && <GoldenDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
