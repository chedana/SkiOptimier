import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import ROUTES_CACHE from "./routes-cache.js";

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const RESORTS = [
  { country: "France", flag: "🇫🇷", resorts: ["Chamonix-Mont-Blanc","Val d'Isère","Tignes","Courchevel","Méribel","Val Thorens","La Plagne","Les Arcs","Alpe d'Huez","Les Deux Alpes","Morzine","Avoriaz","Les Gets","Flaine","Megève","La Clusaz","Serre Chevalier","La Rosière"] },
  { country: "Italy", flag: "🇮🇹", resorts: ["Cortina d'Ampezzo","Val Gardena (Selva)","Alta Badia","Cervinia","Courmayeur","La Thuile","Livigno","Madonna di Campiglio"] },
  { country: "Switzerland", flag: "🇨🇭", resorts: ["Zermatt","Verbier","Crans-Montana","Saas-Fee","Wengen","Grindelwald","St. Moritz","Davos-Klosters","Laax","Andermatt"] },
  { country: "Austria", flag: "🇦🇹", resorts: ["St. Anton am Arlberg","Lech-Zürs","Kitzbühel","Ischgl","Sölden","Mayrhofen","Saalbach-Hinterglemm"] }
];

const ALL_RESORT_NAMES = RESORTS.flatMap(g => g.resorts);

const MODE_ICONS = { flight: "✈️", train: "🚆", bus: "🚌", shuttle: "🚐", car: "🚗", ferry: "⛴️", cable_car: "🚡", walk: "🚶" };
const MODE_ZH = { flight: "飞行", train: "火车", bus: "巴士", shuttle: "接驳车", car: "自驾", ferry: "渡轮", cable_car: "缆车", walk: "步行" };
const TIER_COLORS = { budget: "#34d399", mid: "#fbbf24", premium: "#f87171" };
const TIER_LABELS = { budget: "💰 经济", mid: "💎 中档", premium: "👑 高端" };
const COMPLEXITY_LABELS = { simple: "简单", moderate: "适中", complex: "复杂" };
const BG = "#0c1220";
const CARD_BG = "#151d2e";
const CARD_BORDER = "#1e2d45";
const ACCENT = "#38bdf8";
const TEXT1 = "#f1f5f9";
const TEXT2 = "#94a3b8";
const TEXT3 = "#64748b";
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

/* ═══════════════════════════════════════════════
   URL PARAMS
   ═══════════════════════════════════════════════ */

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    origin: params.get("o") || params.get("origin") || "",
    resort: params.get("r") || params.get("resort") || "",
    autoSend: params.get("ch") || params.get("auto") || "",
  };
}

/** Fuzzy match a resort name from URL param to canonical name */
function matchResort(query) {
  if (!query) return "";
  const q = query.toLowerCase().replace(/[.']/g, "");
  // Exact
  for (const name of ALL_RESORT_NAMES) {
    if (name.toLowerCase() === query.toLowerCase()) return name;
  }
  // Accent-stripped exact
  for (const name of ALL_RESORT_NAMES) {
    if (name.toLowerCase().replace(/[.'àâäéèêëïîôùûüÿçæœ]/g, c => {
      const map = {à:"a",â:"a",ä:"a",é:"e",è:"e",ê:"e",ë:"e",ï:"i",î:"i",ô:"o",ù:"u",û:"u",ü:"u",ÿ:"y",ç:"c",æ:"ae",œ:"oe","'":"",".":""};
      return map[c] || c;
    }) === q) return name;
  }
  // Prefix
  const prefix = ALL_RESORT_NAMES.filter(n => n.toLowerCase().replace(/[.']/g, "").startsWith(q));
  if (prefix.length === 1) return prefix[0];
  // Substring
  const sub = ALL_RESORT_NAMES.filter(n => n.toLowerCase().replace(/[.']/g, "").includes(q));
  if (sub.length === 1) return sub[0];
  if (sub.length > 0) return sub[0];
  return "";
}

/* ═══════════════════════════════════════════════
   CACHE + ROUTE LOGIC
   ═══════════════════════════════════════════════ */

function cacheKey(origin, resort) {
  return `${origin.trim().toLowerCase()}::${resort.trim().toLowerCase()}`;
}

function getRoutes(origin, resort) {
  const key = cacheKey(origin, resort);
  if (ROUTES_CACHE[key]) return { routes: ROUTES_CACHE[key].routes, source: "预生成" };
  return { routes: [], source: "无缓存" };
}

/* ═══════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════ */

function ResortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const groups = useMemo(() => {
    if (!q) return RESORTS;
    const s = q.toLowerCase();
    return RESORTS.map(g => ({
      ...g,
      resorts: g.resorts.filter(r => r.toLowerCase().includes(s) || g.country.toLowerCase().includes(s))
    })).filter(g => g.resorts.length > 0);
  }, [q]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{ fontSize: 12, color: TEXT2, marginBottom: 6, display: "block", fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>🎿 滑雪场</label>
      <div onClick={() => setOpen(!open)} style={{
        padding: "12px 16px", borderRadius: 10, border: `1px solid ${open ? ACCENT : CARD_BORDER}`,
        background: CARD_BG, color: value ? TEXT1 : TEXT3, cursor: "pointer", fontSize: 15,
        display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s"
      }}>
        <span>{value || "选择目的地..."}</span>
        <span style={{ fontSize: 10, color: TEXT3 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12,
          maxHeight: 340, overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)"
        }}>
          <div style={{ padding: 8, position: "sticky", top: 0, background: CARD_BG, zIndex: 2 }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索雪场或国家..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${CARD_BORDER}`,
                background: BG, color: TEXT1, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = CARD_BORDER} />
          </div>
          {groups.map(g => (
            <div key={g.country}>
              <div style={{ padding: "8px 16px", fontSize: 11, color: TEXT2, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                {g.flag} {g.country} ({g.resorts.length})
              </div>
              {g.resorts.map(r => (
                <div key={r} onClick={() => { onChange(r); setOpen(false); setQ(""); }}
                  style={{ padding: "9px 16px 9px 34px", cursor: "pointer", fontSize: 14,
                    color: r === value ? ACCENT : TEXT1,
                    background: r === value ? ACCENT+"10" : "transparent", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (r !== value) e.currentTarget.style.background = ACCENT+"0a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = r === value ? ACCENT+"10" : "transparent"; }}>
                  {r}
                </div>
              ))}
            </div>
          ))}
          {groups.length === 0 && <div style={{ padding: 20, textAlign: "center", color: TEXT3, fontSize: 14 }}>没有匹配</div>}
        </div>
      )}
    </div>
  );
}

function LegTimeline({ legs }) {
  return (
    <div style={{ padding: "16px 0 4px" }}>
      {legs.map((leg, i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < legs.length - 1 ? 18 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 36 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: ACCENT+"18", fontSize: 17, flexShrink: 0 }}>
              {MODE_ICONS[leg.mode] || "🚀"}
            </div>
            {i < legs.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: CARD_BORDER, marginTop: 6 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>
              {leg.from} → {leg.to}
              {leg.from_code && leg.to_code && <span style={{ fontSize: 12, color: TEXT3, fontWeight: 400, marginLeft: 8 }}>{leg.from_code} → {leg.to_code}</span>}
            </div>
            <div style={{ fontSize: 13, color: TEXT2, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span>{MODE_ZH[leg.mode] || leg.mode}</span>
              <span style={{ color: TEXT3 }}>·</span>
              <span>{leg.duration_hours}h</span>
              {leg.distance_km > 0 && <><span style={{ color: TEXT3 }}>·</span><span>{leg.distance_km}km</span></>}
            </div>
            {leg.typical_carriers?.length > 0 && <div style={{ fontSize: 12, color: TEXT3, marginTop: 3 }}>{leg.typical_carriers.join(" / ")}</div>}
            {leg.notes && (
              <div style={{ fontSize: 12, color: ACCENT, marginTop: 6, padding: "6px 10px", background: ACCENT+"08", borderRadius: 8, lineHeight: 1.5, borderLeft: `2px solid ${ACCENT}40` }}>
                {leg.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RouteCard({ route, selected, onToggle, expanded, onExpand }) {
  const tierColor = TIER_COLORS[route.price_tier] || TEXT3;
  const legs = route.legs || [];
  const cityChain = legs.map((leg, i) => {
    const icon = MODE_ICONS[leg.mode] || "→";
    return i === 0 ? `${leg.from} ―${icon}― ${leg.to}` : ` ―${icon}― ${leg.to}`;
  }).join("");

  return (
    <div style={{
      background: selected ? ACCENT+"08" : CARD_BG,
      border: `1px solid ${selected ? ACCENT : CARD_BORDER}`,
      borderRadius: 14, overflow: "hidden", transition: "all 0.2s ease"
    }}>
      <div onClick={onExpand} style={{ padding: "16px 18px", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: TEXT1 }}>{route.name}</span>
              {route.tags?.map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: ACCENT+"15", color: ACCENT, letterSpacing: 0.3 }}>{tag}</span>
              ))}
            </div>
            {route.name_en && <div style={{ fontSize: 12, color: TEXT3, marginTop: 2 }}>{route.name_en}</div>}
            <div style={{ fontSize: 13, color: TEXT2, marginTop: 8, lineHeight: 1.5, wordBreak: "break-word" }}>{cityChain}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT1, fontVariantNumeric: "tabular-nums" }}>{route.total_duration_hours}h</div>
              <div style={{ display: "flex", gap: 5, marginTop: 5, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, fontWeight: 500, background: tierColor+"18", color: tierColor }}>{TIER_LABELS[route.price_tier] || route.price_tier}</span>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: TEXT3+"15", color: TEXT3 }}>{COMPLEXITY_LABELS[route.complexity] || route.complexity}</span>
              </div>
            </div>
            <div onClick={e => { e.stopPropagation(); onToggle(); }}
              style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${selected ? ACCENT : "#334155"}`,
                background: selected ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
              {selected && <span style={{ color: BG, fontSize: 14, fontWeight: 800 }}>✓</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: TEXT3 }}>{expanded ? "▲ 收起详情" : "▼ 展开详情"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${CARD_BORDER}` }}>
          <LegTimeline legs={legs} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONFIRM TOAST
   ═══════════════════════════════════════════════ */

function ConfirmToast({ show, message }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      background: "#166534", color: "#bbf7d0", padding: "12px 24px", borderRadius: 12,
      fontSize: 14, fontWeight: 600, zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      animation: "sk-fadein 0.3s ease"
    }}>
      <style>{"@keyframes sk-fadein { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }"}</style>
      ✅ {message}
    </div>
  );
}

function CartStrip({ cart, onRemove }) {
  const totalRoutes = cart.reduce((sum, item) => sum + item.routes.length, 0);
  return (
    <div style={{
      maxWidth: 600, margin: "0 auto", width: "100%", padding: "0 16px", marginBottom: 12
    }}>
      <div style={{
        background: ACCENT + "10", border: `1px solid ${ACCENT}30`, borderRadius: 12,
        padding: "10px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
        boxSizing: "border-box", minHeight: 44
      }}>
        <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600, marginRight: 4 }}>
          🛒 已选清单 ({totalRoutes})
        </span>
        {cart.length === 0 && (
          <span style={{
            padding: "4px 10px", fontSize: 12, color: TEXT3,
            border: `1px dashed ${CARD_BORDER}`, borderRadius: 8
          }}>选择路线后自动添加</span>
        )}
        {cart.map((item, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8,
            padding: "4px 10px", fontSize: 12, color: TEXT1, whiteSpace: "nowrap"
          }}>
            {item.resort} ×{item.routes.length}
            <span onClick={() => onRemove(i)} style={{
              cursor: "pointer", color: TEXT3, marginLeft: 2, fontSize: 14,
              lineHeight: 1
            }}>✕</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */

export default function SkiRoutePlanner() {
  const urlParams = useMemo(() => getUrlParams(), []);
  const isFromDiscord = !!(urlParams.origin && urlParams.resort);

  const [origin, setOrigin] = useState(urlParams.origin || "London");
  const [resort, setResort] = useState("");
  const [routes, setRoutes] = useState(null);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [cart, setCart] = useState([]);
  const didAutoSearch = useRef(false);

  const canSearch = origin.trim().length > 1 && resort;

  const handleSearch = useCallback(() => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setRoutes(null);
    setExpanded({});
    setConfirmed(false);
    // Sync lookup (all cached, no async needed)
    const { routes: r, source: s } = getRoutes(origin.trim(), resort);
    if (r.length === 0 && s === "无缓存") {
      setError(`暂无 ${origin} → ${resort} 的预存路线。请回到 Discord 让茄子为你实时生成。`);
    }
    // Restore checkboxes if this resort is already in cart
    const key = `${origin.trim()}::${resort}`;
    const existing = cart.find(item => `${item.origin}::${item.resort}` === key);
    if (existing) {
      const sel = {};
      existing.routes.forEach(rt => { sel[rt.id] = true; });
      setSelected(sel);
    } else {
      setSelected({});
    }
    setRoutes(r.length > 0 ? r : null);
    setSource(s);
    setLoading(false);
  }, [origin, resort, canSearch, cart]);

  // Auto-fill resort from URL and auto-search
  useEffect(() => {
    if (didAutoSearch.current) return;
    if (urlParams.resort) {
      const matched = matchResort(urlParams.resort);
      if (matched) {
        setResort(matched);
        // Auto-search after state update
        setTimeout(() => {
          const { routes: r, source: s } = getRoutes(urlParams.origin || "London", matched);
          if (r.length > 0) {
            setRoutes(r);
            setSource(s);
          }
        }, 0);
      }
    }
    didAutoSearch.current = true;
  }, [urlParams]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const selectedRoutes = routes ? routes.filter(r => selected[r.id]) : [];

  const [confirmText, setConfirmText] = useState("");
  const confirmInputRef = useRef(null);

  const [sending, setSending] = useState(false);

  // Auto-sync selection to cart whenever checkboxes change
  useEffect(() => {
    if (!resort || !routes) return;
    const currentSelected = routes.filter(r => selected[r.id]);
    const key = `${origin.trim()}::${resort}`;
    setCart(prev => {
      const filtered = prev.filter(item => `${item.origin}::${item.resort}` !== key);
      if (currentSelected.length === 0) return filtered;
      return [...filtered, {
        origin: origin.trim(),
        resort,
        routes: currentSelected.map(r => ({
          id: r.id, name: r.name, name_en: r.name_en,
          total_duration_hours: r.total_duration_hours, price_tier: r.price_tier,
        }))
      }];
    });
  }, [selected, origin, resort, routes]);

  const handleRemoveFromCart = useCallback((index) => {
    setCart(prev => {
      const removed = prev[index];
      // If removing the currently viewed resort, also clear checkboxes
      if (removed && removed.resort === resort && removed.origin === origin.trim()) {
        setSelected({});
      }
      return prev.filter((_, i) => i !== index);
    });
  }, [resort, origin]);

  const buildSelections = useCallback(() => {
    return cart.map(item => ({
      origin: item.origin,
      resort: item.resort,
      selected_routes: item.routes,
    }));
  }, [cart]);

  const totalConfirmCount = useMemo(() => {
    const selections = buildSelections();
    return selections.reduce((sum, s) => sum + s.selected_routes.length, 0);
  }, [buildSelections]);

  const handleConfirm = useCallback(async () => {
    const selections = buildSelections();
    if (selections.length === 0) return;

    const allIds = selections.flatMap(s => s.selected_routes.map(r => r.id)).join(" ");

    setSending(true);
    try {
      const resp = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      if (resp.ok) {
        setConfirmed(true);
        setCart([]);
        setSelected({});
        setToast({ show: true, message: "已发送到 Discord！茄子会自动回复详情" });
        setTimeout(() => setToast({ show: false, message: "" }), 5000);
      } else {
        const text = `茄子 确认 ${allIds}`;
        setConfirmText(text);
        setConfirmed(true);
        setToast({ show: true, message: "自动发送失败，请手动复制下方文字回 Discord" });
        setTimeout(() => setToast({ show: false, message: "" }), 5000);
      }
    } catch {
      const text = `茄子 确认 ${allIds}`;
      setConfirmText(text);
      setConfirmed(true);
      setToast({ show: true, message: "网络错误，请手动复制下方文字回 Discord" });
      setTimeout(() => setToast({ show: false, message: "" }), 5000);
    }
    setSending(false);
  }, [buildSelections]);

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: "100vh", color: TEXT1, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <ConfirmToast show={toast.show} message={toast.message} />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${CARD_BG} 0%, #0f1729 100%)`, borderBottom: `1px solid ${CARD_BORDER}`, padding: "24px 20px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>⛷️</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Ski Route Planner</div>
              <div style={{ fontSize: 12, color: TEXT3 }}>
                {isFromDiscord
                  ? `🍆 茄子为你准备的路线 · 选好后点确认`
                  : "AI 驱动 · 43 个顶级欧洲滑雪场 · 4 国覆盖"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, marginBottom: 6, display: "block", fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>📍 出发城市</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="London, Manchester, Dublin..."
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${CARD_BORDER}`,
                  background: CARD_BG, color: TEXT1, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = CARD_BORDER} />
            </div>
            <ResortDropdown value={resort} onChange={r => {
                setResort(r);
                setSelected({});
                setConfirmed(false);
                // Auto-search
                const o = origin.trim();
                if (o.length > 1) {
                  const { routes: rts, source: s } = getRoutes(o, r);
                  const key = `${o}::${r}`;
                  const existing = cart.find(item => `${item.origin}::${item.resort}` === key);
                  if (existing) {
                    const sel = {};
                    existing.routes.forEach(rt => { sel[rt.id] = true; });
                    setSelected(sel);
                  }
                  if (rts.length > 0) { setRoutes(rts); setSource(s); setError(null); }
                  else { setRoutes(null); setError(`暂无 ${o} → ${r} 的预存路线。请回到 Discord 让茄子为你实时生成。`); }
                }
              }} />
            <button onClick={handleSearch} disabled={!canSearch || loading}
              style={{ padding: "14px", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 700,
                background: canSearch && !loading ? `linear-gradient(135deg, ${ACCENT}, #0ea5e9)` : CARD_BORDER,
                color: canSearch && !loading ? BG : TEXT3, cursor: canSearch && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s", letterSpacing: 0.3, fontFamily: FONT }}>
              {loading ? "⏳ 加载中..." : "🔍 查找所有路线"}
            </button>
          </div>
        </div>
      </div>

      {/* Cart strip */}
      <div style={{ paddingTop: 12 }}>
        <CartStrip cart={cart} onRemove={handleRemoveFromCart} />
      </div>

      {/* Results */}
      <div style={{ flex: 1, maxWidth: 600, margin: "0 auto", width: "100%", padding: "8px 16px 120px" }}>
        {error && (
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "#7f1d1d30", border: "1px solid #991b1b50", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}
        {!routes && !error && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ fontSize: 13, color: TEXT2, fontWeight: 600, marginBottom: 10 }}>热门推荐</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { resort: "Chamonix-Mont-Blanc", flag: "🇫🇷", desc: "法国 · 勃朗峰脚下 · 经典首选" },
                { resort: "Zermatt", flag: "🇨🇭", desc: "瑞士 · 马特洪峰 · 无车小镇" },
                { resort: "Val d'Isère", flag: "🇫🇷", desc: "法国 · 世界杯赛场 · 雪质一流" },
                { resort: "St. Anton am Arlberg", flag: "🇦🇹", desc: "奥地利 · 滑雪发源地 · 派对圣地" },
                { resort: "Cortina d'Ampezzo", flag: "🇮🇹", desc: "意大利 · 2026冬奥 · 多洛米蒂" },
              ].map(item => (
                <div key={item.resort} onClick={() => {
                    setResort(item.resort);
                    setSelected({});
                    setConfirmed(false);
                    const o = origin.trim();
                    const { routes: rts, source: s } = getRoutes(o, item.resort);
                    if (rts.length > 0) { setRoutes(rts); setSource(s); setError(null); }
                    else { setRoutes(null); setError(`暂无 ${o} → ${item.resort} 的预存路线。`); }
                  }}
                  style={{
                    padding: "12px 16px", borderRadius: 10, border: `1px solid ${CARD_BORDER}`,
                    background: CARD_BG, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
                  onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BORDER}>
                  <span style={{ fontSize: 24 }}>{item.flag}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{item.resort}</div>
                    <div style={{ fontSize: 12, color: TEXT3 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: TEXT3, marginTop: 16 }}>
              43 个欧洲顶级雪场 · 4 国覆盖 · London 出发秒出
            </div>
          </div>
        )}
        {routes && routes.length > 0 && (
          <>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{origin} → {resort}</span>
                <span style={{ fontSize: 13, color: TEXT3, marginLeft: 8 }}>{routes.length} 条路线</span>
              </div>
              <span style={{ fontSize: 11, color: source === "预生成" ? "#34d399" : ACCENT,
                background: (source === "预生成" ? "#34d399" : ACCENT) + "15",
                padding: "3px 8px", borderRadius: 6 }}>{source}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {routes.map(route => (
                <RouteCard key={route.id} route={route}
                  selected={!!selected[route.id]} onToggle={() => { setSelected(p => ({ ...p, [route.id]: !p[route.id] })); setConfirmed(false); }}
                  expanded={!!expanded[route.id]} onExpand={() => setExpanded(p => ({ ...p, [route.id]: !p[route.id] }))} />
              ))}
            </div>
          </>
        )}
        {routes && routes.length === 0 && <div style={{ textAlign: "center", padding: 40, color: TEXT3 }}>没有找到路线</div>}
      </div>

      {/* Bottom confirm bar */}
      {totalConfirmCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 20px",
          background: `linear-gradient(0deg, ${BG} 80%, transparent)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 50 }}>
          {confirmed && confirmText && (
            <div style={{ maxWidth: 600, width: "100%", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>📋 回 Discord 发送以下内容：</div>
              <input ref={confirmInputRef} readOnly value={confirmText}
                onFocus={e => e.target.select()}
                onClick={e => e.target.select()}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `2px solid #34d399`,
                  background: "#16653420", color: "#bbf7d0", fontSize: 18, fontWeight: 700,
                  textAlign: "center", outline: "none", fontFamily: FONT, boxSizing: "border-box",
                  caretColor: "transparent" }} />
              <div style={{ fontSize: 11, color: TEXT3 }}>点击上方文字框 → 全选 → 复制</div>
            </div>
          )}
          <button onClick={handleConfirm} disabled={confirmed || sending}
            style={{ padding: "14px 32px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700,
              background: confirmed
                ? "#166534"
                : `linear-gradient(135deg, ${ACCENT}, #0ea5e9)`,
              color: confirmed ? "#bbf7d0" : BG,
              cursor: confirmed ? "default" : "pointer", fontFamily: FONT,
              boxShadow: confirmed ? "none" : `0 4px 20px ${ACCENT}40`, maxWidth: 600, width: "100%",
              transition: "all 0.3s" }}>
            {sending
              ? `⏳ 发送中...`
              : confirmed
                ? (confirmText ? `✅ 已选择 ${totalConfirmCount} 条路线` : `✅ 已发送到 Discord！可以关闭此页面`)
                : `✅ 确认全部 ${totalConfirmCount} 条路线 →`}
          </button>
        </div>
      )}
    </div>
  );
}
