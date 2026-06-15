// 变异规则与概率。来源：游戏内「变异说明」弹窗（2026-06）。
// 与 mutation_atlas.json 分离：游戏 auto-sync 不会覆盖此文件。

export const MUTATION_RULES: string[] = [
  '作物变异概率可通过【变异宝典-概率展示】查看。种植天工作物时，会有保底机制，具体规则如下：',
  '种植可触发装扮变异的天工作物时，会累计该作物对应变异的 1 点心愿值。心愿进度首次达到指定心愿值后，将在符合条件的变异判定中触发对应变异。',
  '若同一次种植同时达到多个变异的心愿进度，将优先触发更珍稀的变异效果；其余已达到进度的变异不会消失，会在后续继续种植该作物时继续生效。',
  '月华宝荷心愿值为 30 点，黄金·月华宝荷心愿值为 60 点。',
];

export interface MutationProbability {
  name: string;
  quality: string;
  rate: string;
}

export const MUTATION_PROBABILITIES: MutationProbability[] = [
  { name: '月华', quality: '天工', rate: '6.6%' },
  { name: '塔塔', quality: '天工', rate: '6.6%' },
  { name: '荷华', quality: '珍品', rate: '13.28%' },
  { name: '荷华', quality: '稀有', rate: '9.63%' },
  { name: '黄金', quality: '天工', rate: '9.26%' },
  { name: '黄金', quality: '珍品', rate: '8.51%' },
  { name: '黄金', quality: '稀有', rate: '7.6%' },
  { name: '冰冻', quality: '无', rate: '3.2%' },
  { name: '爱心', quality: '无', rate: '3.2%' },
  { name: '暗化', quality: '无', rate: '4.8%' },
  { name: '湿润', quality: '无', rate: '4.8%' },
];

// name → 该变异的所有概率行（用于在变异卡片上挂概率 chip）
const MUTATION_PROB_INDEX: Record<string, MutationProbability[]> = {};
for (const p of MUTATION_PROBABILITIES) {
  if (!MUTATION_PROB_INDEX[p.name]) MUTATION_PROB_INDEX[p.name] = [];
  MUTATION_PROB_INDEX[p.name].push(p);
}

export function getProbabilitiesFor(name: string): MutationProbability[] {
  return MUTATION_PROB_INDEX[name] || [];
}
