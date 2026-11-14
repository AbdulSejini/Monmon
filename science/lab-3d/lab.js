/* 3D Body Lab: the engine (science/lab-3d). The scenes are in scenes.js.
   One WebGL view (three.js r160, assets/vendor/three.min.js) shows one scene at a time. The child turns the model with a
   finger (a sideways drag turns it, an up-and-down swipe still scrolls the page), pinches or uses + and − to zoom, and
   taps a part or its name to read about it. Each scene has its own controls (sliders, buttons, a joystick pad), a caption
   with the English sentence of the lesson and a simple Arabic explanation, both read aloud (assets/voice.js), and a guided
   tour («شغّل الشرح») that moves the model step by step. Sounds are made here (no files) and follow the site's sound
   switch. With "reduce motion" on, the model starts paused (the ⏯ button starts it). Nothing is saved and no points are
   given: this page is for looking and trying. */
"use strict";
const Lab = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const still = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const strip = h => String(h).replace(/<[^>]+>/g, "");

  /* ---------- sound: a tiny synth, following the site's switch ---------- */
  let mute = false, ac = null;
  const soundOn = () => window.MonmonRewards && MonmonRewards.sound ? !!MonmonRewards.sound() : !mute;
  function audio(){
    if (!soundOn()) return null;
    try { if (!ac){ const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); } if (ac.state === "suspended") ac.resume(); } catch (e) { return null; }
    return ac;
  }
  function tone(f, at, dur, type, vol, to){
    const a = audio(); if (!a) return;
    try {
      const t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function noise(at, dur, freq, q, vol, to){
    const a = audio(); if (!a) return;
    try {
      const n = Math.max(1, Math.floor(a.sampleRate * dur)), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + (at || 0);
      src.buffer = buf; f.type = "bandpass"; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur); f.Q.value = q || 1;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + Math.min(0.04, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(a.destination); src.start(t); src.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const SND = {
    tap:() => tone(660, 0, .07, "triangle", .05),
    whoosh:() => noise(0, .45, 400, .8, .3, 2400),
    ding:() => { tone(1318, 0, .25, "sine", .05); tone(1976, .05, .3, "sine", .025); },
    tada:() => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .09, i === 3 ? .5 : .14, "square", .035)),
    power:() => [523, 784, 1047].forEach((f, i) => tone(f, i * .07, .16, "triangle", .06)),
    wrong:() => { tone(150, 0, .16, "sawtooth", .07); tone(115, .14, .2, "sawtooth", .07); },
    stretch:() => tone(190, 0, .3, "sine", .09, 420),
    creak:() => tone(140, 0, .35, "sawtooth", .03, 95),
    whirr:() => tone(200, 0, .5, "triangle", .05, 520),
    swish:() => noise(0, .3, 1200, 1, .2, 3000),
    boing:() => tone(440, 0, .42, "sawtooth", .07, 95),
    pop:() => tone(300, 0, .12, "sine", .1, 900),
    crunch:() => [0, .4, .8].forEach(at => noise(at, .11, 900, .7, .4)),
    gulp:() => { tone(320, 0, .22, "sine", .12, 120); tone(180, .18, .14, "sine", .08, 90); },
    gurgle:() => { for (let i = 0; i < 7; i++) tone(180 + Math.random() * 260, i * .09, .09, "sine", .07, 90 + Math.random() * 200); },
    drip:() => { tone(1400, 0, .1, "sine", .06, 500); tone(1100, .25, .1, "sine", .05, 400); },
    sparkle:() => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * .06, .18, "sine", .025)),
    bubbles:() => { for (let i = 0; i < 6; i++) tone(600 + Math.random() * 900, i * .08, .07, "sine", .05, 1400 + Math.random() * 600); },
    beat:() => { tone(70, 0, .14, "sine", .3, 45); tone(62, .2, .12, "sine", .24, 40); },
    breathIn:() => noise(0, 1.1, 500, .6, .12, 1100),
    breathOut:() => noise(0, 1.1, 900, .6, .1, 400),
    zap:() => { tone(1800, 0, .18, "square", .03, 200); noise(0, .12, 3000, 2, .12); },
    sizzle:() => noise(0, .8, 5000, .5, .1, 7000),
    ouch:() => { tone(600, 0, .12, "triangle", .08, 900); tone(900, .1, .3, "triangle", .07, 300); },
    click:() => noise(0, .04, 2500, 2, .2)
  };
  const sfx = n => { try { if (SND[n]) SND[n](); } catch (e) {} };

  /* ---------- the reading voice ---------- */
  const sayable = t => strip(t).replace(/\s*→\s*/g, ", ").replace(/\(([^)]*)\)/g, ", $1,");
  /* read a text aloud; the promise ends when the reading does (at once when the sound is off or there is no voice) */
  function say(text, lang){
    return new Promise(done => {
      if (!soundOn() || !window.MonmonVoice || !MonmonVoice.can || (lang === "ar" && !MonmonVoice.has("ar"))) return done(false);
      let fin = false; const end = () => { if (!fin){ fin = true; done(true); } };
      try { if (!MonmonVoice.speak(sayable(text), {lang:lang === "ar" ? "ar" : "en", onend:end})) return done(false); } catch (e) { return done(false); }
      setTimeout(end, 4000 + sayable(text).length * 110);   /* never wait for ever */
    });
  }
  const hush = () => { try { if (window.MonmonVoice) MonmonVoice.stop(); } catch (e) {} };
  let speed = 1;   /* tests run the tours faster */
  const wait = ms => new Promise(r => setTimeout(r, ms / speed));
  const readMs = t => Math.min(9000, Math.max(2600, 1400 + strip(t).split(/\s+/).length * 330));

  /* ---------- the kit: shapes and materials the scenes share ---------- */
  const texCache = {};
  function canvasTex(key, w, h, draw, rx, ry){
    if (!texCache[key]){ const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); texCache[key] = c; }
    const t = new THREE.CanvasTexture(texCache[key]); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    return t;
  }
  const K = {
    V, clamp, lerp, ease,
    /* materials */
    bone:() => new THREE.MeshStandardMaterial({color:0xEFE5CF, roughness:.62}),
    cartilage:() => new THREE.MeshPhysicalMaterial({color:0xA8D9EF, roughness:.3, clearcoat:.5}),
    muscle:() => new THREE.MeshPhysicalMaterial({color:0xC9453F, roughness:.5, clearcoat:.35, clearcoatRoughness:.4, map:K.fibers()}),
    organ:(color, o) => new THREE.MeshPhysicalMaterial(Object.assign({color, roughness:.38, clearcoat:.6, clearcoatRoughness:.3}, o || {})),
    glass:(color, op, o) => new THREE.MeshPhysicalMaterial(Object.assign({color, transparent:true, opacity:op, roughness:.25, depthWrite:false, side:THREE.DoubleSide}, o || {})),
    glow:(color, o) => new THREE.MeshBasicMaterial(Object.assign({color, toneMapped:false}, o || {})),
    flat:(color, o) => new THREE.MeshStandardMaterial(Object.assign({color, roughness:.7}, o || {})),
    /* fine stripes along a muscle */
    fibers:() => canvasTex("fib", 64, 8, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4){ g.fillStyle = x % 8 ? "rgba(120,20,20,.22)" : "rgba(255,255,255,.18)"; g.fillRect(x, 0, 2, h); } }, 6, 1),
    /* a soft round shadow for the floor */
    shadowTex:() => canvasTex("shadow", 128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 4, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(0,0,0,.55)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); }),
    /* a soft dot for glows */
    dotTex:() => canvasTex("dot", 64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.35, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); }),
    mesh:(geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); if (x !== undefined) m.position.set(x, y, z); return m; },
    /* an ellipsoid */
    blob:(mat, x, y, z, sx, sy, sz, seg) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg || 28, seg ? Math.round(seg * .7) : 20), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; },
    /* a long bone along +Y from 0 to L: a shaft of radius r with a knob of radius hr at each end */
    boneGeo(L, r, hr){
      const p = [[0, 0], [hr * .72, .012], [hr, .05], [hr * .96, .1], [r * 1.25, .19], [r, .3], [r * .96, .5], [r, .7], [r * 1.25, .81], [hr * .96, .9], [hr, .95], [hr * .72, .988], [0, 1]];
      const c = new THREE.SplineCurve(p.map(q => new THREE.Vector2(q[0], q[1] * L)));
      const pts = c.getPoints(44); pts[0].x = 0; pts[pts.length - 1].x = 0;
      return new THREE.LatheGeometry(pts, 20);
    },
    /* a muscle belly of length 1 along +Y (thin tendon ends, thick middle) */
    spindleGeo(){
      const pts = []; for (let i = 0; i <= 28; i++){ const t = i / 28, s = Math.sin(Math.PI * t); pts.push(new THREE.Vector2(i === 0 || i === 28 ? 0 : .07 + .43 * Math.pow(s, 1.6), t)); }
      return new THREE.LatheGeometry(pts, 18);
    },
    /* a tube along a curve whose radius changes: rFn(t, angle) gives the radius at t in 0..1 */
    tubeVar(curve, segs, radial, rFn){
      const fr = curve.computeFrenetFrames(segs, false), pts = curve.getSpacedPoints(segs), n = (segs + 1) * (radial + 1);
      const g = new THREE.BufferGeometry(), idx = [], uv = new Float32Array(n * 2);
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      for (let i = 0; i <= segs; i++) for (let j = 0; j <= radial; j++){
        const k = i * (radial + 1) + j; uv[k * 2] = i / segs; uv[k * 2 + 1] = j / radial;
        if (i < segs && j < radial){ const a = k, b = k + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
      g.userData = {fr, pts, segs, radial};
      K.shapeTube(g, typeof rFn === "function" ? rFn : () => rFn);
      return g;
    },
    shapeTube(g, rFn){
      const {fr, pts, segs, radial} = g.userData, pos = g.attributes.position.array, nor = g.attributes.normal.array;
      for (let i = 0; i <= segs; i++){
        const P = pts[i], N = fr.normals[i], B = fr.binormals[i], t = i / segs;
        for (let j = 0; j <= radial; j++){
          const a = j / radial * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r = rFn(t, a), k = (i * (radial + 1) + j) * 3;
          const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
          pos[k] = P.x + r * nx; pos[k + 1] = P.y + r * ny; pos[k + 2] = P.z + r * nz; nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
        }
      }
      g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; g.computeBoundingSphere();
    },
    curve:(pts, closed) => new THREE.CatmullRomCurve3(pts.map(p => Array.isArray(p) ? V(p[0], p[1], p[2]) : p), !!closed, "catmullrom", .5),
    /* put a mesh made along +Y (length 1) between two points */
    between(m, a, b, thick, thickZ){
      const d = b.clone().sub(a), len = d.length() || 1e-6;
      m.position.copy(a); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.multiplyScalar(1 / len)); m.scale.set(thick, len, thickZ === undefined ? thick : thickZ);
      return len;
    },
    /* a flat band (a ligament) from p0 to p1, bowed through pc; update() moves it and returns its length */
    ribbon(mat, n){
      n = n || 12;
      const g = new THREE.BufferGeometry(), idx = [];
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((n + 1) * 6), 3));
      g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array((n + 1) * 6), 3));
      for (let i = 0; i < n; i++){ const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      g.setIndex(idx);
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
      const P = V(), T = V(), S = V(), Nn = V(), prev = V();
      m.update = (p0, pc, p1, w, out) => {
        const pos = g.attributes.position.array, nor = g.attributes.normal.array; let len = 0;
        for (let i = 0; i <= n; i++){
          const t = i / n, u = 1 - t;
          P.set(u * u * p0.x + 2 * u * t * pc.x + t * t * p1.x, u * u * p0.y + 2 * u * t * pc.y + t * t * p1.y, u * u * p0.z + 2 * u * t * pc.z + t * t * p1.z);
          T.set(2 * u * (pc.x - p0.x) + 2 * t * (p1.x - pc.x), 2 * u * (pc.y - p0.y) + 2 * t * (p1.y - pc.y), 2 * u * (pc.z - p0.z) + 2 * t * (p1.z - pc.z)).normalize();
          S.crossVectors(T, out).normalize(); Nn.crossVectors(S, T).normalize();
          const k = i * 6;
          pos[k] = P.x + S.x * w; pos[k + 1] = P.y + S.y * w; pos[k + 2] = P.z + S.z * w; pos[k + 3] = P.x - S.x * w; pos[k + 4] = P.y - S.y * w; pos[k + 5] = P.z - S.z * w;
          nor[k] = nor[k + 3] = Nn.x; nor[k + 1] = nor[k + 4] = Nn.y; nor[k + 2] = nor[k + 5] = Nn.z;
          if (i) len += P.distanceTo(prev); prev.copy(P);
        }
        g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
        return len;
      };
      return m;
    },
    /* many small balls drawn in one go: set(i, position, size, colour) */
    dots(n, r, mat){
      const m = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), mat, n), o = new THREE.Object3D(), c = new THREE.Color();
      m.frustumCulled = false;
      m.set = (i, p, s, col) => { o.position.copy(p); o.scale.setScalar(s === undefined ? 1 : s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (col !== undefined){ c.set(col); m.setColorAt(i, c); } };
      m.done = () => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
      const far = V(0, -99, 0); for (let i = 0; i < n; i++) m.set(i, far, 0, 0xffffff); m.done();
      return m;
    },
    /* a glowing spot that always faces the camera */
    spark(color, size){
      const s = new THREE.Sprite(new THREE.SpriteMaterial({map:K.dotTex(), color, transparent:true, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false}));
      s.scale.setScalar(size || .4); s.renderOrder = 20; return s;
    },
    /* a see-through head and body, to show where the organs sit */
    bodyShell(o){
      o = o || {};
      const g = new THREE.Group(), m = K.glass(0xF2C9A8, o.op || .13, {roughness:.5, side:THREE.FrontSide});
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.72, 1.75, 8, 24), m); torso.position.set(0, 1.95, 0); torso.scale.set(1.28, 1, .78);
      const head = K.blob(m, 0, 4.12, .05, .5, .6, .55), neck = new THREE.Mesh(new THREE.CylinderGeometry(.2, .26, .45, 16), m); neck.position.set(0, 3.5, 0);
      g.add(torso, head, neck); g.traverse(x => { x.renderOrder = 10; });
      return g;
    },
    rnd(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  };

  /* ---------- the view ---------- */
  const SCENES = [], BY = {};
  let renderer = null, scene3 = null, camera = null, root = null, floor = null, cv = null;
  let cur = null, ctx = null, t = 0, last = 0, paused = false, userTurned = false, namesOn = true, tourTok = 0, touring = false;
  const orb = {theta:.5, phi:1.3, dist:6, target:V(0, 2, 0), min:3, max:10, fit:1};
  const labels = [], tweens = [], tmp = V(), tmp2 = V();

  function initGL(){
    cv = $("#gl");
    try { renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true, powerPreference:"high-performance"}); } catch (e) { return false; }
    if (!renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.localClippingEnabled = true;
    scene3 = new THREE.Scene(); camera = new THREE.PerspectiveCamera(36, 1, .05, 80);
    scene3.add(new THREE.HemisphereLight(0xffffff, 0x54608a, 1.15));
    const key = new THREE.DirectionalLight(0xfff3df, 2.4); key.position.set(3.5, 6, 5); scene3.add(key);
    const fill = new THREE.DirectionalLight(0xbcd6ff, .9); fill.position.set(-5, 2, 3); scene3.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.3); rim.position.set(-1, 4, -6); scene3.add(rim);
    /* soft studio reflections, so wet and smooth things shine */
    try {
      const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(); es.background = new THREE.Color(0x20284a);
      const panel = (c, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshBasicMaterial({color:c})); m.position.set(x, y, z); es.add(m); };
      panel(0xffffff, 0, 7, 0, 9, .3, 9); panel(0xffe2b8, 7, 2, 3, .3, 5, 5); panel(0xa9c8ff, -7, 1, -3, .3, 5, 5); panel(0x8a93b8, 0, 1, -8, 8, 4, .3);
      scene3.environment = pm.fromScene(es, .05).texture; pm.dispose(); es.traverse(x => { if (x.geometry){ x.geometry.dispose(); x.material.dispose(); } });
    } catch (e) {}
    floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map:K.shadowTex(), transparent:true, depthWrite:false, opacity:.8}));
    floor.rotation.x = -Math.PI / 2; scene3.add(floor);
    root = new THREE.Group(); scene3.add(root);
    bindPointer();
    window.addEventListener("resize", resize);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe($("#view"));
    resize();
    return true;
  }
  function resize(){
    if (!renderer) return;
    const b = $("#view"), w = Math.max(50, b.clientWidth), h = Math.max(50, b.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    orb.fit = clamp(1.3 / camera.aspect, 1, 1.75);
  }
  function placeCamera(){
    const d = orb.dist * orb.fit, sp = Math.sin(orb.phi);
    camera.position.set(orb.target.x + d * sp * Math.sin(orb.theta), orb.target.y + d * Math.cos(orb.phi), orb.target.z + d * sp * Math.cos(orb.theta));
    camera.lookAt(orb.target);
  }
  /* a sideways drag turns the model; two fingers zoom; a short tap picks a part */
  function bindPointer(){
    const ptrs = new Map(); let moved = 0, downAt = 0, pinch0 = 0, dist0 = 0;
    const gap = () => { const a = [...ptrs.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
    cv.addEventListener("pointerdown", e => {
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (ptrs.size === 1){ moved = 0; downAt = performance.now(); }
      if (ptrs.size === 2){ pinch0 = gap(); dist0 = orb.dist; }
    });
    cv.addEventListener("pointermove", e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1){
        orb.theta -= dx * .009; orb.phi = clamp(orb.phi - dy * .006, .35, 2.5); moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 8 && !userTurned){ userTurned = true; $("#hint").hidden = true; }
      } else if (ptrs.size === 2){ orb.dist = clamp(dist0 * pinch0 / gap(), orb.min, orb.max); moved = 99; }
    });
    const up = e => {
      const had = ptrs.delete(e.pointerId);
      if (had && e.type === "pointerup" && moved < 8 && performance.now() - downAt < 500) pickAt(e.clientX, e.clientY);
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    /* with a keyboard: the arrows turn the model, + and − zoom */
    cv.addEventListener("keydown", e => {
      const k = e.key; let used = true;
      if (k === "ArrowLeft") orb.theta -= .15; else if (k === "ArrowRight") orb.theta += .15; else if (k === "ArrowUp") orb.phi = clamp(orb.phi - .1, .35, 2.5); else if (k === "ArrowDown") orb.phi = clamp(orb.phi + .1, .35, 2.5);
      else if (k === "+" || k === "=") orb.dist = clamp(orb.dist * .88, orb.min, orb.max); else if (k === "-") orb.dist = clamp(orb.dist * 1.14, orb.min, orb.max); else used = false;
      if (used){ e.preventDefault(); userTurned = true; $("#hint").hidden = true; }
    });
  }
  const ray = new THREE.Raycaster();
  function pickAt(x, y){
    if (!cur || !ctx.picks.length) return;
    const r = cv.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(ctx.picks, true)[0]; if (!hit) return;
    let o = hit.object; while (o && !o.userData.pick) o = o.parent;
    if (o) doPick(o.userData.pick);
  }
  function doPick(key){ if (ctx && ctx.onPick){ stopTour(); sfx("tap"); ctx.onPick(key); } }

  function frame(now){
    requestAnimationFrame(frame);
    if (!renderer || !cur || document.hidden) { last = now; return; }
    const real = Math.min(.05, (now - last) / 1000 || 0); last = now;
    const dt = paused ? 0 : real; t += dt;
    for (let i = tweens.length - 1; i >= 0; i--){
      const w = tweens[i]; w.t += real * 1000 * speed; const k = w.ms <= 0 ? 1 : Math.min(1, w.t / w.ms);
      try { w.fn(w.ease ? w.ease(k) : k); } catch (e) { console.error(e); }
      if (k >= 1){ tweens.splice(i, 1); w.done(true); }
    }
    if (!userTurned && !paused && !still()) orb.theta = cur.cam.theta + .28 * Math.sin(t * .35);
    try { if (cur.live && cur.live.update) cur.live.update(dt, t, real); } catch (e) { console.error(e); }
    placeCamera();
    renderer.render(scene3, camera);
    /* the names sit over the canvas */
    const W = cv.clientWidth, H = cv.clientHeight;
    for (const l of labels){
      const on = namesOn && l.on !== false && (!l.show || l.show());
      if (!on){ if (l.vis){ l.el.style.display = "none"; l.vis = false; } continue; }
      const p = typeof l.pos === "function" ? l.pos(tmp2) : l.pos.isObject3D ? l.pos.getWorldPosition(tmp2) : tmp2.copy(l.pos);
      tmp.copy(p).project(camera);
      const ok = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      if (ok !== l.vis){ l.el.style.display = ok ? "" : "none"; l.vis = ok; }
      if (ok) l.el.style.transform = "translate(" + ((tmp.x * .5 + .5) * W + (l.dx || 0)).toFixed(1) + "px," + ((-tmp.y * .5 + .5) * H + (l.dy || 0)).toFixed(1) + "px) translate(-50%,-50%)";
    }
  }

  /* ---------- what a scene gets to build with ---------- */
  function makeCtx(def){
    const ctl = $("#ctl"); ctl.innerHTML = "";
    const c = {
      root, K, sfx, say, wait, def, picks:[], onPick:null, tour:[],
      get t(){ return t; }, still,
      /* a name over the model: pos is a point, an object or a function; tapping it is like tapping the part */
      label(text, pos, o){
        o = o || {};
        const el = document.createElement("button"); el.type = "button"; el.className = "lb" + (o.cls ? " " + o.cls : ""); el.textContent = text; el.dir = "ltr"; el.style.display = "none";
        if (o.pick) el.addEventListener("click", () => doPick(o.pick)); else el.tabIndex = -1;
        $("#labels").appendChild(el);
        const l = {el, pos, dx:o.dx, dy:o.dy, show:o.show, vis:false, on:true, key:o.pick}; labels.push(l); return l;
      },
      hot(key){ labels.forEach(l => l.el.classList.toggle("hot", !!key && l.key === key)); },
      pick(obj, key){ obj.userData.pick = key; c.picks.push(obj); return obj; },
      /* the caption: a title, the lesson's sentence in English and a simple explanation in Arabic */
      info(o){ setInfo(o); },
      /* run fn(k) with k from 0 to 1 over ms; the promise ends with it (or when the scene changes) */
      tween(ms, fn, ez){ return new Promise(done => { tweens.push({ms, fn, t:0, ease:ez === null ? null : (ez || ease), done, scene:def.id}); }); },
      /* fly the camera */
      look(o, ms){
        const a = {th:orb.theta, ph:orb.phi, d:orb.dist, tg:orb.target.clone()}; userTurned = true;
        const tg = o.target ? V(o.target[0], o.target[1], o.target[2]) : a.tg;
        return c.tween(ms === undefined ? 900 : ms, k => { if (o.theta !== undefined) orb.theta = lerp(a.th, o.theta, k); if (o.phi !== undefined) orb.phi = lerp(a.ph, o.phi, k); if (o.dist !== undefined) orb.dist = lerp(a.d, o.dist, k); orb.target.lerpVectors(a.tg, tg, k); });
      },
      ui:{
        slider(o){
          const w = document.createElement("label"); w.className = "sl";
          w.innerHTML = '<span class="sl-top"><b>' + o.label + '</b><output dir="ltr"></output></span><input type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 1) + '" value="' + o.value + '">';
          const inp = w.querySelector("input"), out = w.querySelector("output"), fmt = o.fmt || (v => String(Math.round(v)));
          const api = {el:w, input:inp, get:() => +inp.value, set(v, quiet){ inp.value = v; out.textContent = fmt(+inp.value); o.on(+inp.value, !!quiet); }};
          inp.addEventListener("input", () => { stopTour(); out.textContent = fmt(+inp.value); o.on(+inp.value, false); });
          out.textContent = fmt(+o.value); ctl.appendChild(w); return api;
        },
        buttons(list){
          const row = document.createElement("div"); row.className = "brow";
          const els = list.map(b => { const e = document.createElement("button"); e.type = "button"; e.className = "cbtn" + (b.cls ? " " + b.cls : ""); e.innerHTML = b.label; e.addEventListener("click", () => { if (!b.keepTour) stopTour(); b.on(e); }); row.appendChild(e); return e; });
          ctl.appendChild(row); return els;
        },
        /* one choice out of a few */
        seg(o){
          const row = document.createElement("div"); row.className = "seg"; row.setAttribute("role", "group"); if (o.label) row.setAttribute("aria-label", strip(o.label));
          const els = {}; let val = o.value;
          const paint = () => { for (const k in els) els[k].setAttribute("aria-pressed", k === val ? "true" : "false"); };
          o.opts.forEach(p => { const e = document.createElement("button"); e.type = "button"; e.innerHTML = p.label; e.addEventListener("click", () => { stopTour(); api.set(p.k); }); els[p.k] = e; row.appendChild(e); });
          const api = {el:row, get:() => val, set(k, quiet){ val = k; paint(); o.on(k, !!quiet); }};
          paint(); ctl.appendChild(row); return api;
        },
        toggle(o){
          const e = document.createElement("button"); e.type = "button"; e.className = "cbtn tg" + (o.cls ? " " + o.cls : ""); let val = !!o.value;
          const paint = () => { e.setAttribute("aria-pressed", val ? "true" : "false"); e.innerHTML = val ? o.on_label : o.off_label; };
          const api = {el:e, get:() => val, set(v, quiet){ val = !!v; paint(); o.on(val, !!quiet); }};
          e.addEventListener("click", () => { stopTour(); api.set(!val); }); paint();
          (o.into || ctl).appendChild(e); return api;
        },
        note(html, cls){ const p = document.createElement("p"); p.className = "note" + (cls ? " " + cls : ""); p.innerHTML = html; ctl.appendChild(p); return p; },
        row(){ const d = document.createElement("div"); d.className = "brow"; ctl.appendChild(d); return d; },
        /* a round pad: dragging the knob gives x and y from -1 to 1 */
        pad(o){
          const w = document.createElement("div"); w.className = "padw";
          w.innerHTML = '<div class="pad" role="slider" tabindex="0" aria-label="' + esc(strip(o.label)) + '" aria-valuetext="0, 0"><i></i></div><p class="note">' + o.label + '</p>';
          const pad = w.firstChild, knob = pad.firstChild; let x = 0, y = 0, drag = false;
          const paint = () => { knob.style.transform = "translate(" + (x * 38).toFixed(1) + "px," + (y * 38).toFixed(1) + "px)"; pad.setAttribute("aria-valuetext", x.toFixed(1) + ", " + y.toFixed(1)); };
          const api = {el:w, get:() => [x, y], set(nx, ny, quiet){ const m = Math.hypot(nx, ny); if (m > 1){ nx /= m; ny /= m; } x = nx; y = ny; paint(); o.on(x, y, !!quiet); }};
          const at = e => { const r = pad.getBoundingClientRect(); api.set(((e.clientX - r.left) / r.width - .5) * 2.2, ((e.clientY - r.top) / r.height - .5) * 2.2); };
          pad.addEventListener("pointerdown", e => { stopTour(); drag = true; try { pad.setPointerCapture(e.pointerId); } catch (err) {} at(e); });
          pad.addEventListener("pointermove", e => { if (drag) at(e); });
          pad.addEventListener("pointerup", () => { drag = false; }); pad.addEventListener("pointercancel", () => { drag = false; });
          pad.addEventListener("keydown", e => { const d = {ArrowLeft:[-.2, 0], ArrowRight:[.2, 0], ArrowUp:[0, -.2], ArrowDown:[0, .2]}[e.key]; if (d){ e.preventDefault(); stopTour(); api.set(clamp(x + d[0], -1, 1), clamp(y + d[1], -1, 1)); } });
          ctl.appendChild(w); return api;
        }
      }
    };
    return c;
  }
  let capNow = null;
  function setInfo(o){
    capNow = o;
    $("#capT").innerHTML = o.t || (cur ? cur.title : "");
    $("#capEn").innerHTML = o.en || ""; $("#capEn").hidden = !o.en;
    $("#capAr").innerHTML = o.ar || ""; $("#capAr").hidden = !o.ar;
    const c = $("#cap"); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop");
  }

  /* ---------- scenes ---------- */
  function open(id, quiet){
    const def = BY[id] || SCENES[0]; if (!def || !renderer) return;
    stopTour(); hush();
    /* clear the old scene */
    tweens.splice(0).forEach(w => w.done(false));
    if (cur && cur.live && cur.live.dispose) try { cur.live.dispose(); } catch (e) {}
    root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { for (const k of ["map", "alphaMap", "emissiveMap"]) if (m[k]) m[k].dispose(); m.dispose(); }); });
    root.clear(); labels.splice(0).forEach(l => l.el.remove());
    cur = def; t = 0; userTurned = false; paused = still(); paintPause();
    orb.theta = def.cam.theta; orb.phi = def.cam.phi; orb.dist = def.cam.dist; orb.target.set(def.cam.target[0], def.cam.target[1], def.cam.target[2]); orb.min = def.cam.min || def.cam.dist * .45; orb.max = def.cam.max || def.cam.dist * 1.6;
    floor.visible = def.floor !== false; if (def.floor){ floor.position.set(def.floor[0], def.floor[1], def.floor[2]); floor.scale.setScalar(def.floor[3]); }
    ctx = makeCtx(def);
    $("#hint").hidden = false;
    try { def.live = def.build(ctx) || {}; } catch (e) { console.error(e); def.live = {}; }
    setInfo(def.intro);
    document.querySelectorAll("#scenes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === def.id ? "true" : "false"));
    const on = $('#scenes button[data-id="' + def.id + '"]'); if (on && !quiet && on.scrollIntoView) try { on.scrollIntoView({block:"nearest", inline:"center"}); } catch (e) {}
    $("#lessonLink").href = "../quiz-2/index.html#" + def.topic;
    $("#lessonLink").textContent = "الدرس " + def.les + " في صفحة المراجعة ←";
    $("#tourBtn").hidden = !ctx.tour.length;
    $("#stageTitle").textContent = def.title; $("#stageEn").textContent = def.en;
    if (!quiet) try { history.replaceState(null, "", "#" + def.id); } catch (e) {}
    last = performance.now();
  }
  /* the guided tour: each step shows its caption, reads the English aloud and moves the model */
  async function runTour(){
    if (touring){ stopTour(); return; }
    const my = ++tourTok, steps = ctx.tour, def = cur; touring = true; paintTour();
    if (paused){ paused = false; paintPause(); }
    sfx("whoosh");
    for (let i = 0; i < steps.length; i++){
      if (my !== tourTok || cur !== def) return;
      const st = steps[i];
      setInfo({t:(i + 1) + " / " + steps.length + " · " + (st.t || def.title), en:st.en, ar:st.ar});
      if (st.hot !== undefined) ctx.hot(st.hot);
      if (i) sfx("ding");
      const spoken = say(st.en, "en").then(ok => ok ? null : wait(readMs(st.en)));
      const work = st.run ? Promise.resolve().then(() => st.run(ctx, () => my === tourTok && cur === def)).catch(e => console.error(e)) : null;
      await Promise.all([spoken, work, wait(st.min || 1800)]);
      if (my !== tourTok || cur !== def) return;
      await wait(450);
    }
    if (my !== tourTok) return;
    touring = false; paintTour(); ctx.hot(null); sfx("tada");
    if (def.outro) setInfo(def.outro);
  }
  function stopTour(){ if (!touring) return; tourTok++; touring = false; hush(); paintTour(); if (ctx) ctx.hot(null); }
  function paintTour(){ const b = $("#tourBtn"); b.setAttribute("aria-pressed", touring ? "true" : "false"); b.textContent = touring ? "⏹ أوقف الشرح" : "▶ شغّل الشرح"; }
  function paintPause(){ const b = $("#pauseBtn"); b.setAttribute("aria-pressed", paused ? "true" : "false"); b.textContent = paused ? "▶" : "⏸"; b.setAttribute("aria-label", paused ? "شغّل الحركة" : "أوقف الحركة"); }
  function paintSound(){ const b = $("#sndBtn"), on = soundOn(); b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", "الأصوات والقراءة: " + (on ? "شغّالة" : "مقفلة")); }

  function start(){
    /* the scene buttons, lesson by lesson */
    const nav = $("#scenes"), les = [...new Set(SCENES.map(s => s.les))];
    const LES = {2:"الدرس 2 · الدعامة والحركة", 3:"الدرس 3 · الطاقة والفضلات", 4:"الدرس 4 · نقل المواد", 5:"الدرس 5 · التحكم والحواس"};
    nav.innerHTML = les.map(n => '<div class="sgroup"><span class="slabel">' + LES[n] + '</span><div class="schips">' + SCENES.filter(s => s.les === n).map(s =>
      '<button type="button" data-id="' + s.id + '" aria-pressed="false"><i aria-hidden="true">' + s.icon + '</i><span>' + s.title + '<small dir="ltr">' + s.en + '</small></span></button>').join("") + '</div></div>').join("");
    nav.addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (b){ sfx("tap"); open(b.dataset.id); const v = $("#stage"); if (v.getBoundingClientRect().top < 0 || v.getBoundingClientRect().top > innerHeight * .6) v.scrollIntoView({behavior:still() ? "auto" : "smooth", block:"start"}); } });
    $("#sndBtn").addEventListener("click", () => { const on = !soundOn(); if (window.MonmonRewards && MonmonRewards.sound) MonmonRewards.sound(on); else mute = !on; if (!on) hush(); paintSound(); });
    paintSound();
    if (!window.THREE || !initGL()){ $("#nogl").hidden = false; $("#gl").hidden = true; $("#side").hidden = true; document.body.classList.add("no-gl"); return; }
    $("#tourBtn").addEventListener("click", runTour);
    $("#pauseBtn").addEventListener("click", () => { paused = !paused; paintPause(); });
    $("#zin").addEventListener("click", () => { orb.dist = clamp(orb.dist * .85, orb.min, orb.max); });
    $("#zout").addEventListener("click", () => { orb.dist = clamp(orb.dist * 1.18, orb.min, orb.max); });
    $("#vreset").addEventListener("click", () => { if (cur){ const c = cur.cam; ctx.look({theta:c.theta, phi:c.phi, dist:c.dist, target:c.target}, 500); } });
    $("#namesBtn").addEventListener("click", e => { namesOn = !namesOn; e.currentTarget.setAttribute("aria-pressed", namesOn ? "true" : "false"); });
    $("#sayEn").addEventListener("click", () => { if (capNow && capNow.en){ stopTour(); say(capNow.en, "en"); } });
    $("#sayAr").addEventListener("click", () => { if (capNow && capNow.ar){ stopTour(); say(capNow.ar, "ar").then(ok => { if (!ok && soundOn() && window.MonmonVoice && MonmonVoice.open) MonmonVoice.open("ar"); }); } });
    document.addEventListener("visibilitychange", () => { if (document.hidden){ stopTour(); hush(); } });
    window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (BY[id] && (!cur || cur.id !== id)) open(id, true); });
    open(BY[location.hash.slice(1)] ? location.hash.slice(1) : SCENES[0].id, true);
    requestAnimationFrame(frame);
  }
  return {scene(def){ SCENES.push(def); BY[def.id] = def; }, start, K, sfx, get cur(){ return cur; }, get ctx(){ return ctx; }, get orb(){ return orb; }, get touring(){ return touring; }, runTour, stopTour, open,
    setPaused(v){ paused = !!v; paintPause(); }, setSpeed(n){ speed = n; }, get paused(){ return paused; }, get labels(){ return labels; }};
})();
