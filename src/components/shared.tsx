import React from 'react';
import { Leaf } from 'lucide-react';
import seedMapping from '../data/seed_mapping.json';
import plantData from '../data/Plant.json';

const seedImageMap: Record<number, string> = {};
const seedNameImageMap: Record<string, string> = {};
for (const m of seedMapping) {
  const sid = Number(m.seedId);
  if (sid > 0 && m.fileName) seedImageMap[sid] = m.fileName;
  if (m.name && m.fileName && m.name !== '未知') seedNameImageMap[m.name] = m.fileName;
}

export function CropImage({ seedId, name, size = 32, className = '' }: { seedId?: number, name: string, size?: number, className?: string }) {
  const [step, setStep] = React.useState(0);
  const fileName = (seedId && seedImageMap[seedId]) || seedNameImageMap[name];
  const remoteId = seedId ? (seedId % 10000) : undefined;
  const remoteUrl1 = remoteId ? `https://jsq.gptvip.chat/images/plant/model/v4/Crop_${remoteId}_Seed.png` : undefined;
  const remoteUrl2 = seedId ? `https://jsq.gptvip.chat/images/plant/model/v4/Crop_${seedId}_Seed.png` : undefined;

  const step0 = step === 0 && !!fileName;
  const step1 = step <= 1 && !!remoteUrl1;
  const step2 = step <= 2 && !!remoteUrl2;

  if (step0) {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    return <img src={`${cleanBaseUrl}seed_images_named/${fileName}`} alt={name} className={`inline-block align-middle object-contain shrink-0 drop-shadow-md ${className}`} loading="lazy" style={{ width: size, height: size }} onError={() => setStep(1)} />;
  }
  if (step1) {
    return <img src={remoteUrl1!} alt={name} className={`inline-block align-middle object-contain shrink-0 drop-shadow-md ${className}`} loading="lazy" style={{ width: size, height: size }} onError={() => setStep(2)} />;
  }
  if (step2) {
    return <img src={remoteUrl2!} alt={name} className={`inline-block align-middle object-contain shrink-0 drop-shadow-md ${className}`} loading="lazy" style={{ width: size, height: size }} onError={() => setStep(3)} />;
  }
  return <div className={`inline-flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full shrink-0 ${className}`} style={{ width: size, height: size }}><Leaf size={size * 0.5} className="text-green-500/50" /></div>;
}

export function parseGrowPhases(growPhases: string) {
  if (!growPhases) return [];
  return growPhases.split(';').map(x => x.trim()).filter(Boolean).map(seg => {
    const parts = seg.split(':');
    return parts.length >= 2 ? (Number(parts[1]) || 0) : 0;
  }).filter(sec => sec > 0);
}

export const plantPhaseMap: Record<number, number> = {};
export const plantLastPhaseMap: Record<number, number> = {};
for (const p of plantData) {
  const seedId = Number(p.seed_id);
  if (seedId > 0 && !plantPhaseMap[seedId]) {
    const phases = parseGrowPhases(p.grow_phases);
    if (phases.length > 0) {
      plantPhaseMap[seedId] = phases[0];
      plantLastPhaseMap[seedId] = phases[phases.length - 1];
    }
  }
}

export function formatSec(sec: number) {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r > 0 ? `${m}分${r}秒` : `${m}分钟`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}小时${mm}分` : `${h}小时`;
}

export const LAND_BUFFS = {
  normal: { time: 1.0, exp: 1.0, yield: 1.0 },
  red: { time: 1.0, exp: 1.0, yield: 2.0 },
  black: { time: 0.9, exp: 1.0, yield: 3.0 },
  gold: { time: 0.8, exp: 1.2, yield: 4.0 },
  purple: { time: 0.8, exp: 1.25, yield: 4.0 },
};

export const NO_FERT_PLANT_SPEED = 9;
export const NORMAL_FERT_PLANT_SPEED = 6;
