# QQ农场收益计算器

QQ农场（QQ Farm）游戏辅助工具集，提供收益计算、图鉴查阅、道具浏览等功能。移动端优先的渐进式 Web 应用。

## 功能

| 入口 | 功能 | 说明 |
|------|------|------|
| 🧮 计算 | 经验收益计算器 | 等级/土地配置/紫晶土地/施肥对比/TOP20 排行榜 |
| 📖 图鉴 | 作物图鉴 | 163 种作物，点击卡片查看成长阶段图和详细属性 |
| | 土地图鉴 | 5 种土地类型（普通/红/黑/金/紫晶），24 块地开垦顺序与升级需求 |
| | 变异图鉴 | 10 种变异效果 + 黄金超变来源 + 超变图鉴（41 黄金果实/4 装扮果实/5 活动果实） |
| | 装扮图鉴 | 6 类 38 件装扮（小屋/木牌/栅栏/盆栽/仓库/道路） |
| 🛒 道具 | 道具目录 | 12 个分类 269 件道具（种子/黄金果实/货币/工具/化肥/狗粮等） |
| 📋 更多 | 等级查询 | Lv1-Lv200 等级经验表，搜索和分段快速定位 |

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

## 构建部署

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
```

部署到 GitHub Pages：推送 `main` 分支后自动通过 GitHub Actions 构建发布。

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2026 DearMJZ-2U

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

欢迎自由使用、修改和分发。Issue / PR 都欢迎 🎉
