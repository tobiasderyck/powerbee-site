// The Swarm — GPU particle field.
// Free-flying "bees" (chaos) that assemble into a honeycomb lattice (order)
// as you reach De Hive, then disperse again. Mouse acts as a soft repeller.

import * as THREE from 'three';

const COUNT = 1500;

const vert = /* glsl */ `
  attribute float aSeed;
  attribute vec3 aBase;
  attribute vec3 aTarget;
  attribute float aSize;
  attribute float aBlue;

  uniform float uTime;
  uniform float uMorph;      // 0 = free swarm, 1 = honeycomb lattice
  uniform float uDrift;      // global scroll drift
  uniform vec3 uMouse;       // world-space pointer
  uniform float uPixelRatio;

  varying float vBlue;
  varying float vTwinkle;

  void main() {
    float t = uTime;
    float s = aSeed;

    // pseudo-curl flight: layered lissajous per particle
    vec3 flight = aBase + vec3(
      sin(t * (0.18 + s * 0.22) + s * 17.0) * (1.6 + s * 2.4),
      cos(t * (0.14 + s * 0.19) + s * 31.0) * (1.1 + s * 1.8),
      sin(t * (0.16 + s * 0.15) + s * 47.0) * (1.4 + s * 1.6)
    );

    // lattice target breathes very slightly so the hive feels alive
    vec3 hive = aTarget + vec3(
      sin(t * 0.6 + s * 40.0) * 0.05,
      cos(t * 0.55 + s * 23.0) * 0.05,
      sin(t * 0.5 + s * 11.0) * 0.10
    );

    float m = smoothstep(0.0, 1.0, uMorph);
    vec3 pos = mix(flight, hive, m);
    pos.y += uDrift;

    // mouse repulsion (xy plane)
    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float push = smoothstep(2.6, 0.0, dist) * 1.4 * (1.0 - m * 0.7);
    pos.xy += normalize(d + 0.0001) * push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.55 + 0.45 * sin(t * (1.2 + s * 2.0) + s * 90.0);
    vTwinkle = twinkle;
    vBlue = aBlue;

    gl_PointSize = aSize * uPixelRatio * (1.0 + m * 0.5) * (52.0 / -mv.z) * (0.7 + 0.3 * twinkle);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying float vBlue;
  varying float vTwinkle;
  uniform float uOpacity;
  uniform float uInk; // 0 = bright particles on dark, 1 = ink particles on light

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    core = pow(core, 2.2);

    vec3 honey = vec3(1.0, 0.74, 0.36);
    vec3 plasma = vec3(0.27, 0.81, 1.0);
    vec3 honeyInk = vec3(0.69, 0.43, 0.08);
    vec3 tealInk = vec3(0.01, 0.38, 0.36);
    vec3 col = mix(mix(honey, plasma, vBlue), mix(honeyInk, tealInk, vBlue), uInk);

    gl_FragColor = vec4(col, core * vTwinkle * uOpacity * (1.0 + uInk * 0.2));
  }
`;

// Honeycomb lattice targets: corner points of a hex grid → dotted comb wireframe
function buildHiveTargets(count) {
  const pts = [];
  const R = 1.05;                 // hex radius (world units)
  const cols = 7, rows = 5;
  const w = Math.sqrt(3) * R;     // pointy-top width
  for (let q = 0; q < cols; q++) {
    for (let r = 0; r < rows; r++) {
      const cx = (q - (cols - 1) / 2) * w + (r % 2 ? w / 2 : 0);
      const cy = (r - (rows - 1) / 2) * R * 1.5;
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 3 * k + Math.PI / 6;
        pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
    }
  }
  const targets = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const p = pts[i % pts.length];
    // several particles share a vertex; scatter them into a tiny glowing cluster
    targets[i * 3]     = p[0] + (Math.random() - 0.5) * 0.09;
    targets[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 0.09;
    targets[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
  }
  return targets;
}

export function createSwarm(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: false, powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 11;

  const geo = new THREE.BufferGeometry();
  const base = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);
  const blues = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    base[i * 3]     = (Math.random() - 0.5) * 24;
    base[i * 3 + 1] = (Math.random() - 0.5) * 14;
    base[i * 3 + 2] = -2.5 + (Math.random() - 0.5) * 11;
    seeds[i] = Math.random();
    sizes[i] = 0.9 + Math.pow(Math.random(), 3.0) * 2.6;
    blues[i] = Math.random() < 0.12 ? 0.75 + Math.random() * 0.25 : Math.random() * 0.06;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  geo.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aBlue', new THREE.BufferAttribute(blues, 1));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(buildHiveTargets(COUNT), 3));

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uDrift: { value: 0 },
    uMouse: { value: new THREE.Vector3(999, 999, 0) },
    uOpacity: { value: 0 },
    uPixelRatio: { value: 1 },
    uInk: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  scene.add(new THREE.Points(geo, mat));

  const pointer = new THREE.Vector2(999, 999);
  const worldPointer = new THREE.Vector3(999, 999, 0);

  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = dpr;
  }
  window.addEventListener('resize', resize);
  resize();

  const raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const raycaster = new THREE.Raycaster();

  const clock = new THREE.Clock();
  let running = true;

  function frame() {
    if (!running) return;
    uniforms.uTime.value = clock.getElapsedTime();

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(raycastPlane, worldPointer);
    if (worldPointer) uniforms.uMouse.value.lerp(worldPointer, 0.08);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    const wasRunning = running;
    running = document.visibilityState === 'visible';
    if (running && !wasRunning) { clock.getDelta(); requestAnimationFrame(frame); }
  });

  return {
    uniforms,
    setMorph(v) { uniforms.uMorph.value = v; },
    setDrift(v) { uniforms.uDrift.value = v; },
    setOpacity(v) { uniforms.uOpacity.value = v; },
    // ink mode: dark particles + normal blending so the swarm reads on light paper
    setInk(on) {
      uniforms.uInk.value = on ? 1 : 0;
      mat.blending = on ? THREE.NormalBlending : THREE.AdditiveBlending;
      mat.needsUpdate = true;
    },
  };
}
