"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  bgTop: "#EFFAE2",
  bgBottom: "#CFEAB2",
  canopy: "#2F5233",
  canopyLight: "#3F6B41",
  leaf: "#6FAE52",
  leafSoft: "#6FAE521F",
  cream: "#FFFBF0",
  creamBorder: "#EFE2C0",
  textDark: "#33421F",
  textDim: "#7C8F63",
  wet: "#4FB6DA",
  wetSoft: "#4FB6DA22",
  dirty: "#B27A3E",
  dirtySoft: "#B27A3E22",
  bottle: "#F0B93B",
  bottleSoft: "#F0B93B22",
};

const QUICK_AMOUNTS = [30, 60, 90, 120, 150, 180, 210];

const CONFETTI_SETS = {
  wet: ["💧", "🌿", "💧"],
  dirty: ["🍃", "🐒", "🍂"],
  bottle: ["🍌", "🥛", "🍌"],
};

function normalize(row) {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    timestamp: new Date(row.created_at).getTime(),
  };
}

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return remMins ? `${hrs}h ${remMins}m ago` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function dateLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

let particleId = 0;

export default function App() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [bottleOpen, setBottleOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState(60);
  const [flash, setFlash] = useState(null);
  const [bounce, setBounce] = useState(false);
  const [particles, setParticles] = useState([]);
  const [, forceTick] = useState(0);

  // Initial load
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setEntries(data.map(normalize));
      setLoaded(true);
    })();
  }, []);

  // Realtime sync between both phones
  useEffect(() => {
    const channel = supabase
      .channel("entries-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "entries" },
        (payload) => {
          const entry = normalize(payload.new);
          setEntries((prev) => (prev.some((e) => e.id === entry.id) ? prev : [entry, ...prev]));
          setFlash(entry.type);
          setBounce(true);
          burstConfetti(entry.type);
          setTimeout(() => setFlash(null), 1100);
          setTimeout(() => setBounce(false), 800);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "entries" },
        (payload) => {
          setEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const burstConfetti = useCallback((type) => {
    const emojis = CONFETTI_SETS[type] || ["✨"];
    const next = Array.from({ length: 14 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 110;
      return {
        id: particleId++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 40,
        rot: (Math.random() - 0.5) * 360,
        size: 16 + Math.random() * 14,
        delay: Math.random() * 120,
      };
    });
    setParticles((p) => [...p, ...next]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !next.some((n) => n.id === x.id)));
    }, 1200);
  }, []);

  const addEntry = useCallback(async (type, amount) => {
    const payload = { type };
    if (amount) payload.amount = amount;
    const { error } = await supabase.from("entries").insert([payload]);
    if (error) console.error("Insert failed", error);
    // UI updates via the realtime subscription above (for both devices).
  }, []);

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) console.error("Delete failed", error);
  }, []);

  const lastOf = (type) => entries.find((e) => e.type === type);
  const lastWet = lastOf("wet");
  const lastDirty = lastOf("dirty");
  const lastBottle = lastOf("bottle");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysFeeds = entries.filter((e) => e.type === "bottle" && e.timestamp >= todayStart.getTime());
  const todaysTotalMl = todaysFeeds.reduce((s, e) => s + (e.amount || 0), 0);

  const groups = entries.reduce((acc, e) => {
    const label = dateLabel(e.timestamp);
    (acc[label] = acc[label] || []).push(e);
    return acc;
  }, {});

  if (!loaded) {
    return (
      <div
        style={{
          background: C.bgTop,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.textDim,
          fontFamily: "system-ui",
        }}
      >
        Loading the jungle… 🐒
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bgBottom} 100%)`,
        color: C.textDark,
        fontFamily: "'Quicksand', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .display { font-family: 'Fredoka', sans-serif; }
        @keyframes swing { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
        @keyframes swingSlow { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(11deg); } }
        @keyframes bounceIn {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.35) rotate(-10deg); }
          50% { transform: scale(0.9) rotate(8deg); }
          70% { transform: scale(1.15) rotate(-4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .tap-btn { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1); }
        .tap-btn:active { transform: scale(0.94) rotate(-1deg); }
        .flash-in { animation: flashPop 1.1s ease; }
        @keyframes flashPop {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(1); }
        }
        @keyframes confettiPop {
          0% { opacity: 0; transform: translate(0,0) scale(0.3) rotate(0deg); }
          15% { opacity: 1; transform: translate(calc(var(--tx) * 0.35), calc(var(--ty) * 0.35)) scale(1.1) rotate(calc(var(--rot) * 0.3)); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.7) rotate(var(--rot)); }
        }
        @keyframes leafFall {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.55; }
          92% { opacity: 0.5; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
        }
        @keyframes climb { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-22px) rotate(4deg); } }
        @keyframes tailWag { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
        @media (prefers-reduced-motion: reduce) {
          .tap-btn, .flash-in, .mascot, .leaf-particle, .side-monkey, .vine-monkey { animation: none !important; transition: none !important; }
        }
      `}</style>

      {[
        { left: "6%", size: 16, dur: 11, delay: 0, drift: "40px", spin: "220deg", emoji: "🍃" },
        { left: "22%", size: 13, dur: 14, delay: 3, drift: "-30px", spin: "-180deg", emoji: "🌿" },
        { left: "45%", size: 15, dur: 12.5, delay: 6, drift: "25px", spin: "260deg", emoji: "🍃" },
        { left: "68%", size: 14, dur: 10.5, delay: 1.5, drift: "-45px", spin: "-240deg", emoji: "🍂" },
        { left: "85%", size: 17, dur: 13, delay: 4.5, drift: "35px", spin: "200deg", emoji: "🌿" },
        { left: "92%", size: 12, dur: 9.5, delay: 8, drift: "-20px", spin: "-200deg", emoji: "🍃" },
      ].map((l, i) => (
        <div
          key={i}
          className="leaf-particle"
          style={{
            position: "absolute",
            left: l.left,
            top: 0,
            fontSize: l.size,
            zIndex: 1,
            pointerEvents: "none",
            "--drift": l.drift,
            "--spin": l.spin,
            animation: `leafFall ${l.dur}s linear infinite`,
            animationDelay: `${l.delay}s`,
          }}
        >
          {l.emoji}
        </div>
      ))}

      <div className="side-monkey" style={{ position: "absolute", left: 6, top: "38%", fontSize: 22, zIndex: 1, animation: "climb 3.6s ease-in-out infinite", opacity: 0.85 }}>🐒</div>
      <div className="side-monkey" style={{ position: "absolute", right: 8, top: "58%", fontSize: 19, zIndex: 1, animation: "climb 4.2s ease-in-out infinite", animationDelay: "1.1s", opacity: 0.8, transform: "scaleX(-1)" }}>🐒</div>

      <div style={{ position: "absolute", top: -60, left: -70, width: 220, height: 220, borderRadius: "45% 55% 60% 40% / 50% 40% 60% 50%", background: C.leafSoft, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", top: 120, right: -80, width: 200, height: 200, borderRadius: "60% 40% 45% 55% / 45% 55% 45% 55%", background: C.bottleSoft, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", bottom: 80, left: -60, width: 180, height: 180, borderRadius: "50% 50% 40% 60% / 60% 40% 60% 40%", background: C.wetSoft }} />

      <div style={{ position: "fixed", top: -14, left: -16, fontSize: 46, zIndex: 4, pointerEvents: "none", transform: "rotate(-18deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.08))" }}>🌿</div>
      <div style={{ position: "fixed", top: 6, left: 22, fontSize: 28, zIndex: 4, pointerEvents: "none", transform: "rotate(12deg)", opacity: 0.9 }}>🍃</div>
      <div style={{ position: "fixed", top: -18, right: -14, fontSize: 50, zIndex: 4, pointerEvents: "none", transform: "rotate(200deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.08))" }}>🌿</div>
      <div style={{ position: "fixed", top: 10, right: 26, fontSize: 26, zIndex: 4, pointerEvents: "none", transform: "rotate(-16deg)", opacity: 0.9 }}>🍃</div>
      <div style={{ position: "fixed", bottom: -16, left: -14, fontSize: 48, zIndex: 4, pointerEvents: "none", transform: "rotate(160deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.08))" }}>🌿</div>
      <div style={{ position: "fixed", bottom: 90, left: -10, fontSize: 24, zIndex: 4, pointerEvents: "none", transform: "rotate(-30deg)", opacity: 0.85 }}>🍃</div>
      <div style={{ position: "fixed", bottom: -20, right: -16, fontSize: 52, zIndex: 4, pointerEvents: "none", transform: "rotate(-20deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.08))" }}>🌿</div>
      <div style={{ position: "fixed", bottom: 96, right: -8, fontSize: 24, zIndex: 4, pointerEvents: "none", transform: "rotate(35deg)", opacity: 0.85 }}>🍃</div>
      {[
        { top: "22%", left: -8, size: 22, delay: "0s", flip: false },
        { top: "72%", left: -6, size: 20, delay: "1.3s", flip: false },
        { top: "30%", right: -8, size: 22, delay: "0.6s", flip: true },
        { top: "80%", right: -4, size: 18, delay: "2s", flip: true },
      ].map((v, i) => (
        <div
          key={`vine-${i}`}
          style={{
            position: "fixed",
            top: v.top,
            left: v.left,
            right: v.right,
            fontSize: v.size,
            zIndex: 4,
            pointerEvents: "none",
            opacity: 0.75,
            transformOrigin: "top center",
            animation: "swingSlow 4.5s ease-in-out infinite",
            animationDelay: v.delay,
            ...(v.flip ? { transform: "scaleX(-1)" } : {}),
          }}
        >
          🌿
        </div>
      ))}

      <div style={{ position: "relative", background: `linear-gradient(135deg, ${C.canopy}, ${C.canopyLight})`, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, padding: "20px 20px 22px", textAlign: "center", boxShadow: "0 6px 18px rgba(47,82,51,0.25)", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 26, marginBottom: 2 }}>
          <span className="vine-monkey" style={{ fontSize: 18, transformOrigin: "top center", animation: "swingSlow 2.6s ease-in-out infinite", animationDelay: "0.2s", opacity: 0.85 }}>🐒</span>
          <span className="mascot" style={{ fontSize: 38, transformOrigin: "top center", animation: bounce ? "bounceIn 0.8s ease" : "swing 2.4s ease-in-out infinite" }}>🐒</span>
          <span className="vine-monkey" style={{ fontSize: 18, transformOrigin: "top center", animation: "swingSlow 2.9s ease-in-out infinite", animationDelay: "0.6s", opacity: 0.85 }}>🐒</span>
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 700, color: "#FFF9EC" }}>Emilio's Jungle</div>
        <div style={{ fontSize: 13.5, color: "#D9E9C8", marginTop: 2, fontWeight: 600 }}>
          {tab === "home" ? "Tap a friend to log it" : "Everything that's happened"}
        </div>
      </div>

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "fixed",
            top: 60,
            left: "50%",
            fontSize: p.size,
            zIndex: 60,
            pointerEvents: "none",
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            "--rot": `${p.rot}deg`,
            animation: `confettiPop 1s ease-out forwards`,
            animationDelay: `${p.delay}ms`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {flash && (
        <div className="flash-in" style={{ position: "fixed", top: 16, left: "50%", background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: 999, padding: "8px 18px", fontSize: 14, fontWeight: 700, zIndex: 61, color: C.textDark, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          🐒 Logged!
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 100px", position: "relative", zIndex: 2 }}>
        {tab === "home" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              <LeafStat emoji="💧" label="Last wet" value={lastWet ? timeAgo(lastWet.timestamp) : "—"} color={C.wet} />
              <LeafStat emoji="💩" label="Last dirty" value={lastDirty ? timeAgo(lastDirty.timestamp) : "—"} color={C.dirty} />
              <LeafStat emoji="🍼" label="Last feed" value={lastBottle ? timeAgo(lastBottle.timestamp) : "—"} sub={lastBottle && lastBottle.amount ? `${lastBottle.amount} mL` : null} color={C.bottle} />
            </div>

            {todaysFeeds.length > 0 && (
              <div style={{ textAlign: "center", background: C.cream, border: `1.5px dashed ${C.creamBorder}`, borderRadius: 999, padding: "8px 14px", color: C.textDim, fontSize: 12.5, fontWeight: 700, marginBottom: 20 }}>
                🍌 Today: {todaysFeeds.length} feed{todaysFeeds.length !== 1 ? "s" : ""} · {todaysTotalMl} mL total
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <JungleButton className="tap-btn" emoji="💧" color={C.wet} soft={C.wetSoft} label="Wet Diaper" sub="Splash logged in a tap" onClick={() => addEntry("wet")} />
              <JungleButton className="tap-btn" emoji="💩" color={C.dirty} soft={C.dirtySoft} label="Dirty Diaper" sub="No fuss, just log it" onClick={() => addEntry("dirty")} />
              <JungleButton className="tap-btn" emoji="🍼" color={C.bottle} soft={C.bottleSoft} label="Bottle Feed" sub="Pick the amount" onClick={() => { setCustomAmount(60); setBottleOpen(true); }} />
            </div>
          </>
        ) : (
          <>
            {entries.length === 0 ? (
              <div style={{ textAlign: "center", color: C.textDim, marginTop: 60, fontSize: 15 }}>
                🌿 Nothing logged yet — the jungle is quiet.
              </div>
            ) : (
              Object.entries(groups).map(([label, items]) => (
                <div key={label} style={{ marginBottom: 22 }}>
                  <div className="display" style={{ fontSize: 13.5, fontWeight: 600, color: C.canopy, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🌴</span> {label}
                  </div>
                  <LogTable items={items} onDelete={deleteEntry} />
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: C.cream, borderTop: `2px solid ${C.creamBorder}`, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))", gap: 10, boxShadow: "0 -4px 14px rgba(0,0,0,0.06)", zIndex: 3 }}>
        <NavButton active={tab === "home"} emoji="🌴" label="Home" onClick={() => setTab("home")} />
        <NavButton active={tab === "log"} emoji="📋" label="Log" onClick={() => setTab("log")} />
      </div>

      {bottleOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(47,82,51,0.45)", display: "flex", alignItems: "flex-end", zIndex: 100 }} onClick={() => setBottleOpen(false)}>
          <div style={{ background: C.cream, width: "100%", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "20px 20px calc(24px + env(safe-area-inset-bottom))", border: `2px solid ${C.creamBorder}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="display" style={{ fontSize: 18, fontWeight: 700, color: C.canopy }}>🍼 Bottle amount</div>
              <button onClick={() => setBottleOpen(false)} style={{ background: C.leafSoft, border: "none", color: C.canopy, borderRadius: "50%", width: 32, height: 32, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button key={amt} className="tap-btn" onClick={() => { addEntry("bottle", amt); setBottleOpen(false); }} style={{ background: C.bottleSoft, border: `2px solid ${C.bottle}55`, color: C.textDark, borderRadius: 16, padding: "14px 0", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                  {amt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 18 }}>
              <button className="tap-btn" onClick={() => setCustomAmount((v) => Math.max(0, v - 10))} style={{ background: C.leafSoft, border: "none", borderRadius: "50%", width: 44, height: 44, color: C.canopy, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>−</button>
              <div className="display" style={{ fontSize: 28, fontWeight: 700, minWidth: 100, textAlign: "center", color: C.textDark }}>{customAmount} mL</div>
              <button className="tap-btn" onClick={() => setCustomAmount((v) => v + 10)} style={{ background: C.leafSoft, border: "none", borderRadius: "50%", width: 44, height: 44, color: C.canopy, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+</button>
            </div>

            <button className="tap-btn" onClick={() => { addEntry("bottle", customAmount); setBottleOpen(false); }} style={{ width: "100%", background: C.bottle, border: "none", borderRadius: 16, padding: "16px 0", fontSize: 16, fontWeight: 700, color: "#4A3308", cursor: "pointer" }}>
              Log {customAmount} mL 🍌
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeafStat({ emoji, label, value, sub, color }) {
  return (
    <div style={{ background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: "24px 24px 24px 6px", padding: "12px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
      <div style={{ fontSize: 10.5, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function JungleButton({ color, soft, emoji, label, sub, onClick, className }) {
  return (
    <button className={className} onClick={onClick} style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, background: soft, border: `2px solid ${color}55`, borderRadius: "28px 28px 28px 8px", padding: "18px 20px", cursor: "pointer", overflow: "visible" }}>
      <div style={{ width: 58, height: 58, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: `0 4px 10px ${color}55` }}>
        {emoji}
      </div>
      <div style={{ textAlign: "left" }}>
        <div className="display" style={{ fontSize: 18, fontWeight: 600, color: C.textDark }}>{label}</div>
        <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600 }}>{sub}</div>
      </div>
      <span style={{ position: "absolute", right: 10, bottom: -6, fontSize: 15, animation: "tailWag 1.8s ease-in-out infinite", opacity: 0.7 }}>🐒</span>
    </button>
  );
}

function entryMeta(entry) {
  return entry.type === "wet"
    ? { color: C.wet, emoji: "💧", label: "Wet" }
    : entry.type === "dirty"
    ? { color: C.dirty, emoji: "💩", label: "Dirty" }
    : { color: C.bottle, emoji: "🍼", label: "Bottle" };
}

function LogTable({ items, onDelete }) {
  return (
    <div style={{ background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: "20px 20px 20px 6px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "46px 1fr 78px 30px", alignItems: "center", padding: "9px 12px", background: C.leafSoft, borderBottom: `1.5px solid ${C.creamBorder}` }}>
        <div className="display" style={{ fontSize: 10.5, fontWeight: 700, color: C.canopy }}> </div>
        <div className="display" style={{ fontSize: 10.5, fontWeight: 700, color: C.canopy, textTransform: "uppercase", letterSpacing: 0.4 }}>Entry</div>
        <div className="display" style={{ fontSize: 10.5, fontWeight: 700, color: C.canopy, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "right" }}>Time</div>
        <div />
      </div>
      {items.map((e, i) => {
        const meta = entryMeta(e);
        return (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "46px 1fr 78px 30px", alignItems: "center", padding: "10px 12px", borderBottom: i < items.length - 1 ? `1px solid ${C.creamBorder}` : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${meta.color}22`, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {meta.emoji}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark }}>{meta.label}</div>
              {e.amount ? <div style={{ fontSize: 11.5, color: C.textDim, fontWeight: 600 }}>{e.amount} mL</div> : null}
            </div>
            <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, textAlign: "right" }}>{formatTime(e.timestamp)}</div>
            <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", color: C.textDim, fontSize: 14, padding: 4, cursor: "pointer", justifySelf: "end" }} aria-label="Delete entry">✕</button>
          </div>
        );
      })}
    </div>
  );
}

function NavButton({ active, emoji, label, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, background: active ? C.leafSoft : "none", border: "none", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: active ? C.canopy : C.textDim, padding: "6px 0", cursor: "pointer" }}>
      <span style={{ fontSize: 19 }}>{emoji}</span>
      <span className="display" style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </button>
  );
}
