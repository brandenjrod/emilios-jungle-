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

  if (!loaded) {
    return <div style={{ textAlign: "center", color: C.textDim, marginTop: 60, fontSize: 15 }}>Loading photos… 🐒</div>;
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" onChange={handleUpload} style={{ display: "none" }} id="gallery-upload" />
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
        <span className="display">{uploading ? "Uploading…" : "Add a photo"}</span>
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
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,20,0.9)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewer(null)}>
          <img src={viewer.url} alt="Emilio Joe" style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }} onClick={(e) => e.stopPropagation()} />
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button onClick={() => setViewer(null)} className="tap-btn" style={{ background: C.cream, border: "none", borderRadius: 999, padding: "10px 20px", fontWeight: 700, color: C.textDark, cursor: "pointer" }}>Close</button>
            <button onClick={() => deletePhoto(viewer)} className="tap-btn" style={{ background: "#D9534F", border: "none", borderRadius: 999, padding: "10px 20px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>Delete</button>
          </div>
        </div>
      )}
    </>
  );
}
