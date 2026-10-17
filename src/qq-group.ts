// QQ 交流群配置：群号 / 备注只在这里改，弹窗和顶栏入口共用
export const QQ_GROUP = {
  number: '1128304808',
  remark: 'QQ农场收益计算器',
  // 二维码图片放在 public/ 下，构建时原样拷到站点根目录；用 BASE_URL 兼容 GitHub Pages 子路径
  qrSrc: (() => {
    const base = (import.meta as any).env?.BASE_URL || '/';
    return `${base.endsWith('/') ? base : `${base}/`}qq-group-qr.png`;
  })(),
};
