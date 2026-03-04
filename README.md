# SkiOptimier — 欧洲滑雪路线规划工具

AI 驱动的欧洲滑雪场多模态交通路线规划系统，覆盖 4 国 43 个顶级雪场。可作为 [OpenClaw](https://github.com/nicepkg/openclaw) 技能集成到 Discord/Telegram 等聊天平台。

## 功能

### 已完成

- **路线搜索** — 从任意城市到 43 个欧洲雪场的多模态交通路线（飞机+火车+巴士+接驳等组合）
- **Web UI** — 响应式网页界面，浏览路线、查看详情、选择路线
- **多目的地购物车** — 在网页中浏览多个雪场，将不同雪场的路线加入清单，一次性提交
- **Discord 集成** — 通过 webhook 将选中路线发送到 Discord，Bot 自动处理
- **无目的地浏览** — 用户说"我想去滑雪"时发送通用链接，让用户自主浏览 43 个雪场
- **热门推荐** — 首页展示 5 个热门雪场卡片，点击即查
- **London 预缓存** — London 出发的 43 个雪场共 158 条路线零延迟
- **实时生成** — 非 London 出发的路线通过 Claude API 实时生成并缓存

### TODO

- [ ] 实时价格查询（目前只规划路线，不查价格）
- [ ] 更多出发城市预缓存（Manchester, Dublin, Edinburgh 等）
- [ ] 用户偏好记忆（常用出发城市、价格偏好等）
- [ ] 行程组合（路线+住宿+雪票一键打包）
- [ ] 多语言支持（目前中文为主，英文部分支持）
- [ ] 日期选择和季节性路线调整

## 项目结构

```
SkiOptimier/
├── web/                        # React + Vite 前端
│   ├── src/
│   │   ├── App.jsx             # 主应用（含购物车、路线卡片等）
│   │   ├── routes-cache.js     # 预生成路线缓存
│   │   └── main.jsx
│   ├── api/
│   │   └── confirm.js          # Vercel serverless — Discord webhook
│   ├── index.html
│   └── package.json
├── skills/
│   └── ski/
│       └── SKILL.md            # OpenClaw 技能定义
├── ski_planner/                # Python CLI 工具
├── ski-run.sh                  # 路线搜索入口脚本
├── routes_london_all.json      # London 出发预缓存数据
├── ski_resorts_v2.json         # 雪场数据库
└── pyproject.toml
```

## 部署

### Web UI（Vercel）

```bash
cd web
npm install
npm run build        # 构建
npx vercel --prod    # 部署到 Vercel
```

部署后可通过以下 URL 访问：
- `https://your-app.vercel.app/?o=London` — 浏览所有雪场
- `https://your-app.vercel.app/?o=London&r=Chamonix` — 直接查看某个雪场

**环境变量（Vercel Dashboard 中设置）：**

| 变量 | 说明 |
|------|------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL，用于发送用户确认的路线 |

### OpenClaw 技能集成

#### 1. 复制技能文件

将 `skills/ski/SKILL.md` 复制到你的 OpenClaw 配置目录：

```bash
cp skills/ski/SKILL.md /path/to/openclaw-config/skills/ski/SKILL.md
```

#### 2. 安装 CLI 工具

在 OpenClaw 容器的 workspace 中安装路线搜索工具：

```bash
# 复制文件到 workspace
cp ski-run.sh /path/to/openclaw-workspace/ski-run.sh
cp -r ski_planner /path/to/openclaw-workspace/ski-src/
cp routes_london_all.json /path/to/openclaw-workspace/ski-src/
cp ski_resorts_v2.json /path/to/openclaw-workspace/ski-src/

# 安装 Python 依赖（在容器内）
pip install -e /home/node/workspace/ski-src/
```

#### 3. 配置 TOOLS.md（推荐）

在 workspace 的 `TOOLS.md` 中添加滑雪规则，确保 Bot 在用户没指定目的地时只发链接：

```markdown
## 滑雪路线 — 关键规则

当用户说"我想去滑雪"等没有指定具体雪场的请求时：
- 只发通用链接：https://your-app.vercel.app/?o=London
- 不要推荐任何具体路线或目的地
- 用户在网页里自己选
```

#### 4. 更新 Web UI 链接

在 `SKILL.md` 中将所有 `web-plum-omega-98.vercel.app` 替换为你自己的 Vercel 部署 URL。

#### 5. 重启 Bot

```bash
docker restart your-openclaw-container
```

### 注意事项

**Docker 挂载顺序**：如果你的 `docker-compose.yml` 同时挂载了 `config/` 和 `workspace/`：

```yaml
volumes:
  - ./config:/home/node/.openclaw
  - ./workspace:/home/node/.openclaw/workspace
```

`workspace/` 会**覆盖** `config/workspace/`。所以：
- `SKILL.md` → 放在 `config/skills/ski/SKILL.md`（不会被覆盖）
- `TOOLS.md` → 放在 `workspace/TOOLS.md`（不是 `config/workspace/`）

## 数据覆盖

### 43 个雪场

| 国家 | 数量 | 雪场 |
|------|------|------|
| 🇫🇷 法国 | 18 | Chamonix, Val d'Isère, Tignes, Courchevel, Méribel, Val Thorens, La Plagne, Les Arcs, Alpe d'Huez, Les Deux Alpes, Morzine, Avoriaz, Les Gets, Flaine, Megève, La Clusaz, Serre Chevalier, La Rosière |
| 🇮🇹 意大利 | 8 | Cortina d'Ampezzo, Val Gardena, Alta Badia, Cervinia, Courmayeur, La Thuile, Livigno, Madonna di Campiglio |
| 🇨🇭 瑞士 | 10 | Zermatt, Verbier, Crans-Montana, Saas-Fee, Wengen, Grindelwald, St. Moritz, Davos-Klosters, Laax, Andermatt |
| 🇦🇹 奥地利 | 7 | St. Anton am Arlberg, Lech-Zürs, Kitzbühel, Ischgl, Sölden, Mayrhofen, Saalbach-Hinterglemm |

## 技术栈

- **前端**：React 19 + Vite 6
- **部署**：Vercel (前端 + serverless API)
- **CLI**：Python 3.11+ / Click
- **路线生成**：Claude API (Anthropic)
- **Bot 框架**：OpenClaw
- **聊天平台**：Discord（已启用）, Telegram/Slack（可选）

## 本地开发

```bash
cd web
npm install
npm run dev    # http://localhost:5173
```
