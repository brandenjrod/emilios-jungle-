"use client";

import { C } from "../../lib/theme";
import { timeAgo } from "../../lib/format";

export function HomeTab({ entries, addEntry, openBottleSheet }) {
  const lastOf = (type) => entries.find((e) => e.type === type);
  const lastWet = lastOf("wet");
  const lastDirty = lastOf("dirty");
  const lastBottle = lastOf("bottle");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysFeeds = entries.filter((e) => e.type === "bottle" && e.timestamp >= todayStart.getTime());
  const todaysTotalMl = todaysFeeds.reduce((s, e) => s + (e.amount || 0), 0);

  return (
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
        <JungleButton className="tap-btn" emoji="🍼" color={C.bottle} soft={C.bottleSoft} label="Bottle Feed" sub="Pick the amount" onClick={openBottleSheet} />
      </div>
    </>
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
