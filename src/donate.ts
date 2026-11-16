const BASE = (import.meta as any).env?.BASE_URL || '/';
const CLEAN_BASE = BASE.endsWith('/') ? BASE : BASE + '/';

const asset = (file: string) => `${CLEAN_BASE}${file}`;

export type DonateAccent = 'leaf' | 'sky';

export interface DonateChannel {
  id: string;
  label: string;
  emoji: string;
  accent: DonateAccent;
  hint: string;
  qrSrc: string;
  width: number;
  height: number;
}

export const DONATE: {
  title: string;
  subtitle: string;
  note: string;
  channels: DonateChannel[];
} = {
  title: '请作者喝杯咖啡吧',
  subtitle: '数据和规则都是挤时间一点点整理的。如果这个工具帮你省了事，欢迎随手请作者喝杯咖啡。',
  note: '打赏纯属自愿，不影响任何功能使用 ❤️',
  channels: [
    {
      id: 'wechat',
      label: '微信支付',
      emoji: '💚',
      accent: 'leaf',
      hint: '微信扫一扫，也可以长按二维码识别',
      qrSrc: asset('donate-wechat.png'),
      width: 916,
      height: 1003,
    },
    {
      id: 'alipay',
      label: '支付宝',
      emoji: '💙',
      accent: 'sky',
      hint: '支付宝扫一扫，也可以长按二维码识别',
      qrSrc: asset('donate-alipay.png'),
      width: 913,
      height: 1038,
    },
  ],
};