import React, {
  useEffect, useMemo, useRef, useState, createContext, useContext
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";



// =============================
// API Provider + Hook
// =============================
const ApiContext = createContext(null);
const API_BASE = "https://api.scripture.api.bible/v1";

// ⚠️ Fallbacks par défaut (pour éviter de retaper la clé à chaque port)
const DEFAULT_KEY = import.meta?.env?.VITE_BIBLE_API_KEY || "50b1936583c8445adbcaf56bbe122c3d";
const DEFAULT_BIBLE_ID = import.meta?.env?.VITE_BIBLE_ID || "a93a92589195411f-01";

export function ApiProvider({ children }) {
  const [apiKey, setApiKey] = useState(() =>
    (localStorage.getItem("BIBLE_API_KEY") || DEFAULT_KEY).trim()
  );
  const [bibleId, setBibleId] = useState(() =>
    (localStorage.getItem("BIBLE_ID") || DEFAULT_BIBLE_ID).trim()
  );

  const headers = useMemo(() => ({ "api-key": apiKey }), [apiKey]);

  const api = useMemo(() => ({
    apiKey,
    setApiKey: (k) => {
      k = (k || "").trim();
      setApiKey(k);
      localStorage.setItem("BIBLE_API_KEY", k);
    },
    bibleId,
    setBibleId: (id) => {
      id = (id || "").trim();
      setBibleId(id);
      localStorage.setItem("BIBLE_ID", id);
    },

    async listBibles(lang = "fra") {
      const r = await fetch(`${API_BASE}/bibles?language=${encodeURIComponent(lang)}`, { headers });
      if (!r.ok) throw new Error(`Bibles: ${r.status}`);
      return (await r.json()).data;
    },

    async listBooks() {
      const r = await fetch(`${API_BASE}/bibles/${bibleId}/books`, { headers });
      if (!r.ok) throw new Error(`Livres: ${r.status}`);
      return (await r.json()).data;
    },

    async bookChapters(bookId) {
      const r = await fetch(`${API_BASE}/bibles/${bibleId}/books/${bookId}/chapters`, { headers });
      if (!r.ok) throw new Error(`Chapitres: ${r.status}`);
      return (await r.json()).data;
    },

    // Lecteur robuste: chapters (HTML minimal) → passages (id) → passages (range exact via /verses)
    async readChapter(chapter) {
      const ch = typeof chapter === "string" ? { id: chapter } : chapter;

      // 1) /chapters en HTML minimal
      try {
        const u1 = `${API_BASE}/bibles/${bibleId}/chapters/${encodeURIComponent(ch.id)}?contentType=html`;
        const r1 = await fetch(u1, { headers });
        if (r1.ok) return (await r1.json()).data;
      } catch {}

      // 2) /passages (id brut) sans query params
      try {
        const u2 = `${API_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(ch.id)}`;
        const r2 = await fetch(u2, { headers });
        if (r2.ok) return (await r2.json()).data;
      } catch {}

      // 3) /verses → range exact → /passages(range)
      const uv = `${API_BASE}/bibles/${bibleId}/chapters/${encodeURIComponent(ch.id)}/verses`;
      const rv = await fetch(uv, { headers });
      if (!rv.ok) throw new Error(`Verses: ${rv.status}`);
      const verses = (await rv.json()).data || [];
      if (!verses.length) throw new Error("Aucun verset trouvé pour ce chapitre");

      const firstId = verses[0].id;
      const lastId = verses[verses.length - 1].id;
      const rangeId = `${firstId}-${lastId}`;

      const u3 = `${API_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(rangeId)}`;
      const r3 = await fetch(u3, { headers });
      if (!r3.ok) throw new Error(`Lecture: ${r3.status} ${await r3.text()}`);
      return (await r3.json()).data;
    },
  }), [apiKey, bibleId, headers]);

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within <ApiProvider>");
  return ctx;
}

// =============================
// 3D Components réutilisables
// =============================

// Sphère de livres : Fibonacci + rayon réglable
export function BooksSphere({ books = [], onPick, radius = 3 }) {
  const group = useRef();
  const prefersReducedMotion = usePrefersReducedMotion();

  const positions = React.useMemo(() => {
    const N = Math.max(books.length, 1);
    const phi = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / Math.max(1, N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      pts.push([x * radius, y * radius, z * radius]);
    }
    return pts;
  }, [books.length, radius]);

  // interaction souris = rotation douce
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (!prefersReducedMotion) {
      group.current.rotation.y += dt * 0.15 + mouse.current.x * dt * 0.6;
      group.current.rotation.x = mouse.current.y * 0.25;
    }
  });

return (
  <group ref={group}>
    {books.map((b, i) => (
      <Book3D
        key={b.id}
        position={positions[i]}
        book={b}
        onPick={() => onPick?.(b)}
      />
    ))}
  </group>
);
}



// ⬇️ Remplace l’usage de <BookDot .../> par <Book3D .../> dans BooksSphere
// <Book3D key={b.id} position={positions[i]} book={b} onPick={() => onPick?.(b)} />

function Book3D({ position, book, onPick }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [label, setLabel] = useState("");

  const groupRef = useRef();
  const coverMatRef = useRef();
  const spineMatRef = useRef();
  const pagesMatRef = useRef();
  const textRef = useRef();        // <- pour désactiver le raycast du Text
  const hoverAmt = useRef(0);

  // Dimensions
  const W = 0.52, H = 0.74, T = 0.18, COVER_T = 0.012, SPINE_W = 0.055, R = 0.03;

  // Couleurs
  const coverBase = "#7a552b";
  const spineBase = "#654322";
  const pagesColor = "#ece7dc";
  const glow = new THREE.Color("#ffd8a6");

  // Textures
  const coverTexture = useMemo(() => makeCoverTexture(book), [book]);
  coverTexture.anisotropy = 8;
  const pagesTexture = useMemo(() => makePagesTexture(), []);

  // Désactiver la "sélection" du Text pour qu'il ne vole pas le hover
  useEffect(() => {
    if (textRef.current) {
      // R3F: neutralise le pick/raycast de ce mesh Text
      textRef.current.raycast = () => null;
    }
  }, []);

  // Animation douce (scale + glow)
  useFrame((_, dt) => {
    const target = hovered || focused ? 1 : 0;
    hoverAmt.current = THREE.MathUtils.damp(hoverAmt.current, target, 6, dt);

    // scale
    if (groupRef.current) {
      const s = 1 + 0.12 * hoverAmt.current;
      groupRef.current.scale.set(s, s, s);
    }

    // émission
    const e = 0.65 * hoverAmt.current;
    if (coverMatRef.current) {
      coverMatRef.current.emissive.copy(glow);
      coverMatRef.current.emissiveIntensity = e;
    }
    if (spineMatRef.current) {
      spineMatRef.current.emissive.copy(glow);
      spineMatRef.current.emissiveIntensity = e * 0.6;
    }
    if (pagesMatRef.current) {
      pagesMatRef.current.emissive.set("#ffffff");
      pagesMatRef.current.emissiveIntensity = e * 0.15;
    }
  });

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick?.(book);
    }
  };

  return (
    <group ref={groupRef} position={position} castShadow receiveShadow>
      {/* Accessibilité clavier (inchangé) */}
      <HtmlTabCatcher
        ariaLabel={`Ouvrir le livre ${book.name}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKey}
        onActivate={() => onPick?.(book)}
      />

      {/* --- HITBOX INVISIBLE QUI PORTE TOUS LES EVENTS --- */}
      <mesh
        // légèrement plus grand que le livre pour ne jamais "perdre" le hover
        position={[0, 0, 0]}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); }}
        onPointerCancel={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onPick?.(book); }}
      >
        <boxGeometry args={[W + 0.06, H + 0.06, T + COVER_T * 2 + 0.04]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Bloc pages */}
      <RoundedBox args={[W - COVER_T * 2, H - COVER_T * 2, T]} radius={R} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial
          ref={pagesMatRef}
          color={pagesColor}
          map={pagesTexture}
          roughness={0.85}
        />
      </RoundedBox>

      {/* Couverture avant */}
      <group position={[0, 0, T / 2 + COVER_T / 2 + 0.0005]}>
        <RoundedBox args={[W, H, COVER_T]} radius={R} smoothness={4} castShadow>
          <meshPhysicalMaterial
            ref={coverMatRef}
            color={coverBase}
            map={coverTexture}
            roughness={0.5}
            metalness={0.0}
            clearcoat={0.6}
            clearcoatRoughness={0.35}
            sheen={1}
            sheenRoughness={0.7}
            emissiveIntensity={0}
          />
        </RoundedBox>

        {/* Titre face (raycast désactivé) */}
        <Text
          ref={textRef}
          position={[0, 0, COVER_T / 2 + 0.001]}
          fontSize={0.075}
          maxWidth={W * 0.85}
          color="#f1eadf"
          anchorX="center"
          anchorY="middle"
        >
          {book.name}
        </Text>
      </group>

      {/* Dos */}
      <group position={[-W / 2 + SPINE_W / 2, 0, 0]}>
        <RoundedBox args={[SPINE_W, H, T + COVER_T * 2]} radius={R * 0.8} smoothness={4} castShadow>
          <meshPhysicalMaterial
            ref={spineMatRef}
            color={spineBase}
            roughness={0.55}
            clearcoat={0.5}
            clearcoatRoughness={0.35}
            emissiveIntensity={0}
          />
        </RoundedBox>
      </group>

      {/* Tranches latérales */}
      <mesh position={[ W / 2 - 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[T, H - COVER_T * 2]} />
        <meshStandardMaterial color={pagesColor} map={pagesTexture} />
      </mesh>
      <mesh position={[-W / 2 + SPINE_W + 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[T, H - COVER_T * 2]} />
        <meshStandardMaterial color={pagesColor} map={pagesTexture} />
      </mesh>
    </group>
  );
}


// CanvasTexture pour la couverture (grain + titre léger en fond)
function makeCoverTexture(book) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const g = c.getContext("2d");

  // fond cuir “bruité”
  const grd = g.createLinearGradient(0, 0, 512, 512);
  grd.addColorStop(0, "#6e4f29");
  grd.addColorStop(1, "#7a552b");
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);

  // léger bruit
  for (let i = 0; i < 9000; i++) {
    const a = Math.random() * 0.06 + 0.04;
    g.fillStyle = `rgba(0,0,0,${a})`;
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.fillRect(x, y, 1, 1);
  }

  // grand titre en watermark
  g.font = "700 44px system-ui, Segoe UI, Roboto";
  g.fillStyle = "rgba(255,255,255,.08)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.translate(256, 256);
  g.rotate(-Math.PI / 12);
  const txt = (book?.abbreviation || book?.name || "").toUpperCase();
  g.fillText(txt, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// CanvasTexture “pages” (lignes fines gris très clair)
function makePagesTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#f2eee6";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(0,0,0,.06)";
  g.lineWidth = 1;
  for (let y = 4; y < 256; y += 4) {
    g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(256, y + 0.5); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}


// Small invisible DOM element anchored to 3D to catch focus/tab/keypress
function HtmlTabCatcher({ ariaLabel, onKeyDown, onFocus, onBlur, onActivate }) {
  return (
    <Html transform sprite zIndexRange={[10, 0]}>
      <button
        aria-label={ariaLabel}
        title={ariaLabel}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={(e) => {
          e.preventDefault();
          onActivate?.();
        }}
        style={{
          width: 1,
          height: 1,
          opacity: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
        tabIndex={0}
      />
    </Html>
  );
}

// BasicCanvas – remplace par ceci
export function BasicCanvas({ children }) {
  return (
    <Canvas
      shadows                // ⬅️ ombres ON
      dpr={[1, 2]}
      camera={{ position: [0, 1.2, 4.2], fov: 50 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0b0f14"]} />
      <fog attach="fog" args={["#0b0f14", 8, 14]} />

      {/* lumières avec ombres douces */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={4}
      />
      {/* sol invisible recevant l'ombre, adoucit le rendu */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <shadowMaterial transparent opacity={0.18} />
      </mesh>

      {children}
    </Canvas>
  );
}



function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return reduced;
}




