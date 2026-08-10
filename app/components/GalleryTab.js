"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { C } from "../../lib/theme";

function normalize(row) {
  const { data } = supabase.storage.from("gallery").getPublicUrl(row.storage_path);
  return { id: row.id, path: row.storage_path, caption: row.caption, url: data.publicUrl };
}

export function GalleryTab() {
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false });
      if (data) setPhotos(data.map(normalize));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("gallery-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "photos" }, (payload) => {
        const row = normalize(payload.new);
        setPhotos((prev) => (prev.some((p) => p.id === row.id) ? prev : [row, ...prev]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "photos" }, (payload) => {
        const row = normalize(payload.new);
        setPhotos((prev) => prev.map((p) => (p.id === row.id ? row : p)));
        setViewer((v) => (v && v.id === row.id ? row : v));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "photos" }, (payload) => {
        setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file);
      if (!uploadError) {
        await supabase.from("photos").insert([{ storage_path: path }]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const deletePhoto = useCallback(async (photo) => {
    await supabase.storage.from("gallery").remove([photo.path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    setViewer(null);
  }, []);

  const saveCaption = useCallback(async (photo, caption) => {
    await supabase.from("photos").update({ caption: caption.trim() || null }).eq("id", photo.id);
  }, []);

  if (!loaded) {
    return <div style={{ textAlign: "center", color: C.textDim, marginTop: 60, fontSize: 15 }}>Loading photos… 🐒</div>;
  }

  return (
    <>
      {/* No `capture` attribute here on purpose — that's what was forcing
          camera-only. This opens the normal picker (library or camera). */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} id="gallery-upload" />
      <label
        htmlFor="gallery-upload"
        className="tap-btn"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: C.gallerySoft, border: `2px dashed ${C.gallery}66`, borderRadius: "24px 24px 24px 8px",
          padding: "18px 20px", marginBottom: 18, cursor: "pointer", color: C.textDark, fontWeight: 700,
        }}
      >
        <span style={{ fontSize: 22 }}>📸</span>
        <span className="display">{uploading ? "Uploading…" : "Add photos"}</span>
      </label>

      {photos.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textDim, marginTop: 40, fontSize: 15 }}>
          🐵 No pictures yet — add the first one of Emilio Joe!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setViewer(p)}
              style={{
                position: "relative", padding: 0, border: `2px solid ${C.creamBorder}`,
                borderRadius: i % 3 === 0 ? "20px 20px 8px 20px" : "20px 20px 20px 8px",
                overflow: "hidden", cursor: "pointer", aspectRatio: "1 / 1", background: C.cream,
              }}
            >
              <img src={p.url} alt="Emilio Joe" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {p.caption && (
                <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(47,82,51,0.75)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                  💬
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} onDelete={() => deletePhoto(viewer)} onSaveCaption={(caption) => saveCaption(viewer, caption)} />}
    </>
  );
}

function PhotoViewer({ photo, onClose, onDelete, onSaveCaption }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(photo.caption || "");

  useEffect(() => {
    setDraft(photo.caption || "");
    setEditing(false);
  }, [photo.id, photo.caption]);

  const save = () => {
    onSaveCaption(draft);
    setEditing(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,20,0.92)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ position: "relative", maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
        <img src={photo.url} alt="Emilio Joe" style={{ maxWidth: "100%", maxHeight: "62vh", borderRadius: 18, boxShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "block" }} />

        {/* Decorative leaf accents framing the caption bubble, like the reference */}
        <div style={{ position: "absolute", bottom: -6, left: -10, fontSize: 22, transform: "rotate(-15deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}>🌴</div>
        <div style={{ position: "absolute", bottom: -6, right: -10, fontSize: 20, transform: "rotate(20deg)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}>🍃</div>
      </div>

      <div style={{ marginTop: 22, width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <div style={{ background: C.cream, border: `2px solid ${C.leaf}`, borderRadius: "20px 20px 20px 6px", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a caption…"
              maxLength={120}
              style={{ border: `1.5px solid ${C.creamBorder}`, borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", fontStyle: "italic", color: C.textDark, background: "#FFFFFF" }}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(false)} className="tap-btn" style={{ background: "none", border: `1.5px solid ${C.creamBorder}`, color: C.textDim, borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={save} className="tap-btn" style={{ background: C.leaf, border: "none", color: "#fff", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="tap-btn"
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
              background: C.cream, border: `2px solid ${C.leaf}88`, borderRadius: "20px 20px 20px 6px",
              padding: "12px 16px", cursor: "pointer", position: "relative",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>🌴</span>
            <span style={{ fontSize: 14, fontStyle: "italic", fontWeight: 600, color: photo.caption ? C.textDark : C.textDim, flex: 1 }}>
              {photo.caption ? `# ${photo.caption}` : "Add a caption…"}
            </span>
            <span style={{ fontSize: 13, flexShrink: 0 }}>✏️</span>
            <span style={{ position: "absolute", top: -8, right: 10, fontSize: 16, transform: "rotate(15deg)" }}>🍃</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="tap-btn" style={{ background: C.cream, border: "none", borderRadius: 999, padding: "10px 20px", fontWeight: 700, color: C.textDark, cursor: "pointer" }}>Close</button>
        <button onClick={onDelete} className="tap-btn" style={{ background: "#D9534F", border: "none", borderRadius: 999, padding: "10px 20px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>Delete</button>
      </div>
    </div>
  );
}
