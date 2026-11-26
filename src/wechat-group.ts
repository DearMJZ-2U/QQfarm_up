// 微信交流群配置：群名 / 二维码 / 有效期只在这里改，弹窗和顶栏入口共用
export const WECHAT_GROUP: { name: string; qrSrc: string; expiresOn?: string } = {
  name: 'QQ农场收益计算器',
  // 二维码图片放在 public/ 下，构建时原样拷到站点根目录；用 BASE_URL 兼容 GitHub Pages 子路径
  qrSrc: (() => {
    const base = (import.meta as any).env?.BASE_URL || '/';
    return `${base.endsWith('/') ? base : `${base}/`}wechat-group-qr.png`;
  })(),
  // 微信群二维码是 7 天临时码：换图时把这里改成新的失效日期，过期后弹窗会自动提示「已过期」
  expiresOn: '2026-12-03',
};
