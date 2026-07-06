# QQ农场收益计算器

QQ农场（QQ Farm）游戏辅助工具集，提供收益计算、图鉴查阅、道具浏览等功能。移动端优先的渐进式 Web 应用。

## 功能

| 入口 | 功能 | 说明 |
|------|------|------|
| 🏠 首页 | 仪表盘 | 快速计算器 + 全功能导航入口 + 数据统计 |
| 🧮 计算器 | 经验收益计算器 | 等级/土地配置/紫晶土地/施肥对比/TOP20 排行榜 |
| 📖 图鉴 | 作物图鉴 | 全部种子，点击卡片查看成长阶段图和详细属性 |
| | 土地图鉴 | 5 种土地类型（普通/红/黑/金/紫晶），24 块地开垦顺序与升级需求 |
| | 变异图鉴 | 10 种变异效果 + 黄金超变来源 + 超变图鉴 |
| | 装扮图鉴 | 6 类装扮（小屋/木牌/栅栏/盆栽/仓库/道路等） |
| 🛒 道具 | 道具目录 | 12 个分类全覆盖（种子/黄金果实/货币/工具/化肥/狗粮等） |
| 🛠️ 工具 | 等级查询 | Lv1-Lv200 等级经验表，搜索和分段快速定位 |
| | 土地升级所需 | 各地块升级到红/黑/金/紫晶土地的等级和金币需求 |

## 技术栈

- React 19 / TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (Framer Motion)
- Lucide Icons

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`

## 数据来源与更新

游戏配置数据直接来自微信小游戏「QQ经典农场」的公开 CDN 资源服务器，**不依赖任何第三方计算器站**。

数据采集工作区位于 `D:\workspace\qqfarm-tuisong`（独立目录，不纳入本项目 git），通过脚本从游戏 CDN 提取最新配置后同步到本项目。

### 更新数据流程

```bash
# 1. 在数据采集工作区跑提取脚本（输出自动写入本项目）
cd D:\workspace\qqfarm-tuisong
npm run sync              # 全量：JSON 配置 + 图片
npm run sync:no-images    # 只生成 JSON，跳过图片（快）

# 2. 回到本项目验证 + 推送
cd D:\workspace\QQfarm_up
npm run lint              # TypeScript 类型检查
git diff src/data/        # 看数据变化
git add src/data/ public/
git commit -m "chore: sync QQ farm data"
git push
```

### 安全与合规

- ✅ 只下载公开 CDN 静态资源（无鉴权、无登录、无账号接口）
- ✅ 不抓包、不复现游戏 API 请求签名、不调用任何需登录的接口
- ✅ 不读微信进程内存、不注入、不修改游戏文件
- ✅ 等同于浏览器下载公开图片和 JSON 配置，对微信账号零风险

详细的数据采集方法见 `D:\workspace\qqfarm-tuisong\README.md`。

## 构建部署

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
```

部署到 GitHub Pages：推送 `main` 分支后自动通过 GitHub Actions 构建发布。

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。
