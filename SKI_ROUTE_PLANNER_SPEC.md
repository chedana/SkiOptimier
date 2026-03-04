# Ski Route Planner — Discord Bot Skill 技术文档

## 项目概述

一个 Discord bot skill，帮用户查找从任意城市到欧洲滑雪场的多模态交通路线（飞机、火车、巴士、接驳车的各种组合）。

**核心体验：** 用户在 Discord 输入出发城市和目标雪场 → 立即看到 5-8 条路线选项 → 选择感兴趣的路线 → 确认后传回 LLM 做下一步处理（价格查询等）。

---

## 数据源

### 1. 预生成路线缓存（`routes_london_all.json`）

- **覆盖范围：** London → 43 个欧洲滑雪场，共 158 条路线
- **4 个国家：** 法国 18 场、意大利 8 场、瑞士 10 场、奥地利 7 场
- **数据结构：** key = `"london::雪场名小写"`，value = `{"routes": [...]}`
- London 出发的查询直接读缓存，**零延迟**

### 2. 雪场列表（`ski_resorts_v2.json`）

- 43 个雪场的完整信息（国家、海拔、雪道公里数、最近机场代码、标签等）
- 用于用户选择雪场时的 dropdown / autocomplete

### 3. 实时生成（非 London 出发时）

- 当用户输入的出发城市不在缓存中（如 Manchester、Dublin、Paris）
- 调用 Claude API 实时生成路线
- 生成后缓存，同一组合不重复生成

---

## JSON 数据格式

### 路线缓存 key 格式
```
"{origin小写}::{resort名小写}"
```
示例：`"london::chamonix-mont-blanc"`, `"london::val d'isère"`, `"london::st. moritz"`

### 单条路线结构
```json
{
  "id": "R1",
  "name": "飞 Geneva，巴士直达 Chamonix",       // 中文名，描述怎么走
  "name_en": "Fly Geneva + direct shuttle",     // 英文名
  "total_duration_hours": 3.5,                  // 总时长（小时）
  "price_tier": "budget",                       // budget | mid | premium
  "complexity": "simple",                       // simple | moderate | complex
  "tags": ["最快", "最热门"],                     // 标签数组
  "legs": [                                     // 路线段
    {
      "from": "London",
      "to": "Geneva",
      "mode": "flight",                         // flight | train | bus | shuttle | car | ferry
      "typical_carriers": ["easyJet", "SWISS", "BA"],
      "duration_hours": 1.5,
      "distance_km": 750,
      "from_code": "LGW/LHR",                  // 可选：机场/车站代码
      "to_code": "GVA",                         // 可选
      "notes": "easyJet Gatwick 最便宜 £30-60"   // 实用贴士
    },
    {
      "from": "Geneva Airport",
      "to": "Chamonix",
      "mode": "shuttle",
      "typical_carriers": ["AlpyBus", "easyBus"],
      "duration_hours": 1.5,
      "distance_km": 88,
      "notes": "机场直接上车，不用进市区，AlpyBus 约 €35"
    }
  ]
}
```

### 可用标签
```
最快, 最便宜, 最热门, 最舒适, 风景最美, 夜车省住宿, 纯火车, 仅限冬季, 需要转车多, 创意路线
```

### 交通模式
```
flight, train, bus, shuttle, car, ferry, cable_car, walk
```

### 价格档位
```
budget  → 经济（廉航+FlixBus 组合，总计 £60-120）
mid     → 中档（BA/SWISS + 火车，总计 £150-300）
premium → 高端（直飞商务+私人接送，£300+）
```

---

## 用户交互流程（Discord）

### Step 1: 触发

用户在 Discord 发消息：
```
/ski London to Chamonix
/ski Manchester to Zermatt
/ski 从伦敦去 Val d'Isère
```

或者自然语言：
```
"我想从伦敦去 Chamonix 滑雪，有什么交通方式？"
"How do I get from London to Courchevel?"
```

### Step 2: 解析输入

从用户消息中提取：
- **origin:** 出发城市（必须）
- **resort:** 目标雪场（必须，需要模糊匹配到 43 个雪场之一）

如果信息不全，bot 应该追问。

### Step 3: 查找路线

优先级：
1. 检查 `routes_london_all.json` 缓存 → key = `"{origin}::{resort}"`
2. 如果没有 → 调 Claude API 实时生成 → 缓存结果
3. 返回 routes 数组

### Step 4: 展示路线（Discord Embed）

为每条路线生成一个 Discord Embed 或格式化消息。

**推荐展示格式（每条路线一行摘要 + 编号）：**

```
🏔️ London → Chamonix-Mont-Blanc  |  找到 8 条路线

1️⃣ 飞 Geneva，巴士直达 Chamonix
   ✈️ London → Geneva → 🚐 Chamonix  |  3.5h  |  💰经济  |  简单
   [最快] [最热门]

2️⃣ 飞 Lyon，大巴转 Chamonix
   ✈️ London → Lyon → 🚌 Chamonix  |  5.5h  |  💰经济  |  适中
   [最便宜]

3️⃣ 飞 Turin，走 Mont Blanc 隧道
   ✈️ London → Turin → 🚌 Courmayeur → 🚐 Chamonix  |  5h  |  💰经济  |  适中
   [创意路线]

4️⃣ Eurostar Snow 滑雪专线 + 转巴士
   🚆 London → Lille → Bourg-St-Maurice → 🚌 Chamonix  |  10h  |  💎中档  |  适中
   [仅限冬季] [纯火车]

5️⃣ 全程火车 London→Paris→Chamonix
   🚆 London → Paris → Saint-Gervais → Chamonix  |  9.5h  |  💎中档  |  复杂
   [纯火车] [风景最美]

6️⃣ 飞 Geneva，瑞士火车风景线
   ✈️ London → Geneva → 🚆 Martigny → Chamonix  |  5h  |  💎中档  |  适中
   [风景最美]

7️⃣ 飞 Bergamo 廉航，穿隧道到 Chamonix
   ✈️ London → Bergamo → 🚌 Courmayeur → 🚐 Chamonix  |  7h  |  💰经济  |  复杂
   [需要转车多]

8️⃣ FlixBus 夜车直达
   🚌 London → Chamonix  |  14h  |  💰经济  |  简单
   [夜车省住宿] [最便宜]

请输入你感兴趣的路线编号（可多选，如 "1 3 5"）：
```

### Step 5: 用户选择路线

用户回复编号：
```
1 3 5
```
或
```
我要 1 和 4
```

### Step 6: 展示选中路线详情

对每条选中的路线，展开显示详情：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 路线 1: 飞 Geneva，巴士直达 Chamonix
   Fly Geneva + direct shuttle | 3.5h | 💰经济

   ✈️ London → Geneva
      飞行 · 1.5h · 750km
      easyJet / SWISS / BA
      💡 easyJet Gatwick 最便宜 £30-60; SWISS/BA 从 Heathrow

   🚐 Geneva Airport → Chamonix
      接驳车 · 1.5h · 88km
      AlpyBus / easyBus
      💡 机场直接上车，不用进市区，AlpyBus 约 €35

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 路线 3: 飞 Turin，走 Mont Blanc 隧道
   Fly Turin + Mont Blanc Tunnel | 5h | 💰经济

   ✈️ London → Turin
      飞行 · 2h · 950km
      Ryanair / Wizz Air
      💡 Ryanair/Wizz 常有超低价 £15-30

   🚌 Turin → Courmayeur
      巴士 · 1.5h · 150km
      SAVDA
      💡 SAVDA 大巴约 €12

   🚐 Courmayeur → Chamonix
      接驳车 · 0.5h · 20km
      Mont Blanc Tunnel shuttle
      💡 穿 Mont Blanc 隧道 11.6km，20分钟到

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

确认这些路线？输入 "确认" 继续查询实时价格。
```

### Step 7: 确认 → 回传 LLM

用户确认后，将选中的路线数据（完整 JSON）传回给 LLM 做后续处理。

**回传给 LLM 的数据结构：**
```json
{
  "action": "ski_route_confirmed",
  "origin": "London",
  "resort": "Chamonix-Mont-Blanc",
  "selected_routes": [
    {
      "id": "R1",
      "name": "飞 Geneva，巴士直达 Chamonix",
      "total_duration_hours": 3.5,
      "price_tier": "budget",
      "legs": [
        { "from": "London", "to": "Geneva", "mode": "flight", "typical_carriers": ["easyJet", "SWISS", "BA"] },
        { "from": "Geneva Airport", "to": "Chamonix", "mode": "shuttle", "typical_carriers": ["AlpyBus", "easyBus"] }
      ]
    },
    {
      "id": "R3",
      "name": "飞 Turin，走 Mont Blanc 隧道",
      "total_duration_hours": 5,
      "price_tier": "budget",
      "legs": [
        { "from": "London", "to": "Turin", "mode": "flight", "typical_carriers": ["Ryanair", "Wizz Air"] },
        { "from": "Turin", "to": "Courmayeur", "mode": "bus", "typical_carriers": ["SAVDA"] },
        { "from": "Courmayeur", "to": "Chamonix", "mode": "shuttle", "typical_carriers": ["Mont Blanc Tunnel shuttle"] }
      ]
    }
  ]
}
```

LLM 拿到这个数据后可以：
- 用 web search 查具体航班价格和时刻
- 帮用户组合完整行程
- 生成预订链接
- 估算总费用

---

## 实时生成（非缓存城市）

### Claude API 调用

当缓存 miss 时，调用 Claude API：

**Model:** `claude-sonnet-4-5-20250514`
**Max tokens:** 4000

**System prompt（已优化，直接使用）：**

```
You are a European ski travel route planner. Given an origin city and a ski resort, generate ALL viable multi-modal transport routes.

RULES:
- Generate 5-8 routes with flights, trains, buses, shuttles, creative combos
- Include budget (Ryanair, easyJet, FlixBus) and premium (BA, SWISS, Eurostar)
- Consider ALL nearby airports including secondary ones
- Route names in Chinese describing HOW you travel, not carrier names
- Do NOT invent prices, categorize as budget/mid/premium
- Include Eurostar Snow train if relevant (London→Lille→Alps, Saturdays Dec-Mar)
- Include overnight bus/train if saves accommodation

Respond ONLY valid JSON:
{"routes":[{"id":"R1","name":"中文路线名","name_en":"English name","total_duration_hours":3.5,"price_tier":"budget","complexity":"simple","tags":["最快"],"legs":[{"from":"...","to":"...","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":"实用贴士"}]}]}

TAGS: 最快, 最便宜, 最热门, 最舒适, 风景最美, 夜车省住宿, 纯火车, 仅限冬季, 需要转车多, 创意路线
```

**User prompt:**
```
Origin: {origin}
Destination: {resort}
Generate all viable routes. Chinese names. JSON only.
```

**解析返回：**
```python
text = "".join(block["text"] for block in response["content"] if block.get("text"))
clean = text.replace("```json", "").replace("```", "").strip()
data = json.loads(clean)
routes = data["routes"]
```

### 缓存策略

- 实时生成的结果存入内存缓存（dict）
- key 格式同预生成：`"{origin小写}::{resort小写}"`
- 同一 session 内同组合不重复生成
- 可选：持久化到文件，跨 session 复用

---

## 雪场模糊匹配

用户可能输入：
- `chamonix` → 匹配 `Chamonix-Mont-Blanc`
- `cham` → 匹配 `Chamonix-Mont-Blanc`
- `val d'isere` → 匹配 `Val d'Isère`（注意重音符号）
- `courchevel 1850` → 匹配 `Courchevel`
- `st anton` → 匹配 `St. Anton am Arlberg`
- `kitzbuhel` → 匹配 `Kitzbühel`
- `zermatt` → 精确匹配
- `3 valleys` → 应该提示用户选择 Courchevel / Méribel / Val Thorens

**匹配逻辑建议：**
1. 先精确匹配（忽略大小写、忽略重音符号）
2. 再前缀匹配
3. 再模糊包含匹配
4. 如果多个匹配，列出让用户选
5. 如果零匹配，提示可用列表

**完整雪场列表（43 个）：**

**France (18):** Chamonix-Mont-Blanc, Val d'Isère, Tignes, Courchevel, Méribel, Val Thorens, La Plagne, Les Arcs, Alpe d'Huez, Les Deux Alpes, Morzine, Avoriaz, Les Gets, Flaine, Megève, La Clusaz, Serre Chevalier, La Rosière

**Italy (8):** Cortina d'Ampezzo, Val Gardena (Selva), Alta Badia, Cervinia, Courmayeur, La Thuile, Livigno, Madonna di Campiglio

**Switzerland (10):** Zermatt, Verbier, Crans-Montana, Saas-Fee, Wengen, Grindelwald, St. Moritz, Davos-Klosters, Laax, Andermatt

**Austria (7):** St. Anton am Arlberg, Lech-Zürs, Kitzbühel, Ischgl, Sölden, Mayrhofen, Saalbach-Hinterglemm

---

## 辅助显示数据

### 交通模式图标
```
flight   → ✈️
train    → 🚆
bus      → 🚌
shuttle  → 🚐
car      → 🚗
ferry    → ⛴️
cable_car → 🚡
walk     → 🚶
```

### 交通模式中文
```
flight   → 飞行
train    → 火车
bus      → 巴士
shuttle  → 接驳车
car      → 自驾
ferry    → 渡轮
cable_car → 缆车
walk     → 步行
```

### 价格档位颜色/标签
```
budget  → 💰 经济  → 绿色
mid     → 💎 中档  → 黄色
premium → 👑 高端  → 红色
```

### 复杂度中文
```
simple   → 简单
moderate → 适中
complex  → 复杂
```

---

## 项目文件清单

```
ski-route-planner/
├── routes_london_all.json     # 预生成路线缓存（London→43雪场，158条路线）
├── ski_resorts_v2.json        # 43个雪场详细信息（海拔、雪道、最近机场等）
├── SKI_ROUTE_PLANNER_SPEC.md  # 本文档
└── (bot skill 代码由 Claude Code 实现)
```

---

## 关键设计决策

1. **路线是静态的，价格是动态的。** London→Chamonix 永远是那 8 条路线，不会变。变的是航班价格和班次。所以 Step 1（路线发现）用预生成缓存，Step 2（价格查询）才需要实时搜索。

2. **中文路线名。** 用户群体中文为主，路线名用中文描述"怎么走"（如"飞 Geneva，巴士直达雪场"），而不是承运商名字（如"easyJet + AlpyBus"）。英文名作为副标题。

3. **Eurostar Snow 冬季专线。** 2025/26 赛季每周六从 London St Pancras 出发，停 Chambéry→Albertville→Moûtiers→Aime-la-Plagne→Landry→Bourg-Saint-Maurice。覆盖三峡谷、La Plagne、Les Arcs、Val d'Isère、Tignes、La Rosière。已在相关雪场路线中包含。

4. **自由输入出发城市。** 不限制出发城市列表。London 有缓存秒出；其他城市首次调 API（15-20秒），之后缓存。

5. **用户选择→确认→回传 LLM。** 这是一个两步交互：先展示路线让用户选，确认后把选中路线的完整数据回传给 LLM。LLM 拿到具体路线后可以做价格搜索、行程规划等后续处理。
