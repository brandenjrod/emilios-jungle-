"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { C } from "../lib/theme";
import { JungleStyles, JungleDecor } from "./components/JungleDecor";
import { JungleHeader } from "./components/JungleHeader";
import { BottomNav } from "./components/BottomNav";
import { HomeTab } from "./components/HomeTab";
import { LogTab } from "./components/LogTab";
import { EmilioTab } from "./components/EmilioTab";
import { GalleryTab } from "./components/GalleryTab";
import { BottleSheet } from "./components/BottleSheet";

const CONFETTI_SETS = {
  wet: ["💧", "🌿", "💧"],
  dirty: ["🍃", "🐒", "🍂"],
  bottle: ["🍌", "🥛", "🍌"],
};

const SUBTITLES = {
  home: "Tap a friend to log it",
  log: "Everything that's happened",
  emilio: "His story so far",
  gallery: "Emilio Joe's photo book",
};

function normalize(row) {
  return { id: row.id, type: row.type, amount: row.amount, timestamp: new Date(row.created_at).getTime() };
}

let particleId = 0;

export default function App() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [bottleOpen, setBottleOpen] = useState(false);
  const [flash, setFlash] = useState(null);
  const [bounce, setBounce] = useState(false);
  const [particles, setParticles] = useState([]);

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

  useEffect(() => {
    const channel = supabase
      .channel("entries-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "entries" }, (payload) => {
        const entry = normalize(payload.new);
        setEntries((prev) => (prev.some((e) => e.id === entry.id) ? prev : [entry, ...prev]));
        setFlash(entry.type);
        setBounce(true);
        burstConfetti(entry.type);
        setTimeout(() => setFlash(null), 1100);
        setTimeout(() => setBounce(false), 800);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "entries" }, (payload) => {
        const entry = normalize(payload.new);
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)).sort((a, b) => b.timestamp - a.timestamp));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "entries" }, (payload) => {
        setEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEntry = useCallback(async (type, amount) => {
    const payload = { type };
    if (amount) payload.amount = amount;
    const { error } = await supabase.from("entries").insert([payload]);
    if (error) console.error("Insert failed", error);
  }, []);

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) console.error("Delete failed", error);
  }, []);

  const updateEntryTime = useCallback(async (id, timestampMs) => {
    // Update the UI immediately rather than waiting on the realtime
    // round-trip, which was making edits look like they didn't take.
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, timestamp: timestampMs } : e)).sort((a, b) => b.timestamp - a.timestamp)
    );
    const { error } = await supabase.from("entries").update({ created_at: new Date(timestampMs).toISOString() }).eq("id", id);
    if (error) {
      console.error("Update failed", error);
      // Re-sync from the server if the save didn't actually go through.
      const { data } = await supabase.from("entries").select("*").order("created_at", { ascending: false }).limit(500);
      if (data) setEntries(data.map(normalize));
    }
  }, []);

  if (!loaded) {
    return (
      <div style={{ background: C.bgTop, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontFamily: "system-ui" }}>
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
      <JungleStyles />
      <JungleDecor />

      <JungleHeader subtitle={SUBTITLES[tab]} bounce={bounce} />

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "fixed", top: 60, left: "50%", fontSize: p.size, zIndex: 60, pointerEvents: "none",
            "--tx": `${p.tx}px`, "--ty": `${p.ty}px`, "--rot": `${p.rot}deg`,
            animation: `confettiPop 1s ease-out forwards`, animationDelay: `${p.delay}ms`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {flash && (
        <div className="flash-in" style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 6px)", left: "50%", background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: 999, padding: "8px 18px", fontSize: 14, fontWeight: 700, zIndex: 61, color: C.textDark, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          🐒 Logged!
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 110px", position: "relative", zIndex: 2 }}>
        {tab === "home" && <HomeTab entries={entries} addEntry={addEntry} openBottleSheet={() => setBottleOpen(true)} />}
        {tab === "log" && <LogTab entries={entries} onDelete={deleteEntry} onUpdateTime={updateEntryTime} />}
        {tab === "emilio" && <EmilioTab />}
        {tab === "gallery" && <GalleryTab />}
      </div>

      <BottomNav tab={tab} setTab={setTab} />

      {bottleOpen && (
        <BottleSheet
          onClose={() => setBottleOpen(false)}
          onLog={(amt) => {
            addEntry("bottle", amt);
            setBottleOpen(false);
          }}
        />
      )}
    </div>
  );
}
