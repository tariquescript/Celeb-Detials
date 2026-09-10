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

   The scene reacts to the app: `energy` rises while a search is in flight,
   which widens the orb's displacement and speeds the galaxy up.
   -------------------------------------------------------------------------- */

const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

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

    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y * 0.75;
    positions[i * 3 + 2] = v.z;

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

function Scene({ energy = 0 }) {
  const mountRef = useRef(null);
  const energyRef = useRef(energy);

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

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
      // No WebGL (old browser, blocked context) — the CSS aurora carries the page.
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
    scene.fog = new THREE.FogExp2(0x04050c, 0.055);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0.55, 8.4);

    const world = new THREE.Group();
    // Where the composition sits is decided per-breakpoint in frame(): on wide
    // screens it takes the right half of the stage beside the copy; on narrow
    // ones it centres and drops behind the hero.
    const layout = { baseX: 0, baseY: -0.95 };
    scene.add(world);

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
    world.add(orb);

    /* ----------------------------------------------------- lattice shell */
    const shellGeo = new THREE.IcosahedronGeometry(1.86, 2);
    const shellMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#6ee7ff"),
      wireframe: true,
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    world.add(shell);

    /* ---------------------------------------------------------- the rings */
    const ringDefs = [
      { r: 2.05, tube: 0.017, tilt: [1.18, 0.0, 0.22], opacity: 1, speed: 0.34 },
      { r: 2.5, tube: 0.013, tilt: [0.46, 0.55, -0.3], opacity: 0.8, speed: -0.26 },
      { r: 3.15, tube: 0.01, tilt: [-0.35, -0.4, 0.75], opacity: 0.6, speed: 0.18 },
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
      mesh.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
      world.add(mesh);
      return { mesh, uniforms, speed: def.speed, geo, mat };
    });

    /* -------------------------------------------------------- satellites */
    const satGeo = new THREE.SphereGeometry(0.052, 16, 16);
    const satellites = [
      { color: "#f5c26b", radius: 2.05, tilt: [1.18, 0.0, 0.22], speed: 0.52, phase: 0 },
      { color: "#22d3ee", radius: 2.5, tilt: [0.46, 0.55, -0.3], speed: -0.4, phase: 2.1 },
      { color: "#ff5d8f", radius: 3.15, tilt: [-0.35, -0.4, 0.75], speed: 0.28, phase: 4.2 },
    ].map((def) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(def.color),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(satGeo, mat);
      const pivot = new THREE.Group();
      // Each satellite rides the plane of its matching ring.
      pivot.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
      pivot.add(mesh);
      world.add(pivot);
      return { mesh, mat, pivot, ...def };
    });

    /* ------------------------------------------------------- point clouds */
    const galaxyCount = tier === "low" ? 3200 : 8000;
    const starCount = tier === "low" ? 1100 : 2600;

    const galaxyUniforms = {
      uTime: { value: 0 },
      uSize: { value: tier === "low" ? 0.03 : 0.026 },
      uScale: { value: 800 },
      uOpacity: { value: 0.62 },
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
    galaxy.rotation.x = 0.5;
    world.add(galaxy);

    const starUniforms = {
      uTime: { value: 0 },
      uSize: { value: tier === "low" ? 0.05 : 0.042 },
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
    const pointer = { x: 0, y: 0 };
    const smoothed = { x: 0, y: 0 };
    let scrollNorm = 0;
    let energySmooth = 0;
    let stillReady = false;

    const onPointerMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointer.x = (e.clientX / w) * 2 - 1;
      pointer.y = (e.clientY / h) * 2 - 1;
    };

    const onScroll = () => {
      const h = window.innerHeight || 1;
      scrollNorm = Math.min(window.scrollY / h, 1.4);
    };

    // Framing: on narrow screens pull the camera back and lift the composition
    // so the orb never collides with the headline or the search field.
    const frame = () => {
      const w = mount.clientWidth;
      const h = Math.max(mount.clientHeight, 1);
      const aspect = w / h;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(w, h, false);
      camera.aspect = aspect;

      const portrait = aspect < 1;
      const wide = w >= 1080 && aspect >= 1.15;

      camera.fov = portrait ? 58 : 44;
      camera.position.z = portrait ? 9.8 : THREE.MathUtils.clamp(10 - aspect * 1.1, 7.8, 9.6);
      camera.position.y = portrait ? -0.1 : 0.1;
      camera.updateProjectionMatrix();

      // Beside the copy on wide screens, centred and low on everything else.
      layout.baseX = wide ? 2.55 : 0;
      layout.baseY = wide ? -0.15 : -0.95;
      world.position.x = layout.baseX;
      world.scale.setScalar(portrait ? 0.72 : wide ? 1 : 0.86);

      // Points are sized in world units; convert to pixels with the same
      // perspective term the projection matrix uses.
      const pxPerUnit = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      galaxyUniforms.uScale.value = pxPerUnit;
      starUniforms.uScale.value = pxPerUnit;

      // Resizing clears the drawing buffer; without a running loop the still
      // frame has to be redrawn by hand.
      if (reduceMotion && stillReady) renderFrame(0.016, 2.4);
    };

    frame();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(frame) : null;
    if (resizeObserver) resizeObserver.observe(mount);
    window.addEventListener("resize", frame);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ------------------------------------------------------------- render */
    const clock = new THREE.Clock();
    let frameId = null;

    const renderFrame = (dt, elapsed) => {
      const e = energyRef.current;
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
      shellMat.opacity = 0.04 + energySmooth * 0.07;

      rings.forEach((ring, i) => {
        ring.uniforms.uTime.value = t;
        ring.mesh.rotation.z += dt * ring.speed * (0.4 + energySmooth * 0.9);
        ring.uniforms.uOpacity.value =
          ringDefs[i].opacity * (1.05 + energySmooth * 0.55);
      });

      satellites.forEach((sat) => {
        const a = sat.phase + elapsed * sat.speed * (1 + energySmooth);
        sat.mesh.position.set(
          Math.cos(a) * sat.radius,
          Math.sin(a) * sat.radius,
          0
        );
        sat.mat.opacity = 0.7 + Math.sin(elapsed * 3 + sat.phase) * 0.25;
      });

      galaxyUniforms.uTime.value = t;
      galaxyUniforms.uOpacity.value = 0.58 + energySmooth * 0.28;
      galaxy.rotation.y = elapsed * 0.045 * (1 + energySmooth * 1.2);

      starUniforms.uTime.value = elapsed;
      stars.rotation.y = elapsed * 0.012;
      stars.rotation.x = Math.sin(elapsed * 0.05) * 0.04;

      // Pointer parallax, critically damped so it glides instead of snapping.
      smoothed.x = damp(smoothed.x, pointer.x, 2.6, dt);
      smoothed.y = damp(smoothed.y, pointer.y, 2.6, dt);

      world.rotation.y = smoothed.x * 0.32;
      world.rotation.x = smoothed.y * 0.2;
      world.position.y = layout.baseY - scrollNorm * 1.5;
      world.position.x = layout.baseX + smoothed.x * 0.28;
      stars.rotation.z = smoothed.x * 0.05;

      camera.position.x = damp(camera.position.x, smoothed.x * 0.45, 2.2, dt);
      camera.lookAt(layout.baseX * 0.42, 0.3 - scrollNorm * 0.35, 0);

      renderer.render(scene, camera);
    };

    let contextLost = false;

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

    stillReady = true;
    if (reduceMotion) renderStill();
    else setRunning(!document.hidden);

    // The canvas is a fixed backdrop for the whole page, so the only time it
    // is truly unseen is when the tab itself is hidden.
    const onVisibility = () => setRunning(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (e) => {
      e.preventDefault(); // allows the browser to hand the context back
      contextLost = true;
      setRunning(false);
    };
    const onContextRestored = () => {
      contextLost = false;
      if (reduceMotion) renderStill();
      else setRunning(!document.hidden);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    /* ------------------------------------------------------------ cleanup */
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      if (resizeObserver) resizeObserver.disconnect();

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
  }, []);

  return <div className="scene" ref={mountRef} aria-hidden="true" />;
}

export default Scene;
