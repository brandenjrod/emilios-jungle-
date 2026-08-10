"use client";

import { C } from "../../lib/theme";

const TABS = [
  { id: "home", emoji: "🌴", label: "Home" },
  { id: "log", emoji: "📋", label: "Log" },
  { id: "emilio", emoji: "💚", label: "Emilio Joe" },
  { id: "gallery", emoji: "🖼️", label: "Gallery" },
];

export function BottomNav({ tab, setTab }) {
  return (
    <div
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, display: "flex",
        background: C.cream, borderTop: `2px solid ${C.creamBorder}`,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: "8px 8px calc(8px + env(safe-area-inset-bottom))", gap: 4,
        boxShadow: "0 -4px 14px rgba(0,0,0,0.06)", zIndex: 20,
      }}
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, background: active ? C.leafSoft : "none", border: "none", borderRadius: 14,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              color: active ? C.canopy : C.textDim, padding: "6px 2px", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 17 }}>{t.emoji}</span>
            <span className="display" style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.1, textAlign: "center" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
