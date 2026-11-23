import React from 'react';
import CalculatorTab from './CalculatorTab';
import RanchCalcTab from './RanchCalcTab';

export type CalcMode = 'farm' | 'ranch';

interface Props {
  mode: CalcMode;
  onModeChange: (mode: CalcMode) => void;
}

const MODES = [
  {
    id: 'farm' as const,
    emoji: '🌾',
    title: '农场计算器',
    desc: '作物收益 · 经验 / 金币',
    color: 'leaf',
  },
  {
    id: 'ranch' as const,
    emoji: '🐄',
    title: '牧场计算器',
    desc: '动物收益 · 金券 / 经验',
    color: 'orange',
  },
];

/**
 * 计算器总入口：农场 / 牧场 两个口径。
 * 农场走 CalculatorTab（原有），牧场走 RanchCalcTab。
 * 顶部的切换条做成大块 segmented control —— 一整屏宽度、每个按钮带图标与副标题。
 */
export default function CalculatorHub({ mode, onModeChange }: Props) {
  return (
    <div>
      <div className="container-app px-3 sm:px-4 pt-3 sticky top-0 z-30"
        style={{ background: 'linear-gradient(to bottom, var(--bg) 82%, transparent)', paddingBottom: 8 }}>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 rounded-2xl"
          style={{ background: 'var(--bg-2)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-pop)' }}>
          {MODES.map(m => {
            const on = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                aria-pressed={on}
                className="relative flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 py-2 sm:px-4 sm:py-2.5 text-left transition-all"
                style={on ? {
                  background: `linear-gradient(135deg, var(--${m.color}) 0%, var(--${m.color}-deep) 100%)`,
                  boxShadow: `0 3px 0 var(--${m.color}-deep), 0 6px 16px -6px var(--${m.color})`,
                  transform: 'translateY(-1px)',
                } : {
                  background: 'transparent',
                  boxShadow: 'none',
                }}
              >
                <span className="text-xl sm:text-2xl leading-none flex-shrink-0"
                  style={{ filter: on ? 'drop-shadow(0 2px 3px rgba(0,0,0,.25))' : 'grayscale(.35) opacity(.7)' }}>
                  {m.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-display italic font-bold leading-tight truncate text-[13px] sm:text-base"
                    style={{ color: on ? '#fff' : 'var(--ink-soft)' }}>
                    {m.title}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] font-bold leading-tight truncate mt-0.5"
                    style={{ color: on ? 'rgba(255,255,255,.82)' : 'var(--ink-mute)' }}>
                    {m.desc}
                  </span>
                </span>
                {on && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/90" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {mode === 'farm' ? <CalculatorTab /> : <RanchCalcTab />}
    </div>
  );
}