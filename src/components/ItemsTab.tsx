import React from 'react';
import seedsData from '../data/seeds.json';
import { CropImage } from './shared';

const seedsList = Array.isArray(seedsData) ? seedsData : (seedsData.rows || []);
const IMG = (path: string) => `https://jsq.gptvip.chat/images/${path}`;

interface ItemEntry { name: string; desc?: string; level?: string; imgSrc?: string; }
const categoryItems: Record<string, ItemEntry[]> = {
  '17': [
    { name: '黄金·哈哈南瓜', desc: '出售获得金豆豆', level: 'Lv.31', imgSrc: IMG('plant/model/v4/gold/Crop_416_Seed.png') },
    { name: '黄金·风信子', desc: '出售获得金豆豆', level: 'Lv.200', imgSrc: IMG('plant/model/v4/gold/Crop_112_Seed.png') },
    { name: '黄金·银杏树苗', desc: '出售获得金豆豆', level: 'Lv.200', imgSrc: IMG('plant/model/v4/gold/Crop_25_Seed.png') },
    { name: '黄金·蔷薇', desc: '出售获得金豆豆', level: 'Lv.200', imgSrc: IMG('plant/model/v4/gold/Crop_121_Seed.png') },
    { name: '黄金·蝴蝶兰', desc: '出售获得金豆豆', level: 'Lv.200', imgSrc: IMG('plant/model/v4/gold/Crop_109_Seed.png') },
    { name: '黄金·昙花', desc: '出售获得金豆豆', level: 'Lv.201', imgSrc: IMG('plant/model/v4/gold/Crop_224_Seed.png') },
    { name: '黄金·荷包牡丹', desc: '出售获得金豆豆', level: 'Lv.201', imgSrc: IMG('plant/model/v4/gold/Crop_249_Seed.png') },
    { name: '黄金·艾草', desc: '出售获得金豆豆', level: 'Lv.200', imgSrc: IMG('plant/model/v4/gold/Crop_1135_Seed.png') },
    { name: '黄金·卡特兰', desc: '出售获得金豆豆', level: 'Lv.21', imgSrc: IMG('plant/model/v4/gold/Crop_184_Seed.png') },
    { name: '黄金·红云飞片', desc: '出售获得金豆豆', level: 'Lv.21', imgSrc: IMG('plant/model/v4/gold/Crop_193_Seed.png') },
    { name: '黄金·石竹花', desc: '出售获得金豆豆', level: 'Lv.21', imgSrc: IMG('plant/model/v4/gold/Crop_256_Seed.png') },
    { name: '黄金·针垫花', desc: '出售获得金豆豆', level: 'Lv.21', imgSrc: IMG('plant/model/v4/gold/Crop_261_Seed.png') },
    { name: '黄金·孔雀草', desc: '出售获得金豆豆', level: 'Lv.41', imgSrc: IMG('plant/model/v4/gold/Crop_257_Seed.png') },
    { name: '黄金·欧石楠', desc: '出售获得金豆豆', level: 'Lv.41', imgSrc: IMG('plant/model/v4/gold/Crop_258_Seed.png') },
    { name: '黄金·黄金果', desc: '出售获得金豆豆', level: 'Lv.81', imgSrc: IMG('plant/model/v4/gold/Crop_304_Seed.png') },
    { name: '黄金·爱心果', desc: '出售获得金豆豆', level: 'Lv.202', imgSrc: IMG('plant/model/v4/gold/Crop_46_Seed.png') },
    { name: '黄金·哈哈小南瓜', desc: '出售获得金豆豆', level: 'Lv.41', imgSrc: IMG('plant/model/v4/gold/Crop_9001_Seed.png') },
    { name: '哈哈小南瓜', desc: '出售获得金币', level: 'Lv.41', imgSrc: IMG('plant/model/v4/gold/Crop_9001_Seed.png') },
  ],
  '02': [
    { name: '金币', desc: '农场基础货币', imgSrc: IMG('extraRes/gui/texture/icon/golds.png') },
    { name: '点券', desc: '特殊兑换货币', imgSrc: IMG('extraRes/gui/texture/icon/star.png') },
    { name: '累计充值', desc: '累计充值金额计数', imgSrc: IMG('extraRes/gui/texture/icon/star.png') },
    { name: '金豆豆', desc: '高级兑换货币', imgSrc: IMG('extraRes/gui/texture/icon/goldenBean.png') },
    { name: '普通化肥容器', desc: '单个作物仅能使用一次', imgSrc: IMG('extraRes/gui/texture/fertilize/normalFertilizeIcon.png') },
    { name: '有机化肥容器', desc: '单个作物不限使用次数', imgSrc: IMG('extraRes/gui/texture/fertilize/fertilizePro.png') },
    { name: '友谊果实', desc: '友谊树果实', imgSrc: IMG('extraRes/gui/texture/icon/pack_08.png') },
    { name: '穗华', desc: '稀有种子兑换货币', imgSrc: IMG('extraRes/gui/texture/icon/suihua.png') },
    { name: '幸运币', desc: '抽奖用货币', imgSrc: IMG('extraRes/gui/texture/icon/xingyunbi.png') },
  ],
  '04': [
    { name: '收获', imgSrc: IMG('extraRes/gui/texture/icon/icon_harvest.png') },
    { name: '铲除', imgSrc: IMG('extraRes/gui/texture/icon/icon_erase.png') },
    { name: '放草', imgSrc: IMG('extraRes/gui/texture/icon/icon_grass.png') },
    { name: '放虫', imgSrc: IMG('extraRes/gui/texture/icon/icon_bug.png') },
    { name: '除草', imgSrc: IMG('extraRes/gui/texture/icon/icon_grass_eraser.png') },
    { name: '除虫', imgSrc: IMG('extraRes/gui/texture/icon/icon_bug_killer.png') },
    { name: '浇水', imgSrc: IMG('extraRes/gui/texture/icon/icon_watering.png') },
    { name: '摘菜', desc: '偷菜', imgSrc: IMG('extraRes/gui/texture/icon/icon_steal.png') },
  ],
  '07': [
    { name: '化肥(1小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize1.png') },
    { name: '化肥(4小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize2.png') },
    { name: '化肥(8小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize3.png') },
    { name: '化肥(12小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize4.png') },
    { name: '有机化肥(1小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize5.png') },
    { name: '有机化肥(4小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize6.png') },
    { name: '有机化肥(8小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize7.png') },
    { name: '有机化肥(12小时)', imgSrc: IMG('extraRes/gui/texture/icon/icon_feterlize8.png') },
  ],
  '10': [
    { name: '农场元老内测框', desc: '元老内测专属', imgSrc: IMG('extraRes/gui/texture/gift/img_giftHead_bg.png') },
    { name: '金穗至尊SVIP框', desc: 'QQSVIP专属', imgSrc: IMG('generated/gui/texture/v2/img_QQVIP_head_bg.png') },
    { name: '萌宠柯基头像框', desc: '萌宠柯基活动', imgSrc: IMG('generated/gui/texture/v2/img_keji_head_bg.png') },
    { name: '春耕纪头像框', desc: '清明春耕纪活动', imgSrc: IMG('generated/gui/texture/v2/img_qing_head_bg.png') },
    { name: '同气连枝头像框', desc: '同气连枝限定', imgSrc: IMG('generated/gui/texture/v2/img_roco_skill_head_bg.png') },
    { name: '护主犬头像框', desc: '洛克王国联动限定', imgSrc: IMG('generated/gui/texture/v2/img_roco_head_bg.png') },
    { name: '哈哈南瓜头像框', desc: '哈哈南瓜活动限定', imgSrc: IMG('generated/gui/texture/v2/img_nangua_head_bg.png') },
  ],
  '08': [
    { name: '田园犬', desc: '吃饱后可看家', imgSrc: IMG('extraRes/gui/texture/icon/Item_4_1.png') },
    { name: '牧羊犬', desc: '吃饱后可看家', imgSrc: IMG('extraRes/gui/texture/icon/Item_4_3.png') },
    { name: '斑点狗', desc: '吃饱后可看家', imgSrc: IMG('extraRes/gui/texture/icon/Item_4_4.png') },
    { name: '柯基', desc: '吃饱后可看家', imgSrc: IMG('extraRes/gui/texture/icon/Item_8_11.png') },
    { name: '护主犬', desc: '洛克王国联动限定', imgSrc: IMG('extraRes/gui/texture/icon/Item_8_21.png') },
  ],
  '09': [
    { name: '1天狗粮', desc: '1天内看家', imgSrc: IMG('extraRes/gui/texture/icon/dogFood1.png') },
    { name: '3天狗粮', desc: '3天内看家', imgSrc: IMG('extraRes/gui/texture/icon/dogFood2.png') },
    { name: '5天狗粮', desc: '5天内看家', imgSrc: IMG('extraRes/gui/texture/icon/dogFood3.png') },
  ],
  '19': [
    { name: '青团', desc: '清明春耕纪活动货币', imgSrc: IMG('extraRes/gui/texture/icon/icon_qing.png') },
    { name: '南瓜印章', desc: '南瓜乐翻天活动货币', imgSrc: IMG('extraRes/gui/texture/icon/icon_nangua.png') },
  ],
  '01': [
    { name: '更新版本可见', desc: '系统保留字段' },
  ],
  '03': [
    { name: '种植经验', desc: '参与种植即可获取', imgSrc: IMG('extraRes/gui/texture/icon/exp.png') },
  ],
  '15': [
    { name: '钻石', desc: '农场充值货币', imgSrc: IMG('extraRes/gui/texture/icon/icon_diamond.png') },
  ],
};

const catMeta = [
  { id: '05', name: '种子', icon: '🌱', count: seedsList.length },
  { id: '17', name: '黄金果实', icon: '✨', count: 18 },
  { id: '02', name: '货币与计数', icon: '💰', count: 9 },
  { id: '04', name: '操作工具', icon: '🛠️', count: 8 },
  { id: '07', name: '化肥道具', icon: '🧪', count: 8 },
  { id: '10', name: '头像框与装饰', icon: '🎨', count: 7 },
  { id: '08', name: '狗与看门犬', icon: '🐕', count: 5 },
  { id: '09', name: '狗粮', icon: '🦴', count: 3 },
  { id: '19', name: '活动货币', icon: '🎟', count: 2 },
  { id: '01', name: '系统占位', icon: '🔧', count: 1 },
  { id: '03', name: '经验与成长', icon: '⭐', count: 1 },
  { id: '15', name: '充值货币', icon: '💎', count: 1 },
];

function RemoteImg({ src, name }: { src?: string; name: string }) {
  const [fail, setFail] = React.useState(false);
  if (!src || fail) return <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-lg border border-black/5 dark:border-white/5 shrink-0">❓</div>;
  return <img src={src} alt={name} className="w-10 h-10 rounded-lg object-contain shrink-0 bg-white dark:bg-gray-800 border border-black/5 dark:border-white/5" loading="lazy" onError={() => setFail(true)} />;
}

export default function ItemsTab() {
  const [cat, setCat] = React.useState('05');
  const info = catMeta.find(c => c.id === cat)!;

  return (
    <div className="flex gap-3 h-full fade-in">
      <div className="w-28 flex-shrink-0 space-y-0.5">
        {catMeta.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`w-full text-left text-xs py-2 px-2.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${cat === c.id ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' : 'text-gray-500 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5'}`}>
            <span>{c.icon}</span><span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>
      <div className="flex-1">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>{info.icon}</span><span className="text-sm font-bold text-gray-900 dark:text-white">{info.name}</span>
            <span className="text-[10px] text-gray-500 ml-auto">{info.count} 个道具</span>
          </div>
          <div className="space-y-1 max-h-[65vh] overflow-y-auto">
            {cat === '05'
              ? seedsList.map(s => (
                  <div key={s.seedId} className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] hover:bg-green-500/5 transition-colors">
                    <CropImage seedId={s.seedId} name={s.name} size={32} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-gray-900 dark:text-white">{s.name}</div>
                      <div className="text-[9px] text-gray-400">Lv{s.requiredLevel} · 🌱{s.exp}经验 · 🕒{s.growTimeStr}</div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 shrink-0">💰{s.price}</span>
                  </div>
                ))
              : categoryItems[cat]
                ? categoryItems[cat].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] hover:bg-green-500/5 transition-colors">
                      <RemoteImg src={item.imgSrc} name={item.name} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{item.name}</div>
                        {item.desc && <div className="text-[9px] text-gray-400">{item.desc}</div>}
                      </div>
                      {item.level && <span className="text-[9px] font-bold text-gray-400 shrink-0">{item.level}</span>}
                    </div>
                  ))
                : <div className="text-xs text-gray-400 text-center py-8">数据整理中</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}