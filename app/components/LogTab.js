"use client";

import { useState } from "react";
import { C } from "../../lib/theme";
import { formatTime, dateLabel, toDatetimeLocal } from "../../lib/format";

function entryMeta(entry) {
  return entry.type === "wet"
    ? { color: C.wet, emoji: "💧", label: "Wet" }
    : entry.type === "dirty"
    ? { color: C.dirty, emoji: "💩", label: "Dirty" }
    : { color: C.bottle, emoji: "🍼", label: "Bottle" };
}

export function LogTab({ entries, onDelete, onUpdateTime }) {
  const groups = entries.reduce((acc, e) => {
    const label = dateLabel(e.timestamp);
    (acc[label] = acc[label] || []).push(e);
    return acc;
  }, {});

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", color: C.textDim, marginTop: 60, fontSize: 15 }}>
        🌿 Nothing logged yet — the jungle is quiet.
      </div>
    );
  }

  return (
    <>
      {Object.entries(groups).map(([label, items]) => (
        <div key={label} style={{ marginBottom: 22 }}>
          <div className="display" style={{ fontSize: 13.5, fontWeight: 600, color: C.canopy, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🌴</span> {label}
          </div>
          <LogTable items={items} onDelete={onDelete} onUpdateTime={onUpdateTime} />
        </div>
      ))}
    </>
  );
}

function LogTable({ items, onDelete, onUpdateTime }) {
  const [editingId, setEditingId] = useState(null);
  const [draftTime, setDraftTime] = useState("");

  const startEdit = (e) => {
    setEditingId(e.id);
    setDraftTime(toDatetimeLocal(e.timestamp));
  };

  const saveEdit = (id) => {
    const ms = new Date(draftTime).getTime();
    if (!isNaN(ms)) onUpdateTime(id, ms);
    setEditingId(null);
  };

  return (
    <div style={{ background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: "20px 20px 20px 6px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "46px 1fr 100px 30px", alignItems: "center", padding: "9px 12px", background: C.leafSoft, borderBottom: `1.5px solid ${C.creamBorder}` }}>
        <div />
        <div className="display" style={{ fontSize: 10.5, fontWeight: 700, color: C.canopy, textTransform: "uppercase", letterSpacing: 0.4 }}>Entry</div>
        <div className="display" style={{ fontSize: 10.5, fontWeight: 700, color: C.canopy, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "right" }}>Time</div>
        <div />
      </div>
      {items.map((e, i) => {
        const meta = entryMeta(e);
        const isEditing = editingId === e.id;
        return (
          <div key={e.id} style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.creamBorder}` : "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "46px 1fr 100px 30px", alignItems: "center", padding: "10px 12px" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${meta.color}22`, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {meta.emoji}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark }}>{meta.label}</div>
                {e.amount ? <div style={{ fontSize: 11.5, color: C.textDim, fontWeight: 600 }}>{e.amount} mL</div> : null}
              </div>
              <button
                onClick={() => (isEditing ? setEditingId(null) : startEdit(e))}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "right" }}
                aria-label="Edit time"
              >
                <div style={{ fontSize: 12.5, color: isEditing ? C.canopy : C.textDim, fontWeight: 700, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
                  {formatTime(e.timestamp)} ✏️
                </div>
              </button>
              <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", color: C.textDim, fontSize: 14, padding: 4, cursor: "pointer", justifySelf: "end" }} aria-label="Delete entry">✕</button>
            </div>
            {isEditing && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "0 12px 12px", flexWrap: "wrap" }}>
                <input
                  type="datetime-local"
                  value={draftTime}
                  onChange={(ev) => setDraftTime(ev.target.value)}
                  style={{ flex: 1, minWidth: 170, border: `1.5px solid ${C.creamBorder}`, borderRadius: 10, padding: "8px 10px", fontSize: 13.5, fontFamily: "inherit", color: C.textDark, background: "#FFFFFF" }}
                />
                <button onClick={() => saveEdit(e.id)} style={{ background: C.leaf, border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: `1.5px solid ${C.creamBorder}`, color: C.textDim, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
