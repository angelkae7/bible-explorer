// src/pages/BookDetailsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useApi } from "../BibleExplorer";
import Book3D from "../components/Book3D";



export default function BookDetailsPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { bookChapters, bookById } = useApi();

  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [justOpened, setJustOpened] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const [b, ch] = await Promise.all([
          bookById?.(bookId),
          bookChapters?.(bookId),
        ]);

        if (!alive) return;
        setBook(b || { id: bookId, name: nameFromAbbrev(bookId), abbreviation: bookId });
        setChapters(Array.isArray(ch) ? ch : []);
      } catch {
        // safe fallbacks
        setBook({ id: bookId, name: nameFromAbbrev(bookId), abbreviation: bookId });
        setChapters([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, [bookId]); // eslint-disable-line

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return chapters;
    // autorise "1", "2", "10" etc.
    return chapters.filter((c) =>
      (c?.number ? String(c.number) : c?.name || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [chapters, search]);

  const onPickChapter = (c) => {
    // Certaines API renvoient "id" (ex: "PRO.5"). Sinon, construire "BOOK.NUM"
    const cid = c?.id || `${bookId}.${c?.number || c}`;
    navigate(`/read/${cid}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={{ width: "100%", height: "100%" }}>
          <Canvas camera={{ position: [0, 0.4, 3], fov: 40 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 4, 3]} intensity={0.9} />
            <Environment preset="studio" />
            <Book3D book={book} idleFloat={false} hoverScale={1} glowIntensity={0} />
            <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
          </Canvas>
        </div>

        {/* Aide visuelle hover/clic */}
        <div style={styles.helper}>
          Survolez le livre pour le voir s’illuminer. Cliquez pour l’ouvrir puis choisissez un chapitre ➜
        </div>
      </div>

      <aside style={styles.sidebar} aria-live="polite">
        <header style={styles.header}>
          <div style={styles.breadcrumb} onClick={() => navigate(-1)} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(-1)}>
            ← Retour à la sphère
          </div>
          <h1 style={styles.title}>{book?.name || nameFromAbbrev(bookId)}</h1>
          <div style={styles.subTitle}>
            Abrév. : <strong>{(book?.abbreviation || bookId || "").toUpperCase()}</strong> •{" "}
            {chapters.length} chapitres
          </div>
          <p style={styles.resume}>
            {resumeFor(bookId)}
          </p>
        </header>

        <section style={styles.tools}>
          <input
            aria-label="Rechercher un chapitre"
            placeholder="Rechercher un chapitre (ex. 5, 10...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
          <div style={styles.quickRow}>
            <button style={styles.quick} onClick={() => setSearch("1")}>Début</button>
            {chapters.length > 3 && (
              <>
                <button
                  style={styles.quick}
                  onClick={() =>
                    setSearch(String(Math.ceil(chapters.length / 2)))
                  }
                >
                  Milieu
                </button>
                <button
                  style={styles.quick}
                  onClick={() => setSearch(String(chapters.length))}
                >
                  Fin
                </button>
              </>
            )}
            <button style={styles.quickGhost} onClick={() => setSearch("")}>Tout</button>
          </div>
        </section>

        {/* --- Chapitres --- */}
        <section style={styles.listWrap}>
          <h2 style={styles.listTitle}>
            {loading ? "Chargement..." : "Chapitres"}
          </h2>

          {!loading && filtered.length === 0 && (
            <div style={styles.empty}>Aucun chapitre trouvé.</div>
          )}

          {/* NOUVEAU: conteneur scrollable */}
          <div style={styles.listScroll} role="list">
            <div style={styles.grid}>
              {(justOpened ? filtered : chapters).map((c) => {
                const num =
                  c?.number || Number(String(c?.id || "").split(".")[1]) || "?";
                return (
                  <button
                    key={c?.id || `${bookId}.${num}`}
                    role="listitem"
                    onClick={() => onPickChapter(c)}
                    style={styles.card}
                    className="chapter-card"
                    aria-label={`Chapitre ${num}`}
                  >
                    <span style={styles.cardNum}>{num}</span>
                    <span style={styles.cardHint}>Lire</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

      </aside>
    </div>
  );
}

/* -------------------- 3D Book component -------------------- */


/* -------------- Helpers -------------------- */

function nameFromAbbrev(abbrev = "") {
  // fallback minimal (tu peux compléter si besoin)
  const map = {
    GEN: "Genèse", EXO: "Exode", LEV: "Lévitique", NUM: "Nombres", DEU: "Deutéronome",
    JOS: "Josué", JDG: "Juges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
    "1KI": "1 Rois", "2KI": "2 Rois", "1CH": "1 Chroniques", "2CH": "2 Chroniques",
    EZR: "Esdras", NEH: "Néhémie", EST: "Esther", JOB: "Job", PSA: "Psaumes",
    PRO: "Proverbes", ECC: "Ecclésiaste", SNG: "Cantique des cantiques",
  };
  return map[abbrev?.toUpperCase()] || abbrev;
}

function resumeFor(bookId = "") {
  const id = (bookId || "").toUpperCase();
  if (id === "PRO") {
    return "Recueil de maximes de sagesse, souvent attribuées à Salomon. Conseils pratiques pour vivre avec droiture, prudence et crainte de Dieu.";
  }
  if (id === "PSA") {
    return "Prières et chants pour toutes les saisons de la vie : louange, lamentation, espoir et confiance en Dieu.";
  }
  return "Aperçu du contenu et du thème principal du livre. (Tu peux remplacer ce texte par un résumé de l’API si disponible.)";
}

function easeOutCubic(t) {
  // t in [0..1]
  return 1 - Math.pow(1 - t, 3);
}

/* -------------------- Styles -------------------- */

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 380px",
    height: "100vh", // assure une hauteur fixe écran
    background:
      "radial-gradient(1200px 600px at 40% 40%, #0d1117 0%, #0a0e13 60%, #07090d 100%)",
    color: "#e6edf3",
    overflow: "hidden", // évite le scroll global
  },
  left: {
    position: "relative",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    minWidth: 0,
    height: "100vh",   // <---- ajoute ça
    overflow: "hidden" // évite les débordements
  },

  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 18,
    height: "100vh",      // occupe tout l’écran
    minHeight: 0,         // IMPORTANT pour que le flex enfant puisse scroller
    overflow: "hidden",   // on délègue le scroll à listScroll
  },
  header: {
    display: "grid",
    gap: 6,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 10,
    flex: "0 0 auto",
  },
  tools: {
    display: "grid",
    gap: 8,
    flex: "0 0 auto",
  },
  listWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
    flex: "1 1 auto", // prend le reste -> zone scrollable interne
  },
  listTitle: { margin: 0, fontSize: 16, fontWeight: 700, flex: "0 0 auto" },

  // NOUVEAU: le vrai conteneur scroll
  listScroll: {
    flex: "1 1 auto",
    minHeight: 0,
    overflow: "auto",          // <-- la barre de scroll est ici
    paddingRight: 4,           // petit espace pour la barre
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", // un peu plus large
    gap: 12,
  },

  card: {
    height: 82,                            // +10px
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.20)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    position: "relative",
    transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
    outline: "none",
  },

  cardNum: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  cardHint: {
    position: "absolute",
    bottom: 7,
    right: 10,
    fontSize: 10,
    opacity: 0.65,
  }

  // ... le reste inchangé ...
};


/* Small keyboard-focus effect (optional if you have global focus styles) */
if (typeof document !== "undefined") {
  const styleTag = document.getElementById("bookdetails-extra-style") || document.createElement("style");
  styleTag.id = "bookdetails-extra-style";
  styleTag.textContent = `
    .chapter-card:focus-visible { box-shadow: 0 0 0 3px rgba(56,189,248,.6); transform: translateY(-1px); }
    .chapter-card:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.25); }
  `;
  if (!document.getElementById("bookdetails-extra-style")) {
    document.head.appendChild(styleTag);
  }
}
