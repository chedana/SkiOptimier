---
name: ski-ticket
description: >
  帮用户查找滑雪场的雪票（lift pass）价格、装备租赁信息。
  在用户确认滑雪路线后触发，也可独立使用。
  当用户问到雪票、lift pass、装备租赁、滑雪费用等话题时触发。
---

# 雪票 & 装备查询工具 (Ski Ticket & Rental Planner)

你可以调用雪票查询工具，路径是 `/home/node/workspace/ski-run.sh`，子命令 `ticket-info`。
它覆盖欧洲主要滑雪场，提供雪票价格参考数据、装备租赁费用估算。

**重要：** 必须使用完整路径 `/home/node/workspace/ski-run.sh` 来调用。

⚠️ **最重要的规则：**

**价格必须用 browser 工具打开官网核实 — 永远不要凭自己知识报价。CLI 工具提供 `official_url` 和 `search_hint` 字段。优先用 browser 打开 `official_url` 获取价格；如果官网打不开，用 browser 打开 Google 搜索 `search_hint`。展示搜索结果里的价格，并注明赛季（如 "2025/26 赛季"）。**

### browser 操作步骤（每次搜索都必须这样做）

```
1. browser open "url"                          — 打开页面
2. browser wait --load networkidle             — 等加载完（最多 15 秒）
3. browser snapshot                            — 检查有没有 cookie consent 弹窗
4. 如果有弹窗 → browser act kind=click ref=<接受按钮ref>
   → browser wait --load networkidle
5. browser snapshot                            — 获取完整页面内容
6. 从快照提取价格信息
```

**打开官网获取价格：**
```
browser open "https://www.les3vallees.com/en/skipass"
browser wait --load networkidle
browser snapshot
```

**如果官网打不开（403/timeout），用 Google 搜索：**
```
browser open "https://www.google.com/search?q=Chamonix+Valley+Pass+price+March+2026+adult"
browser wait --load networkidle
browser snapshot
```

## 什么时候用

当用户：

- 从 `ski` 路线规划技能确认路线后，想知道下一步（雪票、装备）
- 问雪票 / lift pass / ski pass 怎么买、多少钱
- 问租装备多少钱（双板、单板、雪鞋、头盔）
- 自带雪板，想知道航空公司收多少滑雪包行李费
- 问"去 X 滑雪要花多少钱"、"X 的雪票多少钱"
- 关键词：雪票、lift pass、ski pass、租板、租装备、费用、多少钱

不要用在：

- 路线规划（用 `ski` 技能）
- 最后一公里 / 机场到雪场接驳查询（用 `ski` 技能处理）
- 住宿 / 酒店推荐
- 雪场评价或雪场对比
- 雪况 / 天气查询

## 命令

```bash
# 完整查询（含到达/离开时间）
/home/node/workspace/ski-run.sh ticket-info "Chamonix" --dates "2026-03-14" --departure-date "2026-03-21" --days 7 --adults 2 --children 1 --arrival-time "14:00" --departure-time "10:00" -j

# 基础查询（独立使用）
/home/node/workspace/ski-run.sh ticket-info "Zermatt" -j
```

**参数说明：**
- `"resort"` — 雪场名（必填）
- `--dates` — 到达日期，格式 `YYYY-MM-DD`
- `--departure-date` — 离开日期，格式 `YYYY-MM-DD`
- `--days` — 滑雪总天数
- `--adults` — 成人人数
- `--children` — 儿童人数
- `--arrival-time` — 到达雪场的时间，格式 `HH:MM`
- `--departure-time` — 离开雪场的时间，格式 `HH:MM`
- `-j` / `--json-output` — 输出 JSON 格式（必须加）

**返回字段说明：**
- `data_quality: "curated"` — 有详细参考数据，直接展示 + browser 打开官网核实
- `data_quality: "basic"` — 只有基础数据，需要 browser 搜索补充
- `search_hint` — 用这个字段做 Google 搜索查实时价格（包含出行月份）
- `official_url` — 官网链接，优先用 browser 直接打开获取价格
- `ski_areas[]` — 雪场区域列表，含距离、海拔、难度标签、`official_url`
- `pass_systems[]` — 可用通票系统，含 `official_url`
- `pass_types[]` — 可用雪票类型（单日 / 多日 / 超级通票）
- `rental_refs[]` — 装备租赁参考商家

## 完整交互流程（必须按顺序执行）

### Step 1: 收集信息

**如果是从 `ski` 路线确认 payload 触发：**

从 payload 自动提取：
- 雪场名（destination）
- 日期（如果用户在路线确认时填了）

**如果是独立触发（用户直接问雪票）：**

先确认信息。**一次性问清楚，不要分多条消息：**

```
查雪票前确认一下：
1. 去哪个雪场？（或者已经确认路线了？）
2. 几号到达、几号离开？（到达和离开的大概时间？）
3. 几个人？（大人/小孩）
4. 自带雪板还是需要租？
```

**日期 & 时间解析规则：**
- "3月14号" → `--dates "2026-03-14"`
- "mid-March" → 估算 `--dates "2026-03-15"`，备注"以下按 3 月 15 日估算"
- "一周" → `--days 7`
- "周末" → `--days 2`（标注可能 3 天）
- "5天" → `--days 5`
- "下午两点到" → `--arrival-time "14:00"`
- "上午 10 点走" → `--departure-time "10:00"`
- "带孩子" → 追问小孩年龄（雪场通常 5 岁以下免票，5-17 岁儿童价）

**如果用户没提日期或时间：** 不要追问，直接用默认值，后面标注 "以上按 7 天估算，告诉我具体日期和时间可以更精确"。

### Step 2: 调用 CLI 工具

根据收集到的信息拼命令：

```bash
/home/node/workspace/ski-run.sh ticket-info "Chamonix" --dates "2026-03-14" --departure-date "2026-03-21" --days 7 --adults 2 --children 1 --arrival-time "14:00" --departure-time "10:00" -j
```

解析返回的 JSON，进入 Step 3-7。

**如果 CLI 工具返回错误（`status: "error"` 或找不到雪场）：见"出错时怎么办"。**

### Step 3: 展示滑雪天数计算

根据到达时间、离开时间、天数帮用户算实际可滑天数：

```
📅 **滑雪天数**

到达: 3月14日 14:00 — 半天可滑
3月15日-19日 — 5 天全天
离开: 3月21日 10:00 — 上午半天可滑

✅ 推荐: **6.5天雪票** → 买 6天 + 1张半天票
💡 替代: 直接买 7天通票（更灵活）
```

**计算规则（使用 `--arrival-time` 和 `--departure-time`）：**

到达当天：
- `arrival_time` 早于 `half_day_start`（通常 12:30）→ 全天
- `arrival_time` 早于 `last_lift`（通常 16:30）→ 半天
- `arrival_time` 晚于 `last_lift` → 不计

离开当天（以 `departure_time` 减去 2 小时缓冲作为实际最晚可滑时间）：
- 可滑至时间晚于 `half_day_start`（通常 12:30）→ 全天
- 可滑至时间晚于 `first_lift`（通常 09:00）→ 上午半天
- 可滑至时间早于 `first_lift` → 不计

其他规则：
- 儿童 / 青少年通常有单独的雪票有效期（如 15 岁以下免费），标注
- 多天票通常有 "5 days within 7" 这类灵活选项，提示用户

**如果没有日期或时间信息：** 跳过这一步，直接展示 Step 4。

### Step 4: 展示雪场区域（必须用 browser 打开官网）

从 CLI 的 `ski_areas[]` 和 `pass_systems[]` 字段解析，**同时必须用 browser 打开官网**，引用官网内容作为来源。

**步骤：**
1. 取 CLI 返回的 `pass_systems[].official_url`
2. 用 browser 打开官网 URL：
   ```
   browser open "<official_url>"
   browser wait --load networkidle
   browser snapshot
   ```
3. 从 snapshot 提取地形、海拔、雪道数据，补充 CLI 的基础信息
4. 展示时附官网 URL 作为来源

```
⛷️ **Chamonix 滑雪区域**

🏔️ **Grands Montets** — 3275m · 镇中心 9km · 高手天堂，垂直落差 2000m
🏔️ **Brévent-Flégère** — 2525m · 镇中心 1km · 中级为主，勃朗峰全景
🏔️ **Les Houches** — 1900m · 镇中心 8km · 家庭友好，下坡赛道
🏔️ **Le Tour/Balme** — 2270m · 镇中心 10km · 安静，粉雪好

📋 Chamonix Valley Pass 覆盖以上全部
📋 Mont Blanc Unlimited 超级通票另含 Courmayeur + Megève
🔗 来源: https://www.montblancnaturalresort.com/en
```

**格式规则：**
- 每行：`🏔️ **区域名** — 海拔 · 距镇中心距离 · 一句话特点（来自官网）`
- 最后一到两行说明哪张通票覆盖哪些区域
- **必须在末尾标注官网 URL 作为来源**
- 如果 `data_quality: "basic"`，加一行：`💡 以上数据为基础参考，详情建议查官网`

### Step 5: 搜索并展示雪票价格

⚠️ **必须用 browser 查价格 — 永远不要凭自己知识报价。**

**步骤：**
1. 取 CLI 返回的 `pass_systems[].official_url`
2. **优先用 browser 直接打开官网**获取价格：
   ```
   browser open "<official_url>"
   browser wait --load networkidle
   browser snapshot
   ```
3. 从 snapshot 提取成人 / 儿童 / 各天数价格
4. **如果官网打不开（403/timeout）**，用 browser 搜 Google：
   ```
   browser open "https://www.google.com/search?q=<search_hint 的内容，空格换成+>"
   browser wait --load networkidle
   browser snapshot
   ```
5. 按下面格式展示，并注明赛季和来源 URL

```
🎫 **雪票价格** (2025/26 赛季 · 3月峰季)

**Chamonix Valley Pass:**
  1天: 成人 €67 · 儿童 €54
  半天: 成人 €54 · 儿童 €43
  6天: 成人 €330 · 儿童 €264
  🔗 官网: https://www.montblancnaturalresort.com/en
  💡 网上买便宜 5-10%，建议提前购买

**Mont Blanc Unlimited** (超级通票，含 Courmayeur + Megève):
  6天: 成人 €395 · 儿童 €316

👥 你的团队 (2大1小, 6天 Valley Pass):
  €330 × 2 + €264 × 1 = **€924**
```

**格式规则：**
- 每种通票单独一段，加粗名称
- 展示与用户需求匹配的天数（以及 1 天 / 半天供参考）
- **必须显示团队合计**（成人数 × 成人价 + 儿童数 × 儿童价）
- 如果没有儿童，只显示成人价格
- 标注出行月份（峰季 / 淡季）
- 标注在线购买优惠（通常 5-10%）
- **如果 web search 没有返回明确价格：** 显示官网 URL 并说 `"建议直接查官网确认当前赛季价格"`

### Step 6: 装备租赁 or 航空行李费

根据用户选择展示其中一个。

**如果用户需要租装备：**

用 browser 打开 Google 搜索 `"[resort] ski equipment rental prices 2025/26"` 或使用 CLI `rental_refs[]` 数据：

```
🎿 **装备租赁**

Intersport [雪场名] (多个取板点)
  基础套装 (双板+雪鞋+雪杖): ~€25-30/天
  高性能套装: ~€40-50/天
  头盔: +€8/天
  🔗 https://www.intersport-rent.com/
  💡 网上预订优惠 30-50%！强烈推荐提前订

👥 你的团队 6天基础套装 (3人):
  ~€28 × 6天 × 3人 = **~€504**
  网上预订后约: **~€300**（节省 ~€200）
```

**如果用户自带装备：**

```
🎿 **自带装备 — 航空公司滑雪包行李费**

  滑雪包 (ski bag): 请查你所乘航空公司官网确认费用
  💡 easyJet 示例: ~£42 单程（需在线提前购买）
  💡 British Airways: 滑雪包通常含在 23kg 托运行李内（免费，请核查）
  💡 用专业雪板袋，加好保护，避免超重
```

**如果用户没说自带还是租：** 默认展示租赁选项，结尾加一句：`"如果你是自带雪板，告诉我是哪家航空公司，我帮你查行李费。"`

### Step 7: 费用总览

把以上费用汇总成一张清单：

```
💰 **费用总览** (2大1小, 6天)

🎫 雪票 (6天 Valley Pass):           €924
🎿 装备租赁 (基础套装 × 6天 × 3人):  ~€504
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 预计合计: **~€1,428** (不含机票、住宿和交通)

💡 **省钱贴士:**
  · 雪票官网在线购买优惠 5-10%（约省 €92）
  · Intersport 网上预订租装备便宜 30-50%（约省 €200）
  · 全部提前购买可省约 **€290-€300**
```

**格式规则：**
- 每项 emoji + 中文说明 + 人数/天数参数 + 金额（右对齐）
- 分隔线用 `━` 重复
- 合计加粗，用 `**`
- 注明"不含机票、住宿和交通"
- 省钱贴士里如果金额可以估算就写出来，更有说服力

结尾可以问：`"需要帮你查住宿吗？🏨"`

## 出错时怎么办

**雪场名未找到：**
告诉用户没找到，建议用更完整的名字，或者调用：
```bash
/home/node/workspace/ski-run.sh match "cham" -j
```
列出最接近的雪场名。

**`data_quality: "basic"`（没有详细数据）：**
告诉用户：`"这个雪场暂没有详细数据，我帮你搜一下"` —— 然后用 browser 搜 Google 查所有信息（雪票官网、租赁商家），不要用 CLI 作为主要来源。

**browser 打不开或没有返回明确价格：**
展示官网 URL（来自 CLI 数据），说：`"建议直接查官网确认当前赛季价格，链接在上面"` —— 不要自己估算，不要给出过时数据。

**CLI 工具完全不可用：**
切换到纯 browser 搜索模式 — 用 browser 打开 Google 依次搜：
1. `https://www.google.com/search?q=[resort]+lift+pass+prices+2025/26`
2. `https://www.google.com/search?q=[resort]+ski+rental+prices+2025/26`
从 snapshot 提取价格，标注每个来源的 URL。

**日期不确定：**
不要追问，按 7 天估算并展示，结尾加：`"以上按 7 天估算，告诉我具体日期和到达/离开时间可以更精确。"`

## 重要规则（每次都必须遵守）

1. **永远显示团队合计** — 不只显示单人价格，必须算出 `成人数 × 成人价 + 儿童数 × 儿童价` 的总金额
2. **永远用 browser 查价格** — 不许凭自己知识报价，优先 browser 打开 `official_url`，打不开就 browser 搜 Google（用 `search_hint` 做搜索词）
3. **标注赛季** — 所有价格必须标注赛季，如 "2025/26 赛季"
4. **每个价格来源配 URL** — 官网链接必须放在对应价格旁边
5. **用官网 URL 作为证据** — 展示雪场区域信息时，必须用 browser 打开官网并引用 URL 作为来源

## 示例

**用户（来自路线确认后）：** "好的路线定了，伦敦飞 Geneva，然后接驳到 Chamonix，3月14号下午2点到雪场，3月21号上午10点离开，两大一小，需要租装备"

**你：** 提取信息，执行：
```bash
/home/node/workspace/ski-run.sh ticket-info "Chamonix" --dates "2026-03-14" --departure-date "2026-03-21" --days 7 --adults 2 --children 1 --arrival-time "14:00" --departure-time "10:00" -j
```

然后按 Step 3-7 完整展示滑雪天数、雪场区域（browser 打开官网）、雪票价格（browser 查官网或搜 Google）、租赁（browser 搜索）、费用总览。

---

**用户（独立触发）：** "Zermatt 雪票多少钱？"

**你：** 执行：
```bash
/home/node/workspace/ski-run.sh ticket-info "Zermatt" -j
```

用 browser 打开 `pass_systems[].official_url` 获取当前赛季价格和区域信息，展示 Zermatt 的各类通票（Zermatt Lift Ticket / Magic Pass 等），附官网链接。如果用户没说人数和天数，按 1 人 / 7 天估算，结尾询问是否需要租赁信息。
