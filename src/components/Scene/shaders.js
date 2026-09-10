/* --------------------------------------------------------------------------
   GLSL used by the LUMINA hero scene.
   Ashima Arts' 3D simplex noise (MIT) powers the fluid displacement of the
   core orb; everything else is bespoke.
   -------------------------------------------------------------------------- */

export const SIMPLEX_3D = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/* ---------------------------------------------------------------- core orb */

export const ORB_VERTEX = `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uRadius;
uniform float uPulse;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;
varying vec3 vPos;

${SIMPLEX_3D}

// Layered noise sampled on the unit sphere so the surface reads as one
// continuous liquid skin rather than tiling patches.
float fbm(vec3 n, float t) {
  float f  = snoise(n * uFreq + vec3(0.0, 0.0, t));
  f += 0.52 * snoise(n * uFreq * 2.13 + vec3(t * 1.27, 0.0, 0.0));
  f += 0.26 * snoise(n * uFreq * 4.31 - vec3(0.0, t * 0.83, 0.0));
  return f / 1.78;
}

vec3 displace(vec3 dir, float t, out float outNoise) {
  float f = fbm(dir, t);
  outNoise = f;
  return dir * (uRadius + f * uAmp + uPulse * 0.06);
}

void main() {
  float t = uTime * 0.22;
  vec3 dir = normalize(position);

  // Build a tangent frame so displaced normals can be re-derived analytically.
  vec3 up = abs(dir.y) < 0.985 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(up, dir));
  vec3 t2 = cross(dir, t1);

  float n0, n1, n2;
  float eps = 0.022;
  vec3 p0 = displace(dir, t, n0);
  vec3 p1 = displace(normalize(dir + t1 * eps), t, n1);
  vec3 p2 = displace(normalize(dir + t2 * eps), t, n2);

  vec3 newNormal = normalize(cross(p1 - p0, p2 - p0));

  vNoise = n0;
  vPos = p0;
  vNormalW = normalize(mat3(modelMatrix) * newNormal);

  vec4 world = modelMatrix * vec4(p0, 1.0);
  vViewDir = normalize(cameraPosition - world.xyz);

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const ORB_FRAGMENT = `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorRim;
uniform float uTime;
uniform float uIntensity;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;
varying vec3 vPos;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);

  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);

  // Two rig lights: a cool key from upper-left, a warm kick from lower-right.
  vec3 keyDir  = normalize(vec3(-0.55, 0.85, 0.6));
  vec3 kickDir = normalize(vec3(0.75, -0.35, 0.45));
  float key  = clamp(dot(N, keyDir), 0.0, 1.0);
  float kick = clamp(dot(N, kickDir), 0.0, 1.0);

  vec3 H = normalize(keyDir + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 68.0);

  // Iridescent banding driven by the same noise that shapes the silhouette.
  float band = 0.5 + 0.5 * sin(vNoise * 7.5 + uTime * 0.5 + vPos.y * 2.2);

  vec3 base = mix(uColorA, uColorB, band);
  base = mix(base, uColorC, smoothstep(0.35, 1.0, key) * 0.55);
  base += uColorC * kick * 0.28;
  // Thin-film style iridescence: the viewing angle shifts the hue, so the
  // surface shimmers as the orb turns.
  float iri = 0.5 + 0.5 * sin(fres * 9.0 + vNoise * 3.0 + uTime * 0.35);
  base += mix(vec3(0.18, 0.42, 0.62), vec3(0.55, 0.32, 0.12), iri) * fres * 0.9;
  base += uColorRim * fres * 1.15;
  base += vec3(1.0) * spec * 0.6;

  // Deep-shadow falloff keeps the orb reading as a solid volume.
  base *= mix(0.34, 0.95, key * 0.75 + 0.25);

  float alpha = clamp(0.72 + fres * 0.9, 0.0, 1.0);
  gl_FragColor = vec4(base * uIntensity, alpha);
}
`;

/* ------------------------------------------------------------- point cloud */

export const POINTS_VERTEX = `
uniform float uTime;
uniform float uSize;
uniform float uScale;
uniform vec2 uPointer;

attribute float aScale;
attribute float aSeed;
attribute vec3 aColor;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec3 pos = position;

  // Gentle orbital drift so the field never feels frozen.
  float wob = sin(uTime * 0.55 + aSeed * 6.283) * 0.06;
  pos.y += wob;
  pos.x += cos(uTime * 0.4 + aSeed * 4.7) * 0.05;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  vTwinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed * 12.9);
  vColor = aColor;

  gl_PointSize = uSize * aScale * (uScale / max(-mv.z, 0.001));
  gl_Position = projectionMatrix * mv;
}
`;

export const POINTS_FRAGMENT = `
precision mediump float;

uniform float uOpacity;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  // Procedural soft disc — no texture fetch, no extra network request.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.0, d);
  float halo = smoothstep(0.5, 0.12, d);
  float a = core * 0.55 + halo * halo * 0.85;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * (0.75 + vTwinkle * 0.6), a * uOpacity * vTwinkle);
}
`;

/* ------------------------------------------------------------- energy ring */

export const RING_VERTEX = `
uniform float uTime;
varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;
  vec3 pos = position;
  vWave = sin(uv.x * 26.0 - uTime * 2.2);
  pos.z += vWave * 0.035;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const RING_FRAGMENT = `
precision mediump float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uOpacity;

varying vec2 vUv;
varying float vWave;

void main() {
  // A pulse of light travels around the ring: two lobes chasing each other,
  // with a bright leading edge so the direction of travel reads.
  float sweep = 0.5 + 0.5 * sin(vUv.x * 6.283 * 2.0 - uTime * 1.1);
  float comet = pow(0.5 + 0.5 * sin(vUv.x * 6.283 - uTime * 0.8), 6.0);

  vec3 col = mix(uColorA, uColorB, sweep);
  col += vec3(1.0, 0.95, 0.85) * comet * 0.8;

  float a = (0.32 + sweep * 0.5 + comet * 0.9) * uOpacity;
  gl_FragColor = vec4(col * (1.25 + vWave * 0.3), a);
}
`;
