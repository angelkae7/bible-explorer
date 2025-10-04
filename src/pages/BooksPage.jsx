// src/pages/BooksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useApi, BasicCanvas, BooksSphere } from "../BibleExplorer";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import '../index.css';


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
    <div className="booksPage">
      {/* Header sticky */}
      <header className="booksHeader" role="banner" aria-label="Navigation et recherche">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <h1>Livres de la Bible</h1>
          <span aria-hidden="true" className="booksCount">
            {filtered.length}/{books.length}
          </span>
        </div>

        <label htmlFor="searchBooks" className="sr-only">Rechercher un livre</label>
        <input
          id="searchBooks"
          type="search"
          placeholder="Rechercher (ex. Marc, Ps...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un livre"
          className="searchInput"
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
      <main aria-label="Liste des livres" className="scrollbar-thin">
        <div className="booksWrap">
        <ul className="booksGrid">
          {filtered.map((b) => (
            <li key={b.id}>
              <button onClick={() => navigate(`/books/${b.id}`)} className="bookCard">
                <div className="title">{b.name}</div>
                <div className="abbr">{b.abbreviation}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      </main>
    )}
  </div >
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
