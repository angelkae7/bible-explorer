// src/pages/BooksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useApi, BasicCanvas, BooksSphere } from "../BibleExplorer";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

export default function BooksPage() {
  const { listBooks } = useApi();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list"); // "3d" | "list"
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
    <div
      style={{
        background: "#0b0f14",
        color: "#e9eef5",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
      }}
    >
      {/* Header sticky */}
      <header
        role="banner"
        aria-label="Navigation et recherche"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          flex: "0 0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 12,
          alignItems: "center",
          padding: "12px 16px",
          background: "rgba(15,20,28,.86)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #1f2a37",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: ".2px" }}>
            Livres de la Bible
          </h1>
          <span
            aria-hidden="true"
            style={{
              opacity: 0.75,
              fontSize: 12,
              padding: "2px 6px",
              border: "1px solid #263241",
              borderRadius: 8,
            }}
          >
            {filtered.length}/{books.length}
          </span>
        </div>

        <label htmlFor="searchBooks" className="sr-only" style={{ position: "absolute", left: -9999 }}>
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
          <TabButton active={view === "3d"} onClick={() => setView("3d")}>Vue 3D</TabButton>
          <TabButton active={view === "list"} onClick={() => setView("list")}>Liste</TabButton>
        </div>
      </header>

      {/* Contenu */}
      {view === "3d" ? (
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
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

          <p className="sr-only" style={{ position: "absolute", left: -9999 }}>
            Astuce : utilisez Tab pour naviguer dans les livres. Appuyez sur Entrée pour ouvrir un livre.
          </p>
        </div>
      ) : (
        <main
          aria-label="Liste des livres"
          className="scrollbar-thin"
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            padding: "24px 0",
          }}
        >
          {/* CSS local pour centrer 3 colonnes et gérer le responsive */}
          <style>{`
            .booksGrid {
              display: grid;
              grid-template-columns: repeat(3, 300px); /* 3 colonnes fixes */
              justify-content: center;                 /* centre la grille */
              gap: 16px;
              list-style: none;
              padding: 0;
              margin: 0 auto;
              width: 100%;
            }
            @media (max-width: 1200px) {
              .booksGrid { grid-template-columns: repeat(2, 300px); }
            }
            @media (max-width: 720px) {
              .booksGrid { grid-template-columns: repeat(1, 300px); }
            }
          `}</style>

          <ul className="booksGrid">
            {filtered.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => navigate(`/books/${b.id}`)}
                  style={cardStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
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

function TabButton({ active, onClick, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid " + (active ? "#35507a" : "#2b3a4d"),
        background: active ? "#142133" : "#0f141c",
        color: "#e9eef5",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

const cardStyle = {
  width: "100%",
  padding: "14px 12px",
  textAlign: "left",
  borderRadius: 14,
  border: "1px solid #243244",
  background: "#0f1722",
  color: "#e9eef5",
  cursor: "pointer",
  transition: "transform .15s ease, background .2s ease, border-color .2s ease",
  outline: "none",
  boxShadow: "none",
};
