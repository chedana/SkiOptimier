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

### 搜索实时价格

用户确认路线并提供日期后，生成搜索计划：

```bash
/home/node/workspace/ski-run.sh price-search "出发城市" "雪场名" "R1,R3" "2026-03-15" --return-date "2026-03-22" -j
```

返回每段行程的搜索查询（用于 `web_search`）和 URL（用于 `browser`），按交通方式分类。

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

**不管哪种方式，都提取出路线编号，执行 Step 5。如果消息中包含日期（📅 行），记录下来用于 Step 6 价格搜索。**

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

📅 请提供出行日期（如 **3月15日-22日**），我自动搜索实时价格！
如果已有日期，直接回复 **确认** 开始搜索 🔎
```

### Step 6: 实时价格搜索 + 逐段选择（用户确认路线 + 提供日期后）

用户确认路线并提供日期后，进入价格搜索流程。**按段搜索、按段展示、让用户逐段选择。**

#### Step 6a: 确认用户偏好

在搜索前，先快速确认用户偏好（一个问题即可）：

```
你更看重什么？
1️⃣ 💰 便宜优先（廉航没问题，时间灵活）
2️⃣ ⏰ 时间优先（想早到、航班时间合理）
3️⃣ ✨ 舒适优先（全服务航空、直达、不赶时间）
4️⃣ 🤷 都行，帮我推荐
```

记住用户的选择，用于后续每段的推荐排序。如果用户已在之前的对话中表达过偏好（"我想便宜的"/"早点到"），直接用，不用再问。

#### Step 6b: 生成搜索计划

```bash
/home/node/workspace/ski-run.sh price-search "London" "Chamonix" "R1" "2026-03-15" --return-date "2026-03-22" -j
```

返回每段行程的搜索查询和 URL。**注意：按段独立搜索，不生成组合。**

#### Step 6c: 逐段搜索 + 展示（核心流程）

**对每段行程，按顺序搜索和展示：**

##### 搜索方法（每段行程）：

1. **`browser`**（首选）— 打开 `urls.primary`（Google Flights / Trainline / FlixBus）
   - `browser open <url>`
   - `browser wait --load networkidle`（最多等 15 秒）
   - 如果有 cookie consent 弹窗 → `browser snapshot` → 找到"Accept"按钮 → `browser act kind=click ref=<ref>` → 再 `browser wait --load networkidle`
   - `browser snapshot` → 从快照提取完整航班/车次列表
   - 提取：每个选项的价格、出发时间、到达时间、承运商、是否廉航
   - 目标：找到 5-8 个选项

2. **`web_search`**（如果 browser 失败或超时）— 用 `web_search_queries[0]` 搜索
   - 解析搜索结果中的价格、时间信息
   - 通常只能拿到价格范围和航司列表，缺少具体航班时刻

3. **`web_search` fallback** — 用 `fallback_query`

4. **放弃** — "🔗 请手动查看: {urls.primary}"

##### 展示格式（每段）：

**第一段（通常是航班）— 展示所有选项，标注推荐：**

```
✈️ **第1段: London → Geneva** (3月15日)

  推荐 👇（基于你的偏好：💰 便宜优先）

  1️⃣ ⭐ easyJet £45 | 06:15 LGW → 09:30 GVA | 廉航
  2️⃣ ⭐ Ryanair £39 | 07:00 STN → 10:15 GVA | 廉航
  3️⃣ SWISS £89 | 08:00 LHR → 10:45 GVA | 全服务
  4️⃣ BA £72 | 07:30 LHR → 10:15 GVA | 全服务
  5️⃣ easyJet £65 | 10:00 LGW → 13:15 GVA | 廉航
  6️⃣ SWISS £120 | 14:00 LHR → 16:45 GVA | 全服务

  选一个航班编号（1-6），我根据到达时间帮你筛选下一段 🚐
```

**推荐逻辑：**
- 💰 便宜优先 → 按价格排序，⭐标最便宜的 2 个
- ⏰ 时间优先 → 按到达时间排序，⭐标最早到的 2 个（合理出发时间，不要凌晨 4 点的）
- ✨ 舒适优先 → 全服务航空优先，⭐标价格最合理的全服务航班
- 🤷 都行 → 综合推荐：标一个最便宜 + 一个最佳性价比（合理时间+合理价格）

**标注规则：**
- 廉航标"廉航"（easyJet, Ryanair, Wizz Air, Vueling, Transavia, etc.）
- 全服务标"全服务"（SWISS, BA, Air France, Lufthansa, etc.）
- 有行李限制的标 ⚠️

##### 用户选了第一段后 → 时间感知筛选下一段：

用户选了 `1️⃣ easyJet 06:15→09:30 GVA`，你知道到达时间是 **09:30**。

搜索下一段时，**只展示 10:30 以后出发的选项**（留 1 小时缓冲：取行李、过关、找车）：

```
🚐 **第2段: Geneva Airport → Chamonix** (3月15日，10:30 以后)

  基于你选的航班（09:30 到达 GVA），筛选 10:30 后的接驳车：

  1️⃣ ⭐ AlpyBus €35 | 11:00 发车 → 12:30 到 | 需提前预约
  2️⃣ easyBus €25 | 11:30 发车 → 13:15 到 | 较慢但便宜
  3️⃣ AlpyBus €35 | 13:00 发车 → 14:30 到 | 下一班

  选一个，或输入"全部"看所有时段 🚐
```

##### 接驳车/shuttle 特殊处理：

如果搜索计划返回了 `known_carrier`，且 `notes` 字段有价格信息：
- 直接用已知信息，不需要搜索
- 但仍然根据上一段到达时间筛选班次
- 如果没有班次信息，展示价格 + 预约链接

##### 如果用户不满意推荐：

用户可能说"还有别的吗"、"太贵了"、"有没有更早的"。此时：
- 展示该段的完整列表（不筛选）
- 或者按用户新的条件重新排序
- 用户也可以说"返回上一段重新选"

#### Step 6d: 汇总确认

所有段选完后，汇总展示完整行程：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **你的完整行程 (Mar 15)**

  ✈️ London → Geneva
     easyJet £45 | 06:15 LGW → 09:30 GVA

  🚐 Geneva Airport → Chamonix
     AlpyBus €35 | 11:00 → 12:30

  💰 **单程总计: £80 / 人**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

确认这个行程？我给你生成预订链接！
或者输入"重选"从头来过。
```

如果有回程日期，接着搜索回程（反转 from/to，同样逐段选择）。

#### Step 6e: 生成预订链接

用户确认后：
- 每段给出预订链接（从 `urls.primary`）
- 建议预订顺序：先订机票（价格会变），再订接驳车
- 提醒：行李政策（廉航需加购）、到达后找接驳车位置、等

```
🔗 **预订链接：**

1. ✈️ easyJet London→Geneva
   https://www.google.com/travel/flights?q=...
   ⚠️ 廉航注意: 只含手提行李，托运行李需另购 £20-30

2. 🚐 AlpyBus Geneva→Chamonix
   https://www.alpybus.com/
   💡 建议提前 2-3 天预约，到达后在机场 Bus Station 集合

先订机票锁价！🎿
```

#### 跳过价格搜索的情况：

- 🚶 步行段 — 免费，不搜索
- 🚡 缆车段 — 价格固定，用 notes 字段信息
- 🚐 接驳车有 `known_carrier` + notes 有价格 → 直接用，不搜索（但仍按时间筛选）
- 总时间预算：最多 3 分钟（含所有段的搜索）

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
