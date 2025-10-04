import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Html,
  Environment,
  ContactShadows,
  PresentationControls,
} from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import HolyBible from "../components/HolyBible";

export default function LandingPage() {
  const navigate = useNavigate();
  const bibleRef = useRef();
  const [hover, setHover] = useState(false);

  // curseur main au survol
  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "";
    return () => (document.body.style.cursor = "");
  }, [hover]);

  const openThenGo = useCallback(async () => {
    try {
      await bibleRef.current?.open?.();          // animation "OppeningBook"
      await new Promise((r) => setTimeout(r, 140));
    } finally {
      navigate("/books");
    }
  }, [navigate]);

  // juste après openThenGo
useEffect(() => {
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openThenGo();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [openThenGo]);


  // accessibilité clavier (Entrée / Espace)
  const onKey = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openThenGo();
      }
    },
    [openThenGo]
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "100dvh",
        /* fond chaleureux, discret */
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(1200px 600px at 120% 110%, rgba(173,216,230,0.08), transparent 60%), #1c1e20",
      }}
    >
      {/* Décor : grille très légère */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(800px 800px at 40% 20%, black, transparent 70%)",
        }}
      />

      {/* Carte de bienvenue */}
      <section className="absolute left-6 top-6 z-20 max-w-[500px] rounded-2xl bg-white/80 p-5 backdrop-blur md:left-10 md:top-10">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Bible Explorer
        </h1>
        <p className="text-sm leading-relaxed text-gray-700">
          Clique sur la Bible pour l’ouvrir et entrer dans la sphère des livres.
          Parcours les chapitres, lis les passages, découvre les liens.
        </p>

        <div className="mt-4 flex items-center gap-3 text-xs text-gray-600">
          <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-1 font-medium text-emerald-700">
            Astuce
          </span>
          <span>Tu peux aussi appuyer sur <kbd className="rounded bg-gray-200 px-1">Entrée</kbd>.</span>
        </div>
      </section>

      {/* Bouton d’accès direct (si l’utilisateur n’aime pas la 3D) */}
      <button
        onClick={() => navigate("/books")}
        className="absolute right-6 top-6 z-20 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-800 backdrop-blur transition hover:bg-white/90 md:right-10 md:top-10"
      >
        Aller directement aux livres
      </button>

      <Canvas
        shadows
        camera={{ position: [0, 2, 6], fov: 50  }}
        onPointerMissed={() => setHover(false)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 6, 3]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Suspense
          fallback={
            <Html center>
              <div className="rounded bg-white/90 px-3 py-2 text-sm shadow">
                Chargement…
              </div>
            </Html>
          }
        >
          <Environment preset="studio" />

          {/* Contrôle “présentation” : un tout petit tilt au drag */}
          <PresentationControls
            global
            polar={[-0.2, 0.2]}
            azimuth={[-0.3, 0.3]}
            speed={0.8}
            snap
          >
            {/* Zone focusable pour clavier */}
            <group
              tabIndex={0}
              role="button"
              // aria-label="Ouvrir la Bible"
              onKeyDown={onKey}
            >
              <HolyBible
                ref={bibleRef}
                url="/models/holy-bible.glb"
                position={[0, 0, 0]}
                rotation={[1, 0, .1]}
                scale={7}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                onClick={openThenGo}
                idleName="iddle"
                openName="OppeningBook"
              />

              {/* Petit hint qui flotte au-dessus */}
              <Html position={[2, 1, 2]} center distanceFactor={8}>
                <div
                  className={`select-none rounded-md px-5 py-1 text-xs font-small transition ${
                    hover ? "bg-emerald-500 text-white" : "bg-white/80 text-gray-800"
                  }`}
                >
                  {hover ? "Cliquer pour ouvrir" : "Survole puis clique"}
                </div>
              </Html>
            </group>
          </PresentationControls>

          {/* Ombre douce au sol = effet “posé” */}
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.5}
            scale={14}
            blur={2.5}
            far={6}
          />
        </Suspense>
      </Canvas>

      {/* Lueur douce au survol */}
      <div
        className={`pointer-events-none absolute inset-5 transition opacity-0 ${
          hover ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(500px 140px at 50% 60%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />
    </div>
  );
}
