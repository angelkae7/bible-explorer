// src/pages/ChaptersPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "../BibleExplorer";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ChaptersPage() {
  const { bookId } = useParams();
  const { bookChapters } = useApi();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [chapters, setChapters] = useState(state?.chapters || []);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!chapters.length) {
      bookChapters(bookId).then(setChapters).catch(() => setChapters([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // --- filtre simple (texte ou numéro) ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((c) => {
      const label =
        c.number ||
        (c.reference && (c.reference.match(/\d+/) || ["?"])[0]) ||
        "intro";
      return String(label).toLowerCase().includes(q) ||
        (c.reference || "").toLowerCase().includes(q);
    });
  }, [chapters, query]);

  // --- horizontal scroller ---
  const scrollRef = useRef(null);

  const onWheelHorizontal = (e) => {
    if (!scrollRef.current) return;
    // molette verticale => scroll horizontal
    scrollRef.current.scrollLeft += e.deltaY;
  };

  // boutons de scroll
  const scrollBy = (dir = 1) => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({ left: dir * Math.round(w * 0.9), behavior: "smooth" });
  };

  // clavier global
  useEffect(() => {
    const handler = (e) => {
      if (!scrollRef.current) return;
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") scrollBy(-1);
      if (e.key === "ArrowRight") scrollBy(1);
      if (e.key === "Home") scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      if (e.key === "End")
        scrollRef.current.scrollTo({
          left: scrollRef.current.scrollWidth,
          behavior: "smooth",
        });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // progression (scrollLeft / total)
  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const p = Math.min(1, Math.max(0, scrollLeft / (scrollWidth - clientWidth || 1)));
    setProgress(p);
  };

  return (
    <div className="h-dvh">
      <div className="mx-auto w-[min(1600px,98vw)] h-full flex flex-col">
        {/* Header sticky */}
        <header className="sticky top-0 z-10 -mx-2 mb-3 px-2 pt-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-black/20">
          {/* Barre de progression */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/60 transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          {/* Rangée 1 : Retour (gauche) / Titre (centré) / Compteur (droite) */}
          <div className="relative min-h-[68px]">
            {/* gauche */}
            <div className="absolute inset-y-4 left-0 flex items-center flex-col">
              <div className="inline-block rounded-md bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider border border-white/10">
                Livre de
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-wide">{bookId}</h1>
            </div>

            {/* centre : titre uniquement */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 grid place-items-center text-center">
              <div className="w-full max-w-xl">
                <SearchBox value={query} onChange={setQuery} />
              </div>
            </div>

            {/* droite : compteur */}
            <div className="absolute inset-y-0 right-0 flex items-center">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right min-w-[84px]">
                <div className="text-[11px] uppercase tracking-wider opacity-70">Chapitres</div>
                <div className="text-2xl font-semibold leading-none">{chapters.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Rangée 2 : recherche alignée à droite */}
          <div className="mt-3 flex justify-end">

          </div>


        </header>



        {/* Zone scroller */}
        <div className="relative" pt-1>
          {/* Boutons flottants */}
          <div className="pointer-events-none absolute -left-3 top-1/2 z-10 -translate-y-1/2 hidden md:block">
            <RoundButton onClick={() => scrollBy(-1)} icon="◀" />
          </div>
          <div className="pointer-events-none absolute -right-2 top-1/2 z-10 -translate-y-1/2 hidden md:block">
            <RoundButton onClick={() => scrollBy(1)} icon="▶" />
          </div>

          <div

            ref={scrollRef}
            onWheel={onWheelHorizontal}
            onScroll={onScroll}

            className="relative overflow-x-auto overflow-y-hidden px-2 py-6
+              min-h-[320px] md:min-h-[380px] lg:min-h-[430px]
+              scroll-smooth snap-x snap-mandatory
+              scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent
+              overscroll-x-contain"
            aria-label="Liste des chapitres (défilement horizontal)"
          >
            <div className="flex gap-5 pr-4">
              {filtered.map((c) => (
                <ChapterCard
                  key={c.id}
                  chapter={c}
                  onOpen={() =>
                    navigate(`/read/${encodeURIComponent(c.id)}`, {
                      state: { chapter: c },
                    })
                  }
                />
              ))}
              {!filtered.length && (
                <EmptyState query={query} onClear={() => setQuery("")} />
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-auto mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(`/books/${bookId}`)}
            className="rounded-full px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
          >
            📖 Détails du livre
          </button>

          <div className="text-xs opacity-70">
            Astuces: molette verticale ⇒ défilement horizontal • flèches ← → • Home/End
          </div>
        </div>
      </div>
    </div>
  );
}

/** Champ de recherche */
function SearchBox({ value, onChange }) {
  return (
    <label className="group relative block">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un chapitre… (ex: 3, 12, intro)"
        className="w-72 max-w-[74vw] rounded-full bg-white/5 pl-10 pr-4 py-2 text-sm
                   outline-none border border-white/10 focus:border-white/30
                   placeholder:text-white/40"
        type="text"
      />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
        🔎
      </span>
    </label>
  );
}

/** Bouton rond flottant pour scroller */
function RoundButton({ icon = "▶", onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="pointer-events-auto grid place-items-center h-11 w-11
                 rounded-full border border-white/20 bg-white/10
                 backdrop-blur hover:bg-white/20 active:scale-95
                 shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                 focus:outline-none focus:ring-2 focus:ring-white/50"
      aria-label="Faire défiler"
    >
      <span className="text-base leading-none">{icon}</span>
    </button>
  );
}


/** Carte chapitre moderne */
function ChapterCard({ chapter, onOpen }) {
  const label =
    chapter.number ||
    (chapter.reference && (chapter.reference.match(/\d+/) || ["?"])[0]) ||
    "intro";

  return (
    <div className="snap-start first:pl-2 last:pr-2">
      <button
        onClick={onOpen}
        aria-label={`Ouvrir chapitre ${label}`}
        className="group relative grid place-items-center
                   rounded-2xl border border-white/10 bg-white/5
                   shadow-[0_8px_30px_rgb(0,0,0,0.25)]
                   transition-all duration-200
                   hover:-translate-y-0.5 hover:bg-white/[0.07]
                   focus:outline-none focus:ring-2 focus:ring-white/50
                   active:scale-[0.98]"
      >
        {/* glow subtil */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
        <div className="pointer-events-none absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0 blur-md transition-opacity duration-200 group-hover:opacity-100" />

        {/* contenu */}
        <div className="aspect-square w-36 sm:w-44 md:w-48 lg:w-52 grid place-items-center">
          <span className="select-none text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide">
            {label}
          </span>
        </div>
      </button>
    </div>
  );
}

/** Petite carte stat */
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
      <div className="text-[11px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
    </div>
  );
}

/** Etat vide (pas de résultat) */
function EmptyState({ query, onClear }) {
  return (
    <div className="mx-2 my-8 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-lg font-medium mb-1">Aucun chapitre trouvé</div>
      <div className="text-sm opacity-70">
        Aucun résultat pour « <span className="font-medium">{query}</span> ».
      </div>
      <button
        onClick={onClear}
        className="mt-3 rounded-full px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 border border-white/10"
      >
        Réinitialiser la recherche
      </button>
    </div>
  );
}
