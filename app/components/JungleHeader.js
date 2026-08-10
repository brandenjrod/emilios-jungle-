"use client";

import { C } from "../../lib/theme";

export function JungleHeader({ title = "Emilio's Jungle", subtitle, bounce }) {
  return (
    <div
      style={{
        position: "relative",
        background: `linear-gradient(135deg, ${C.canopy}, ${C.canopyLight})`,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        padding: "calc(env(safe-area-inset-top) + 18px) 20px 22px",
        textAlign: "center",
        boxShadow: "0 6px 18px rgba(47,82,51,0.25)",
        zIndex: 2,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 26, marginBottom: 2 }}>
        <span className="vine-monkey" style={{ fontSize: 18, transformOrigin: "top center", animation: "swingSlow 2.6s ease-in-out infinite", animationDelay: "0.2s", opacity: 0.85 }}>🐒</span>
        <span className="mascot" style={{ fontSize: 38, transformOrigin: "top center", animation: bounce ? "bounceIn 0.8s ease" : "swing 2.4s ease-in-out infinite" }}>🐒</span>
        <span className="vine-monkey" style={{ fontSize: 18, transformOrigin: "top center", animation: "swingSlow 2.9s ease-in-out infinite", animationDelay: "0.6s", opacity: 0.85 }}>🐒</span>
      </div>
      <div className="display" style={{ fontSize: 22, fontWeight: 700, color: "#FFF9EC" }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 13.5, color: "#D9E9C8", marginTop: 2, fontWeight: 600 }}>{subtitle}</div>
      )}
    </div>
  );
}
