"use client";

import { useState } from "react";
import { C } from "../../lib/theme";

const QUICK_AMOUNTS = [30, 60, 90, 120, 150, 180, 210];

export function BottleSheet({ onClose, onLog }) {
  const [customAmount, setCustomAmount] = useState(60);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(47,82,51,0.45)", display: "flex", alignItems: "flex-end", zIndex: 100 }} onClick={onClose}>
      <div style={{ background: C.cream, width: "100%", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "20px 20px calc(24px + env(safe-area-inset-bottom))", border: `2px solid ${C.creamBorder}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 700, color: C.canopy }}>🍼 Bottle amount</div>
          <button onClick={onClose} style={{ background: C.leafSoft, border: "none", color: C.canopy, borderRadius: "50%", width: 32, height: 32, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {QUICK_AMOUNTS.map((amt) => (
            <button key={amt} className="tap-btn" onClick={() => onLog(amt)} style={{ background: C.bottleSoft, border: `2px solid ${C.bottle}55`, color: C.textDark, borderRadius: 16, padding: "14px 0", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {amt}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 18 }}>
          <button className="tap-btn" onClick={() => setCustomAmount((v) => Math.max(0, v - 10))} style={{ background: C.leafSoft, border: "none", borderRadius: "50%", width: 44, height: 44, color: C.canopy, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>−</button>
          <div className="display" style={{ fontSize: 28, fontWeight: 700, minWidth: 100, textAlign: "center", color: C.textDark }}>{customAmount} mL</div>
          <button className="tap-btn" onClick={() => setCustomAmount((v) => v + 10)} style={{ background: C.leafSoft, border: "none", borderRadius: "50%", width: 44, height: 44, color: C.canopy, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+</button>
        </div>

        <button className="tap-btn" onClick={() => onLog(customAmount)} style={{ width: "100%", background: C.bottle, border: "none", borderRadius: 16, padding: "16px 0", fontSize: 16, fontWeight: 700, color: "#4A3308", cursor: "pointer" }}>
          Log {customAmount} mL 🍌
        </button>
      </div>
    </div>
  );
}
