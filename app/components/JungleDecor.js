"use client";

import { C } from "../../lib/theme";

export function JungleStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@500;600;700&display=swap');
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
      @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) {
        .tap-btn, .flash-in, .mascot, .leaf-particle, .side-monkey, .vine-monkey { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

export function JungleDecor() {
  return (
    <>
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
            position: "fixed", left: l.left, top: 0, fontSize: l.size, zIndex: 1, pointerEvents: "none",
            "--drift": l.drift, "--spin": l.spin,
            animation: `leafFall ${l.dur}s linear infinite`, animationDelay: `${l.delay}s`,
          }}
        >
          {l.emoji}
        </div>
      ))}

      <div className="side-monkey" style={{ position: "fixed", left: 6, top: "38%", fontSize: 22, zIndex: 1, animation: "climb 3.6s ease-in-out infinite", opacity: 0.85 }}>🐒</div>
      <div className="side-monkey" style={{ position: "fixed", right: 8, top: "58%", fontSize: 19, zIndex: 1, animation: "climb 4.2s ease-in-out infinite", animationDelay: "1.1s", opacity: 0.8, transform: "scaleX(-1)" }}>🐒</div>

      <div style={{ position: "fixed", top: -60, left: -70, width: 220, height: 220, borderRadius: "45% 55% 60% 40% / 50% 40% 60% 50%", background: C.leafSoft, filter: "blur(2px)", zIndex: 0 }} />
      <div style={{ position: "fixed", top: 120, right: -80, width: 200, height: 200, borderRadius: "60% 40% 45% 55% / 45% 55% 45% 55%", background: C.bottleSoft, filter: "blur(2px)", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: 80, left: -60, width: 180, height: 180, borderRadius: "50% 50% 40% 60% / 60% 40% 60% 40%", background: C.wetSoft, zIndex: 0 }} />

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
            position: "fixed", top: v.top, left: v.left, right: v.right, fontSize: v.size, zIndex: 4, pointerEvents: "none",
            opacity: 0.75, transformOrigin: "top center",
            animation: "swingSlow 4.5s ease-in-out infinite", animationDelay: v.delay,
            ...(v.flip ? { transform: "scaleX(-1)" } : {}),
          }}
        >
          🌿
        </div>
      ))}
    </>
  );
}
