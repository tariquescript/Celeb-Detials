import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./Scene.css";
import {
  ORB_VERTEX,
  ORB_FRAGMENT,
  POINTS_VERTEX,
  POINTS_FRAGMENT,
  RING_VERTEX,
  RING_FRAGMENT,
} from "./shaders";

/* --------------------------------------------------------------------------
   LUMINA hero scene.

   A hand-built three.js composition: a noise-displaced "liquid light" orb,
   a counter-rotating lattice shell, tilted energy rings, a spiral particle
   galaxy and a parallax starfield. Everything is procedural — no external
   models or textures — so the whole scene ships inside the JS bundle.

   The orb is typeset: it is placed and sized to fill an empty slot in the
   hero masthead (`anchorRef`), so it reads as the "O" in the word. The
   camera looks straight down -Z, so pixels on the z = 0 plane map linearly
   onto world units and the alignment holds at every viewport size.

   The scene reacts to the app: `energy` rises while a search is in flight,
   which widens the orb's displacement and speeds the galaxy up. Hovering
   the orb itself stirs it a little too.
   -------------------------------------------------------------------------- */

const FOV = 30;
const CAMERA_Z = 10;
// The slot already carries the typeface's overshoot, and the noise pushes
// the surface out by up to ~11%, so the resting sphere sits a touch inside it.
const ORB_FILL = 0.94;
const GALAXY_INNER = 2.25;
const GALAXY_OUTER = 6.35;
const INTRO_SECONDS = 1.9;

const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

const easeOutBack = (t) => {
  const c = 1.45;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

function buildGalaxy(count, tier) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const seeds = new Float32Array(count);

  const inner = new THREE.Color("#a78bfa");
  const mid = new THREE.Color("#22d3ee");
  const outer = new THREE.Color("#f5c26b");
  const arms = 4;
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Spiral arms: radius drives the angular offset, jitter breaks the seams.
    const radius = 2.25 + Math.pow(Math.random(), 0.7) * 4.1;
    const arm = (i % arms) / arms;
    const spin = radius * 0.85;
    const jitter = Math.pow(Math.random(), 2.4) * (Math.random() < 0.5 ? -1 : 1);
    const angle = arm * Math.PI * 2 + spin + jitter * 0.55;

    const thickness = 0.3 * (1 - (radius - 2.25) / 5.0) + 0.05;

    positions[i * 3] = Math.cos(angle) * radius + jitter * 0.35;
    positions[i * 3 + 1] = (Math.random() - 0.5) * thickness * 2.0;
    positions[i * 3 + 2] = Math.sin(angle) * radius + jitter * 0.35;

    const t = (radius - 2.25) / 4.1;
    tmp.copy(inner).lerp(mid, Math.min(t * 1.6, 1));
    if (t > 0.55) tmp.lerp(outer, (t - 0.55) / 0.45 * 0.7);

    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;

    scales[i] = 0.35 + Math.random() * (tier === "low" ? 1.1 : 1.5);
    seeds[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geo;
}

function buildStarfield(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const seeds = new Float32Array(count);

  const cold = new THREE.Color("#c7d2fe");
  const warm = new THREE.Color("#fde8c8");
  const tmp = new THREE.Color();
  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    // Uniform direction, biased radius — a shell rather than a solid ball.
    v.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    if (v.lengthSq() < 0.0001) v.set(0, 1, 0);
    v.normalize().multiplyScalar(7.5 + Math.random() * 11);

    // Only the far hemisphere: the camera sits inside the shell, and a star
    // drifting past the lens would balloon into a blob.
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y * 0.75;
    positions[i * 3 + 2] = -Math.abs(v.z) - 1.5;

    tmp.copy(cold).lerp(warm, Math.random() * Math.random());
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;

    scales[i] = 0.2 + Math.random() * 0.85;
    seeds[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geo;
}

function Scene({ energy = 0, anchorRef, onReady }) {
  const mountRef = useRef(null);
  const energyRef = useRef(energy);
  const readyRef = useRef(onReady);

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const announce = (ready) => {
      if (typeof readyRef.current === "function") readyRef.current(ready);
    };

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio < 1.75,
        powerPreference: "high-performance",
      });
    } catch (err) {
      // No WebGL (old browser, blocked context) — the CSS orb in the masthead
      // and the aurora behind the page carry the design.
      return undefined;
    }

    const tier = window.innerWidth < 820 ? "low" : "high";
    const maxDpr = tier === "low" ? 1.6 : 1.9;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04050c, 0.04);

    const camera = new THREE.PerspectiveCamera(
      FOV,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0, CAMERA_Z);
    camera.lookAt(0, 0, 0);

    // `world` is pinned to the masthead slot. `core` (orb, lattice, rings,
    // satellites) is scaled to the slot; `halo` (the galaxy) to the viewport,
    // so the disc frames the whole cover rather than shrinking with the type.
    const world = new THREE.Group();
    const core = new THREE.Group();
    const halo = new THREE.Group();
    world.add(halo);
    world.add(core);
    scene.add(world);

    const layout = {
      x: 0,
      y: 0,
      core: 1,
      halo: 1,
      // the orb's centre and radius in client pixels, for hover detection
      cx: -1e4,
      cy: -1e4,
      r: 0,
      // last measured anchor rect, so unchanged frames skip the maths
      key: "",
    };

    /* ------------------------------------------------------------- the orb */
    const orbUniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.115 },
      uFreq: { value: 2.1 },
      uRadius: { value: 1.0 },
      uPulse: { value: 0 },
      uIntensity: { value: 0.98 },
      uColorA: { value: new THREE.Color("#2a1d5e") },
      uColorB: { value: new THREE.Color("#0e2f52") },
      uColorC: { value: new THREE.Color("#7c5cff") },
      uColorRim: { value: new THREE.Color("#4fd8ff") },
    };

    const orbGeo = new THREE.IcosahedronGeometry(1.16, tier === "low" ? 4 : 5);
    const orbMat = new THREE.ShaderMaterial({
      uniforms: orbUniforms,
      vertexShader: ORB_VERTEX,
      fragmentShader: ORB_FRAGMENT,
      transparent: true,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.renderOrder = 1;
    core.add(orb);

    /* ----------------------------------------------------- lattice shell */
    const shellGeo = new THREE.IcosahedronGeometry(1.62, 2);
    const shellMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#6ee7ff"),
      wireframe: true,
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    core.add(shell);

    /* ---------------------------------------------------------- the rings */
    // Laid nearly flat, so from the front they read as orbits threading
    // behind the letters on either side of the orb.
    const ringDefs = [
      { r: 1.75, tube: 0.016, tilt: [1.3, 0.0, 0.1], opacity: 1, speed: 0.34 },
      { r: 2.35, tube: 0.012, tilt: [1.12, 0.22, -0.16], opacity: 0.78, speed: -0.26 },
      { r: 3.05, tube: 0.009, tilt: [1.42, -0.12, 0.26], opacity: 0.55, speed: 0.18 },
    ];

    const rings = ringDefs.map((def) => {
      const uniforms = {
        uTime: { value: 0 },
        uOpacity: { value: def.opacity },
        uColorA: { value: new THREE.Color("#8b5cf6") },
        uColorB: { value: new THREE.Color("#22d3ee") },
      };
      const geo = new THREE.TorusGeometry(
        def.r,
        def.tube,
        8,
        tier === "low" ? 140 : 260
      );
      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: RING_VERTEX,
        fragmentShader: RING_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 2;
      mesh.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
      core.add(mesh);
      return { mesh, uniforms, speed: def.speed, geo, mat };
    });

    /* -------------------------------------------------------- satellites */
    const satGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const satellites = [
      { color: "#f5c26b", ring: 0, speed: 0.52, phase: 0 },
      { color: "#22d3ee", ring: 1, speed: -0.4, phase: 2.1 },
      { color: "#ff5d8f", ring: 2, speed: 0.28, phase: 4.2 },
    ].map((def) => {
      const { r, tilt } = ringDefs[def.ring];
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(def.color),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(satGeo, mat);
      mesh.renderOrder = 2;
      const pivot = new THREE.Group();
      // Each satellite rides the plane of its matching ring.
      pivot.rotation.set(tilt[0], tilt[1], tilt[2]);
      pivot.add(mesh);
      core.add(pivot);
      return { mesh, mat, pivot, radius: r, ...def };
    });

    /* ------------------------------------------------------- point clouds */
    const galaxyCount = tier === "low" ? 3200 : 8000;
    const starCount = tier === "low" ? 1100 : 2600;

    const galaxyUniforms = {
      uTime: { value: 0 },
      uSize: { value: tier === "low" ? 0.024 : 0.02 },
      uScale: { value: 800 },
      uOpacity: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
    };
    const galaxyGeo = buildGalaxy(galaxyCount, tier);
    const galaxyMat = new THREE.ShaderMaterial({
      uniforms: galaxyUniforms,
      vertexShader: POINTS_VERTEX,
      fragmentShader: POINTS_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    galaxy.rotation.x = 0.42;
    halo.add(galaxy);

    const starUniforms = {
      uTime: { value: 0 },
      uSize: { value: tier === "low" ? 0.04 : 0.034 },
      uScale: { value: 800 },
      uOpacity: { value: 0.5 },
      uPointer: { value: new THREE.Vector2() },
    };
    const starGeo = buildStarfield(starCount);
    const starMat = new THREE.ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: POINTS_VERTEX,
      fragmentShader: POINTS_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* ------------------------------------------------------- interaction */
    const pointer = { x: 0, y: 0, px: -1e4, py: -1e4 };
    const smoothed = { x: 0, y: 0 };
    let scrollNorm = 0;
    let energySmooth = 0;
    let hoverSmooth = 0;
    let stillReady = false;

    const onPointerMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointer.x = (e.clientX / w) * 2 - 1;
      pointer.y = (e.clientY / h) * 2 - 1;
      pointer.px = e.clientX;
      pointer.py = e.clientY;
    };

    const onScroll = () => {
      const h = mount.clientHeight || window.innerHeight || 1;
      scrollNorm = Math.min(Math.max(window.scrollY / h, 0), 1);
    };

    // Pin the composition to the masthead slot. The canvas scrolls with the
    // hero, so the offset between the two rects never changes with scroll —
    // only with layout — and the orb cannot drift out of its letter.
    const measureAnchor = () => {
      const w = mount.clientWidth;
      const h = Math.max(mount.clientHeight, 1);
      const m = mount.getBoundingClientRect();
      const anchor = anchorRef && anchorRef.current;

      let cx = w / 2;
      let cy = h * 0.42;
      let radius = Math.min(w, h) * 0.12;

      if (anchor) {
        const a = anchor.getBoundingClientRect();
        if (a.width > 0 && a.height > 0) {
          cx = a.left - m.left + a.width / 2;
          cy = a.top - m.top + a.height / 2;
          radius = Math.min(a.width, a.height) / 2;
        }
      }

      layout.cx = m.left + cx;
      layout.cy = m.top + cy;
      layout.r = radius;

      const key = `${w}|${h}|${cx.toFixed(1)}|${cy.toFixed(1)}|${radius.toFixed(1)}`;
      if (key === layout.key) return false;
      layout.key = key;

      // World units per CSS pixel on the z = 0 plane.
      const k = (2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h;
      layout.x = (cx - w / 2) * k;
      layout.y = (h / 2 - cy) * k;
      layout.core = radius * k * ORB_FILL;
      // The disc should frame the cover, but its inner edge must always clear
      // the outermost ring.
      const fromViewport = (Math.max(w * 0.48, h * 0.62) * k) / GALAXY_OUTER;
      const clearRings = (layout.core * ringDefs[2].r * 1.18) / GALAXY_INNER;
      layout.halo = Math.max(fromViewport, clearRings);
      return true;
    };

    const frame = () => {
      const w = mount.clientWidth;
      const h = Math.max(mount.clientHeight, 1);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Points are sized in world units; convert to pixels with the same
      // perspective term the projection matrix uses.
      const pxPerUnit = h / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
      galaxyUniforms.uScale.value = pxPerUnit;
      starUniforms.uScale.value = pxPerUnit;

      layout.key = "";
      onScroll();

      // Resizing clears the drawing buffer; without a running loop the still
      // frame has to be redrawn by hand.
      if (reduceMotion && stillReady) renderStill();
    };

    /* ------------------------------------------------------------- render */
    const clock = new THREE.Clock();
    let frameId = null;

    const renderFrame = (dt, elapsed) => {
      measureAnchor();

      const intro = reduceMotion ? 1 : Math.min(elapsed / INTRO_SECONDS, 1);
      const pop = easeOutBack(intro);

      // Stir the orb while the pointer is over it.
      const dx = pointer.px - layout.cx;
      const dy = pointer.py - layout.cy;
      const over = Math.sqrt(dx * dx + dy * dy) < layout.r * 1.35 ? 0.55 : 0;
      hoverSmooth = damp(hoverSmooth, over, 4, dt);

      const e = Math.max(energyRef.current, hoverSmooth);
      energySmooth = damp(energySmooth, e, 3.2, dt);

      const t = elapsed * (1 + energySmooth * 0.55);

      orbUniforms.uTime.value = t;
      orbUniforms.uAmp.value = 0.115 + energySmooth * 0.1;
      orbUniforms.uPulse.value = Math.sin(elapsed * 2.4) * energySmooth;
      orbUniforms.uIntensity.value = 0.98 + energySmooth * 0.34;

      orb.rotation.y = elapsed * 0.09;
      orb.rotation.x = Math.sin(elapsed * 0.16) * 0.12;

      shell.rotation.y = -elapsed * 0.06;
      shell.rotation.z = elapsed * 0.035;
      shellMat.opacity = (0.04 + energySmooth * 0.07) * intro;

      // Scrolling away loosens the system: rings drift outward as the cover
      // leaves the screen.
      const spread = 1 + scrollNorm * 0.35;

      rings.forEach((ring, i) => {
        ring.uniforms.uTime.value = t;
        ring.mesh.rotation.z += dt * ring.speed * (0.4 + energySmooth * 0.9);
        ring.mesh.scale.setScalar(spread);
        ring.uniforms.uOpacity.value =
          ringDefs[i].opacity * (1.05 + energySmooth * 0.55) * intro;
      });

      satellites.forEach((sat) => {
        const a = sat.phase + elapsed * sat.speed * (1 + energySmooth);
        const r = sat.radius * spread;
        sat.mesh.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
        sat.mat.opacity = (0.7 + Math.sin(elapsed * 3 + sat.phase) * 0.25) * intro;
      });

      galaxyUniforms.uTime.value = t;
      galaxyUniforms.uOpacity.value = (0.5 + energySmooth * 0.28) * intro;
      galaxy.rotation.y = elapsed * 0.045 * (1 + energySmooth * 1.2);
      galaxy.rotation.x = 0.42 + scrollNorm * 0.3;

      starUniforms.uTime.value = elapsed;
      stars.rotation.y = elapsed * 0.012;
      stars.rotation.x = Math.sin(elapsed * 0.05) * 0.04;

      // Pointer parallax, critically damped so it glides instead of snapping.
      // The world turns about the orb's own centre, so the orb never leaves
      // its slot — only the orbits and the disc swing around it.
      smoothed.x = damp(smoothed.x, pointer.x, 2.6, dt);
      smoothed.y = damp(smoothed.y, pointer.y, 2.6, dt);

      world.position.set(layout.x, layout.y, 0);
      world.rotation.y = smoothed.x * 0.26;
      world.rotation.x = smoothed.y * 0.16;
      core.scale.setScalar(layout.core * pop);
      halo.scale.setScalar(layout.halo * (0.86 + 0.14 * intro));
      stars.rotation.z = smoothed.x * 0.04;

      renderer.render(scene, camera);
    };

    let contextLost = false;
    let visible = true;

    const loop = () => {
      frameId = window.requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      renderFrame(dt, clock.elapsedTime);
    };

    // One composed still frame: the design holds up without motion.
    const renderStill = () => renderFrame(0.016, 2.4);

    const setRunning = (run) => {
      if (reduceMotion) return;
      if (run && frameId === null && !contextLost) {
        clock.getDelta(); // swallow the time spent paused
        frameId = window.requestAnimationFrame(loop);
      } else if (!run && frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const sync = () => setRunning(visible && !document.hidden);

    frame();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(frame) : null;
    if (resizeObserver) resizeObserver.observe(mount);

    // A still frame has no loop to notice the masthead moving (late web fonts,
    // a reflowed hint line), so watch the type directly.
    const anchorObserver =
      reduceMotion && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => stillReady && renderStill())
        : null;
    const anchorEl = anchorRef && anchorRef.current;
    if (anchorObserver && anchorEl && anchorEl.parentElement) {
      anchorObserver.observe(anchorEl.parentElement);
    }
    if (reduceMotion && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => stillReady && renderStill());
    }

    window.addEventListener("resize", frame);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    stillReady = true;
    if (reduceMotion) renderStill();
    else sync();
    announce(true);

    // The canvas lives in the hero now, so it can rest whenever the hero is
    // scrolled out of view, not only when the tab is hidden.
    const intersection =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
              sync();
            },
            { rootMargin: "80px 0px" }
          )
        : null;
    if (intersection) intersection.observe(mount);

    document.addEventListener("visibilitychange", sync);

    const onContextLost = (e) => {
      e.preventDefault(); // allows the browser to hand the context back
      contextLost = true;
      setRunning(false);
      announce(false);
    };
    const onContextRestored = () => {
      contextLost = false;
      layout.key = "";
      if (reduceMotion) renderStill();
      else sync();
      announce(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    /* ------------------------------------------------------------ cleanup */
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", sync);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      if (resizeObserver) resizeObserver.disconnect();
      if (anchorObserver) anchorObserver.disconnect();
      if (intersection) intersection.disconnect();

      orbGeo.dispose();
      orbMat.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      satGeo.dispose();
      satellites.forEach((s) => s.mat.dispose());
      rings.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });
      galaxyGeo.dispose();
      galaxyMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [anchorRef]);

  return <div className="scene" ref={mountRef} aria-hidden="true" />;
}

export default Scene;
