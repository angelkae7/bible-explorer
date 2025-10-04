import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const HolyBible = forwardRef(function HolyBible(
  {
    url = "/models/holy-bible.glb",
    onPointerOver,
    onPointerOut,
    onClick,
    idleName = "iddle",          // <-- nom exact de l'idle
    openName = "OppeningBook",   // <-- nom exact de l'ouverture
    ...props
  },
  ref
) {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions, names, mixer, clips } = useAnimations(animations, group);

  // petite flottabilité/rotation douce
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!group.current) return;
    group.current.position.y = Math.sin(t) * 0.08;
    group.current.rotation.y += 0.0005;
  });

  // utilitaires d'animation
  const playOnce = (name) => {
    const act = actions?.[name];
    if (!act) return null;
    act.reset();
    act.clampWhenFinished = true;
    act.setLoop(THREE.LoopOnce, 1);
    act.enabled = true;
    act.fadeIn(0.15).play();
    return act;
  };

  const playLoop = (name) => {
    const act = actions?.[name];
    if (!act) return null;
    act.reset();
    act.clampWhenFinished = false;
    act.setLoop(THREE.LoopRepeat, Infinity);
    act.enabled = true;
    act.fadeIn(0.15).play();
    return act;
  };

  const stop = (name) => {
    const act = actions?.[name];
    if (!act) return;
    act.fadeOut(0.15);
    setTimeout(() => act.stop(), 180);
  };

  // Expose .open() pour l'extérieur (LandingPage)
  useImperativeHandle(ref, () => ({
    open: () =>
      new Promise((resolve) => {
        // coupe l'idle si elle tourne
        if (actions?.[idleName]?.isRunning()) stop(idleName);

        const act = playOnce(openName);
        if (!act) return resolve(); // pas d'anim -> resolve tout de suite

        // durée du clip + filet de sécu
        const clip =
          clips?.find((c) => c.name === act.getClip?.().name) ||
          act.getClip?.() ||
          clips?.find((c) => c.name === openName);
        const ms = Math.max(100, Math.round((clip?.duration ?? 1) * 1000));

        const onFin = (e) => {
          // s’assure que c’est bien notre clip
          if (!e?.action || e.action !== act) return;
          mixer?.removeEventListener?.("finished", onFin);
          resolve();
        };
        mixer?.addEventListener?.("finished", onFin);
        setTimeout(() => {
          mixer?.removeEventListener?.("finished", onFin);
          resolve();
        }, ms + 80);
      }),
  }));

  // debug (optionnel) : voir les noms disponibles
  useEffect(() => {
    // console.log("Clips:", names);
  }, [names]);

  return (
    <group
      ref={group}
      {...props}
      onPointerOver={(e) => {
        playLoop(idleName);
        onPointerOver?.(e);
      }}
      onPointerOut={(e) => {
        stop(idleName);
        onPointerOut?.(e);
      }}
      onClick={onClick}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  );
});

export default HolyBible;

// préchargement
useGLTF.preload("/models/holy-bible.glb");
