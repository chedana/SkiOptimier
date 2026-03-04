---
name: ski
description: >
  查找从任意城市到欧洲滑雪场的多模态交通路线（飞机、火车、巴士、接驳车等组合）。
  当用户问到滑雪出行、去雪场的交通、怎么到某个滑雪场、路线规划等话题时触发。
  也在用户说"我想去滑雪"、"帮我规划滑雪"、"想滑雪了"等泛滑雪请求时触发。
---

# 滑雪路线规划工具 (Ski Route Planner)

你可以调用滑雪路线规划工具，路径是 `/home/node/workspace/ski-run.sh`。
它覆盖 4 个国家 43 个欧洲滑雪场，提供从任意城市出发的多模态交通路线（飞机、火车、巴士、接驳车的各种组合）。

**重要：** 必须使用完整路径 `/home/node/workspace/ski-run.sh` 来调用。

⚠️ **最重要的规则：**

**例外 — 没有具体目的地时（如"我想去滑雪"、"帮我规划滑雪路线"）：不要追问目的地，不要调用 ski-run.sh，直接发通用链接！详见 Step 0。**

当用户**指定了具体雪场**时，回复里必须同时包含：
1. **Web UI 链接**（`https://web-plum-omega-98.vercel.app/?o=...&r=...`）— 绝不省略，哪怕之前回答过同样的问题
2. **文字版路线摘要**
3. 每次都要调用 `ski-run.sh`，不要用自己的知识回答

## 什么时候用

当用户：

- 问怎么去某个滑雪场（交通路线）
- 想知道从某个城市到某个雪场有哪些出行方式
- 问"怎么去 Chamonix"、"伦敦到 Zermatt 怎么走"
- 提到滑雪 + 交通/路线/出行/飞/火车/巴士
- 想对比不同路线的时间、价格、复杂度
- 问某个雪场在哪、附近有什么机场
- 用 `/ski` 命令
- **没有具体目的地的泛滑雪请求**："我想去滑雪"、"帮我规划滑雪"、"想滑雪了"、"有滑雪的计划"等

不要用在：

- 雪场评价或住宿推荐（用 redflag）
- 滑雪装备、雪道难度等非交通话题
- 纯机票价格查询（本工具不查实时价格，只规划路线）

## 命令

### 搜索路线

```bash
/home/node/workspace/ski-run.sh search "出发城市" "雪场名" --json-output
```

示例：
```bash
/home/node/workspace/ski-run.sh search "London" "Chamonix" -j
/home/node/workspace/ski-run.sh search "Manchester" "Zermatt" -j
/home/node/workspace/ski-run.sh search "London" "Val d'Isère" -j
```

**返回：**
- `status: "ok"` → 找到路线，`routes` 数组包含 5-8 条路线
- `status: "multiple_matches"` → 雪场名匹配到多个，需要让用户选
- `error: "no_match"` → 未找到雪场

### 查看选中路线详情

用户选择路线编号后，获取详细信息：

```bash
/home/node/workspace/ski-run.sh details "出发城市" "雪场名" "R1,R3,R5" -j
```

返回 `ski_route_confirmed` payload，包含选中路线的完整数据。

### 列出所有雪场

```bash
/home/node/workspace/ski-run.sh resorts -j
/home/node/workspace/ski-run.sh resorts --country france -j
```

### 模糊匹配雪场名

```bash
/home/node/workspace/ski-run.sh match "cham" -j
```

## 完整交互流程（必须按顺序执行）

### Step 0: 没有具体目的地 → 只发链接，不推荐路线

⚠️ **硬性规则：如果用户没指定具体雪场名（如"我想去滑雪"、"帮我规划滑雪"、"想滑雪了"），你必须：**
1. **不要调用 ski-run.sh**
2. **不要推荐任何具体路线**
3. **不要推荐 London → Chamonix 或任何默认目的地**
4. **不要追问"想去哪个雪场"**
5. **只发下面这段话，一字不改：**

```
🎿 来！先在这里挑雪场和路线：

🔗 https://web-plum-omega-98.vercel.app/?o=London

网页里有 43 个欧洲雪场，选好路线直接发回来，我帮你继续规划！
```

如果用户提到了出发城市，把链接里的 `London` 换成对应城市。如果没提到，默认 London。

**绝对不要在这一步给任何路线建议或"三选一"之类的推荐。用户要自己在网页里浏览和选。**

用户在 Web UI 选好多个目的地路线后点确认，会自动发回 Discord，跳到 Step 4 处理。

### Step 1: 用户触发（有具体目的地）

用户说：
- "我想从伦敦去 Chamonix 滑雪"
- "How do I get from London to Courchevel?"
- "/ski London to Zermatt"

从中提取 **出发城市** 和 **目标雪场**。如果信息不全，追问。

### Step 2: 搜索路线

```bash
/home/node/workspace/ski-run.sh search "London" "Chamonix" -j
```

如果返回 `multiple_matches`，列出匹配的雪场让用户选择。

### Step 2.5: 发送 Web UI 链接（必须！每次都要！）

⚠️ **铁律：每次回复滑雪路线问题时，无论是第几次问、无论之前有没有回答过，都必须包含 Web UI 链接。绝不省略！**

搜索成功后，**必须**发一个 Web UI 链接让用户在漂亮界面里选路线：

```
🔗 在浏览器里选路线（推荐，体验更好）：
https://web-plum-omega-98.vercel.app/?o={origin}&r={resort名}

或者在这里直接选👇
```

链接格式：`https://web-plum-omega-98.vercel.app/?o={origin编码}&r={resort名编码}`

示例：
- `https://web-plum-omega-98.vercel.app/?o=London&r=Chamonix`
- `https://web-plum-omega-98.vercel.app/?o=London&r=Val%20d'Is%C3%A8re`

用户在 Web UI 选完路线后点确认，页面会显示 `茄子 确认 R3 R4` 并自动复制到剪贴板，用户回 Discord 粘贴发送即可。

### Step 3: 展示路线摘要（文字版备选）

同时也在 Discord 里列出文字版摘要，解析 JSON 中的 `routes` 数组，每条路线一张"卡片"：

```
⛷️ **London → Chamonix-Mont-Blanc**  ·  8 条路线

1️⃣ **飞 Geneva，巴士直达 Chamonix**  `最快`  `最热门`
    Fly Geneva + direct shuttle
    London ―✈️― Geneva ―🚐― Chamonix
    ⏱ 3.5h · 💰 经济 · 简单

2️⃣ **飞 Lyon，大巴转 Chamonix**  `最便宜`
    Fly Lyon + bus
    London ―✈️― Lyon ―🚌― Chamonix
    ⏱ 5.5h · 💰 经济 · 适中

...

回复路线编号选择（可多选，如 **1 3 5**）
```

**每张卡片 4 行：**
1. **编号 + 中文名 + 标签**（加粗名字，标签用 `反引号`）
2. **英文名**（副标题）
3. **城市链**（用 `―图标―` 连接：London ―✈️― Geneva ―🚐― Chamonix）
4. **统计行**（⏱时长 · 价格档 · 复杂度）

**图标对照：** ✈️flight 🚆train 🚌bus 🚐shuttle 🚗car ⛴️ferry 🚡cable_car 🚶walk
**价格档：** 💰经济(budget) 💎中档(mid) 👑高端(premium)
**复杂度：** 简单(simple) 适中(moderate) 复杂(complex)
**标签：** 最快, 最便宜, 最热门, 最舒适, 风景最美, 夜车省住宿, 纯火车, 仅限冬季, 需要转车多, 创意路线

### Step 4: 用户选择路线

用户可能通过以下方式选择路线：
- 直接在 Discord 回复编号："1 3 5" 或 "我要 1 和 4"
- 从 Web UI 确认后发送："茄子 确认 R3 R4"（从网页复制粘贴）
- 任何包含 "确认" + 路线编号（R1-R8 或 1-8）的消息
- **多目的地确认**（来自 Web UI 的 webhook 消息），格式如：
  ```
  @茄子 确认 R1 R3 R2

  **London → Chamonix** — R1, R3
  R1 飞 Geneva，巴士直达 Chamonix
  R3 飞 Turin，走 Mont Blanc 隧道

  **London → Zermatt** — R2
  R2 飞 Zurich + 火车到 Zermatt
  ```

**处理多目的地确认时：** 解析消息中的每个 `**Origin → Resort** — IDs` 段落，对每个目的地分别执行 Step 5（details 命令），然后把所有详情合并在一条回复里展示。

**不管哪种方式，都提取出路线编号，执行 Step 5。**

### Step 5: 展示详情

```bash
/home/node/workspace/ski-run.sh details "London" "Chamonix" "R1,R3,R5" -j
```

解析返回的 JSON，展示详细的 **Leg Timeline**（参照 JSX LegTimeline 组件）：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **R1 | 飞 Geneva，巴士直达 Chamonix**
    `最快`  `最热门`
    Fly Geneva + direct shuttle  ·  ⏱ 3.5h  ·  💰 经济

  ✈️ **London → Geneva**  `LGW/LHR → GVA`
      飞行 · 1.5h · 750km
      easyJet / SWISS / BA
      💡 easyJet Gatwick 最便宜 £30-60
      │
  🚐 **Geneva Airport → Chamonix**
      接驳车 · 1.5h · 88km
      AlpyBus / easyBus
      💡 机场直接上车，不用进市区，AlpyBus 约 €35

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

回复 **确认** 继续查询实时价格 🔎
```

### Step 6: 用户确认 → 后续处理

用户确认后，拿到 `ski_route_confirmed` payload（来自 Step 5 的 JSON），可以：
- 用 web search 查具体航班价格和时刻
- 帮用户组合完整行程
- 生成预订链接
- 估算总费用

## 数据覆盖

### London 出发（预缓存，秒出）
London → 43 个雪场，共 158 条路线，零延迟。

### 其他城市（实时生成）
首次查询调 Claude API 生成（约 15-20 秒），之后缓存。

### 43 个雪场

**法国 (18):** Chamonix-Mont-Blanc, Val d'Isère, Tignes, Courchevel, Méribel, Val Thorens, La Plagne, Les Arcs, Alpe d'Huez, Les Deux Alpes, Morzine, Avoriaz, Les Gets, Flaine, Megève, La Clusaz, Serre Chevalier, La Rosière

**意大利 (8):** Cortina d'Ampezzo, Val Gardena (Selva), Alta Badia, Cervinia, Courmayeur, La Thuile, Livigno, Madonna di Campiglio

**瑞士 (10):** Zermatt, Verbier, Crans-Montana, Saas-Fee, Wengen, Grindelwald, St. Moritz, Davos-Klosters, Laax, Andermatt

**奥地利 (7):** St. Anton am Arlberg, Lech-Zürs, Kitzbühel, Ischgl, Sölden, Mayrhofen, Saalbach-Hinterglemm

## 示例

**用户：** "从伦敦去 Chamonix 怎么走？"

**你：** 执行：
```bash
/home/node/workspace/ski-run.sh search "London" "Chamonix" -j
```

然后用上述 Step 3 格式展示路线摘要。等用户选择编号后，执行 Step 5 获取详情。

---

**用户：** "Manchester to Zermatt"

**你：** 执行：
```bash
/home/node/workspace/ski-run.sh search "Manchester" "Zermatt" -j
```

⚠️ 非 London 出发，首次会实时生成（约 15 秒），告知用户稍等。

---

**用户：** "有什么雪场推荐？"

**你：** 执行：
```bash
/home/node/workspace/ski-run.sh resorts -j
```

按国家列出雪场，附上标签（expert, family, snow-sure 等），帮用户选。

## 出错时怎么办

- **雪场名匹配失败：** 告诉用户没找到，建议用更完整的名字，或用 `match` 命令查看。
- **多个匹配：** 列出匹配到的雪场让用户选。
- **非 London 出发 + 没有 API key：** 提示目前只支持 London 出发的预存路线。
- **API 生成失败：** 告诉用户生成路线失败，建议稍后重试或换一个出发城市试试。
