// src/pages/BooksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useApi, BasicCanvas, BooksSphere } from "../BibleExplorer";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

export default function BooksPage() {
  const { listBooks } = useApi();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("3d"); // "3d" | "list"
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    listBooks()
      .then((d) => alive && setBooks(d))
      .catch(() => alive && setBooks([]));
    return () => (alive = false);
  }, [listBooks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) =>
      [b.name, b.abbreviation].some((s) => (s || "").toLowerCase().includes(q))
    );
  }, [books, query]);

  return (
    <div className="h-dvh" style={{ background: "#0b0f14", color: "#e9eef5" }}>
      {/* Accessible page title + helper */}
      <header
        className="ui-bar"
        role="banner"
        aria-label="Navigation et recherche"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: "12px",
          alignItems: "center",
          padding: "12px 16px",
          background: "rgba(15, 20, 28, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #1f2a37",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: ".2px",
            }}
          >
            Livres de la Bible
          </h1>
          <span
            aria-hidden="true"
            style={{
              opacity: 0.7,
              fontSize: 12,
              padding: "2px 6px",
              border: "1px solid #263241",
              borderRadius: 8,
            }}
          >
            {filtered.length}/{books.length}
          </span>
        </div>

        <label
          htmlFor="searchBooks"
          className="sr-only"
          style={{ position: "absolute", left: -9999 }}
        >
          Rechercher un livre
        </label>
        <input
          id="searchBooks"
          type="search"
          placeholder="Rechercher (ex. Marc, Ps...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un livre"
          style={{
            width: 320,
            maxWidth: "45vw",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #2b3a4d",
            background: "#0f141c",
            color: "#e9eef5",
            outline: "none",
          }}
        />

        <div role="tablist" aria-label="Changer de vue" style={{ display: "flex", gap: 8 }}>
          <button
            role="tab"
            aria-selected={view === "3d"}
            onClick={() => setView("3d")}
            style={tabStyle(view === "3d")}
          >
            Vue 3D
          </button>
          <button
            role="tab"
            aria-selected={view === "list"}
            onClick={() => setView("list")}
            style={tabStyle(view === "list")}
          >
            Liste
          </button>
        </div>
      </header>

      {view === "3d" ? (
        <div className="h-full" style={{ height: "calc(100dvh - 58px)" }}>
          <BasicCanvas>
            <BooksSphere
              books={filtered}
              onPick={(b) => navigate(`/books/${b.id}`)}
              radius={3.2}
            />
            <OrbitControls
              enablePan={false}
              enableZoom
              maxDistance={7}
              minDistance={2.5}
              zoomSpeed={0.6}
              rotateSpeed={0.6}
            />
          </BasicCanvas>

          {/* Screen-reader hint */}
          <p className="sr-only" style={{ position: "absolute", left: -9999 }}>
            Astuce : utilisez Tab pour naviguer dans les livres. Appuyez sur
            Entrée pour ouvrir un livre.
          </p>
        </div>
      ) : (
        <main
          aria-label="Liste des livres"
          style={{
            padding: 16,
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <ul
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 12,
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {filtered.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => navigate(`/books/${b.id}`)}
                  style={{
                    width: "100%",
                    padding: "14px 12px",
                    textAlign: "left",
                    borderRadius: 12,
                    border: "1px solid #243244",
                    background: "#111824",
                    color: "#e9eef5",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{b.name}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{b.abbreviation}</div>
                </button>
              </li>
            ))}
          </ul>
        </main>
      )}

    </div>
  );
}

function tabStyle(active) {
  return {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid " + (active ? "#35507a" : "#2b3a4d"),
    background: active ? "#142133" : "#0f141c",
    color: "#e9eef5",
    cursor: "pointer",
    fontWeight: 600,
  };
}
