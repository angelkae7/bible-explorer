import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

export default function Book3D({
  book,
  position = [0, 0, 0],
  onPick,
  color = "#d9cfb3",
  pagesColor = "#ece7dc",
  hoverScale = 1.03,
  glowIntensity = 0.18,
  idleFloat = true,
  label,
  ...props
}) {
  const groupRef = useRef();
  const coverMatRef = useRef();
  const pagesMatRef = useRef();

  const [hovered, setHovered] = useState(false);
  const labelText = (label || book?.abbreviation || book?.name || "BOOK").toUpperCase();

  // Texture simple pour le titre (canvas 2D)
  const coverMap = useMemo(() => makeCoverTexture(labelText), [labelText]);

  // Dimensions (m)
  const W = 0.52, H = 0.74, T = 0.18; // largeur, hauteur, épaisseur totales
  const P = T * 0.76;                  // épaisseur du paquet de pages
  const R = 0.035;                     // arrondi

  useFrame((state, dt) => {
    // Flottement doux
    if (idleFloat && groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 0.7) * 0.01;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.02;
      groupRef.current.rotation.z = Math.sin(t * 0.33) * 0.015;
    }

    // Lissage scale + glow
    if (groupRef.current) {
      const target = hovered ? hoverScale : 1;
      const s = THREE.MathUtils.damp(groupRef.current.scale.x, target, 8, dt);
      groupRef.current.scale.set(s, s, s);
    }
    if (coverMatRef.current) {
      const targetGlow = hovered ? glowIntensity : 0;
      coverMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        coverMatRef.current.emissiveIntensity || 0,
        targetGlow,
        8,
        dt
      );
    }
  });

  const handleClick = () => onPick?.(book);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={(e) => (e.stopPropagation(), setHovered(false))}
      onClick={(e) => (e.stopPropagation(), handleClick())}
      {...props}
    >
      {/* Couverture */}
      <RoundedBox args={[W, H, T]} radius={R} smoothness={6}>
        <meshStandardMaterial
          ref={coverMatRef}
          color={color}
          roughness={0.52}
          metalness={0.04}
          emissive="#ffd8a6"
          emissiveIntensity={0}
          map={coverMap}
        />
      </RoundedBox>

      {/* Paquet de pages */}
      <RoundedBox
        args={[W * 0.96, H * 0.96, P]}
        radius={R * 0.7}
        smoothness={4}
        position={[0, 0, -0.01]}
      >
        <meshStandardMaterial
          ref={pagesMatRef}
          color={pagesColor}
          roughness={0.8}
          metalness={0.02}
        />
      </RoundedBox>

      {/* Biseau d’ombre pour le volume */}
      <mesh position={[0, -H * 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.98, T * 0.9]} />
        <meshBasicMaterial color="black" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

/* ===== utils ===== */
function makeCoverTexture(text = "BOOK") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // fond
  ctx.fillStyle = "#e6dcc0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // bande diagonale subtile
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "rgba(255,255,255,0.10)");
  grad.addColorStop(1, "rgba(0,0,0,0.05)");
  ctx.fillStyle = grad;
  ctx.save();
  ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.fillRect(-canvas.width, -120, canvas.width * 2, 240);
  ctx.restore();

  // Titre
  ctx.fillStyle = "#2b2a28";
  ctx.font = "bold 110px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "left";
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 12;
  ctx.fillText(text, canvas.width / 6, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
