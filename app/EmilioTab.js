"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { C } from "../../lib/theme";
import { formatAge, ageBreakdown, MILESTONES, currentMilestone, nextMilestone } from "../../lib/milestones";
import { toDateInput } from "../../lib/format";

function normalizeAppt(row) {
  return { id: row.id, date: row.appointment_date, note: row.note };
}
function normalizeGrowth(row) {
  return { id: row.id, date: row.log_date, height: row.height_in, weight: row.weight_lb };
}

export function EmilioTab() {
  const [now, setNow] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [growthLogs, setGrowthLogs] = useState([]);
  const [apptForm, setApptForm] = useState({ date: toDateInput(Date.now()), note: "" });
  const [growthForm, setGrowthForm] = useState({ date: toDateInput(Date.now()), height: "", weight: "" });
  const [showAllMilestones, setShowAllMilestones] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: appts } = await supabase.from("appointments").select("*").order("appointment_date", { ascending: false });
      if (appts) setAppointments(appts.map(normalizeAppt));
      const { data: growth } = await supabase.from("growth_logs").select("*").order("log_date", { ascending: false });
      if (growth) setGrowthLogs(growth.map(normalizeGrowth));
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("emilio-tab-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments" }, (payload) => {
        const row = normalizeAppt(payload.new);
        setAppointments((prev) => (prev.some((a) => a.id === row.id) ? prev : [row, ...prev]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "appointments" }, (payload) => {
        setAppointments((prev) => prev.filter((a) => a.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "growth_logs" }, (payload) => {
        const row = normalizeGrowth(payload.new);
        setGrowthLogs((prev) => (prev.some((g) => g.id === row.id) ? prev : [row, ...prev]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "growth_logs" }, (payload) => {
        setGrowthLogs((prev) => prev.filter((g) => g.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const addAppointment = useCallback(async () => {
    if (!apptForm.note.trim()) return;
    const { error } = await supabase.from("appointments").insert([{ appointment_date: apptForm.date, note: apptForm.note.trim() }]);
    if (!error) setApptForm({ date: toDateInput(Date.now()), note: "" });
  }, [apptForm]);

  const deleteAppointment = useCallback(async (id) => {
    await supabase.from("appointments").delete().eq("id", id);
  }, []);

  const addGrowth = useCallback(async () => {
    if (!growthForm.height && !growthForm.weight) return;
    const { error } = await supabase.from("growth_logs").insert([
      {
        log_date: growthForm.date,
        height_in: growthForm.height ? parseFloat(growthForm.height) : null,
        weight_lb: growthForm.weight ? parseFloat(growthForm.weight) : null,
      },
    ]);
    if (!error) setGrowthForm({ date: toDateInput(Date.now()), height: "", weight: "" });
  }, [growthForm]);

  const deleteGrowth = useCallback(async (id) => {
    await supabase.from("growth_logs").delete().eq("id", id);
  }, []);

  const { totalDays } = ageBreakdown(now);
  const current = currentMilestone(totalDays);
  const upcoming = nextMilestone(totalDays);
  const daysToNext = upcoming ? upcoming.days - totalDays : null;

  return (
    <>
      {/* Age hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.heartSoft}, ${C.leafSoft})`, border: `2px solid ${C.heart}55`, borderRadius: "28px 28px 28px 8px", padding: "22px 20px", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 34, marginBottom: 4 }}>💚🐒</div>
        <div className="display" style={{ fontSize: 15, fontWeight: 600, color: C.textDim }}>Emilio Joe is</div>
        <div className="display" style={{ fontSize: 30, fontWeight: 700, color: C.canopy, margin: "2px 0" }}>{formatAge(now)}</div>
        <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>Born July 29, 2026 · 9:11 AM</div>
      </div>

      {/* Current milestone */}
      <div style={{ background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: "24px 24px 24px 8px", padding: "16px 18px", marginBottom: 12 }}>
        <div className="display" style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>🌟 Right now</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 30 }}>{current.emoji}</div>
          <div>
            <div className="display" style={{ fontSize: 16.5, fontWeight: 700, color: C.textDark, marginBottom: 3 }}>{current.title}</div>
            <div style={{ fontSize: 13.5, color: C.textDim, fontWeight: 600, lineHeight: 1.4 }}>{current.text}</div>
          </div>
        </div>
      </div>

      {upcoming && (
        <div style={{ background: `${C.leafSoft}`, border: `1.5px dashed ${C.creamBorder}`, borderRadius: "20px 20px 20px 8px", padding: "12px 16px", marginBottom: 16, opacity: 0.85 }}>
          <div style={{ fontSize: 12.5, color: C.textDim, fontWeight: 700 }}>
            🔒 Next up in {daysToNext} day{daysToNext === 1 ? "" : "s"}: <span style={{ color: C.canopy }}>{upcoming.label}</span> — {upcoming.title.replace("!!", "").replace("!", "")}
          </div>
        </div>
      )}

      <button onClick={() => setShowAllMilestones((v) => !v)} className="tap-btn" style={{ width: "100%", background: "none", border: `1.5px solid ${C.creamBorder}`, color: C.canopy, borderRadius: 14, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>
        {showAllMilestones ? "Hide full timeline ▲" : "See full milestone timeline ▼"}
      </button>

      {showAllMilestones && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, animation: "fadeInUp 0.3s ease" }}>
          {MILESTONES.map((m) => {
            const unlocked = m.days <= totalDays;
            return (
              <div key={m.days} style={{ display: "flex", alignItems: "center", gap: 10, background: unlocked ? C.cream : "transparent", border: `1.5px solid ${unlocked ? C.creamBorder : "transparent"}`, borderRadius: 12, padding: "8px 12px", opacity: unlocked ? 1 : 0.55 }}>
                <div style={{ fontSize: 17 }}>{unlocked ? m.emoji : "🔒"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: unlocked ? C.textDark : C.textDim }}>{m.label}</div>
                  {unlocked && <div style={{ fontSize: 11.5, color: C.textDim }}>{m.text}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointments */}
      <SectionLabel emoji="🩺" title="Appointments & notes" />
      <div style={{ background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: "20px 20px 20px 8px", padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <input type="date" value={apptForm.date} onChange={(e) => setApptForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle(110)} />
          <input type="text" placeholder="Note (e.g. 2-week checkup)" value={apptForm.note} onChange={(e) => setApptForm((f) => ({ ...f, note: e.target.value }))} style={{ ...inputStyle(140), flex: 1 }} />
          <button onClick={addAppointment} className="tap-btn" style={addBtnStyle}>Add</button>
        </div>
        {appointments.length === 0 ? (
          <EmptyRow text="No appointments logged yet." />
        ) : (
          <Table
            columns={["Date", "Note", ""]}
            rows={appointments.map((a) => [
              new Date(a.date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
              a.note,
              <DeleteBtn key={a.id} onClick={() => deleteAppointment(a.id)} />,
            ])}
          />
        )}
      </div>

      {/* Growth */}
      <SectionLabel emoji="📏" title="Height & weight" />
      <div style={{ background: C.cream, border: `2px solid ${C.creamBorder}`, borderRadius: "20px 20px 20px 8px", padding: 14, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <input type="date" value={growthForm.date} onChange={(e) => setGrowthForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle(110)} />
          <input type="number" inputMode="decimal" placeholder="Height (in)" value={growthForm.height} onChange={(e) => setGrowthForm((f) => ({ ...f, height: e.target.value }))} style={inputStyle(90)} />
          <input type="number" inputMode="decimal" placeholder="Weight (lb)" value={growthForm.weight} onChange={(e) => setGrowthForm((f) => ({ ...f, weight: e.target.value }))} style={inputStyle(90)} />
          <button onClick={addGrowth} className="tap-btn" style={addBtnStyle}>Add</button>
        </div>
        {growthLogs.length === 0 ? (
          <EmptyRow text="No measurements logged yet." />
        ) : (
          <Table
            columns={["Date", "Height", "Weight", ""]}
            rows={growthLogs.map((g) => [
              new Date(g.date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
              g.height ? `${g.height} in` : "—",
              g.weight ? `${g.weight} lb` : "—",
              <DeleteBtn key={g.id} onClick={() => deleteGrowth(g.id)} />,
            ])}
          />
        )}
      </div>
    </>
  );
}

function SectionLabel({ emoji, title }) {
  return (
    <div className="display" style={{ fontSize: 14.5, fontWeight: 600, color: C.canopy, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      <span>{emoji}</span> {title}
    </div>
  );
}

function inputStyle(minWidth) {
  return { minWidth, border: `1.5px solid ${C.creamBorder}`, borderRadius: 10, padding: "9px 10px", fontSize: 13, fontFamily: "inherit", color: C.textDark, background: "#FFFFFF" };
}

const addBtnStyle = { background: C.heart, border: "none", color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" };

function EmptyRow({ text }) {
  return <div style={{ textAlign: "center", color: C.textDim, fontSize: 13, padding: "10px 0" }}>{text}</div>;
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: C.textDim, fontSize: 13, cursor: "pointer", padding: 4 }} aria-label="Delete">✕</button>
  );
}

function Table({ columns, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="display" style={{ textAlign: i === columns.length - 1 ? "right" : "left", padding: "6px 6px", fontSize: 10.5, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.3, borderBottom: `1.5px solid ${C.creamBorder}` }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "8px 6px", borderBottom: ri < rows.length - 1 ? `1px solid ${C.creamBorder}` : "none", color: C.textDark, fontWeight: ci === 0 ? 700 : 500, textAlign: ci === row.length - 1 ? "right" : "left" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
