// src/pages/ReaderPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "../BibleExplorer";
import { useNavigate, useParams } from "react-router-dom";

export default function ReaderPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { readChapter, bookChapters } = useApi();

  const [data, setData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le chapitre + la liste des chapitres du livre
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const d = await readChapter(chapterId);
        if (!alive) return;
        setData(d);

        // bookId de l'API sinon fallback depuis l'ID de chapitre (e.g. "PRO.5" -> "PRO")
        const bookId = d?.bookId || (chapterId.includes(".") ? chapterId.split(".")[0] : null);

        if (bookId) {
          try {
            const list = await bookChapters(bookId);
            if (alive) setChapters(list || []);
          } catch (e) {
            console.warn("Erreur chargement chapitres:", e);
          }
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [chapterId, readChapter, bookChapters]);

  const title = data?.reference || chapterId;

  // 1 verset = 1 ligne : on insère <br/> avant chaque numéro de verset (<sup> ou .verse-number)
  const renderedHtml = useMemo(() => {
    if (!data?.content) return "";
    try {
      let s = data.content;

      // <sup>xx</sup>
      s = s.replace(/<sup\b/gi, "<br/><sup");
      // corrige <p><br/><sup> au début d'un bloc
      s = s.replace(/(<(?:p|div)\b[^>]*>)\s*<br\/?>\s*(<sup\b)/gi, "$1$2");

      // <span class="verse-number">xx</span>
      s = s.replace(/(<span[^>]*class="[^"]*\bverse-number\b[^"]*"[^>]*>)/gi, "<br/>$1");
      s = s.replace(
        /(<(?:p|div)\b[^>]*>)\s*<br\/?>\s*(<span[^>]*class="[^"]*\bverse-number\b[^"]*"[^>]*>)/gi,
        "$1$2"
      );

      return s;
    } catch {
      // en cas de souci, on renvoie l’original
      return data.content;
    }
  }, [data?.content]);

  // index courant pour prev/next
  const idx = useMemo(() => {
    if (!chapters?.length) return -1;
    return chapters.findIndex(c => (c.id || c) === chapterId);
  }, [chapters, chapterId]);

  const prevId = idx > 0 ? (chapters[idx - 1].id || chapters[idx - 1]) : null;
  const nextId = idx >= 0 && idx < chapters.length - 1
    ? (chapters[idx + 1].id || chapters[idx + 1])
    : null;

  const goToChapter = (id) => {
    if (!id) return;
    navigate(`/read/${encodeURIComponent(id)}`, { state: { chapters } });
  };
  const bookId = chapterId.includes(".") ? chapterId.split(".")[0] : chapterId;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 ">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-[280px_1fr] items-start shadow-md">

          {/* NAV STICKY EN HAUT-GAUCHE */}
          <aside
            className="sticky top-4 self-start rounded-md bg-neutral-50 p-4 text-neutral-900 shadow-md"
            role="navigation"
            aria-label="Navigation du livre"
          >
            <div className="text-[11px] uppercase tracking-wide opacity-60 mb-2">Livre de</div>

            <div className="mb-4">
              <div className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium shadow-sm">
                {title}
              </div>
            </div>

{/* bouton accueil */}
  <button
    onClick={() => navigate("/")}
    className="w-full mb-3 inline-flex justify-center items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    🏠 Accueil
  </button>
            

            <button
              onClick={() => navigate(`/books/${bookId}/chapters`)}   // retour direct vers carrousel
              className="w-full mb-3 inline-flex justify-center items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ← Retour au carrousel
            </button>

            <nav aria-label="Chapitres voisinants" className="flex flex-col gap-2">
              <button
                onClick={() => goToChapter(prevId)}
                disabled={!prevId}
                className={`rounded px-2 py-1.5 text-xs shadow-sm border ${prevId
                  ? "bg-neutral-200 hover:bg-neutral-300 border-neutral-300"
                  : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                  }`}
              >
                Chapitre précédent
              </button>

              <button
                onClick={() => goToChapter(nextId)}
                disabled={!nextId}
                className={`rounded px-2 py-1.5 text-xs shadow-sm border ${nextId
                  ? "bg-neutral-200 hover:bg-neutral-300 border-neutral-300"
                  : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                  }`}
              >
                Chapitre suivant
              </button>
            </nav>
          </aside>

          {/* ==== LECTURE SCROLLABLE SEULEMENT ICI ==== */}
          <main
            className="
    relative rounded-md bg-[#F7F2E7] text-neutral-900 shadow-xl
    p-4 sm:p-6
    max-h-[85vh] overflow-y-auto overscroll-contain
  "
            role="main"
            aria-label="Texte biblique"
            tabIndex={0}           /* permet au clavier de focus le bloc et de scroller */
          >
            <h1 className="mb-4 text-lg font-bold tracking-wide text-center">{title}</h1>
            <div className="reader-html leading-relaxed">
              {loading ? "⏳ Chargement…" : err ? (
                <div className="text-red-700">{err}</div>
              ) : renderedHtml ? (
                <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              ) : (
                "(Aucun contenu trouvé)"
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
