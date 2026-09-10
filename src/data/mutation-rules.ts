// 变异规则与概率。
//   - MUTATION_RULES：手工整理（来自游戏内「变异说明」弹窗 + 官方公告），游戏 auto-sync 不覆盖此文件。
//   - MUTATION_PROBABILITIES：**自动生成**，来自 mutation_atlas.json 的 probabilities 字段
//     （提取脚本直接解 MutantPublicity 表，public_probability/100 = 百分比），
//     新变异上线时随提取脚本自动更新，无需手工维护。
//
// 历史上 MUTATION_PROBABILITIES 是手写的常量，2026-09-10 的比熊乐园版本新增「比熊/乐园」
// 两条变异时漏更新，导致概率展示缺行 —— 故改为从生成数据读取。
import mutationData from './mutation_atlas.json';

export const MUTATION_RULES: string[] = [
  '作物变异概率可通过【变异宝典-概率展示】查看。种植天工作物时，会有保底机制，具体规则如下：',
  '种植可触发装扮变异的天工作物时，会累计该作物对应变异的 1 点心愿值。心愿进度首次达到指定心愿值后，将在符合条件的变异判定中触发对应变异。',
  '若同一次种植同时达到多个变异的心愿进度，将优先触发更珍稀的变异效果；其余已达到进度的变异不会消失，会在后续继续种植该作物时继续生效。',
  '月华宝荷心愿值为 30 点，黄金·月华宝荷心愿值为 60 点。',
  // 2026-08 核补（来源：官方活动公告 + Global.MUTAN_TIPS/ZIJING_TIPS + Level 表）
  '雷雨天气下，珍品及以上品级的作物有概率发生闪电变异（基础概率18%，气象研究节点与「闪电感应」可提升）；闪电变异作物售价为普通作物的4倍，收获时可额外获得雷电徽章。',
  '晶辉变异仅在紫晶土地上出现：基础变异触发时约有16.7%概率呈变为晶辉形态；紫晶共鸣使紫晶土地上任意变异作物的经验+25%（紫晶土地本身变异概率+120%）。',
];

export interface MutationProbability {
  name: string;
  quality: string;
  rate: string;
  /** 变异发布序（= mutant_effect.id，越大越新），用于同品质内按发布新→旧排序 */
  releaseOrder?: number;
}

interface GeneratedProbability extends MutationProbability {
  qualityId?: number;
  order?: number;
  raw?: number;
}

// 从提取脚本生成的 mutation_atlas.json 读取（游戏内「概率展示」的权威数据）
// 生成时已按「品质降序 → 同品质内发布新→旧」排好，这里保持原序转发。
export const MUTATION_PROBABILITIES: MutationProbability[] =
  ((mutationData as any).probabilities as GeneratedProbability[] | undefined)?.map((p) => ({
    name: p.name,
    quality: p.quality,
    rate: p.rate,
    releaseOrder: p.releaseOrder,
  })) ?? [];

// name → 该变异的所有概率行（用于在变异卡片上挂概率 chip）
const MUTATION_PROB_INDEX: Record<string, MutationProbability[]> = {};
for (const p of MUTATION_PROBABILITIES) {
  if (!MUTATION_PROB_INDEX[p.name]) MUTATION_PROB_INDEX[p.name] = [];
  MUTATION_PROB_INDEX[p.name].push(p);
}

export function getProbabilitiesFor(name: string): MutationProbability[] {
  return MUTATION_PROB_INDEX[name] || [];
}
