/* 3D Body Lab: the scenes (science/lab-3d). Each scene builds its model from simple shapes, gives it controls and a
   guided tour. The English sentences follow the lessons of Science Quiz 2 as written on science/quiz-2 (own words, not the
   book's text); the Arabic lines explain them simply. The models are simplified drawings, not medical pictures. */
"use strict";
(() => {
const K = Lab.K, V = K.V, lerp = K.lerp, clamp = K.clamp;
const rad = d => d * Math.PI / 180;
const TAU = Math.PI * 2;
const hexLerp = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(k, 0, 1));
/* green → yellow → red as a ligament stretches */
const stretchColor = s => s < .12 ? hexLerp(0x3CCB8F, 0xFFD23F, s / .12) : hexLerp(0xFFD23F, 0xFF5A5A, (s - .12) / .14);
const pct = s => (s >= 0 ? "+" : "") + Math.round(s * 100) + "%";

/* ====================================================================== LESSON 2 */
/* ---------- joints and ligaments: the three movable joints, each with its ligaments ---------- */
Lab.scene({
  id:"joints", les:2, icon:"🦴", title:"Joints and ligaments", ar:"المفاصل والأربطة", topic:"l2-joint",
  cam:{target:[0, 2.45, 0], dist:7.4, theta:.75, phi:1.3}, floor:[0, 0, 0, 4.5],
  intro:{t:"Joints and ligaments · المفاصل والأربطة",
    en:"A <b>joint</b> is a place where two or more bones meet. <b>Ligaments</b> connect bone to bone at a joint: they stretch when the joint moves and keep the bones from shifting apart.",
    ar:"المفصل (<b class=t>joint</b>) هو مكان التقاء عظمين أو أكثر، وهو اللي يخلّي الهيكل يتحرك. والأربطة (<b class=t>ligaments</b>)، وهي الأشرطة الخضراء، تربط العظم بالعظم: تتمدّد مع الحركة وتمنع العظام (<b class=t>bones</b>) تنفصل. اختر مفصل وحرّكه بنفسك."},
  build(c){
    const bone = K.bone(), cart = K.cartilage(), dark = K.flat(0x2A2440);
    const G = {ball:new THREE.Group(), hinge:new THREE.Group(), pivot:new THREE.Group()};
    c.root.add(G.ball, G.hinge, G.pivot);
    let mode = "ball", ligOn = true, apart = 0, wobble = 0;
    const bands = {ball:[], hinge:[], pivot:[]};
    const band = (g, list, spec) => { const m = K.ribbon(new THREE.MeshStandardMaterial({color:0x3CCB8F, roughness:.5, side:THREE.DoubleSide})); g.add(m); list.push(Object.assign({m, L0:0}, spec)); };

    /* 1. ball-and-socket (like the hip): a ball turns in a cup */
    const C = V(0, 3.05, 0);
    /* the cup is cut open at the front, so the ball shows inside it */
    const CUT0 = 3.2, CUTL = TAU - 1.75;
    const cup = K.mesh(new THREE.SphereGeometry(.7, 36, 16, CUT0, CUTL, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color:0xEFE5CF, roughness:.62, side:THREE.DoubleSide}), C.x, C.y, C.z);
    const cupIn = K.mesh(new THREE.SphereGeometry(.585, 36, 16, CUT0, CUTL, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({color:0xA8D9EF, roughness:.3, clearcoat:.5, side:THREE.DoubleSide}), C.x, C.y, C.z);
    const wing = K.blob(bone, -.35, 4.2, -.55, 1.25, .8, .2); wing.rotation.set(-.25, .3, .2);
    G.ball.add(cup, cupIn, K.blob(bone, -.1, 3.78, -.2, 1.15, .3, .75), wing);
    const mb = new THREE.Group(); mb.position.copy(C); G.ball.add(mb);
    mb.add(K.mesh(new THREE.SphereGeometry(.5, 32, 24), bone), K.mesh(new THREE.SphereGeometry(.515, 32, 12, 0, TAU, 0, Math.PI * .42), cart));
    const neck = K.mesh(new THREE.CylinderGeometry(.2, .17, .5, 20), bone, 0, -.62, 0); mb.add(neck);
    const shaft = K.mesh(K.boneGeo(2.0, .15, .3), bone, 0, -.78, 0); shaft.rotation.x = Math.PI; mb.add(shaft);
    for (let i = 0; i < 6; i++){ const a = i / 6 * TAU + .3, dir = V(Math.cos(a), 0, Math.sin(a));
      band(G.ball, bands.ball, {p0:() => C.clone().addScaledVector(dir, .7).setY(C.y + .02), p1:() => mb.localToWorld(V(dir.x * .21, -.82, dir.z * .21)), out:dir, bow:.34, w:.085}); }

    /* 2. hinge (like the elbow): back and forth, one direction */
    const H = V(0, 2.7, 0);
    const hum = K.mesh(K.boneGeo(1.9, .15, .25), bone, 0, 2.78, 0);
    const pin = K.mesh(new THREE.CylinderGeometry(.27, .27, .8, 28), cart, H.x, H.y, H.z); pin.rotation.z = Math.PI / 2;
    G.hinge.add(hum, pin, K.blob(bone, -.44, 2.82, 0, .17, .2, .2), K.blob(bone, .44, 2.82, 0, .17, .2, .2));
    const mh = new THREE.Group(); mh.position.copy(H); G.hinge.add(mh);
    const clampRing = K.mesh(new THREE.TorusGeometry(.4, .12, 14, 28, Math.PI * 1.1), bone); clampRing.rotation.set(0, Math.PI / 2, 0);
    const clampG = new THREE.Group(); clampG.rotation.x = rad(60); clampG.add(clampRing); mh.add(clampG);
    const fore = K.mesh(K.boneGeo(2.0, .13, .22), bone, 0, -.42, 0); fore.rotation.x = Math.PI; mh.add(fore);
    [-1, 1].forEach(s => band(G.hinge, bands.hinge, {p0:() => V(s * .5, H.y + .05, -.18), p1:() => mh.localToWorld(V(s * .3, -.62, 0)), out:V(s, 0, 0), bow:.12, w:.09}));

    /* 3. pivot (like the neck): one bone turns on another */
    const P = V(0, 2.42, 0);
    [1.05, 1.5, 1.95].forEach((y, i) => { G.pivot.add(K.mesh(new THREE.CylinderGeometry(.5, .5, .3, 28), bone, 0, y, 0), K.mesh(new THREE.BoxGeometry(.16, .16, .5), bone, 0, y, -.62));
      if (i < 2) G.pivot.add(K.mesh(new THREE.CylinderGeometry(.46, .46, .15, 28), cart, 0, y + .225, 0)); });
    G.pivot.add(K.mesh(new THREE.CylinderGeometry(.14, .16, .62, 18), bone, 0, 2.4, 0), K.mesh(new THREE.SphereGeometry(.14, 16, 12), bone, 0, 2.71, 0));
    const mp = new THREE.Group(); mp.position.copy(P); G.pivot.add(mp);
    const ring = K.mesh(new THREE.TorusGeometry(.42, .13, 14, 36), bone); ring.rotation.x = Math.PI / 2;
    mp.add(ring, K.blob(bone, -.62, 0, 0, .26, .12, .2), K.blob(bone, .62, 0, 0, .26, .12, .2), K.blob(bone, -.25, .22, 0, .14, .14, .14), K.blob(bone, .25, .22, 0, .14, .14, .14));
    mp.add(K.blob(bone, 0, 1.3, 0, .8, .86, .92, 36), K.blob(bone, 0, .68, .36, .5, .27, .5), K.blob(dark, -.28, 1.26, .74, .17, .19, .12), K.blob(dark, .28, 1.26, .74, .17, .19, .12));
    const nose = K.mesh(new THREE.ConeGeometry(.09, .2, 3), dark, 0, 1.0, .84); mp.add(nose);
    for (let i = -3; i <= 3; i++) mp.add(K.mesh(new THREE.BoxGeometry(.085, .12, .05), K.flat(0xFFFFFF, {roughness:.3}), i * .1, .74, .8 - Math.abs(i) * .022));
    [-1, 1].forEach(s => band(G.pivot, bands.pivot, {p0:() => V(s * .47, 1.52, 0), p1:() => mp.localToWorld(V(s * .46, -.06, 0)), out:V(s, 0, 0), bow:.12, w:.085}));

    /* the controls */
    const status = c.ui.note("", "badge ok");
    const seg = c.ui.seg({label:"Kind of joint", value:"ball", opts:[
      {k:"ball", label:'Ball-and-socket<small>كروي حُقّي</small>'}, {k:"hinge", label:'Hinge<small>رزّي</small>'}, {k:"pivot", label:'Pivot<small>محوري</small>'}],
      on:k => setMode(k)});
    const pad = c.ui.pad({label:"Move the circle: the bone moves in nearly all directions", on:(x, y, q) => { mb.rotation.set(y * .85, 0, -x * .85); if (!q) creak(); }});
    const sH = c.ui.slider({label:"Bend the joint", min:0, max:140, value:0, fmt:v => Math.round(v) + "°", on:(v, q) => { mh.rotation.x = -rad(v); if (!q) creak(); }});
    const sP = c.ui.slider({label:"Turn the head left and right", min:-70, max:70, value:0, fmt:v => Math.round(v) + "°", on:(v, q) => { mp.rotation.y = rad(v); if (!q) creak(); }});
    const [bAuto, bSide] = c.ui.buttons([{label:"🤸 Move it for me", cls:"go", on:() => auto()}, {label:"🚫 Try to bend it sideways", on:() => sideways()}]);
    const tg = c.ui.toggle({off_label:"🛡️ Bring the ligaments back", on_label:"😱 What if the ligaments vanish?", value:true, cls:"warn", on:(v, q) => setLig(v, q)});
    let lastCreak = 0;
    function creak(){ const n = performance.now(); if (n - lastCreak > 260){ lastCreak = n; c.sfx(mode === "ball" ? "whirr" : mode === "hinge" ? "creak" : "swish"); } }

    const INFO = {
      ball:{t:"1 · Ball-and-socket joint · المفصل الكروي الحُقّي", en:"<b>Ball-and-socket joint:</b> a ball turns in a cup, so it moves and rotates in nearly all directions. Examples: <b>hips, shoulders</b>.",
        ar:"رأس العظم كرة (<b class=t>ball</b>) تدور داخل تجويف يشبه الكوب (<b class=t>socket</b>)، فيتحرك العظم في كل الاتجاهات تقريبًا. مثاله: الورك (<b class=t>hip</b>) والكتف (<b class=t>shoulder</b>). جرّب: دوّر ذراعك من الكتف مثل المروحة."},
      hinge:{t:"2 · Hinge joint · المفصل الرزّي", en:"<b>Hinge joint:</b> it bends back and forth in one direction, like a door. Examples: <b>elbows, knees, fingers</b>.",
        ar:"مثل مفصلة الباب: ينثني وينفرد في اتجاه واحد فقط. مثاله: الكوع (<b class=t>elbow</b>) والركبة (<b class=t>knee</b>) والأصابع (<b class=t>fingers</b>). جرّب تثنيه بالعرض وشوف إيش يصير!"},
      pivot:{t:"3 · Pivot joint · المفصل المحوري", en:"<b>Pivot joint:</b> it lets one bone turn on another. Examples: the <b>neck</b>, and below the elbow (turning the lower arm).",
        ar:"عظم يدور حول عظم ثابت مثل الحلقة حول الوتد. مثاله: الرقبة (<b class=t>neck</b>) لما تلفّ راسك وتقول «لا»، وتحت الكوع (<b class=t>elbow</b>) لما تقلب كفّك."}};
    function setMode(k, quiet){
      mode = k; for (const n in G) G[n].visible = n === k;
      pad.el.hidden = k !== "ball"; sH.el.hidden = k !== "hinge"; sP.el.hidden = k !== "pivot"; bSide.hidden = k !== "hinge";
      if (!ligOn) tg.set(true, true);
      apart = 0;
      if (!quiet){ c.info(INFO[k]); c.sfx("pop"); c.look({theta:k === "hinge" ? 1.15 : .75, phi:1.3, dist:7.4, target:[0, 2.45, 0]}, 600); }
    }
    function setLig(v, quiet){
      ligOn = v; const from = apart, to = v ? 0 : 1;
      if (!quiet){
        c.sfx(v ? "power" : "boing");
        c.info(v ? {t:"The ligaments are back 🛡️ · رجعت الأربطة", en:"<b>Ligaments connect bone to bone</b> at a joint and keep the bones from shifting apart.", ar:"رجعت الأربطة (<b class=t>ligaments</b>) ومسكت العظمين مع بعض. بدونها المفصل (<b class=t>joint</b>) ما يثبت."}
                 : {t:"No ligaments 😱 · بدون أربطة", en:"Without ligaments, the <b>bones shift apart</b>: nothing holds them together at the joint.", ar:"شوف! لما اختفت الأربطة (<b class=t>ligaments</b>) انفصل العظم وطاح من مكانه. عشان كذا نقول: الأربطة تمنع العظام (<b class=t>bones</b>) تنفصل."});
      }
      c.tween(quiet ? 0 : 700, k => { apart = lerp(from, to, k); });
    }
    function auto(){
      c.sfx("whoosh");
      if (mode === "ball") return c.tween(4200, k => { const a = k * TAU * 2, r = Math.sin(k * Math.PI); pad.set(Math.cos(a) * r, Math.sin(a) * r, true); if (k === 1) pad.set(0, 0, true); }, null);
      if (mode === "hinge") return c.tween(3600, k => sH.set(130 * Math.pow(Math.sin(k * Math.PI * 2 - Math.PI / 2) * .5 + .5, 1), true), null);
      return c.tween(3600, k => sP.set(65 * Math.sin(k * TAU * 1.5), true), null);
    }
    function sideways(){
      c.sfx("wrong"); status.className = "note badge bad"; status.textContent = "🚫 It won't bend sideways! One direction only";
      c.info({t:"One direction only · اتجاه واحد فقط", en:"A hinge joint moves <b>back and forth in one direction</b> only. It cannot bend sideways.", ar:"الكوع (<b class=t>elbow</b>) والركبة (<b class=t>knee</b>) ما ينثنون بالعرض. المفصل الرزّي (<b class=t>hinge joint</b>) يتحرك للأمام والخلف فقط، مثل الباب."});
      return c.tween(700, k => { wobble = Math.sin(k * Math.PI * 6) * .11 * (1 - k); }, null).then(() => { wobble = 0; });
    }
    c.label("Joint", () => mode === "ball" ? C : mode === "hinge" ? H : P, {dx:-64, dy:-6});
    c.label("Ligaments", () => mode === "ball" ? V(.78, 2.55, .3) : mode === "hinge" ? V(.62, 2.3, 0) : V(.62, 1.95, 0), {dx:52, show:() => apart < .5, cls:"dim"});
    c.label("Ball", () => mb.getWorldPosition(V()), {dy:16, dx:40, show:() => mode === "ball"});
    c.label("Cup (socket)", V(0, 3.75, .9), {show:() => mode === "ball", dy:-14});
    c.label("One direction", () => mh.localToWorld(V(0, -2.2, 0)), {show:() => mode === "hinge", dy:24});
    c.label("This bone turns", () => mp.localToWorld(V(0, 2.3, 0)), {show:() => mode === "pivot", dy:-10});
    c.label("This bone stays still", V(0, 1.2, .55), {show:() => mode === "pivot", dy:10, cls:"dim"});
    setMode("ball", true);

    c.tour = [
      {t:"Joint · المفصل", en:"A joint is a place where two or more bones meet. Joints make the skeleton flexible.", ar:"المفصل (<b class=t>joint</b>) مكان التقاء عظمين أو أكثر، وهو اللي يخلّي الهيكل العظمي (<b class=t>skeleton</b>) مرن ويتحرك.", run:async () => { seg.set("ball"); await c.wait(900); }},
      {t:"Ligaments · الأربطة", en:"Ligaments connect bone to bone at a joint. They stretch when the joint moves.", ar:"الأربطة (<b class=t>ligaments</b>) الخضراء تربط العظم بالعظم. شوفها تتمدّد ويتغيّر لونها لما يتحرك المفصل (<b class=t>joint</b>).", run:() => c.tween(3200, k => pad.set(Math.sin(k * TAU) * .95, Math.sin(k * TAU * 2) * .3, true), null)},
      {t:"Without ligaments · بدون أربطة", en:"Ligaments keep the bones from shifting apart.", ar:"لو اختفت الأربطة (<b class=t>ligaments</b>) ينفصل العظم عن مكانه. الأربطة تمنع العظام (<b class=t>bones</b>) تنفصل.", run:async () => { pad.set(0, 0, true); tg.set(false); await c.wait(2400); tg.set(true); await c.wait(900); }},
      {t:"1 · Ball-and-socket · كروي حُقّي", en:"Ball-and-socket joint: a ball turns in a cup, in nearly all directions. Hips and shoulders.", ar:"كرة (<b class=t>ball</b>) تدور في كوب (<b class=t>socket</b>): حركة في كل الاتجاهات تقريبًا. الورك (<b class=t>hip</b>) والكتف (<b class=t>shoulder</b>).", run:() => auto()},
      {t:"2 · Hinge · رزّي", en:"Hinge joint: it bends back and forth in one direction. Elbows, knees and fingers.", ar:"ينثني وينفرد في اتجاه واحد مثل الباب. الكوع (<b class=t>elbow</b>) والركبة (<b class=t>knee</b>) والأصابع (<b class=t>fingers</b>).", run:async () => { seg.set("hinge"); await c.wait(700); await auto(); }},
      {t:"3 · Pivot · محوري", en:"Pivot joint: one bone turns on another. The neck, and below the elbow.", ar:"عظم يدور حول عظم ثاني. الرقبة (<b class=t>neck</b>)، وتحت الكوع (<b class=t>elbow</b>) لما تقلب كفّك.", run:async () => { seg.set("pivot"); await c.wait(700); await auto(); }}
    ];
    const pc = V(), mid = V();
    return {update(){
      c.root.updateMatrixWorld(true);
      /* without ligaments the moving bone drops away from the fixed one */
      mb.position.set(C.x + apart * .25, C.y - apart * .75, C.z + apart * .2);
      mh.position.set(H.x + apart * .45, H.y - apart * .6, H.z + apart * .15); mh.rotation.z = wobble + apart * .35;
      mp.position.set(P.x + apart * .55, P.y - apart * .15, P.z + apart * .4); mp.rotation.z = -apart * .5;
      let top = 0;
      for (const b of bands[mode]){
        b.m.visible = apart < .02; if (!b.m.visible) continue;
        const p0 = b.p0(), p1 = b.p1(); mid.addVectors(p0, p1).multiplyScalar(.5); pc.copy(mid).addScaledVector(b.out, b.bow);
        const straight = p0.distanceTo(p1);
        if (!b.L0) b.L0 = straight;
        const s = Math.max(0, straight / b.L0 - 1); top = Math.max(top, s);
        b.m.update(p0, pc, p1, b.w / Math.sqrt(1 + s), b.out); b.m.material.color.copy(stretchColor(s));
      }
      if (apart > .5){ status.className = "note badge bad"; status.textContent = "⚠️ No ligaments: the bones shifted apart"; }
      else if (!wobble){ status.className = "note badge ok"; status.textContent = "✅ The ligaments hold the bones · stretch: " + pct(top); }
    }};
  }
});

/* ---------- the arm: muscles pull on bones, and the elbow is the fixed point of a lever ---------- */
Lab.scene({
  id:"arm", les:2, icon:"💪", title:"Muscles and movement", ar:"العضلات تحرّك العظام", topic:"l2-musc",
  cam:{target:[0, 2.2, .5], dist:6.6, theta:1.25, phi:1.36}, floor:[0, -.6, .4, 4],
  intro:{t:"Muscles and movement · العضلات تحرّك العظام",
    en:"When a muscle <b>contracts</b>, its cells get <b>shorter</b> and thicker. Muscles can only <b>pull</b>, not push, so they work in pairs.",
    ar:"العضلة (<b class=t>muscle</b>) لما تنقبض (<b class=t>contracts</b>) تقصر وتسمن وتسحب العظم. العضلات (<b class=t>muscles</b>) تسحب فقط وما تدفّ، عشان كذا تشتغل أزواج: وحدة تثني ووحدة تفرد. حرّك الشريط وراقب العضلتين."},
  build(c){
    const bone = K.bone(), skinM = K.flat(0xE8B894, {roughness:.6});
    const S = V(0, 3.7, 0), E = V(0, 1.7, 0);
    const g = c.root;
    const hum = K.mesh(K.boneGeo(2.0, .14, .24), bone, 0, S.y, 0); hum.rotation.x = Math.PI; g.add(hum);
    g.add(K.blob(bone, 0, 3.95, -.25, .6, .5, .16), K.blob(bone, 0, 3.78, 0, .3, .3, .3));
    const fa = new THREE.Group(); fa.position.copy(E); g.add(fa);
    [-.1, .1].forEach(x => { const b = K.mesh(K.boneGeo(1.75, .08, .14), bone, x, -.06, 0); b.rotation.x = Math.PI; fa.add(b); });
    fa.add(K.blob(bone, 0, .12, -.17, .15, .2, .15));
    const hand = new THREE.Group(); hand.position.set(0, -2.02, 0); fa.add(hand);
    hand.add(K.blob(skinM, 0, 0, 0, .21, .27, .1));
    for (let i = 0; i < 4; i++){ const f = K.mesh(new THREE.CapsuleGeometry(.045, .2, 4, 10), skinM, -.14 + i * .095, -.38, 0); hand.add(f); }
    const thumb = K.mesh(new THREE.CapsuleGeometry(.05, .16, 4, 10), skinM, .25, -.08, .03); thumb.rotation.z = -.7; hand.add(thumb);
    /* a dumbbell he can add */
    const db = new THREE.Group(), iron = new THREE.MeshStandardMaterial({color:0x4A5568, roughness:.35, metalness:.7});
    const bar = K.mesh(new THREE.CylinderGeometry(.05, .05, .9, 14), iron); bar.rotation.z = Math.PI / 2; db.add(bar);
    [-.42, .42].forEach(x => { const w = K.mesh(new THREE.CylinderGeometry(.22, .22, .16, 24), iron, x, 0, 0); w.rotation.z = Math.PI / 2; db.add(w); });
    db.position.set(0, -.2, .12); db.visible = false; hand.add(db);
    /* the two muscles */
    const mk = () => { const m = K.mesh(K.spindleGeo(), K.muscle()); m.material.emissive = new THREE.Color(0xFF2A1A); m.material.emissiveIntensity = 0; g.add(m); return m; };
    const bi = mk(), tri = mk();
    const biO = V(0, 3.52, .27), triO = V(0, 3.52, -.27), biL = V(0, -.46, .13), triL = V(0, .17, -.24);
    let biL0 = 0, triL0 = 0, ang = 0, prev = 0, dir = 0, calm = 0;
    /* see-through skin */
    const skin = new THREE.Group(), sm = K.glass(0xF2C9A8, .2, {side:THREE.FrontSide});
    const up = K.mesh(new THREE.CapsuleGeometry(.42, 1.5, 8, 20), sm, 0, 2.7, 0), lo = K.mesh(new THREE.CapsuleGeometry(.3, 1.5, 8, 20), sm, 0, -.95, 0);
    skin.add(up); fa.add(lo); skin.traverse(o => { o.renderOrder = 10; }); lo.renderOrder = 10; g.add(skin);

    const status = c.ui.note("", "badge ok");
    const sA = c.ui.slider({label:"Bend the elbow", min:0, max:135, value:20, fmt:v => Math.round(v) + "°", on:v => { ang = v; }});
    c.ui.buttons([{label:"💪 Bend and straighten", cls:"go", on:() => { c.sfx("whoosh"); c.tween(4200, k => sA.set(8 + 122 * (Math.sin(k * TAU * 1.5 - Math.PI / 2) * .5 + .5), true), null); }}]);
    const row = c.ui.row();
    c.ui.toggle({into:row, off_label:"🏋️ Hold a weight", on_label:"🏋️ Put the weight down", value:false, on:v => { db.visible = v; if (v) c.sfx("click"); }});
    c.ui.toggle({into:row, off_label:"👁️ Show the skin", on_label:"👁️ Hide the skin", value:true, on:v => { up.visible = lo.visible = v; }});
    const lBi = c.label("Biceps", () => V(0, 3.0, .5), {pick:"bi", dx:-24, dy:-34}), lTri = c.label("Triceps", () => V(0, 2.5, -.5), {pick:"tri", dx:30, dy:30});
    c.label("Joint: the fixed point", E, {dx:-70, dy:22, cls:"dim"});
    c.label("Bone: the lever", () => fa.localToWorld(V(0, -1.2, 0)), {dy:26, cls:"dim"});
    c.pick(bi, "bi"); c.pick(tri, "tri");
    c.onPick = k => c.info(k === "bi"
      ? {t:"Biceps · العضلة الأمامية", en:"The <b>biceps</b> contracts and pulls the lower arm <b>up</b>. Its cells get shorter and thicker.", ar:"العضلة اللي قدّام (<b class=t>biceps</b>): لما تنقبض (<b class=t>contracts</b>) تقصر وتسمن وتسحب الساعد (<b class=t>lower arm</b>) لفوق، فينثني الكوع (<b class=t>elbow</b>)."}
      : {t:"Triceps · العضلة الخلفية", en:"The <b>triceps</b> contracts and pulls the lower arm <b>back down</b>. A muscle cannot push, so another muscle must pull the other way.", ar:"العضلة اللي ورا (<b class=t>triceps</b>): لما تنقبض (<b class=t>contracts</b>) تسحب الساعد (<b class=t>lower arm</b>) وتفرد الذراع. العضلة ما تدفّ، فلازم عضلة ثانية تسحب بالعكس."});
    c.tour = [
      {en:"A muscle is strong tissue that contracts to make the body move. Bones move when the muscles attached to them contract.", ar:"العضلة (<b class=t>muscle</b>) نسيج قوي ينقبض فيحرّك الجسم. العظم يتحرك لما تنقبض (<b class=t>contracts</b>) العضلة المربوطة فيه.", run:() => c.tween(1200, k => sA.set(lerp(sA.get(), 10, k), true))},
      {t:"Contract · الانقباض", en:"When the biceps contracts, its cells get shorter and thicker, and it pulls the lower arm up.", ar:"العضلة الأمامية (<b class=t>biceps</b>) تنقبض (<b class=t>contracts</b>): تقصر وتسمن وتسحب الساعد (<b class=t>lower arm</b>) لفوق.", hot:"bi", run:() => c.tween(2600, k => sA.set(lerp(10, 130, k), true))},
      {t:"Relax · الانبساط", en:"When a muscle relaxes, its cells go back to their original length.", ar:"ولما ترتخي (<b class=t>relaxes</b>) العضلة (<b class=t>muscle</b>) ترجع لطولها الأصلي.", run:() => c.wait(1500)},
      {t:"Pull, not push · تسحب ولا تدفّ", en:"Muscles can only pull, not push. So the triceps pulls the arm straight again.", ar:"العضلات (<b class=t>muscles</b>) تسحب فقط. عشان يرجع الذراع مفرود، تنقبض (<b class=t>contracts</b>) العضلة الخلفية (<b class=t>triceps</b>) وتسحبه.", hot:"tri", run:() => c.tween(2600, k => sA.set(lerp(130, 10, k), true))},
      {t:"A lever · الرافعة", en:"Bones and muscles work like a lever: the bone turns around a fixed point, which is the joint.", ar:"العظم والعضلة (<b class=t>muscle</b>) مثل الرافعة (<b class=t>lever</b>): العظم يدور حول نقطة ثابتة هي المفصل (<b class=t>joint</b>)، يعني الكوع (<b class=t>elbow</b>).", run:() => c.tween(3000, k => sA.set(10 + 110 * Math.sin(k * Math.PI), true), null)}
    ];
    const I = V();
    return {update(dt, t, real){
      fa.rotation.x = -rad(ang); fa.updateMatrixWorld(true);
      const d = ang - prev; prev = ang;
      if (Math.abs(d) > .02){ dir = d > 0 ? 1 : -1; calm = 0; } else { calm += real; if (calm > .7) dir = 0; }
      fa.localToWorld(I.copy(biL)); let len = I.distanceTo(biO); if (!biL0) biL0 = fa.position.clone().add(biL).distanceTo(biO);
      K.between(bi, biO, I, .46 * Math.pow(biL0 / len, 1.25)); const biK = len / biL0;
      fa.localToWorld(I.copy(triL)); len = I.distanceTo(triO); if (!triL0) triL0 = fa.position.clone().add(triL).distanceTo(triO);
      K.between(tri, triO, I, .5 * Math.pow(triL0 / len, 1.6)); const triK = len / triL0;
      bi.material.emissiveIntensity = lerp(bi.material.emissiveIntensity, dir > 0 ? .55 : 0, .15);
      tri.material.emissiveIntensity = lerp(tri.material.emissiveIntensity, dir < 0 ? .55 : 0, .15);
      lBi.el.textContent = "Biceps " + Math.round(biK * 100) + "%" + (dir > 0 ? " · contracts" : dir < 0 ? " · relaxes" : "");
      lTri.el.textContent = "Triceps " + Math.round(triK * 100) + "%" + (dir < 0 ? " · contracts" : dir > 0 ? " · relaxes" : "");
      status.textContent = dir > 0 ? "⬆️ The biceps contracts and pulls" : dir < 0 ? "⬇️ The triceps contracts and pulls" : "Move the slider and watch the two muscles";
    }};
  }
});

/* ---------- the skeleton: its five jobs, shown on a whole skeleton ---------- */
Lab.scene({
  id:"skeleton", les:2, icon:"💀", title:"What the skeleton does", ar:"وظائف الهيكل العظمي", topic:"l2-skel",
  cam:{target:[0, 2.15, 0], dist:7.3, theta:.5, phi:1.4}, floor:[0, 0, 0, 3.6],
  intro:{t:"What the skeleton does · وظائف الهيكل العظمي",
    en:"The skeleton gives <b>support</b> and shape, works with muscles for <b>movement</b>, <b>protects</b> organs, <b>makes red blood cells</b> and <b>stores calcium</b>.",
    ar:"الهيكل العظمي (<b class=t>skeleton</b>) له خمس وظائف: يسند الجسم، ويحرّكه مع العضلات (<b class=t>muscles</b>)، ويحمي الأعضاء، ويصنع خلايا الدم الحمراء (<b class=t>red blood cells</b>)، ويخزّن الكالسيوم (<b class=t>calcium</b>). اضغط على كل وظيفة وشوفها قدّامك."},
  build(c){
    const sk = new THREE.Group(); c.root.add(sk);
    const M = n => { const m = K.bone(); m.transparent = true; m.emissive = new THREE.Color(0xFFFFFF); m.emissiveIntensity = 0; m.name = n; return m; };
    const mSkull = M("skull"), mRib = M("rib"), mSpine = M("spine"), mLimb = M("limb"), dark = K.flat(0x2A2440);
    /* skull and brain */
    const head = new THREE.Group(); head.position.set(0, 3.84, 0); sk.add(head);
    const cran = K.blob(mSkull, 0, 0, 0, .3, .34, .34, 32); head.add(cran, K.blob(mSkull, 0, -.27, .1, .19, .1, .2), K.blob(dark, -.11, 0, .29, .07, .08, .05), K.blob(dark, .11, 0, .29, .07, .08, .05));
    const brain = K.blob(K.organ(0xF2A7B8, {emissive:0xFF5A8A, emissiveIntensity:0}), 0, .04, -.02, .24, .25, .28); head.add(brain);
    /* backbone and spinal cord */
    const spineC = K.curve([[0, 3.48, -.1], [0, 3.1, -.2], [0, 2.6, -.24], [0, 2.2, -.16], [0, 1.9, -.12]]);
    for (let i = 0; i < 17; i++){ const p = spineC.getPointAt(i / 16); sk.add(K.mesh(new THREE.CylinderGeometry(.075, .075, .075, 12), mSpine, p.x, p.y, p.z)); }
    const cord = K.mesh(K.tubeVar(spineC, 24, 8, .032), K.glow(0xFFD23F)); cord.visible = false; sk.add(cord);
    /* rib cage, heart and lungs */
    const ribs = new THREE.Group(); sk.add(ribs);
    [.3, .37, .42, .45, .46, .44, .4, .34].forEach((R, i) => { const r = K.mesh(new THREE.TorusGeometry(R, .027, 6, 30), mRib, 0, 3.14 - i * .135, .02); r.rotation.x = Math.PI / 2 + .24; r.scale.set(1, .74, 1); ribs.add(r); });
    const stern = K.mesh(new THREE.BoxGeometry(.09, .6, .04), mRib, 0, 2.86, .36); stern.rotation.x = -.12; ribs.add(stern);
    const heart = K.blob(K.organ(0xD93A3A, {emissive:0xFF2222, emissiveIntensity:0}), .07, 2.74, .1, .12, .14, .11);
    const lungM = K.organ(0xF2A0AE, {emissive:0xFF7799, emissiveIntensity:0});
    sk.add(heart, K.blob(lungM, -.2, 2.76, 0, .13, .3, .17), K.blob(lungM, .22, 2.8, 0, .12, .26, .17));
    /* shoulders, hips, arms and legs */
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, .5, 0);
    [-1, 1].forEach(s => { const m = K.mesh(cyl, mLimb); K.between(m, V(s * .05, 3.2, .3), V(s * .58, 3.24, 0), .03); sk.add(m); });
    const hipL = K.blob(mLimb, -.21, 1.84, 0, .25, .27, .13), hipR = K.blob(mLimb, .21, 1.84, 0, .25, .27, .13); hipL.rotation.z = -.4; hipR.rotation.z = .4;
    sk.add(hipL, hipR, K.blob(mLimb, 0, 1.86, -.1, .12, .17, .08));
    const limb = (x, y, L1, L2, r, foot) => {
      const top = new THREE.Group(); top.position.set(x, y, 0); sk.add(top);
      const a = K.mesh(K.boneGeo(L1, r, r * 1.7), mLimb); a.rotation.x = Math.PI; top.add(a);
      const mid = new THREE.Group(); mid.position.set(0, -L1 - .03, 0); top.add(mid);
      const b = K.mesh(K.boneGeo(L2, r * .8, r * 1.4), mLimb); b.rotation.x = Math.PI; mid.add(b);
      mid.add(foot ? K.blob(mLimb, 0, -L2 - .04, .1, .08, .05, .18) : K.blob(mLimb, 0, -L2 - .1, 0, .07, .11, .04));
      const jt = K.blob(K.cartilage(), 0, 0, 0, r * 1.5, r * 1.5, r * 1.5), jm = K.blob(K.cartilage(), 0, 0, 0, r * 1.4, r * 1.4, r * 1.4); top.add(jt); mid.add(jm);
      return {top, mid, bone:a, jt, jm};
    };
    const armL = limb(-.6, 3.22, .85, .78, .05), armR = limb(.6, 3.22, .85, .78, .05), legL = limb(-.22, 1.72, .92, .82, .06, true), legR = limb(.22, 1.72, .92, .82, .06, true);
    armL.top.rotation.z = -.13; armR.top.rotation.z = .13;
    /* a soft body around the bones, for the "support" job */
    const flesh = new THREE.Group(), fm = K.glass(0xF2C9A8, .12, {side:THREE.FrontSide});
    const torso = K.mesh(new THREE.CapsuleGeometry(.42, 1.2, 8, 20), fm, 0, 2.55, 0); torso.scale.set(1.15, 1, .7);
    flesh.add(torso, K.blob(fm, 0, 3.84, 0, .36, .42, .4), K.blob(fm, -.22, .9, 0, .17, .92, .17), K.blob(fm, .22, .9, 0, .17, .92, .17), K.blob(fm, -.68, 2.4, 0, .11, .9, .11), K.blob(fm, .68, 2.4, 0, .11, .9, .11));
    flesh.traverse(o => { o.renderOrder = 10; }); c.root.add(flesh);
    /* red blood cells coming out of the thigh bones */
    const cells = K.dots(36, .035, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.4})); c.root.add(cells);
    let job = null, jobT = 0, see = 0;   /* see: 0 = solid bones, 1 = see-through */
    const reset = () => { [armL, armR, legL, legR].forEach(l => { l.top.rotation.set(0, 0, 0); l.mid.rotation.set(0, 0, 0); }); armL.top.rotation.z = -.13; armR.top.rotation.z = .13; head.rotation.set(0, 0, 0); sk.visible = true; sk.scale.set(1, 1, 1); sk.position.y = 0; flesh.scale.set(1, 1, 1); flesh.position.y = 0; fm.opacity = .12; };
    const JOBS = {
      support:{label:"🧍 Support<small>الدعامة</small>", t:"1 · Support and shape · الدعامة والشكل", en:"<b>Support and shape:</b> the skeleton holds the body up. Without it the body would flop like gelatin.", ar:"الهيكل يسند الجسم ويعطيه شكله. بدون العظام (<b class=t>bones</b>) يطيح الجسم ويصير رخو مثل الجلي!",
        run:async () => { c.sfx("boing"); await c.tween(900, k => { sk.scale.set(1 + k * .4, 1 - k * .86, 1 + k * .4); flesh.scale.set(1 + k * .9, 1 - k * .8, 1 + k * 1.2); fm.opacity = .12 + k * .45; }); sk.visible = false;
          await c.tween(1400, k => { const w = Math.sin(k * 14) * .05 * (1 - k); flesh.scale.set(1.9 + w, .2 - w, 2.2 + w); }, null); await c.wait(500); sk.visible = true; c.sfx("power");
          await c.tween(800, k => { const q = 1 - k; sk.scale.set(1 + q * .4, 1 - q * .86, 1 + q * .4); flesh.scale.set(1 + q * .9, 1 - q * .8, 1 + q * 1.2); fm.opacity = .12 + q * .45; }); }},
      move:{label:"🏃 Movement<small>الحركة</small>", t:"2 · Movement · الحركة", en:"<b>Movement:</b> bones move when the muscles attached to them contract, so the skeletal and muscular systems work together.", ar:"العظام (<b class=t>bones</b>) تتحرك لما تسحبها العضلات (<b class=t>muscles</b>)، والمفاصل (<b class=t>joints</b>) هي اللي تخلّيها تنثني. الهيكل والعضلات يشتغلون مع بعض.",
        run:async () => { c.sfx("whoosh"); await c.tween(3600, k => { const a = Math.sin(k * TAU * 3), b = Math.sin(k * TAU * 3 + Math.PI);
            legL.top.rotation.x = -.55 * Math.max(0, a); legL.mid.rotation.x = 1.0 * Math.max(0, a); legR.top.rotation.x = -.55 * Math.max(0, b); legR.mid.rotation.x = 1.0 * Math.max(0, b);
            armL.top.rotation.x = .5 * b; armR.top.rotation.x = .5 * a; armL.mid.rotation.x = -.5; armR.mid.rotation.x = -.5; sk.position.y = Math.abs(Math.sin(k * TAU * 3)) * .04; }, null);
          reset(); await c.tween(2000, k => { armR.top.rotation.z = .13 + 2.5 * Math.min(1, k * 3); armR.mid.rotation.z = .5 * Math.sin(k * 30) * (k > .3 ? 1 : 0); }, null); reset(); }},
      protect:{label:"🛡️ Protection<small>الحماية</small>", t:"3 · Protection · الحماية", en:"<b>Protection:</b> the <b>skull</b> protects the brain, the <b>rib cage</b> protects the heart and lungs, and the backbone protects the spinal cord.", ar:"الجمجمة (<b class=t>skull</b>) خوذة تحمي المخ (<b class=t>brain</b>)، والقفص الصدري (<b class=t>rib cage</b>) يحمي القلب (<b class=t>heart</b>) والرئتين (<b class=t>lungs</b>)، والعمود الفقري (<b class=t>backbone</b>) يحمي الحبل الشوكي (<b class=t>spinal cord</b>) اللي جوّاه.",
        run:async () => { c.sfx("sparkle"); await c.tween(700, k => { see = k; }); await c.wait(3800); await c.tween(700, k => { see = 1 - k; }); }},
      blood:{label:"🩸 Production<small>صنع الدم</small>", t:"4 · Production of blood cells · صنع خلايا الدم", en:"<b>Production:</b> red blood cells are made inside the bones, in the marrow.", ar:"جوّا العظام (<b class=t>bones</b>)، في النخاع (<b class=t>marrow</b>)، تنصنع خلايا الدم الحمراء (<b class=t>red blood cells</b>). شوفها تطلع من عظم الفخذ (<b class=t>thigh bone</b>)!",
        run:async () => { c.sfx("bubbles"); await c.look({target:[0, 1.3, 0], dist:5, theta:.5, phi:1.4}, 700); await c.wait(3600); await c.look({target:[0, 2.15, 0], dist:7.3, theta:.5, phi:1.4}, 700); }},
      store:{label:"🥛 Storage<small>التخزين</small>", t:"5 · Storage · التخزين", en:"<b>Storage:</b> bones store <b>calcium</b>, for strong bones and many cell processes, and fat.", ar:"العظام (<b class=t>bones</b>) مخزن الكالسيوم (<b class=t>calcium</b>) (اللي في الحليب واللبن) عشان تبقى قوية، وتخزّن الدهون كمان.",
        run:async () => { c.sfx("ding"); await c.wait(3200); }}
    };
    const btns = c.ui.buttons(Object.keys(JOBS).map(k => ({label:JOBS[k].label, on:() => go(k)})));
    btns.forEach(b => b.classList.add("jobbtn"));
    c.ui.note("Tap a job, or tap the skull, the ribs or a joint on the model.");
    let running = 0;
    async function go(k){
      const my = ++running; job = k; jobT = 0; reset(); see = 0; c.info(JOBS[k]);
      Object.keys(JOBS).forEach((n, i) => btns[i].setAttribute("aria-pressed", n === k ? "true" : "false"));
      try { await JOBS[k].run(); }
      finally { if (my === running){ job = null; see = 0; reset(); btns.forEach(b => b.setAttribute("aria-pressed", "false")); } }
    }
    c.label("Skull", () => head.getWorldPosition(V()).add(V(0, .3, 0)), {pick:"skull", dx:50, dy:-6, show:() => job !== "protect"});
    c.label("Rib cage", V(.42, 2.9, .3), {pick:"ribs", dx:44, show:() => !job});
    c.label("Thigh bone", V(.26, 1.3, .1), {pick:"femur", dx:54, show:() => !job});
    c.label("Joint", V(-.6, 3.22, .1), {pick:"shoulder", dx:-36, cls:"dim", show:() => !job});
    c.label("Skull → brain", () => head.getWorldPosition(V()).add(V(0, .45, 0)), {show:() => job === "protect", dy:-8});
    c.label("Rib cage → heart and lungs", V(.5, 2.8, .3), {show:() => job === "protect", dx:70});
    c.label("Backbone → spinal cord", V(0, 2.2, -.25), {show:() => job === "protect", dx:-80, dy:14});
    c.label("Red blood cells", V(.5, 1.25, .2), {show:() => job === "blood", dx:50});
    ["Ca", "Ca", "Ca", "Ca"].forEach((t, i) => c.label(t, [V(-.62, 2.7, .1), V(.24, 1.2, .1), V(0, 3.0, .4), V(-.23, .5, .1)][i], {show:() => job === "store" && Math.sin(jobT * 5 + i * 1.6) > -.3, cls:"hot"}));
    /* tapping a part */
    c.pick(cran, "skull"); c.pick(ribs, "ribs"); c.pick(armL.jt, "shoulder"); c.pick(armR.jt, "shoulder"); c.pick(armL.jm, "elbow"); c.pick(armR.jm, "elbow");
    c.pick(legL.jt, "hip"); c.pick(legR.jt, "hip"); c.pick(legL.jm, "knee"); c.pick(legR.jm, "knee"); c.pick(legL.bone, "femur"); c.pick(legR.bone, "femur");
    const TAP = {
      skull:{t:"Skull · الجمجمة", en:"The <b>skull</b> protects the brain.", ar:"الجمجمة (<b class=t>skull</b>) تحمي المخ (<b class=t>brain</b>) مثل الخوذة.", run:() => go("protect")},
      ribs:{t:"Rib cage · القفص الصدري", en:"The <b>rib cage</b> protects the heart and lungs.", ar:"الأضلاع (<b class=t>ribs</b>) تحمي القلب (<b class=t>heart</b>) والرئتين (<b class=t>lungs</b>).", run:() => go("protect")},
      femur:{t:"Thigh bone · عظم الفخذ", en:"Bones support the body's weight, and <b>red blood cells</b> are made inside them.", ar:"عظم الفخذ (<b class=t>thigh bone</b>) يشيل وزن الجسم، وجوّاه تنصنع خلايا الدم الحمراء (<b class=t>red blood cells</b>).", run:() => go("blood")},
      shoulder:{t:"Shoulder · الكتف", en:"The shoulder is a <b>ball-and-socket joint</b>: it moves in nearly all directions.", ar:"الكتف (<b class=t>shoulder</b>) مفصل (<b class=t>joint</b>) كروي حُقّي (<b class=t>ball-and-socket</b>): يتحرك في كل الاتجاهات تقريبًا.", run:() => c.tween(2400, k => { armR.top.rotation.set(Math.sin(k * TAU * 2) * 1.2 * Math.sin(k * Math.PI), 0, .13 + 1.3 * Math.sin(k * Math.PI)); }, null).then(reset)},
      elbow:{t:"Elbow · الكوع", en:"The elbow is a <b>hinge joint</b>: it bends back and forth in one direction.", ar:"الكوع (<b class=t>elbow</b>) مفصل رزّي (<b class=t>hinge joint</b>): ينثني وينفرد في اتجاه واحد.", run:() => c.tween(2000, k => { armR.mid.rotation.x = -2.1 * Math.sin(k * Math.PI * 2) ** 2; armL.mid.rotation.x = armR.mid.rotation.x; }, null).then(reset)},
      hip:{t:"Hip · الورك", en:"The hip is a <b>ball-and-socket joint</b>.", ar:"الورك (<b class=t>hip</b>) مفصل (<b class=t>joint</b>) كروي حُقّي (<b class=t>ball-and-socket</b>) مثل الكتف (<b class=t>shoulder</b>).", run:() => c.tween(2400, k => { legR.top.rotation.set(-.8 * Math.sin(k * TAU) * Math.sin(k * Math.PI), 0, .7 * Math.sin(k * Math.PI) ** 2); }, null).then(reset)},
      knee:{t:"Knee · الركبة", en:"The knee is a <b>hinge joint</b>.", ar:"الركبة (<b class=t>knee</b>) مفصل رزّي (<b class=t>hinge joint</b>): للأمام والخلف فقط.", run:() => c.tween(2000, k => { legR.mid.rotation.x = 1.5 * Math.sin(k * Math.PI * 2) ** 2; }, null).then(reset)}
    };
    c.onPick = k => { const o = TAP[k]; if (!o) return; if (k === "skull" || k === "ribs" || k === "femur") return o.run(); running++; job = null; reset(); c.info(o); c.sfx("creak"); o.run(); };
    c.tour = Object.keys(JOBS).map(k => ({t:JOBS[k].t, en:strip2(JOBS[k].en), ar:JOBS[k].ar, run:() => go(k)}));
    const p = V(), O = [V(-.22, 1.25, 0), V(.22, 1.25, 0)];
    return {update(dt, t){
      jobT += dt;
      const op = 1 - see * .72;
      mSkull.opacity = mRib.opacity = mSpine.opacity = op; mSkull.depthWrite = mRib.depthWrite = mSpine.depthWrite = see < .3;
      cord.visible = see > .3;
      const pulse = see * (.5 + .5 * Math.sin(t * 5));
      brain.material.emissiveIntensity = pulse * .6; heart.material.emissiveIntensity = pulse * .8; lungM.emissiveIntensity = pulse * .4;
      const beat = 1 + .12 * Math.max(0, Math.sin(t * 6.5)) ** 4; heart.scale.set(.12 * beat, .14 * beat, .11 * beat);
      mLimb.emissiveIntensity = mSkull.emissiveIntensity = mRib.emissiveIntensity = mSpine.emissiveIntensity = job === "store" ? .18 + .18 * Math.sin(jobT * 5) : 0;
      for (let i = 0; i < 36; i++){
        if (job !== "blood"){ cells.set(i, p.set(0, -99, 0), 0); continue; }
        const f = (jobT * .45 + i / 36) % 1, a = i * 2.4, o = O[i % 2];
        p.set(o.x + Math.cos(a) * f * .7, o.y + Math.sin(a * 1.3) * f * .5 + f * .2, o.z + Math.sin(a) * f * .5 + .1); cells.set(i, p, 1 - f * .6, 0xD92B2B);
      }
      cells.done();
    }};
  }
});
function strip2(h){ return String(h).replace(/<[^>]+>/g, ""); }

/* ====================================================================== LESSON 3 */
/* ---------- digestion: the food's journey through a see-through body ---------- */
Lab.scene({
  id:"digest", les:3, icon:"🍎", title:"The digestive system", ar:"رحلة اللقمة", topic:"l3-organs",
  cam:{target:[0, 2.3, 0], dist:7.1, theta:.3, phi:1.42}, floor:[0, .1, 0, 3.4],
  intro:{t:"The digestive system · رحلة اللقمة",
    en:"Food is <b>ingested</b>, <b>digested</b>, its nutrients and water are <b>absorbed</b>, and the undigested food is <b>eliminated</b>.",
    ar:"اللقمة تمشي رحلة طويلة: فم (<b class=t>mouth</b>)، ثم مريء (<b class=t>esophagus</b>)، ثم معدة (<b class=t>stomach</b>)، ثم أمعاء دقيقة (<b class=t>small intestine</b>)، ثم أمعاء غليظة (<b class=t>large intestine</b>). حرّك الشريط وامشِ مع اللقمة (الكرة المضيئة) خطوة خطوة، أو اضغط على أي عضو."},
  build(c){
    const g = c.root; g.add(K.bodyShell());
    const eso = K.curve([[0, 3.8, .25], [0, 3.55, .02], [0, 3.0, 0], [.08, 2.7, .04], [.22, 2.55, .1]]);
    const sto = K.curve([[.22, 2.55, .1], [.55, 2.45, .15], [.68, 2.2, .18], [.52, 1.95, .2], [.2, 1.88, .2], [-.05, 1.95, .18]]);
    const siP = [[-.05, 1.95, .18], [-.26, 1.82, .1], [-.36, 1.58, .18]];
    let x = -.42; [1.42, 1.24, 1.06, .88].forEach((y, k) => { siP.push([x, y, .2], [x * .35, y + .05, .34], [-x * .35, y - .04, .3], [-x, y, .2]); x = -x; });
    siP.push([-.5, .8, .15]);
    const si = K.curve(siP);
    const li = K.curve([[-.5, .8, .15], [-.67, .95, .12], [-.69, 1.4, .1], [-.62, 1.66, .16], [-.3, 1.73, .32], [0, 1.69, .36], [.3, 1.73, .32], [.62, 1.66, .16], [.69, 1.4, .1], [.65, .95, .12], [.4, .68, .1], [.1, .58, .06], [0, .36, 0]]);
    const mEso = K.organ(0xE8A08A), mSto = K.organ(0xF08FA0), mSi = K.organ(0xF4A9A0), mLi = K.organ(0xD9907A), mLiv = K.organ(0x8E3B2F), mSal = K.organ(0xB48CF0);
    [mEso, mSto, mSi, mLi, mLiv, mSal].forEach(m => { m.emissive = new THREE.Color(0xFFD23F); m.emissiveIntensity = 0; });
    const gEso = K.tubeVar(eso, 40, 12, .065), gSto = K.tubeVar(sto, 36, 16, t => .06 + .25 * Math.pow(Math.sin(Math.PI * t), .75));
    const O = {
      mouth:new THREE.Group(), saliv:new THREE.Group(),
      eso:K.mesh(gEso, mEso), sto:K.mesh(gSto, mSto),
      liver:K.blob(mLiv, -.4, 2.42, .22, .72, .36, .42),
      si:K.mesh(K.tubeVar(si, 240, 10, .085), mSi),
      li:K.mesh(K.tubeVar(li, 150, 12, t => .135 * (1 + .13 * Math.sin(t * 75)) * (t > .94 ? 1 - (t - .94) * 9 : 1)), mLi)
    };
    O.liver.rotation.z = -.2;
    const teeth = K.flat(0xFFFFFF, {roughness:.25}), upT = K.mesh(new THREE.TorusGeometry(.19, .035, 6, 14, Math.PI), teeth, 0, 3.88, .26), loT = K.mesh(new THREE.TorusGeometry(.19, .035, 6, 14, Math.PI), teeth, 0, 3.8, .26);
    upT.rotation.x = Math.PI / 2; loT.rotation.x = Math.PI / 2; O.mouth.add(upT, loT, K.blob(K.organ(0xE2596B), 0, 3.82, .22, .14, .04, .16));
    O.saliv.add(K.blob(mSal, -.34, 3.78, .12, .1, .08, .08), K.blob(mSal, .34, 3.78, .12, .1, .08, .08));
    const gall = K.blob(K.organ(0x5FA85A), -.26, 2.12, .44, .07, .12, .07);
    for (const k in O){ g.add(O[k]); c.pick(O[k], k); } g.add(gall);
    /* the food: a bright ball that shows through the organs */
    const food = K.mesh(new THREE.SphereGeometry(.085, 20, 14), new THREE.MeshBasicMaterial({color:0xFFB02E, toneMapped:false, depthTest:false, transparent:true})); food.renderOrder = 30;
    const halo = K.spark(0xFFC65A, .55); g.add(food, halo);
    const bits = K.dots(40, .03, K.glow(0xffffff, {depthTest:false, transparent:true})); bits.renderOrder = 31; g.add(bits);
    const P = []; for (let i = 0; i < 40; i++) P.push({p:V(0, -99, 0), v:V(), life:0, col:0});
    const INFO = {
      mouth:{t:"1 · Mouth · الفم", en:"<b>Mouth:</b> digestion begins here. The teeth chew the food (<b>mechanical</b> digestion) and saliva starts to break down carbohydrates (<b>chemical</b> digestion).", ar:"الهضم يبدأ من الفم (<b class=t>mouth</b>): الأسنان تقطّع وتطحن الأكل (هضم ميكانيكي، <b class=t>mechanical digestion</b>)، واللعاب (<b class=t>saliva</b>) يبدأ يفكّك النشويات (<b class=t>carbohydrates</b>) (هضم كيميائي، <b class=t>chemical digestion</b>)."},
      saliv:{t:"Salivary glands · الغدد اللعابية", en:"The <b>salivary glands</b> make saliva, 1 to 2 liters a day.", ar:"الغدد اللعابية (<b class=t>salivary glands</b>) تصنع اللعاب (<b class=t>saliva</b>): من لتر إلى لترين كل يوم!"},
      eso:{t:"2 · Esophagus · المريء", en:"<b>Esophagus:</b> a muscular tube to the stomach. <b>Peristalsis</b>, waves of muscle contractions, pushes the food down.", ar:"المريء (<b class=t>esophagus</b>) أنبوب عضلي يوصّل للمعدة (<b class=t>stomach</b>). عضلاته تنقبض (<b class=t>contracts</b>) موجة ورا موجة وتدفّ اللقمة لتحت: هذي الحركة الدودية (<b class=t>peristalsis</b>)."},
      sto:{t:"3 · Stomach · المعدة", en:"<b>Stomach:</b> it stores the food and churns it with acidic gastric juice.", ar:"المعدة (<b class=t>stomach</b>) تخزّن الأكل وتخضّه وتخلطه مع العصارة الحمضية (<b class=t>gastric juice</b>)، إلى أن يصير مثل الشوربة."},
      liver:{t:"Liver · الكبد", en:"The <b>liver</b> makes bile, which breaks up fat. Food does <b>not</b> pass through the liver.", ar:"الكبد (<b class=t>liver</b>) يصنع العصارة الصفراء (<b class=t>bile</b>) اللي تفتّت الدهون. انتبه: الأكل ما يمرّ من الكبد نفسه."},
      si:{t:"4 · Small intestine · الأمعاء الدقيقة", en:"<b>Small intestine:</b> most chemical digestion happens here, and the <b>villi</b> absorb nutrients and most of the water into the blood.", ar:"هنا يتم أغلب الهضم الكيميائي (<b class=t>chemical digestion</b>)، والخملات (<b class=t>villi</b>) تمتصّ المغذّيات (<b class=t>nutrients</b>) وأغلب الماء وتدخلها الدم. شوف النقاط الذهبية تطلع من اللقمة!"},
      li:{t:"5 · Large intestine · الأمعاء الغليظة", en:"<b>Large intestine:</b> it absorbs more water. What is left becomes solid waste and is eliminated.", ar:"الأمعاء الغليظة (<b class=t>large intestine</b>) تمتصّ باقي الماء (النقاط الزرقاء)، واللي يبقى يصير فضلات صلبة (<b class=t>solid waste</b>) تطلع من الجسم."}
    };
    const STAGES = [["mouth", 0, .1], ["eso", .1, .22], ["sto", .22, .42], ["si", .42, .76], ["li", .76, 1.001]];
    let q = 0, stage = "", lastQ = 0, emit = 0;
    const status = c.ui.note("", "badge ok");
    const sQ = c.ui.slider({label:"Follow the food", min:0, max:100, step:.2, value:0, fmt:v => Math.round(v) + "%", on:v => { q = v / 100; }});
    c.ui.buttons([{label:"▶ The whole journey", cls:"go", on:() => c.tween(24000, k => sQ.set(k * 100, true), null)},
      {label:"👄 Mouth", on:() => sQ.set(2)}, {label:"Esophagus", on:() => sQ.set(12)}, {label:"Stomach", on:() => sQ.set(26)}, {label:"Small intestine", on:() => sQ.set(46)}, {label:"Large intestine", on:() => sQ.set(79)}]);
    const NAMES = {mouth:"Mouth", saliv:"Salivary glands", eso:"Esophagus", sto:"Stomach", liver:"Liver", si:"Small intestine", li:"Large intestine"};
    const AT = {mouth:V(0, 3.84, .5), saliv:V(.4, 3.78, .2), eso:V(0, 3.1, .15), sto:V(.72, 2.25, .3), liver:V(-.55, 2.45, .5), si:V(0, 1.15, .4), li:V(-.72, 1.3, .2)};
    const DX = {mouth:-46, saliv:66, eso:54, sto:52, liver:-44, si:0, li:-70};
    for (const k in NAMES) c.label(NAMES[k], AT[k], {pick:k, dx:DX[k], cls:"dim"});
    c.onPick = k => { c.info(INFO[k]); glow(k); if (k !== "saliv" && k !== "liver"){ const s = STAGES.find(z => z[0] === k); sQ.set((s[1] + .02) * 100, true); } };
    let glowK = null, glowT = 0;
    function glow(k){ glowK = k; glowT = 1; c.hot(k); }
    c.tour = [
      {t:"1 · Mouth · الفم", en:"Mouth: the teeth chew the food, which is mechanical digestion, and saliva starts chemical digestion.", ar:INFO.mouth.ar, hot:"mouth", run:() => c.tween(2600, k => sQ.set(lerp(0, 9, k), true), null)},
      {t:"2 · Esophagus · المريء", en:"Esophagus: peristalsis, waves of muscle contractions, pushes the food down to the stomach.", ar:INFO.eso.ar, hot:"eso", run:() => c.tween(3200, k => sQ.set(lerp(10, 22, k), true), null)},
      {t:"3 · Stomach · المعدة", en:"Stomach: it stores the food and churns it with acidic gastric juice.", ar:INFO.sto.ar, hot:"sto", run:() => c.tween(4200, k => sQ.set(lerp(22, 42, k), true), null)},
      {t:"Liver · الكبد", en:"The liver makes bile, which breaks up fat. Food does not pass through the liver.", ar:INFO.liver.ar, hot:"liver", run:async () => { glow("liver"); await c.wait(1600); }},
      {t:"4 · Small intestine · الأمعاء الدقيقة", en:"Small intestine: most chemical digestion happens here, and the villi absorb the nutrients into the blood.", ar:INFO.si.ar, hot:"si", run:() => c.tween(7000, k => sQ.set(lerp(42, 76, k), true), null)},
      {t:"5 · Large intestine · الأمعاء الغليظة", en:"Large intestine: it absorbs more water, and what is left becomes solid waste.", ar:INFO.li.ar, hot:"li", run:() => c.tween(5500, k => sQ.set(lerp(76, 100, k), true), null)}
    ];
    const pos = V(), mouthP = V(0, 3.83, .3), stoC = V(.45, 2.2, .18), tmpv = V();
    return {update(dt, t, real){
      const st = STAGES.find(z => q >= z[1] && q < z[2]) || STAGES[4], u = (q - st[1]) / (st[2] - st[1]), moving = Math.abs(q - lastQ) > 1e-5;
      if (st[0] !== stage){
        stage = st[0]; c.info(INFO[stage]); glow(stage);
        c.sfx({mouth:"crunch", eso:"gulp", sto:"gurgle", si:"sparkle", li:"drip"}[stage]);
      }
      let size = 1, col = 0xFFB02E;
      if (stage === "mouth"){ pos.copy(mouthP); size = 1.5 - u * .5; loT.position.y = 3.8 - (moving ? Math.abs(Math.sin(t * 9)) * .07 : 0); }
      else if (stage === "eso"){ eso.getPointAt(u, pos); }
      else if (stage === "sto"){
        if (u < .25) sto.getPointAt(u * 2, pos); else if (u > .85) sto.getPointAt(.5 + (u - .85) / .15 * .5, pos);
        else { const a = u * 40; pos.set(stoC.x + Math.cos(a) * .14, stoC.y + Math.sin(a) * .16, stoC.z); }
        size = 1.25; col = 0xFFC65A;
      }
      else if (stage === "si"){ si.getPointAt(u, pos); size = 1.1 - u * .35; col = 0xFFC65A; }
      else { li.getPointAt(Math.min(1, u), pos); size = .85; col = u > .25 ? 0x9C6B3E : 0xC98A4B; food.material.opacity = q > .995 ? 0 : 1; }
      if (stage !== "li") food.material.opacity = 1;
      if (stage !== "mouth") loT.position.y = 3.8;
      food.position.copy(pos); food.scale.setScalar(size); food.material.color.setHex(col); halo.position.copy(pos); halo.material.opacity = food.material.opacity * .9;
      /* the esophagus squeezes behind the food and bulges around it; the stomach churns */
      K.shapeTube(gEso, tt => stage === "eso" ? .065 + .075 * Math.exp(-Math.pow((tt - u) / .07, 2)) - .03 * Math.exp(-Math.pow((tt - u + .13) / .05, 2)) : .065);
      const ch = stage === "sto" ? 1 : 0;
      K.shapeTube(gSto, (tt, a) => (.06 + .25 * Math.pow(Math.sin(Math.PI * tt), .75)) * (1 + ch * .07 * Math.sin(tt * 14 - t * 6 + a)));
      /* nutrients (gold) leave in the small intestine, water (blue) in the large one */
      emit += (stage === "si" || stage === "li") ? real * (moving ? 22 : 5) : 0;
      while (emit > 1){ emit -= 1; const s = P.find(z => z.life <= 0); if (!s) break; s.p.copy(pos); s.v.set(Math.random() - .5, Math.random() - .5, Math.random() * .6 + .2).normalize().multiplyScalar(.45); s.life = 1; s.col = stage === "si" ? 0xFFD23F : 0x4DA3FF; }
      P.forEach((s, i) => { if (s.life > 0){ s.life -= real * .9; s.p.addScaledVector(s.v, real); bits.set(i, s.p, Math.max(0, s.life), s.col); } else bits.set(i, tmpv.set(0, -99, 0), 0); });
      bits.done();
      glowT = Math.max(0, glowT - real * .5);
      for (const k in O) O[k].traverse(o => { if (o.material && o.material.emissive) o.material.emissiveIntensity = k === glowK ? glowT * .5 * (.6 + .4 * Math.sin(t * 8)) : 0; });
      status.textContent = {mouth:"👄 Mouth: chewing and saliva", eso:"⬇️ Esophagus: peristalsis", sto:"🌀 Stomach: churning with gastric juice", si:"✨ Small intestine: the villi absorb nutrients", li:"💧 Large intestine: water absorbed, then elimination"}[stage];
      lastQ = q;
    }};
  }
});

/* ---------- villi: why the small intestine absorbs so much ---------- */
Lab.scene({
  id:"villi", les:3, icon:"🌿", title:"Absorption: the villi", ar:"الخملات والامتصاص", topic:"l3-villi",
  cam:{target:[0, .55, 0], dist:7.6, theta:.5, phi:1.12}, floor:false,
  intro:{t:"Villi: why the small intestine absorbs so much · الخملات",
    en:"<b>Villi</b> are finger-like projections in the small intestine. They have thin walls, a huge surface area and many blood vessels, so nutrients pass into the blood.",
    ar:"جدار الأمعاء الدقيقة (<b class=t>small intestine</b>) مو أملس: فيه نتوءات صغيرة مثل الأصابع اسمها الخملات (<b class=t>villi</b>). تزيد المساحة كثير، فتلقط المغذّيات (<b class=t>nutrients</b>) (الكرات الذهبية) وتدخلها الدم. جرّب الجدار الأملس وقارن العدّاد!"},
  build(c){
    const g = c.root, wall = K.organ(0xF2A9A0), vm = K.organ(0xF7B4AE);
    g.add(K.mesh(new THREE.BoxGeometry(4.4, .4, 2.3), wall, 0, -.2, 0));
    const vessel = K.mesh(new THREE.CylinderGeometry(.11, .11, 4.4, 16), K.organ(0xD93A3A), 0, -.2, 1.17); vessel.rotation.z = Math.PI / 2; g.add(vessel);
    const prof = [[.2, 0], [.17, .15], [.16, .7], [.13, .9], [.07, .98], [0, 1]].map(p => new THREE.Vector2(p[0], p[1])), vg = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(20), 14);
    const rnd = K.rnd(7), VS = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++){
      const x = -1.65 + i * .66 + (rnd() - .5) * .12, z = -.75 + j * .5 + (rnd() - .5) * .1, xray = i === 3 && j === 3;
      const m = K.mesh(vg, xray ? K.glass(0xF7B4AE, .33) : vm, x, 0, z); if (xray) m.renderOrder = 10; g.add(m); VS.push({m, x, z, ph:rnd() * 6, xray});
    }
    const xv = VS.find(v => v.xray), cap = K.mesh(K.tubeVar(K.curve([[xv.x - .08, 0, xv.z], [xv.x - .07, .6, xv.z], [xv.x, .86, xv.z], [xv.x + .07, .6, xv.z], [xv.x + .08, 0, xv.z]]), 30, 8, .028), K.organ(0xD93A3A)); g.add(cap);
    const N = 70, dots = K.dots(N, .05, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.35, emissive:0x553300, emissiveIntensity:.6})); g.add(dots);
    const PS = []; for (let i = 0; i < N; i++) PS.push({p:V(), st:0, v:null, sp:.7 + rnd() * .5, ph:rnd() * 6});
    const spawn = (s, any) => { s.p.set(any ? -2.2 + rnd() * 4.4 : -2.3, .14 + rnd() * 1.6, -.95 + rnd() * 1.9); s.st = 0; s.v = null; };
    PS.forEach(s => spawn(s, true));
    let villi = true, h = 1, got = 0, lost = 0;
    const box = document.createElement("div"); box.className = "count"; box.innerHTML = '<div><b id="vGot" dir="ltr">0</b><span>Absorbed into the blood</span></div><div><b id="vLost" dir="ltr">0</b><span>Passed by, not absorbed</span></div>';
    const seg = c.ui.seg({value:"v", opts:[{k:"v", label:'🌿 Wall with villi<small>جدار بالخملات</small>'}, {k:"s", label:'➖ Smooth wall<small>جدار أملس</small>'}], on:(k, quiet) => {
      villi = k === "v"; got = lost = 0; const from = h, to = villi ? 1 : .04; c.tween(700, z => { h = lerp(from, to, z); });
      if (!quiet){ c.sfx(villi ? "power" : "boing"); c.info(villi
        ? {t:"Wall with villi · جدار بالخملات", en:"The <b>villi</b> give the wall a huge surface area, so most nutrients touch it and pass into the blood.", ar:"الخملات (<b class=t>villi</b>) تزيد مساحة السطح كثير، فأغلب المغذّيات (<b class=t>nutrients</b>) تلمسها وتدخل الدم. شوف العدّاد الأخضر كيف يطلع بسرعة."}
        : {t:"Smooth wall · جدار أملس", en:"A smooth wall has a small surface area: most nutrients pass by without being absorbed. In <b>celiac disease</b>, gluten damages the small intestine, so the body absorbs less.", ar:"بدون خملات المساحة صغيرة، فأغلب المغذّيات (<b class=t>nutrients</b>) تمرّ وتروح. وهذا اللي يصير في مرض السيلياك (<b class=t>celiac disease</b>): الجلوتين (<b class=t>gluten</b>) يضرّ الأمعاء الدقيقة (<b class=t>small intestine</b>) فيقلّ الامتصاص (<b class=t>absorption</b>)."}); }
    }});
    document.getElementById("ctl").appendChild(box);
    const rate = c.ui.note("", "badge ok");
    c.label("Villi", () => V(-1.65, h + .12, -.75), {show:() => h > .5, dy:-12});
    c.label("Thin wall + blood vessels inside", () => V(xv.x, .6 * h, xv.z + .2), {show:() => h > .5, dx:96, cls:"dim"});
    c.label("Blood vessel", V(1.2, -.2, 1.3), {dy:-16, dx:30});
    c.label("Nutrients", V(-1.2, 1.7, .6), {dy:-16, cls:"dim"});
    c.tour = [
      {en:"Villi are finger-like projections in the small intestine.", ar:"الخملات (<b class=t>villi</b>) نتوءات صغيرة مثل الأصابع تغطّي جدار الأمعاء الدقيقة (<b class=t>small intestine</b>) من جوّا.", run:async () => { seg.set("v", true); await c.look({theta:.5, phi:1.12, dist:7.6, target:[0, .55, 0]}, 500); await c.wait(1500); }},
      {en:"They have thin walls and many blood vessels, so nutrients pass into the blood.", ar:"جدارها رقيق وجوّاها أوعية دموية، فالمغذّيات (<b class=t>nutrients</b>) تعبر منها للدم بسهولة.", run:async () => { await c.look({theta:.25, phi:1.3, dist:3.4, target:[xv.x, .5, xv.z]}, 900); await c.wait(2600); await c.look({theta:.5, phi:1.12, dist:7.6, target:[0, .55, 0]}, 900); }},
      {en:"Without villi, the surface area is small and most nutrients pass by.", ar:"بدون خملات المساحة صغيرة وأغلب المغذّيات (<b class=t>nutrients</b>) تروح بدون امتصاص.", run:async () => { seg.set("s", true); await c.wait(5200); }},
      {en:"The villi give a huge surface area, so the body absorbs much more.", ar:"مع الخملات (<b class=t>villi</b>) المساحة كبيرة جدًّا، والجسم يمتصّ أكثر بكثير.", run:async () => { seg.set("v", true); await c.wait(5200); }}
    ];
    return {update(dt, t){
      VS.forEach(v => { v.m.scale.y = h; v.m.rotation.z = .07 * Math.sin(t * 1.5 + v.ph) * h; });
      cap.scale.y = h; cap.visible = h > .3;
      PS.forEach((s, i) => {
        if (s.st === 0){
          s.p.x += s.sp * dt; s.p.y += Math.sin(t * 2 + s.ph) * .12 * dt; s.p.z += Math.cos(t * 1.7 + s.ph) * .1 * dt;
          if (s.p.x > 2.3){ lost++; spawn(s); }
          else if (s.p.y < .2){ s.st = 1; s.v = {x:s.p.x, z:s.p.z}; }
          else if (h > .5 && s.p.y < h * .98){ const v = VS.find(z => Math.hypot(z.x - s.p.x, z.z - s.p.z) < .24); if (v){ s.st = 1; s.v = v; } }
        } else if (s.st === 1){   /* into the villus (or the wall), then down to the blood */
          s.p.x = lerp(s.p.x, s.v.x, .12); s.p.z = lerp(s.p.z, s.v.z, .12); s.p.y -= 1.1 * dt;
          if (s.p.y < -.2){ s.st = 2; got++; if (i % 4 === 0) c.sfx("tap"); }
        } else { s.p.y = -.2; s.p.z = lerp(s.p.z, 1.17, .1); s.p.x += 1.5 * dt; if (s.p.x > 2.3) spawn(s); }
        dots.set(i, s.p, s.st === 2 ? .8 : 1, s.st === 0 ? 0xFFD23F : s.st === 1 ? 0xFFA53A : 0xFF7B4A);
      });
      dots.done();
      document.getElementById("vGot").textContent = got; document.getElementById("vLost").textContent = lost;
      const all = got + lost; rate.textContent = all < 8 ? "Watch the counter…" : "Absorbed: " + Math.round(100 * got / all) + "%"; rate.className = "note badge " + (all >= 8 && got / all < .5 ? "bad" : "ok");
    }};
  }
});

/* ====================================================================== LESSON 4 */
/* ---------- the heart and the two loops of blood ---------- */
Lab.scene({
  id:"heart", les:4, icon:"❤️", title:"The circulatory system", ar:"القلب والدورة الدموية", topic:"l4-circ",
  cam:{target:[0, -.35, 0], dist:8.8, theta:.12, phi:1.45}, floor:false,
  intro:{t:"The circulatory system · القلب والدورة الدموية",
    en:"The <b>heart</b> is the pump, <b>blood</b> is the carrier and <b>blood vessels</b> are the roads. Blood travels in two loops: to the lungs, and to the body.",
    ar:"القلب (<b class=t>heart</b>) مضخّة ما توقف. الدم الأزرق، اللي فيه أكسجين (<b class=t>oxygen</b>) قليل، يروح للرئتين (<b class=t>lungs</b>) وياخذ أكسجين فيصير أحمر، ثم يرجع للقلب اللي يضخّه لكل الجسم. غيّر سرعة النبض، واضغط على أي جزء."},
  build(c){
    const g = c.root, BLUE = 0x3D6FD6, RED = 0xD73C3C;
    const W = {
      vein:[[-.3, -2.3, .1], [-.55, -2.0, 0], [-.62, -1.2, -.25], [-.5, -.2, -.3], [-.42, .32, -.12]],
      ra:[[-.4, .52, 0]], rv:[[-.22, -.25, .08]],
      pa:[[-.15, .3, .22], [-.02, .9, .3], [0, 1.2, .26]],
      paR:[[-.6, 1.45, .16], [-1.3, 1.35, .06], [-1.75, 1.15, 0]], paL:[[.6, 1.45, .16], [1.3, 1.35, .06], [1.75, 1.15, 0]],
      lungR:[[-1.9, .9, 0]], lungL:[[1.9, .9, 0]],
      pvR:[[-1.7, .68, -.1], [-1.0, .62, -.3], [-.2, .62, -.36], [.24, .56, -.2]], pvL:[[1.7, .68, -.1], [1.0, .65, -.26], [.46, .58, -.2]],
      la:[[.34, .5, -.05]], lv:[[.26, -.3, 0]],
      aorta:[[.14, .25, .05], [.08, .95, .05], [.2, 1.5, -.05], [.6, 1.55, -.25], [.85, 1.1, -.35], [.8, 0, -.35], [.7, -1.2, -.3], [.55, -2.0, 0], [.3, -2.3, .1]],
      bed:[[0, -2.42, .16]]
    };
    const loop = lung => { const pts = [].concat(W.bed, W.vein, W.ra, W.rv, W.pa, lung === "R" ? W.paR : W.paL, lung === "R" ? W.lungR : W.lungL, lung === "R" ? W.pvR : W.pvL, W.la, W.lv, W.aorta);
      const iRV = W.bed.length + W.vein.length + W.ra.length, iLung = iRV + 1 + W.pa.length + 3, iLA = iLung + 1 + (lung === "R" ? W.pvR : W.pvL).length;
      return {curve:K.curve(pts, true), n:pts.length, tRV:iRV / pts.length, tLung:iLung / pts.length, tLA:iLA / pts.length}; };
    const LP = [loop("R"), loop("L")];
    /* the vessels are see-through, so the blood shows inside them */
    const vm = col => K.glass(col, .4, {roughness:.2});
    const tube = (pts, col, r, key) => { const m = K.mesh(K.tubeVar(K.curve(pts), 40, 12, r), vm(col)); m.renderOrder = 6; g.add(m); c.pick(m, key); return m; };
    tube(W.vein, BLUE, .11, "vein");
    tube([].concat(W.rv, W.pa), BLUE, .1, "pa"); tube([W.pa[2]].concat(W.paR), BLUE, .085, "pa"); tube([W.pa[2]].concat(W.paL), BLUE, .085, "pa");
    tube(W.pvR.concat(W.la), RED, .08, "pv"); tube(W.pvL.concat(W.la), RED, .08, "pv");
    tube([].concat(W.lv, W.aorta), RED, .12, "aorta");
    /* the heart: a see-through muscle shell around four chambers */
    const hp = [[0, -.98], [.26, -.82], [.56, -.42], [.74, 0], [.76, .3], [.62, .58], [.36, .74], [0, .8]].map(p => new THREE.Vector2(p[0], p[1]));
    const shell = K.mesh(new THREE.LatheGeometry(new THREE.SplineCurve(hp).getPoints(30), 32), K.glass(0xB5403A, .3, {roughness:.35})); shell.scale.set(1.12, 1, .82); shell.rotation.z = .16; shell.renderOrder = 8; g.add(shell); c.pick(shell, "muscle");
    const chm = col => K.glass(col, .62, {roughness:.2, side:THREE.FrontSide});
    const CH = {ra:K.blob(chm(BLUE), -.4, .5, 0, .27, .22, .25), rv:K.blob(chm(BLUE), -.22, -.24, .08, .3, .5, .3), la:K.blob(chm(RED), .34, .5, -.05, .26, .2, .24), lv:K.blob(chm(RED), .26, -.3, 0, .3, .56, .3)};
    const BASE = {}; for (const k in CH){ BASE[k] = CH[k].scale.clone(); CH[k].renderOrder = 4; g.add(CH[k]); c.pick(CH[k], k); }
    const septum = K.mesh(new THREE.BoxGeometry(.05, .95, .5), K.organ(0x8A2F2A), .03, -.22, .02); septum.rotation.z = .1; g.add(septum); c.pick(septum, "septum");
    const flapM = K.flat(0xFFF6E0), flaps = [[-.31, .2, .05], [.3, .18, -.02]].map(p => { const f = K.mesh(new THREE.BoxGeometry(.24, .035, .18), flapM, p[0], p[1], p[2]); g.add(f); c.pick(f, "valve"); return f; });
    /* lungs and the body's cells */
    const lm = K.glass(0xF2A0AE, .42, {side:THREE.FrontSide}), lungs = [K.blob(lm, -1.95, .95, 0, .52, .82, .45), K.blob(lm, 1.95, .95, 0, .52, .82, .45)];
    lungs.forEach(l => { l.renderOrder = 7; g.add(l); c.pick(l, "lungs"); });
    const body = K.blob(K.glass(0xE9C7A0, .5, {side:THREE.FrontSide}), 0, -2.5, .1, 1.0, .3, .5); body.renderOrder = 7; g.add(body); c.pick(body, "body");
    const N = 150, cells = K.dots(N, .052, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.3})); g.add(cells);
    const BC = []; for (let i = 0; i < N; i++) BC.push({t:i / N + Math.random() * .004, lp:i % 2});
    let bpm = 70, phase = 0, show = "all", beatOn = true, lastBeat = 0;
    const INFO = {
      ra:{t:"Right atrium · الأذين الأيمن", en:"The two <b>atria</b> (top) <b>receive</b> blood. The right atrium receives blood coming back from the body.", ar:"الأذينان (<b class=t>atria</b>) فوق يستقبلون الدم. الأذين الأيمن (<b class=t>right atrium</b>) يستقبل الدم الراجع من الجسم، وهو قليل الأكسجين (<b class=t>oxygen</b>)."},
      la:{t:"Left atrium · الأذين الأيسر", en:"The left atrium receives oxygen-rich blood coming back from the lungs.", ar:"الأذين الأيسر (<b class=t>left atrium</b>) يستقبل الدم الراجع من الرئتين (<b class=t>lungs</b>) وهو مليان أكسجين (<b class=t>oxygen</b>)."},
      rv:{t:"Right ventricle · البطين الأيمن", en:"The two <b>ventricles</b> (bottom) <b>pump</b> blood out. The right ventricle pumps blood to the lungs.", ar:"البطينان (<b class=t>ventricles</b>) تحت يضخّون الدم لبرّا القلب (<b class=t>heart</b>). البطين الأيمن (<b class=t>right ventricle</b>) يضخّه للرئتين (<b class=t>lungs</b>)."},
      lv:{t:"Left ventricle · البطين الأيسر", en:"The <b>left ventricle</b> pumps blood to the whole body, so it has the <b>thickest wall</b>.", ar:"البطين الأيسر (<b class=t>left ventricle</b>) يضخّ الدم لكل الجسم، عشان كذا جداره أسمك جدار في القلب (<b class=t>heart</b>)."},
      septum:{t:"Septum · الحاجز", en:"The <b>septum</b> keeps the two sides of the heart apart.", ar:"الحاجز (<b class=t>septum</b>) جدار يفصل جهة اليمين عن جهة اليسار، فما يختلط الدم."},
      valve:{t:"Valves · الصمّامات", en:"<b>Valves</b> keep blood flowing one way.", ar:"الصمّامات (<b class=t>valves</b>) مثل أبواب تفتح باتجاه واحد، فالدم يمشي لقدّام وما يرجع."},
      muscle:{t:"Heart · القلب", en:"The heart is made of <b>cardiac muscle</b>. It is involuntary: it beats by itself, without you thinking.", ar:"القلب (<b class=t>heart</b>) عضلة قلبية لا إرادية (<b class=t>involuntary</b>): تنبض لحالها طول العمر بدون ما تفكّر."},
      aorta:{t:"Artery · شريان", en:"<b>Arteries</b> carry blood <b>away</b> from the heart.", ar:"الشرايين (<b class=t>arteries</b>) تاخذ الدم من القلب (<b class=t>heart</b>) وتوصّله للجسم."},
      vein:{t:"Vein · وريد", en:"<b>Veins</b> carry blood <b>back</b> to the heart.", ar:"الأوردة (<b class=t>veins</b>) ترجّع الدم للقلب (<b class=t>heart</b>)."},
      pa:{t:"To the lungs · إلى الرئتين", en:"<b>Pulmonary loop:</b> heart → lungs → heart. The blood picks up oxygen in the lungs.", ar:"الحلقة الرئوية (<b class=t>pulmonary loop</b>): من القلب (<b class=t>heart</b>) للرئتين (<b class=t>lungs</b>) ثم يرجع للقلب. في الرئتين الدم ياخذ أكسجين (<b class=t>oxygen</b>)."},
      pv:{t:"From the lungs · من الرئتين", en:"Oxygen-rich blood comes back from the lungs to the left atrium.", ar:"الدم الأحمر المليان أكسجين (<b class=t>oxygen</b>) يرجع من الرئتين (<b class=t>lungs</b>) للأذين الأيسر (<b class=t>left atrium</b>)."},
      lungs:{t:"Lungs · الرئتان", en:"In the lungs the blood picks up <b>oxygen</b> and drops off <b>carbon dioxide</b>.", ar:"في الرئتين (<b class=t>lungs</b>) الدم ياخذ الأكسجين (<b class=t>oxygen</b>) ويتخلّص من ثاني أكسيد الكربون (<b class=t>carbon dioxide</b>)، فيتحوّل من أزرق إلى أحمر."},
      body:{t:"Body cells · خلايا الجسم", en:"<b>Systemic loop:</b> heart → body → heart. In the <b>capillaries</b>, oxygen and nutrients pass from the blood to the cells.", ar:"الحلقة الجهازية (<b class=t>systemic loop</b>): من القلب (<b class=t>heart</b>) للجسم ثم يرجع. في الشعيرات الدموية (<b class=t>capillaries</b>) ينتقل الأكسجين (<b class=t>oxygen</b>) والغذاء للخلايا، فيرجع الدم أزرق."}
    };
    c.onPick = k => { c.info(INFO[k]); c.hot(k); };
    const status = c.ui.note("", "badge ok");
    c.ui.slider({label:"Heart rate", min:50, max:170, value:70, fmt:v => Math.round(v) + " bpm", on:v => { bpm = v; }});
    const seg = c.ui.seg({value:"all", opts:[{k:"all", label:'Both loops<small>الحلقتان</small>'}, {k:"pul", label:'Pulmonary loop<small>الرئوية</small>'}, {k:"sys", label:'Systemic loop<small>الجهازية</small>'}], on:(k, quiet) => { show = k; if (!quiet && k !== "all"){ c.info(k === "pul" ? INFO.pa : INFO.body); c.sfx("pop"); } }});
    c.ui.toggle({off_label:"🔈 Play the heartbeat", on_label:"🔊 Heartbeat on", value:true, on:v => { beatOn = v; }});
    c.label("Right atrium", V(-.4, .52, .3), {pick:"ra", dx:-52, dy:-10}); c.label("Left atrium", V(.34, .5, .25), {pick:"la", dx:50, dy:-14});
    c.label("Right ventricle", V(-.25, -.3, .4), {pick:"rv", dx:-64, dy:14}); c.label("Left ventricle", V(.3, -.35, .35), {pick:"lv", dx:62, dy:14});
    c.label("Lungs", V(-1.95, 1.75, 0), {pick:"lungs", dy:-12}); c.label("Body cells", V(0, -2.5, .6), {pick:"body", dy:22});
    c.label("Artery", V(.85, .2, -.3), {pick:"aorta", dx:36, cls:"dim"}); c.label("Vein", V(-.62, -1.2, -.2), {pick:"vein", dx:-30, cls:"dim"});
    c.label("Valve", V(-.31, .2, .2), {pick:"valve", dx:-6, dy:0, cls:"dim", show:() => Lab.orb.dist < 8});
    c.tour = [
      {en:"The heart is the pump, blood is the carrier and blood vessels are the roads.", ar:"القلب (<b class=t>heart</b>) مضخّة، والدم هو الناقل، والأوعية الدموية هي الطرق.", run:async () => { seg.set("all", true); await c.wait(2200); }},
      {t:"Atria and ventricles · الأذينان والبطينان", en:"Two atria at the top receive blood, and two ventricles at the bottom pump it out. Valves keep blood flowing one way.", ar:"الأذينان (<b class=t>atria</b>) فوق يستقبلون الدم، والبطينان (<b class=t>ventricles</b>) تحت يضخّونه، والصمّامات (<b class=t>valves</b>) تخلّيه يمشي باتجاه واحد.", run:async () => { await c.look({target:[0, 0, 0], dist:4.6, theta:.12, phi:1.45}, 900); await c.wait(3200); }},
      {t:"Pulmonary loop · الحلقة الرئوية", en:"Pulmonary loop: heart, lungs, heart. The blood picks up oxygen.", ar:"الحلقة الرئوية (<b class=t>pulmonary loop</b>): القلب (<b class=t>heart</b>) ثم الرئتين (<b class=t>lungs</b>) ثم القلب. الدم ياخذ أكسجين (<b class=t>oxygen</b>) ويصير أحمر.", hot:"lungs", run:async () => { await c.look({target:[0, .4, 0], dist:8.2, theta:.12, phi:1.45}, 800); seg.set("pul", true); await c.wait(4200); }},
      {t:"Systemic loop · الحلقة الجهازية", en:"Systemic loop: heart, body, heart. The blood delivers oxygen to the cells.", ar:"الحلقة الجهازية (<b class=t>systemic loop</b>): القلب (<b class=t>heart</b>) ثم الجسم ثم القلب. الدم يوصّل الأكسجين (<b class=t>oxygen</b>) للخلايا ويرجع أزرق.", hot:"body", run:async () => { await c.look({target:[0, -.35, 0], dist:8.8, theta:.12, phi:1.45}, 800); seg.set("sys", true); await c.wait(4200); }},
      {t:"Arteries and veins · الشرايين والأوردة", en:"Arteries carry blood away from the heart, veins carry it back, and capillaries are where materials pass between the blood and the cells.", ar:"الشرايين (<b class=t>arteries</b>) تطلّع الدم من القلب (<b class=t>heart</b>)، والأوردة (<b class=t>veins</b>) ترجّعه، وفي الشعيرات (<b class=t>capillaries</b>) يتبادل الدم والخلايا المواد.", run:async () => { seg.set("all", true); await c.wait(3600); }}
    ];
    const p = V(), col = new THREE.Color(), cB = new THREE.Color(0x4D8DF0), cR = new THREE.Color(0xE8353B);
    return {update(dt, t){
      phase = (phase + dt * bpm / 60) % 1;
      /* the atria squeeze first, then the ventricles */
      const at = phase < .15 ? Math.sin(phase / .15 * Math.PI) : 0, ve = phase >= .15 && phase < .5 ? Math.sin((phase - .15) / .35 * Math.PI) : 0;
      const sc = (k, a) => CH[k].scale.copy(BASE[k]).multiplyScalar(1 - a);
      sc("ra", at * .2); sc("la", at * .2); sc("rv", ve * .2); sc("lv", ve * .22);
      shell.scale.set(1.12 * (1 - ve * .06), 1 - ve * .05, .82 * (1 - ve * .06));
      flaps.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (ve > .05 ? 0 : .9); });
      if (dt && ve > .05 && lastBeat !== Math.floor(t * bpm / 60 + .5) && phase < .25){ lastBeat = Math.floor(t * bpm / 60 + .5); if (beatOn) c.sfx("beat"); }
      const sp = dt * (bpm / 70) * .05 * (.35 + 1.5 * ve);
      BC.forEach((b, i) => {
        b.t = (b.t + sp) % 1; const L = LP[b.lp]; L.curve.getPoint(b.t, p);
        /* blue on the way to the lungs, red after them, and blue again once the body's cells have taken the oxygen */
        let k = clamp((b.t - (L.tLung - .02)) / .04, 0, 1); if (b.t > .96) k = 1 - (b.t - .96) / .04;
        col.copy(cB).lerp(cR, k);
        const inPul = b.t > L.tRV && b.t < L.tLA, on = show === "all" || (show === "pul") === inPul;
        cells.set(i, p, on ? 1 : .3, on ? col : 0x55597A);
      });
      cells.done();
      lungs.forEach(l => l.scale.set(.52, .82 * (1 + .03 * Math.sin(t * 1.4)), .45));
      status.textContent = bpm < 62 ? "😴 Slow pulse: sleeping or resting" : bpm < 105 ? "🙂 Normal pulse" : bpm < 140 ? "🚶 Moving and playing" : "🏃 Running! The heart pumps faster to deliver more oxygen";
    }};
  }
});

/* ---------- breathing: the airways, the diaphragm, and gas exchange in an air sac ---------- */
Lab.scene({
  id:"lungs", les:4, icon:"🫁", title:"The respiratory system", ar:"التنفّس وتبادل الغازات", topic:"l4-resp",
  cam:{target:[0, 2.5, 0], dist:8, theta:.3, phi:1.42}, floor:[0, .1, 0, 3.4],
  intro:{t:"Breathing · التنفّس",
    en:"Air path: nose or mouth → pharynx → <b>trachea</b> → <b>bronchi</b> → bronchioles → <b>alveoli</b>. The <b>diaphragm</b> moves down to pull air in and up to push it out.",
    ar:"الهواء يدخل من الأنف أو الفم (<b class=t>mouth</b>)، وينزل في القصبة الهوائية (<b class=t>trachea</b>)، ثم يتفرّع في الشعب الهوائية (<b class=t>bronchi</b>) إلى أن يوصل الحويصلات الهوائية (<b class=t>alveoli</b>). والحجاب الحاجز (<b class=t>diaphragm</b>)، وهو العضلة اللي تحت الرئتين، ينزل فيدخل الهواء، ويطلع فيخرج. حرّك الشريط وتنفّس معه."},
  build(c){
    const g = c.root; const shellG = K.bodyShell({op:.1}); g.add(shellG);
    const airM = K.organ(0xE9CDB6), main = new THREE.Group(), zoom = new THREE.Group(); g.add(main, zoom); zoom.visible = false;
    const trC = K.curve([[0, 4.02, .14], [0, 3.6, .05], [0, 3.02, 0]]);
    main.add(K.mesh(K.tubeVar(trC, 30, 12, t => .12 * (1 + .1 * Math.sin(t * 62))), airM));
    const rnd = K.rnd(11), paths = [];
    function grow(p, dir, len, r, depth, trail){
      const end = p.clone().addScaledVector(dir, len), mid = p.clone().lerp(end, .5).add(V((rnd() - .5) * .06, (rnd() - .5) * .06, (rnd() - .5) * .06));
      main.add(K.mesh(K.tubeVar(K.curve([p, mid, end]), 8, 8, t => lerp(r, r * .72, t)), airM));
      const tr = trail.concat([mid, end]);
      if (!depth){ paths.push(tr); return; }
      const ax = V(rnd() - .5, rnd() - .5, rnd() - .5).cross(dir).normalize();
      [-1, 1].forEach(s => grow(end, dir.clone().applyAxisAngle(ax, s * (.5 + rnd() * .25)).add(V(0, -.22, 0)).normalize(), len * .74, r * .7, depth - 1, tr));
    }
    const top = [V(0, 4.02, .14), V(0, 3.6, .05), V(0, 3.02, 0)];
    grow(V(0, 3.02, 0), V(-.74, -.62, 0).normalize(), .5, .085, 3, top); grow(V(0, 3.02, 0), V(.74, -.62, 0).normalize(), .5, .085, 3, top);
    const curves = paths.map(p => K.curve(p));
    const lm = K.glass(0xF2A0AE, .36, {side:THREE.FrontSide}), L = [K.blob(lm, -.76, 2.2, 0, .6, 1.02, .52, 32), K.blob(lm, .76, 2.2, 0, .6, 1.02, .52, 32)];
    L.forEach(l => { l.renderOrder = 9; main.add(l); c.pick(l, "lungs"); });
    const dia = K.mesh(new THREE.SphereGeometry(1.2, 36, 12, 0, TAU, 0, 1.0), new THREE.MeshPhysicalMaterial({color:0xB5483F, roughness:.5, clearcoat:.3, side:THREE.DoubleSide, map:K.fibers()})); dia.scale.z = .72; main.add(dia); c.pick(dia, "dia");
    const air = K.dots(64, .035, K.glow(0xffffff)); main.add(air);
    const AP = []; for (let i = 0; i < 64; i++) AP.push({c:curves[i % curves.length], o:rnd()});
    /* the zoomed view: one bunch of air sacs with a capillary around it */
    const Z = V(6, 2.3, 0);
    zoom.add(K.mesh(new THREE.CylinderGeometry(.09, .09, .7, 12), airM, Z.x, Z.y + .95, 0));
    const am = K.glass(0xF7B9C4, .3, {side:THREE.FrontSide});
    const sacs = [[0, .2, 0], [-.46, -.1, .08], [.46, -.1, .08], [-.22, -.5, -.06], [.26, -.5, -.02]].map(o => { const s = K.blob(am, Z.x + o[0], Z.y + o[1], o[2], .42, .42, .42, 28); s.renderOrder = 9; zoom.add(s); return s; });
    const capC = K.curve([[Z.x - 1.25, Z.y - .55, .3], [Z.x - .75, Z.y - .8, .45], [Z.x, Z.y - .98, .5], [Z.x + .75, Z.y - .8, .45], [Z.x + 1.25, Z.y - .55, .3]]);
    const capG = K.tubeVar(capC, 40, 12, .1), colA = new Float32Array(capG.attributes.position.count * 3), cc = new THREE.Color();
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 12; j++){ cc.setHex(0x4D8DF0).lerp(new THREE.Color(0xE8353B), clamp((i / 40 - .35) / .3, 0, 1)); colA.set([cc.r, cc.g, cc.b], (i * 13 + j) * 3); }
    capG.setAttribute("color", new THREE.BufferAttribute(colA, 3));
    const capM = K.glass(0xffffff, .5, {vertexColors:true, roughness:.2}), cap = K.mesh(capG, capM); cap.renderOrder = 6; zoom.add(cap);
    const gas = K.dots(40, .045, K.glow(0xffffff)); zoom.add(gas);
    let b = 0, auto = true, zoomed = false, lastDir = 0, lastB = 0;
    const status = c.ui.note("", "badge ok");
    const sB = c.ui.slider({label:"Breathe yourself: inhale ↔ exhale", min:0, max:100, value:0, fmt:v => v > 50 ? "Inhale" : "Exhale", on:(v, q) => { b = v / 100; if (!q && auto) tgA.set(false, true); }});
    const row = c.ui.row();
    const tgA = c.ui.toggle({into:row, off_label:"▶ Breathe by itself", on_label:"⏸ Breathe by itself", value:true, on:v => { auto = v; }});
    const tgZ = c.ui.toggle({into:row, off_label:"🔍 Zoom into the alveoli", on_label:"↩️ Back to the lungs", value:false, cls:"go", on:(v, quiet) => { zoomed = v; zoom.visible = v; main.visible = !v; shellG.visible = !v;
      c.look(v ? {target:[Z.x, Z.y - .1, 0], dist:5, theta:.25, phi:1.42} : {target:[0, 2.5, 0], dist:8, theta:.3, phi:1.42}, quiet ? 0 : 500);
      if (!quiet){ c.sfx("whoosh"); c.info(v ? INFO.alv : Lab.cur.intro); } }});
    const INFO = {
      alv:{t:"Alveoli · الحويصلات الهوائية", en:"The lungs hold millions of <b>alveoli</b>, tiny air sacs with walls one cell thick, wrapped in capillaries. <b>Gas exchange:</b> oxygen moves into the blood, and carbon dioxide moves out of it.", ar:"في الرئتين (<b class=t>lungs</b>) ملايين الحويصلات (<b class=t>alveoli</b>): أكياس هواء صغيرة جدارها رقيق جدًّا (خلية واحدة) وحولها شعيرات دموية (<b class=t>capillaries</b>). الأكسجين (<b class=t>oxygen</b>) يعبر للدم، وثاني أكسيد الكربون (<b class=t>carbon dioxide</b>) يطلع من الدم للهواء. شوف الدم كيف يدخل أزرق ويطلع أحمر!"},
      lungs:{t:"Lungs · الرئتان", en:"Air goes down the trachea and the bronchi to the <b>alveoli</b> in the lungs.", ar:"الهواء ينزل في القصبة والشعب الهوائية (<b class=t>bronchi</b>) إلى أن يوصل الحويصلات (<b class=t>alveoli</b>) في الرئتين (<b class=t>lungs</b>)."},
      dia:{t:"Diaphragm · الحجاب الحاجز", en:"The <b>diaphragm</b> is a muscle under the lungs. It moves <b>down</b> to pull air in and <b>up</b> to push it out, by changing the air pressure in the chest.", ar:"الحجاب الحاجز (<b class=t>diaphragm</b>) عضلة تحت الرئتين (<b class=t>lungs</b>). لما تنقبض (<b class=t>contracts</b>) تنزل وتتسطّح فيتّسع الصدر ويدخل الهواء، ولما ترتخي (<b class=t>relaxes</b>) تطلع فيخرج الهواء."}
    };
    c.onPick = k => { c.info(INFO[k]); c.hot(k); };
    c.label("Trachea", V(0, 3.5, .2), {dx:52, show:() => !zoomed}); c.label("Bronchi", V(-.4, 2.85, .1), {dx:-46, show:() => !zoomed, cls:"dim"});
    c.label("Lung", V(.95, 2.6, .4), {pick:"lungs", dx:40, show:() => !zoomed}); c.label("Diaphragm", () => V(0, dia.position.y + 1.2 * dia.scale.y, .4), {pick:"dia", dy:18, show:() => !zoomed});
    c.label("Alveolus (air sac)", V(Z.x, Z.y + .75, .2), {show:() => zoomed, dx:70}); c.label("Capillary", V(Z.x + 1.2, Z.y - .55, .4), {show:() => zoomed, dy:18});
    c.label("O₂ → blood", V(Z.x + .1, Z.y - .78, .5), {show:() => zoomed, dy:26, cls:"hot"}); c.label("CO₂ → out", V(Z.x - .55, Z.y - .2, .5), {show:() => zoomed, dx:-60});
    c.tour = [
      {en:"Air goes in through the nose or mouth, down the trachea, and into the bronchi.", ar:"الهواء يدخل من الأنف أو الفم (<b class=t>mouth</b>) وينزل في القصبة الهوائية (<b class=t>trachea</b>) ثم الشعب.", run:async () => { tgZ.set(false, true); tgA.set(true, true); await c.wait(3000); }},
      {t:"Diaphragm · الحجاب الحاجز", en:"The diaphragm moves down to pull air in, and up to push it out.", ar:"الحجاب الحاجز (<b class=t>diaphragm</b>) ينزل فيدخل الهواء (شهيق، <b class=t>inhale</b>)، ويطلع فيخرج الهواء (زفير، <b class=t>exhale</b>).", hot:"dia", run:async () => { tgA.set(false, true); await c.tween(2200, k => sB.set(k * 100, true)); await c.wait(500); await c.tween(2200, k => sB.set(100 - k * 100, true)); tgA.set(true, true); }},
      {t:"Alveoli · الحويصلات", en:"The lungs hold millions of alveoli, tiny air sacs with walls one cell thick, wrapped in capillaries.", ar:"في الرئتين (<b class=t>lungs</b>) ملايين الحويصلات الهوائية (<b class=t>alveoli</b>)، جدارها رقيق جدًّا وحولها شعيرات دموية.", run:async () => { tgZ.set(true, true); await c.look({target:[Z.x, Z.y - .1, 0], dist:5, theta:.25, phi:1.42}, 900); await c.wait(2600); }},
      {t:"Gas exchange · تبادل الغازات", en:"Gas exchange: oxygen moves from the alveoli into the capillaries, and carbon dioxide moves from the blood into the alveoli and is breathed out.", ar:"تبادل الغازات (<b class=t>gas exchange</b>): الأكسجين (<b class=t>oxygen</b>) يعبر من الحويصلة للدم، وثاني أكسيد الكربون (<b class=t>carbon dioxide</b>) يعبر من الدم للحويصلة ويطلع مع الزفير (<b class=t>exhale</b>).", run:async () => { await c.wait(5200); tgZ.set(false, true); await c.look({target:[0, 2.5, 0], dist:8, theta:.3, phi:1.42}, 800); }}
    ];
    const p = V(), q2 = V(), o2a = V(Z.x + .1, Z.y - .15, .25), co2b = V(Z.x - .15, Z.y + .1, .2), outP = V(Z.x, Z.y + 1.3, 0);
    return {update(dt, t){
      if (auto){ b = .5 - .5 * Math.cos(t * TAU / 4.6); sB.input.value = b * 100; sB.el.querySelector("output").textContent = b > lastB ? "Inhale" : "Exhale"; }
      const d = b > lastB + 1e-4 ? 1 : b < lastB - 1e-4 ? -1 : lastDir;
      if (d !== lastDir && dt){ lastDir = d; if (!zoomed) c.sfx(d > 0 ? "breathIn" : "breathOut"); }
      lastB = b;
      L.forEach((l, i) => l.scale.set(.6 * (1 + .1 * b), 1.02 * (1 + .09 * b), .52 * (1 + .14 * b)));
      const sy = lerp(1, .32, b); dia.scale.y = sy; dia.position.y = 1.02 - 1.2 * Math.cos(1.0) * sy;
      AP.forEach((a, i) => { a.c.getPoint(clamp(a.o * .5 + b * .5, 0, 1), p); air.set(i, p, 1, d > 0 ? 0xBFE9FF : 0xD9D2A6); });
      air.done();
      status.textContent = d > 0 ? "⬇️ Inhale: the diaphragm moves down and air comes in" : "⬆️ Exhale: the diaphragm moves up and air goes out";
      if (zoomed){
        for (let i = 0; i < 40; i++){
          const f = (t * .22 + i / 40) % 1;
          if (i < 16){ capC.getPoint(f, p); gas.set(i, p, 1.25, f < .35 ? 0x4D8DF0 : f > .65 ? 0xE8353B : new THREE.Color(0x4D8DF0).lerp(new THREE.Color(0xE8353B), (f - .35) / .3)); }   /* blood cells */
          else if (i < 28){ const k = (f * 2) % 1; if (k < .5) p.lerpVectors(o2a.clone().add(q2.set(Math.sin(i * 3) * .25, Math.cos(i * 5) * .2, 0)), capC.getPoint(.5, q2), k * 2); else capC.getPoint(.5 + (k - .5), p); gas.set(i, p, .7, 0x7CF0FF); }   /* oxygen */
          else { const k = (f * 2) % 1; if (k < .4) p.lerpVectors(capC.getPoint(.3, q2), co2b.clone().add(V(Math.sin(i) * .2, 0, 0)), k / .4); else p.lerpVectors(co2b, outP, (k - .4) / .6); gas.set(i, p, .7, 0xE8D46A); }   /* carbon dioxide */
        }
        gas.done();
        sacs.forEach((s, i) => s.scale.setScalar(.42 * (1 + .06 * Math.sin(t * 1.4))));
      }
    }};
  }
});

/* ====================================================================== LESSON 5 */
/* ---------- a reflex: the signal's path from a hot pot to the muscle, and only then to the brain ---------- */
Lab.scene({
  id:"reflex", les:5, icon:"⚡", title:"Neurons, stimulus and response", ar:"ردّ الفعل المنعكس والدماغ", topic:"l5-neuron",
  cam:{target:[.55, 2.9, 0], dist:8.4, theta:.18, phi:1.42}, floor:[.6, .9, .3, 3.6],
  intro:{t:"Reflex · ردّ الفعل المنعكس",
    en:"<b>Stimulus</b> → <b>receptor</b> → sensory neuron → spinal cord → motor neuron → muscle → <b>response</b>. A <b>reflex</b> is fast and automatic and goes through the spinal cord.",
    ar:"لما تلمس شيء حارّ، يدك تنسحب قبل ما تحسّ بالألم! الإشارة تروح من الجلد للحبل الشوكي (<b class=t>spinal cord</b>) وترجع للعضلة (<b class=t>muscle</b>) على طول، وبعدين توصل للدماغ (<b class=t>brain</b>). اضغط «المس القدر» وتابع الإشارة."},
  build(c){
    const g = c.root, skin = K.glass(0xF2C9A8, .42, {side:THREE.FrontSide, roughness:.5}), bone = K.bone();
    /* head, brain and spinal cord */
    const head = K.blob(K.glass(0xF2C9A8, .13, {side:THREE.FrontSide}), 0, 4.4, 0, .58, .64, .64); head.renderOrder = 11; g.add(head);
    const bm = (col) => K.organ(col, {emissive:0xFFFFFF, emissiveIntensity:0});
    const B = {cerebrum:new THREE.Group(), cerebellum:K.blob(bm(0xC98BA6), 0, 4.14, -.3, .22, .14, .17), stem:K.mesh(new THREE.CylinderGeometry(.09, .07, .45, 14), bm(0xD9B58A), 0, 4.0, -.1)};
    const cm = bm(0xE9A6B4); B.cerebrum.add(K.blob(cm, -.19, 4.5, 0, .27, .33, .42, 28), K.blob(cm, .19, 4.5, 0, .27, .33, .42, 28));
    for (const k in B){ g.add(B[k]); c.pick(B[k], k); }
    const cordM = K.glow(0xFFD86B), cord = K.mesh(new THREE.CylinderGeometry(.055, .055, 2.6, 12), cordM, 0, 2.5, -.1); g.add(cord); c.pick(cord, "cord");
    for (let i = 0; i < 10; i++){ const r = K.mesh(new THREE.TorusGeometry(.15, .05, 8, 18), K.glass(0xEFE5CF, .5), 0, 1.35 + i * .26, -.1); r.rotation.x = Math.PI / 2; r.renderOrder = 9; g.add(r); }
    const torso = K.mesh(new THREE.CapsuleGeometry(.6, 1.6, 8, 20), K.glass(0xF2C9A8, .1, {side:THREE.FrontSide}), 0, 2.5, 0); torso.scale.set(1.15, 1, .7); torso.renderOrder = 11; g.add(torso);
    /* the arm reaches to the right, towards the pot */
    const A = new THREE.Group(); A.position.set(.72, 3.4, 0); A.rotation.y = Math.PI / 2; g.add(A);
    const upG = new THREE.Group(); upG.rotation.x = -.42; A.add(upG);
    const hum = K.mesh(K.boneGeo(1.25, .07, .12), bone); hum.rotation.x = Math.PI; upG.add(hum);
    const upS = K.mesh(new THREE.CapsuleGeometry(.17, .95, 6, 14), skin, 0, -.62, 0); upS.renderOrder = 10; upG.add(upS);
    const bic = K.mesh(K.spindleGeo(), K.muscle()); bic.material.emissive = new THREE.Color(0xFF2A1A); bic.material.emissiveIntensity = 0; upG.add(bic);
    const fa = new THREE.Group(); fa.position.set(0, -1.27, 0); upG.add(fa);
    const fb = K.mesh(K.boneGeo(1.05, .055, .09), bone); fb.rotation.x = Math.PI; fa.add(fb);
    const loS = K.mesh(new THREE.CapsuleGeometry(.13, .8, 6, 14), skin, 0, -.52, 0); loS.renderOrder = 10; fa.add(loS);
    const handM = K.flat(0xE8B894); fa.add(K.blob(handM, 0, -1.2, 0, .13, .17, .07)); const tip = new THREE.Object3D(); tip.position.set(0, -1.42, 0); fa.add(tip);
    for (let i = 0; i < 4; i++) fa.add(K.mesh(new THREE.CapsuleGeometry(.03, .14, 4, 8), handM, -.09 + i * .06, -1.4, 0));
    let ang = rad(62);
    const setArm = () => { fa.rotation.x = -ang; A.updateMatrixWorld(true); const I = fa.localToWorld(V(0, -.3, .06)); upG.worldToLocal(I); const O = V(0, -.12, .15), len = K.between(bic, O, I, .36 * Math.pow(1.02 / I.distanceTo(O), 1.2)); return len; };
    const TOUCH = rad(62), AWAY = rad(128), REST = rad(84);
    ang = TOUCH; setArm(); g.updateMatrixWorld(true);
    const F = tip.getWorldPosition(V());
    /* the stove and the pot sit right under the fingers */
    const pot = new THREE.Group(); pot.position.set(F.x + .05, F.y - .34, F.z); g.add(pot);
    pot.add(K.mesh(new THREE.CylinderGeometry(.36, .32, .3, 28), new THREE.MeshStandardMaterial({color:0xD9483B, roughness:.3, metalness:.5}), 0, .15, 0), K.mesh(new THREE.CylinderGeometry(.33, .33, .02, 28), K.flat(0x7A4A2A), 0, .29, 0));
    pot.add(K.mesh(new THREE.BoxGeometry(1.3, .14, .9), K.flat(0x3A3F58, {roughness:.4}), 0, -.08, 0), K.mesh(new THREE.CylinderGeometry(.4, .4, .02, 28), K.glow(0xFF7A2E), 0, 0, 0), K.mesh(new THREE.BoxGeometry(.12, .9, .12), K.flat(0x3A3F58), -.5, -.6, 0), K.mesh(new THREE.BoxGeometry(.12, .9, .12), K.flat(0x3A3F58), .5, -.6, 0));
    const steam = [0, 1, 2].map(i => { const s = K.spark(0xffffff, .3); pot.add(s); return s; });
    /* the nerve paths, drawn for the touching pose */
    const wr = fa.localToWorld(V(0, -1.05, .02)), el = fa.getWorldPosition(V()), sh = A.getWorldPosition(V()), mus = upG.localToWorld(V(0, -.6, .14));
    const CD = V(0, 3.15, -.1), sens = K.curve([F, wr, el.clone().add(V(0, .08, 0)), sh.clone().add(V(-.1, .05, 0)), V(.3, 3.3, -.05), CD]);
    const motor = K.curve([CD.clone().add(V(0, -.12, 0)), V(.3, 3.2, .0), sh.clone().add(V(-.05, -.1, .05)), mus]);
    const up = K.curve([CD, V(0, 3.7, -.1), V(0, 4.05, -.1), V(.05, 4.45, 0)]), down = K.curve([V(.05, 4.5, .1), V(0, 4.05, -.1), V(0, 3.7, -.1), CD, V(.3, 3.2, 0), sh.clone().add(V(-.05, -.1, .05)), mus]);
    const nS = K.mesh(K.tubeVar(sens, 60, 6, .016), K.glow(0x6FB6FF, {transparent:true, opacity:.9, depthTest:false})), nM = K.mesh(K.tubeVar(motor, 40, 6, .016), K.glow(0xFF7B6B, {transparent:true, opacity:.9, depthTest:false}));
    nS.renderOrder = nM.renderOrder = 15; g.add(nS, nM);
    const sig = K.spark(0xffffff, .5), flash = K.spark(0xFFE14D, .1), hot = K.spark(0xFF6A2E, .1); g.add(sig, flash, hot); sig.visible = false; flash.position.copy(CD); hot.position.copy(F);
    const STEPS = ["Stimulus", "Receptor", "Sensory neuron", "Spinal cord", "Motor neuron", "Muscle", "Response", "Brain: pain!"];
    const ol = document.createElement("ol"); ol.className = "steps"; ol.innerHTML = STEPS.map(s => "<li>" + s + "</li>").join(""); document.getElementById("ctl").appendChild(ol);
    const mark = n => [...ol.children].forEach((li, i) => { li.className = i < n ? "done" : i === n ? "on" : ""; });
    let slow = .45, busy = 0, ouch = false, bicK = 0, brainK = 0, hotK = 0;
    const run = (curve, ms, col) => { sig.visible = true; sig.material.color.setHex(col); c.sfx("zap"); return c.tween(ms / slow, k => curve.getPoint(k, sig.position), null).then(() => { sig.visible = false; }); };
    async function reflex(){
      const my = ++busy; ouch = false; mark(-1); nS.visible = nM.visible = true;
      const ok = () => my === busy;
      await c.tween(500, k => { ang = lerp(ang, TOUCH, k); }); if (!ok()) return;
      mark(0); c.sfx("sizzle"); c.info({t:"1 · Stimulus · المنبّه", en:"<b>Stimulus:</b> the hand touches a hot pot.", ar:"المنبّه (<b class=t>stimulus</b>): اليد لمست القدر الحارّ."}); hotK = 1; await c.wait(700 / slow); if (!ok()) return;
      mark(1); c.info({t:"2 · Receptors · المستقبِلات", en:"<b>Receptors</b> in the skin sense the heat.", ar:"المستقبِلات (<b class=t>receptors</b>) في الجلد حسّت بالحرارة."}); await c.wait(600 / slow); if (!ok()) return;
      mark(2); c.info({t:"3 · Sensory neuron · العصب الحسّي", en:"A <b>sensory neuron</b> carries the signal to the spinal cord.", ar:"العصب الحسّي (<b class=t>sensory neuron</b>)، الأزرق، يوصّل الإشارة للحبل الشوكي (<b class=t>spinal cord</b>)."}); await run(sens, 1500, 0x6FB6FF); if (!ok()) return;
      mark(3); c.info({t:"4 · Spinal cord · الحبل الشوكي", en:"In the <b>spinal cord</b>, an interneuron passes the signal straight to a motor neuron. There is no time to think!", ar:"في الحبل الشوكي (<b class=t>spinal cord</b>) الإشارة تتحوّل على طول للعصب الحركي (<b class=t>motor neuron</b>). ما في وقت للتفكير!"}); c.sfx("ding"); await c.tween(600 / slow, k => { flash.scale.setScalar(.1 + Math.sin(k * Math.PI) * 1.1); }, null); if (!ok()) return;
      mark(4); c.info({t:"5 · Motor neuron · العصب الحركي", en:"A <b>motor neuron</b> carries the signal to the arm muscle.", ar:"العصب الحركي (<b class=t>motor neuron</b>)، الأحمر، يوصّل الأمر لعضلة الذراع."}); await run(motor, 1000, 0xFF7B6B); if (!ok()) return;
      mark(5); c.info({t:"6 · Muscle: the response · العضلة والاستجابة", en:"The <b>muscle</b> contracts and pulls the hand away: the <b>response</b>.", ar:"العضلة (<b class=t>muscle</b>) تنقبض (<b class=t>contracts</b>) وتسحب اليد بعيد: هذي الاستجابة (<b class=t>response</b>)."}); c.sfx("swish"); nS.visible = nM.visible = false; hotK = 0;
      await c.tween(260 / Math.max(slow, .6), k => { ang = lerp(TOUCH, AWAY, k); bicK = k; }); mark(6); await c.wait(500 / slow); if (!ok()) return;
      mark(7); c.info({t:"7 · Brain · الدماغ", en:"Only <b>then</b> does the signal reach the brain, and you feel the pain.", ar:"وبعد كل هذا توصل الإشارة للدماغ (<b class=t>brain</b>) فتحسّ بالألم: آي!"}); await run(up, 900, 0xC77DFF); if (!ok()) return;
      ouch = true; brainK = 1; c.sfx("ouch"); mark(8); await c.wait(1800); if (!ok()) return;
      ouch = false; await c.tween(900, k => { ang = lerp(AWAY, REST, k); bicK = 1 - k; }); nS.visible = nM.visible = true;
    }
    async function voluntary(){
      const my = ++busy; ouch = false; mark(-1); nS.visible = nM.visible = false; const ok = () => my === busy;
      c.info({t:"Voluntary action · حركة إرادية", en:"A <b>voluntary</b> action is chosen: the <b>cerebrum</b> decides, and the signal goes down the spinal cord to the muscles.", ar:"الحركة الإرادية (<b class=t>voluntary</b>) أنت تختارها: المخ (<b class=t>cerebrum</b>) يقرّر، والإشارة تنزل في الحبل الشوكي (<b class=t>spinal cord</b>) للعضلة (<b class=t>muscle</b>). هذي أبطأ من ردّ الفعل المنعكس (<b class=t>reflex</b>)."});
      brainK = 1; c.sfx("ding"); await c.tween(500, k => { ang = lerp(ang, REST, k); }); if (!ok()) return;
      await run(down, 1700, 0xC77DFF); if (!ok()) return;
      c.sfx("swish"); await c.tween(2400, k => { ang = REST + rad(34) * Math.sin(k * TAU * 2) * Math.sin(k * Math.PI); bicK = Math.abs(Math.sin(k * TAU * 2)); }, null); bicK = 0; nS.visible = nM.visible = true;
    }
    c.ui.buttons([{label:"🔥 Touch the hot pot", cls:"go", on:() => reflex()}, {label:"🧠 Voluntary: move your hand", on:() => voluntary()}]);
    c.ui.seg({value:"slow", opts:[{k:"slow", label:'🐢 Slow motion<small>بالتصوير البطيء</small>'}, {k:"fast", label:'⚡ Real speed<small>السرعة الحقيقية</small>'}], on:k => { slow = k === "slow" ? .45 : 1.6; }});
    const INFO = {
      cerebrum:{t:"Cerebrum · المخ", en:"The <b>cerebrum</b> is the largest part: thinking, memory, the senses and voluntary movement.", ar:"المخ (<b class=t>cerebrum</b>) أكبر جزء في الدماغ (<b class=t>brain</b>): التفكير والذاكرة والحواس والحركات الإرادية (<b class=t>voluntary</b>)."},
      cerebellum:{t:"Cerebellum · المخيخ", en:"The <b>cerebellum</b> controls balance and coordination.", ar:"المخيخ (<b class=t>cerebellum</b>) مسؤول عن التوازن (<b class=t>balance</b>) وتناسق الحركات."},
      stem:{t:"Brain stem · جذع الدماغ", en:"The <b>brain stem</b> controls breathing and heartbeat, which are involuntary.", ar:"جذع الدماغ (<b class=t>brain stem</b>) يتحكم في التنفّس ونبض القلب (<b class=t>heart</b>): أشياء لا إرادية (<b class=t>involuntary</b>)."},
      cord:{t:"Spinal cord · الحبل الشوكي", en:"The <b>spinal cord</b> is the main pathway for messages, and it handles reflexes. Brain + spinal cord = the central nervous system.", ar:"الحبل الشوكي (<b class=t>spinal cord</b>) الطريق الرئيسي للرسائل، وهو اللي يدير ردود الفعل المنعكسة. الدماغ (<b class=t>brain</b>) مع الحبل الشوكي = الجهاز العصبي المركزي (<b class=t>central nervous system</b>)."}
    };
    c.onPick = k => { c.info(INFO[k]); c.hot(k); brainK = k === "cord" ? 0 : 1; };
    c.label("Cerebrum", V(.3, 4.85, .2), {pick:"cerebrum", dx:44, dy:-8}); c.label("Cerebellum", V(0, 4.12, -.5), {pick:"cerebellum", dx:-58}); c.label("Brain stem", V(0, 3.95, 0), {pick:"stem", dx:-62, dy:14, cls:"dim"});
    c.label("Spinal cord", V(0, 2.2, -.1), {pick:"cord", dx:-56}); c.label("Ouch!", V(.1, 5.25, 0), {show:() => ouch, cls:"big"});
    c.label("Hot pot", () => pot.getWorldPosition(V()).add(V(0, -.2, .5)), {dy:20, cls:"dim"});
    c.tour = [
      {en:"A stimulus is a change. Receptors sense it, and a sensory neuron carries the signal to the spinal cord.", ar:"المنبّه (<b class=t>stimulus</b>) تغيّر يحسّ فيه الجسم. المستقبِلات (<b class=t>receptors</b>) تلقطه، والعصب الحسّي (<b class=t>sensory neuron</b>) يوصّل الإشارة للحبل الشوكي (<b class=t>spinal cord</b>).", run:async () => { slow = .45; const r = reflex(); await c.wait(5200); await r; }, min:1000},
      {t:"Reflex · منعكس", en:"A reflex is fast and automatic. The hand pulls away, and only then does the signal reach the brain and you feel the pain.", ar:"ردّ الفعل المنعكس (<b class=t>reflex</b>) سريع وتلقائي: اليد تنسحب أولًا، وبعدين توصل الإشارة للدماغ (<b class=t>brain</b>) وتحسّ بالألم.", run:() => c.wait(1500)},
      {t:"Voluntary · إرادي", en:"Voluntary actions are chosen, like raising your hand. The cerebrum decides.", ar:"الحركة الإرادية (<b class=t>voluntary</b>) أنت تختارها، مثل رفع اليد. المخ (<b class=t>cerebrum</b>) هو اللي يقرّر.", run:() => voluntary()},
      {t:"Brain · الدماغ", en:"Cerebrum: thinking and memory. Cerebellum: balance. Brain stem: breathing and heartbeat.", ar:"المخ (<b class=t>cerebrum</b>) للتفكير والذاكرة، والمخيخ (<b class=t>cerebellum</b>) للتوازن (<b class=t>balance</b>)، وجذع الدماغ (<b class=t>brain stem</b>) للتنفّس ونبض القلب (<b class=t>heart</b>).", run:async () => { await c.look({target:[0, 4.3, 0], dist:4, theta:.9, phi:1.4}, 900); await c.wait(3000); await c.look({target:[.55, 2.9, 0], dist:8.4, theta:.18, phi:1.42}, 900); }}
    ];
    ang = REST;
    return {update(dt, t, real){
      setArm();
      bic.material.emissiveIntensity = bicK * .6;
      brainK = Math.max(0, brainK - real * .5); hotK = Math.max(0, hotK - real * .25);
      cm.emissiveIntensity = brainK * .5 * (.6 + .4 * Math.sin(t * 9));
      hot.scale.setScalar(.1 + hotK * (.5 + .2 * Math.sin(t * 20))); hot.visible = hotK > .02;
      steam.forEach((s, i) => { const f = (t * .35 + i / 3) % 1; s.position.set(Math.sin(i * 2 + t) * .1, .35 + f * .7, Math.cos(i * 3) * .1); s.material.opacity = .35 * (1 - f); s.scale.setScalar(.2 + f * .3); });
      flash.visible = flash.scale.x > .12;
    }};
  }
});

/* ---------- the eye: light in, an upside-down image on the retina, and the pupil that changes size ---------- */
Lab.scene({
  id:"eye", les:5, icon:"👁️", title:"Sight", ar:"العين والرؤية", topic:"l5-eye",
  cam:{target:[-1.0, 0, 0], dist:8.6, theta:.32, phi:1.38}, floor:false,
  intro:{t:"How we see · كيف نشوف؟",
    en:"Light → <b>cornea</b> (bends light) → <b>pupil</b> → <b>lens</b> (focuses) → <b>retina</b> (rods and cones) → <b>optic nerve</b> → brain, which makes sense of the upside-down image.",
    ar:"هذي عين مقطوعة نصّين عشان تشوف جوّاها. الضوء يدخل من القرنية (<b class=t>cornea</b>) ثم البؤبؤ (<b class=t>pupil</b>)، والعدسة (<b class=t>lens</b>) تجمّعه على الشبكية (<b class=t>retina</b>) فتتكوّن صورة مقلوبة، والعصب البصري (<b class=t>optic nerve</b>) يوصّلها للدماغ (<b class=t>brain</b>) اللي يعدّلها. حرّك شريط الضوء وراقب البؤبؤ."},
  build(c){
    const g = c.root, plane = new THREE.Plane(V(0, 0, -1), 0), cut = [plane];
    const clipM = [];
    const cl = m => { m.clippingPlanes = cut; clipM.push(m); return m; };
    const rz = geo => geo.rotateZ(Math.PI / 2);   /* turn a shape's top towards the front of the eye (−x) */
    const sclera = K.mesh(rz(new THREE.SphereGeometry(1, 56, 36, 0, TAU, .5, Math.PI - .5)), cl(new THREE.MeshPhysicalMaterial({color:0xF7F4EE, roughness:.35, clearcoat:.5}))); g.add(sclera); c.pick(sclera, "retina");
    const retM = cl(new THREE.MeshStandardMaterial({color:0xE8845C, roughness:.6, side:THREE.BackSide, emissive:0xFF5522, emissiveIntensity:0}));
    g.add(K.mesh(rz(new THREE.SphereGeometry(.965, 56, 36, 0, TAU, .52, Math.PI - .52)), retM));
    const cornea = K.mesh(rz(new THREE.SphereGeometry(.62, 40, 16, 0, TAU, 0, .95)), cl(K.glass(0xCFEFFF, .3, {roughness:.05}))); cornea.position.x = -.52; cornea.renderOrder = 12; g.add(cornea); c.pick(cornea, "cornea");
    const irisM = cl(new THREE.MeshStandardMaterial({color:0x8A5A2B, roughness:.5, side:THREE.DoubleSide}));
    const irisGeo = rp => rz(new THREE.LatheGeometry([[rp, -.03], [.49, -.03], [.49, .03], [rp, .03], [rp, -.03]].map(p => new THREE.Vector2(p[0], p[1])), 40));
    const iris = K.mesh(irisGeo(.24), irisM); iris.position.x = -.84; g.add(iris); c.pick(iris, "iris");
    const lens = K.blob(cl(K.glass(0xFFF3C4, .55, {roughness:.05, side:THREE.FrontSide})), -.62, 0, 0, .17, .36, .36); lens.renderOrder = 11; g.add(lens); c.pick(lens, "lens");
    const nerve = K.mesh(K.tubeVar(K.curve([[.93, -.14, 0], [1.3, -.22, 0], [1.95, -.45, -.1]]), 20, 12, .12), K.organ(0xF2D16B, {emissive:0xFFD23F, emissiveIntensity:0})); g.add(nerve); c.pick(nerve, "nerve");
    g.add(K.blob(K.flat(0xFFE9B0), .955, -.14, -.01, .02, .1, .1));
    /* what he looks at: a little tree, and its upside-down picture on the retina */
    const tree = () => { const t = new THREE.Group(); t.add(K.mesh(new THREE.CylinderGeometry(.06, .08, .5, 10), new THREE.MeshStandardMaterial({color:0x8B5A2B}), 0, -.45, 0), K.mesh(new THREE.ConeGeometry(.34, .6, 14), new THREE.MeshStandardMaterial({color:0x2FA35A}), 0, .1, 0), K.mesh(new THREE.ConeGeometry(.24, .45, 14), new THREE.MeshStandardMaterial({color:0x37B866}), 0, .45, 0), K.mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshStandardMaterial({color:0xE23F45}), .12, .05, .25)); return t; };
    const obj = tree(); obj.position.set(-3.5, 0, 0); g.add(obj);
    const img = tree(); img.position.set(.86, 0, -.02); img.rotation.z = Math.PI; img.scale.setScalar(.36); g.add(img);
    const sun = K.spark(0xFFE9A0, 1); sun.position.set(-3.5, 1.6, -.4); g.add(sun);
    /* the light rays: from the top and the bottom of the tree, through the pupil, crossing to the retina */
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, .5, 0), rayM = K.glow(0xFFE14D, {transparent:true, opacity:.75});
    const RAYS = []; [[.68, -.39], [-.68, .39]].forEach(([y0, y1]) => [-1, 0, 1].forEach(k => { const a = K.mesh(cyl, rayM), b = K.mesh(cyl, rayM); g.add(a, b); RAYS.push({a, b, y0, y1, k}); }));
    const photons = K.dots(18, .035, K.glow(0xffffff)); g.add(photons);
    let light = 50, rp = .24, whole = false;
    const status = c.ui.note("", "badge ok");
    const sL = c.ui.slider({label:"Light: dim ↔ bright", min:0, max:100, value:50, fmt:v => v < 30 ? "dim" : v > 70 ? "bright" : "normal", on:(v, q) => { light = v; const n = lerp(.37, .1, v / 100); if (Math.abs(n - rp) > .004){ rp = n; iris.geometry.dispose(); iris.geometry = irisGeo(rp); } if (!q && Math.round(v) % 10 === 0) c.sfx("tap"); }});
    c.ui.toggle({off_label:"✂️ Cut the eye open", on_label:"👁️ Show the whole eye", value:true, on:(v, quiet) => { whole = !v; clipM.forEach(m => { m.clippingPlanes = v ? cut : []; m.needsUpdate = true; }); if (!quiet){ c.sfx("pop"); if (!v) c.look({theta:-.62, phi:1.4, dist:7.6, target:[-1.3, 0, 0]}, 800); else c.look({theta:.32, phi:1.38, dist:8.6, target:[-1, 0, 0]}, 800); } }});
    const INFO = {
      cornea:{t:"Cornea · القرنية", en:"The <b>cornea</b> is the clear front of the eye. It bends the light.", ar:"القرنية (<b class=t>cornea</b>) الغطاء الشفّاف قدّام العين، وهي أول شيء يكسر الضوء."},
      iris:{t:"Iris and pupil · القزحية والبؤبؤ", en:"The <b>iris</b> makes the <b>pupil</b> smaller in bright light and bigger in dim light.", ar:"القزحية (<b class=t>iris</b>)، الجزء الملوّن، تصغّر البؤبؤ (<b class=t>pupil</b>) في الضوء القوي وتكبّره في الضوء الخافت، عشان تتحكم في كمية الضوء الداخل."},
      lens:{t:"Lens · العدسة", en:"The <b>lens</b> focuses the light on the retina.", ar:"العدسة (<b class=t>lens</b>) تجمّع الضوء وتركّزه على الشبكية (<b class=t>retina</b>)."},
      retina:{t:"Retina · الشبكية", en:"The <b>retina</b> has rods and cones. <b>Rods</b> work in dim light (black, white, gray); <b>cones</b> see color.", ar:"الشبكية (<b class=t>retina</b>) في آخر العين وفيها العصي (<b class=t>rods</b>) والمخاريط (<b class=t>cones</b>): العصي تشتغل في الضوء الخافت (أبيض وأسود)، والمخاريط تشوف الألوان. والصورة عليها مقلوبة!"},
      nerve:{t:"Optic nerve · العصب البصري", en:"The <b>optic nerve</b> carries the signal to the brain. Where it leaves the eye there are no rods or cones: the <b>blind spot</b>.", ar:"العصب البصري (<b class=t>optic nerve</b>) يوصّل الإشارة للدماغ (<b class=t>brain</b>). والمكان اللي يطلع منه ما فيه عصي ولا مخاريط، واسمه البقعة العمياء (<b class=t>blind spot</b>)."}
    };
    c.onPick = k => { c.info(INFO[k]); c.hot(k); };
    c.label("Cornea", V(-1.14, .3, 0), {pick:"cornea", dx:-40, dy:-22}); c.label("Pupil", V(-.84, 0, 0), {pick:"iris", dx:-46, dy:30}); c.label("Iris", V(-.84, .42, 0), {pick:"iris", dx:-10, dy:-30, cls:"dim"});
    c.label("Lens", V(-.62, -.3, 0), {pick:"lens", dx:16, dy:34}); c.label("Retina", V(.7, .72, 0), {pick:"retina", dx:34, dy:-18}); c.label("Optic nerve", V(1.6, -.33, 0), {pick:"nerve", dy:26}); c.label("Blind spot", V(.96, -.14, 0), {pick:"nerve", dx:50, cls:"dim"});
    c.label("Upside-down image", V(.86, .02, 0), {dx:-30, dy:-52, cls:"hot", show:() => !whole});
    c.tour = [
      {en:"Light enters through the cornea, which bends it, and then through the pupil.", ar:"الضوء يدخل من القرنية (<b class=t>cornea</b>) اللي تكسره، ثم من البؤبؤ (<b class=t>pupil</b>).", hot:"cornea", run:() => c.wait(2200)},
      {t:"Pupil · البؤبؤ", en:"The iris makes the pupil smaller in bright light and bigger in dim light.", ar:"القزحية (<b class=t>iris</b>) تصغّر البؤبؤ (<b class=t>pupil</b>) في الضوء القوي وتكبّره في الخافت.", hot:"iris", run:async () => { const s = sL; await c.tween(1800, k => s.set(lerp(50, 100, k), true)); await c.wait(500); await c.tween(2200, k => s.set(lerp(100, 0, k), true)); await c.wait(500); await c.tween(1200, k => s.set(lerp(0, 50, k), true)); }},
      {t:"Lens and retina · العدسة والشبكية", en:"The lens focuses the light on the retina, where the image is upside down.", ar:"العدسة (<b class=t>lens</b>) تركّز الضوء على الشبكية (<b class=t>retina</b>)، والصورة هناك تطلع مقلوبة.", hot:"retina", run:() => c.wait(2800)},
      {t:"Optic nerve · العصب البصري", en:"The optic nerve carries the signal to the brain, which makes sense of the upside-down image.", ar:"العصب البصري (<b class=t>optic nerve</b>) يوصّل الإشارة للدماغ (<b class=t>brain</b>)، والدماغ هو اللي يعدّل الصورة ويفهمها.", hot:"nerve", run:() => c.wait(2600)},
      {t:"Rods and cones · العصي والمخاريط", en:"Rods work in dim light and see black, white and gray. Cones see color.", ar:"العصي (<b class=t>rods</b>) تشتغل في الضوء الخافت وتشوف أبيض وأسود ورمادي، والمخاريط (<b class=t>cones</b>) تشوف الألوان.", run:async () => { const s = sL; await c.tween(1500, k => s.set(lerp(50, 4, k), true)); await c.wait(1800); await c.tween(1500, k => s.set(lerp(4, 60, k), true)); }}
    ];
    const a0 = V(), a1 = V(), a2 = V(), gray = new THREE.Color(0x8A8A8A), cols = [], orig = [];
    [obj, img].forEach(t => t.traverse(o => { if (o.material){ cols.push(o.material); orig.push(o.material.color.clone()); } }));
    const api = {update(dt, t){
      const dim = clamp(1 - light / 28, 0, 1), L = light / 100;
      cols.forEach((m, i) => m.color.copy(orig[i]).lerp(gray, dim * .9).multiplyScalar(.45 + .55 * Math.min(1, L * 2 + .1)));
      sun.scale.setScalar(.4 + L * 1.5); sun.material.opacity = .35 + L * .65;
      rayM.opacity = .25 + L * .6;
      RAYS.forEach((r, i) => { a0.set(-3.5, r.y0, 0); a1.set(-.84, r.k * rp * .82, 0); a2.set(.93, r.y1, 0); K.between(r.a, a0, a1, .012); K.between(r.b, a1, a2, .012);
        for (let j = 0; j < 3; j++){ const f = (t * .5 + j / 3 + i * .13) % 1; if (f < .6) a0.lerp(a1, f / .6); else a0.copy(a1).lerp(a2, (f - .6) / .4); photons.set(i * 3 + j, a0, .5 + L * .7, 0xFFF3B0); a0.set(-3.5, r.y0, 0); } });
      photons.done();
      retM.emissiveIntensity = .08 + L * .25; nerve.material.emissiveIntensity = .15 + .25 * Math.max(0, Math.sin(t * 6)) * L;
      status.textContent = light < 28 ? "🌙 Dim light: the pupil gets bigger, and the rods work in black and white" : light > 72 ? "☀️ Bright light: the pupil gets smaller, and the cones see colors" : "Normal light: the cones see colors";
    }};
    return api;
  }
});
/* ---------- a plant: roots, stem and leaves; water up the xylem, sugar down the phloem, photosynthesis ---------- */
Lab.scene({
  id:"plant", les:4, icon:"🌱", title:"Plants: roots, stems and leaves", ar:"النبات من الجذر للورقة", topic:"l4-plant",
  cam:{target:[0, .8, 0], dist:9.6, theta:.45, phi:1.36}, floor:false,
  intro:{t:"From root to leaf · النبات من الجذر للورقة",
    en:"<b>Xylem</b> carries water and minerals <b>up</b> from the roots to the leaves. <b>Phloem</b> carries the sugar made in the leaves to the rest of the plant.",
    ar:"التربة هنا شفّافة عشان تشوف الجذور (<b class=t>roots</b>). الماء (النقاط الزرقاء) يدخل من الجذور ويطلع في الخشب (<b class=t>xylem</b>) للأوراق (<b class=t>leaves</b>)، والسكر (النقاط الذهبية) ينزل من الأوراق في اللحاء (<b class=t>phloem</b>). جرّب تطفّي الشمس أو تقطع الماء، وغيّر نوع الجذور."},
  build(c){
    const g = c.root, cyl = new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, .5, 0);
    const soil = K.mesh(new THREE.BoxGeometry(3.6, 1.75, 1.9), K.glass(0x8B5A2B, .3, {roughness:.9}), 0, -.9, 0); soil.renderOrder = 9; g.add(soil);
    g.add(K.mesh(new THREE.BoxGeometry(3.6, .05, 1.9), K.flat(0x6DBE5A), 0, -.02, 0));
    /* three kinds of roots */
    const rootM = K.organ(0xE2C08A, {clearcoat:.1, roughness:.7}), rnd = K.rnd(5);
    const R = {tap:{g:new THREE.Group(), cv:[], top:.05}, fib:{g:new THREE.Group(), cv:[], top:.05}, prop:{g:new THREE.Group(), cv:[], top:.6}};
    const mk = (o, pts, r0, r1, flow) => { const cv = K.curve(pts); const m = K.mesh(K.tubeVar(cv, 18, 8, t => lerp(r0, r1, t)), rootM); o.g.add(m); if (flow !== false) o.cv.push(cv);
      /* root hairs near the tip */
      for (let k = 0; k < 5; k++){ const p = cv.getPoint(.72 + k * .06), a = rnd() * TAU, h = K.mesh(cyl, rootM); K.between(h, p, p.clone().add(V(Math.cos(a) * .09, -.03, Math.sin(a) * .09)), .006); o.g.add(h); }
      return cv; };
    mk(R.tap, [[0, .05, 0], [.02, -.5, 0], [-.03, -1.0, .02], [0, -1.55, 0]], .17, .025);
    for (let i = 0; i < 8; i++){ const y = -.2 - i * .15, a = i * 2.3; mk(R.tap, [[0, y, 0], [Math.cos(a) * .3, y - .1, Math.sin(a) * .25], [Math.cos(a) * .62, y - .3, Math.sin(a) * .45]], .035, .012); }
    for (let i = 0; i < 14; i++){ const a = i / 14 * TAU, d = .8 + rnd() * .55; mk(R.fib, [[0, .04, 0], [Math.cos(a) * .35, -.3, Math.sin(a) * .28], [Math.cos(a) * (.6 + rnd() * .5), -d, Math.sin(a) * .55]], .042, .012); }
    for (let i = 0; i < 5; i++){ const a = i / 5 * TAU + .3; mk(R.prop, [[0, .6, 0], [Math.cos(a) * .42, .32, Math.sin(a) * .32], [Math.cos(a) * .78, -.05, Math.sin(a) * .5], [Math.cos(a) * .95, -.7, Math.sin(a) * .58]], .05, .018); }
    for (let i = 0; i < 6; i++){ const a = i / 6 * TAU; mk(R.prop, [[0, .04, 0], [Math.cos(a) * .25, -.3, Math.sin(a) * .2], [Math.cos(a) * .4, -.75, Math.sin(a) * .32]], .03, .01, false); }
    for (const k in R){ g.add(R[k].g); c.pick(R[k].g, "roots"); }
    /* the stem is see-through, with the xylem (blue) and the phloem (orange) inside */
    const stem = K.mesh(new THREE.CylinderGeometry(.13, .17, 2.8, 18), K.glass(0x4CAF50, .4, {side:THREE.FrontSide}), 0, 1.4, 0); stem.renderOrder = 9; g.add(stem); c.pick(stem, "stem");
    const xyM = K.organ(0x4DA3FF, {emissive:0x2266FF, emissiveIntensity:0}), phM = K.organ(0xFFA53A, {emissive:0xFF7A00, emissiveIntensity:0});
    g.add(K.mesh(new THREE.CylinderGeometry(.04, .04, 2.75, 10), xyM, -.05, 1.4, 0), K.mesh(new THREE.CylinderGeometry(.038, .038, 2.75, 10), phM, .05, 1.4, 0), K.blob(K.organ(0x8BD46B), 0, 2.88, 0, .13, .17, .13));
    const leafM = K.organ(0x3FA85A, {roughness:.5, emissive:0x66FF88, emissiveIntensity:0}), LV = [];
    [[1.2, -1], [1.7, 1], [2.15, -1], [2.6, 1]].forEach(([h, s], i) => { const lg = new THREE.Group(); lg.position.set(0, h, 0); lg.rotation.y = (s < 0 ? Math.PI : 0) + (i - 1.5) * .25;
      const pet = K.mesh(cyl, leafM); K.between(pet, V(.08, 0, 0), V(.32, 0, 0), .02); const blade = K.blob(leafM, .82, 0, 0, .58, .04, .34, 24), rib = K.mesh(cyl, K.flat(0xBFE8A8)); K.between(rib, V(.3, .045, 0), V(1.36, .045, 0), .012);
      lg.add(pet, blade, rib); lg.rotation.x = -.45; g.add(lg); c.pick(lg, "leaf"); LV.push({g:lg, h, s}); });
    /* the sun and its rays */
    const sunP = V(-2.5, 3.3, -.4), sun = K.spark(0xFFE9A0, 1.8), core = K.mesh(new THREE.SphereGeometry(.22, 20, 14), K.glow(0xFFD23F), sunP.x, sunP.y, sunP.z); sun.position.copy(sunP); g.add(sun, core);
    const rayM = K.glow(0xFFE14D, {transparent:true, opacity:.5}), rays = LV.map(() => { const r = K.mesh(cyl, rayM); g.add(r); return r; });
    const dots = K.dots(96, .04, K.glow(0xffffff)); g.add(dots);
    let type = "tap", sunOn = true, waterOn = true, sunK = 1, turgor = 1, glowK = "", glowT = 0;
    const INFO = {
      roots:{t:"Roots · الجذور", en:"<b>Roots</b> anchor the plant in the soil and keep it upright, and they absorb water and minerals. <b>Root hairs</b> give them a huge surface to take in water.", ar:"الجذور (<b class=t>roots</b>) تثبّت النبات في التربة وتمتصّ الماء والأملاح. والشعيرات الجذرية (<b class=t>root hairs</b>) الصغيرة تزيد المساحة فتمتصّ ماء أكثر."},
      stem:{t:"Stem · الساق", en:"<b>Stems</b> work like the plant's skeleton: they hold up the branches and leaves, and carry water, minerals and sugar.", ar:"الساق (<b class=t>stem</b>) مثل هيكل النبات: يرفع الأغصان والأوراق (<b class=t>leaves</b>)، وينقل الماء والأملاح والسكر."},
      xylem:{t:"Xylem · الخشب", en:"<b>Xylem</b> carries water and minerals <b>up</b> from the roots to the leaves.", ar:"الخشب (<b class=t>xylem</b>)، الأنبوب الأزرق، ينقل الماء والأملاح من الجذور (<b class=t>roots</b>) لفوق إلى الأوراق (<b class=t>leaves</b>)."},
      phloem:{t:"Phloem · اللحاء", en:"<b>Phloem</b> carries the sugar made in the leaves to the rest of the plant, up or down.", ar:"اللحاء (<b class=t>phloem</b>)، الأنبوب البرتقالي، ينقل السكر اللي تصنعه الأوراق (<b class=t>leaves</b>) لباقي النبات، لفوق أو لتحت."},
      leaf:{t:"Leaf · الورقة", en:"<b>Photosynthesis</b> in the leaves uses light energy, water and carbon dioxide to make <b>glucose</b> (a sugar) and give off <b>oxygen</b>.", ar:"في الورقة (<b class=t>leaf</b>) يتم البناء الضوئي (<b class=t>photosynthesis</b>): ضوء + ماء + ثاني أكسيد الكربون (<b class=t>carbon dioxide</b>) ← سكر (<b class=t>glucose</b>) + أكسجين (<b class=t>oxygen</b>). والنبات يصنع غذاءه بنفسه."},
      stoma:{t:"Stomata · الثغور", en:"<b>Transpiration:</b> water vapor leaves through the <b>stomata</b>, tiny openings in the leaves, and pulls more water up the xylem, like sipping through a straw.", ar:"النتح (<b class=t>transpiration</b>): بخار الماء يطلع من الثغور (<b class=t>stomata</b>)، وهي فتحات صغيرة في الورقة، فيسحب ماء جديد لفوق في الخشب (<b class=t>xylem</b>)، مثل ما تشفط العصير بالمصّاصة."}
    };
    const ROOT = {
      tap:{t:"Taproot · جذر وتدي", en:"<b>Taproot:</b> one large main root with small roots branching off, like a carrot or a dandelion.", ar:"الجذر الوتدي (<b class=t>taproot</b>): جذر رئيسي واحد كبير تتفرّع منه جذور صغيرة، مثل الجزر."},
      fib:{t:"Fibrous roots · جذور ليفية", en:"<b>Fibrous roots:</b> many small branching roots in a dense network.", ar:"الجذور الليفية (<b class=t>fibrous roots</b>): جذور صغيرة كثيرة متشابكة مثل الشبكة."},
      prop:{t:"Prop roots · جذور دعامية", en:"<b>Prop roots:</b> extra roots above the ground that help hold the plant up.", ar:"الجذور الدعامية (<b class=t>prop roots</b>): جذور إضافية تطلع فوق الأرض وتسند النبات عشان ما يطيح."}};
    const status = c.ui.note("", "badge ok");
    const seg = c.ui.seg({value:"tap", opts:[{k:"tap", label:'Taproot<small>وتدي</small>'}, {k:"fib", label:'Fibrous<small>ليفي</small>'}, {k:"prop", label:'Prop roots<small>دعامي</small>'}], on:(k, quiet) => { type = k; for (const n in R) R[n].g.visible = n === k; if (!quiet){ c.info(ROOT[k]); c.sfx("pop"); } }});
    const row = c.ui.row();
    const tgS = c.ui.toggle({into:row, off_label:"☀️ Turn the sun on", on_label:"🌙 Turn the sun off", value:true, on:(v, quiet) => { sunOn = v; if (!quiet){ c.sfx(v ? "sparkle" : "pop"); c.info(v ? INFO.leaf : {t:"No light · بدون ضوء", en:"Without light there is no <b>photosynthesis</b>: the leaves make no glucose and give off no oxygen.", ar:"بدون ضوء ما في بناء ضوئي (<b class=t>photosynthesis</b>): الورقة (<b class=t>leaf</b>) ما تصنع سكر وما تطلّع أكسجين (<b class=t>oxygen</b>)."}); } }});
    const tgW = c.ui.toggle({into:row, off_label:"💧 Water the plant", on_label:"🚱 Stop the water", value:true, on:(v, quiet) => { waterOn = v; if (!quiet){ c.sfx(v ? "drip" : "pop"); c.info(v ? INFO.xylem : {t:"No water · بدون ماء", en:"Water enters the roots and travels through the xylem to every part of the plant. Without water the plant wilts.", ar:"الماء يدخل من الجذور (<b class=t>roots</b>) ويوصل لكل النبات. بدون ماء الأوراق (<b class=t>leaves</b>) ترتخي وتذبل (<b class=t>wilt</b>)، ويوقف البناء الضوئي (<b class=t>photosynthesis</b>)."}); } }});
    seg.set("tap", true);
    const mid = i => LV[i].g.localToWorld(V(.78, .05, 0));
    c.label("Leaf", () => mid(3), {pick:"leaf", dy:-22}); c.label("Stem", V(.16, 1.45, .1), {pick:"stem", dx:40, cls:"dim"});
    c.label("Xylem: water up", V(-.06, .75, .12), {pick:"xylem", dx:-74}); c.label("Phloem: sugar", V(.06, .45, .12), {pick:"phloem", dx:66});
    c.label("Roots", V(.25, -.8, .5), {pick:"roots", dx:46}); c.label("Stomata: water vapor out", () => mid(2).add(V(0, .45, 0)), {pick:"stoma", dy:-10, cls:"dim", show:() => turgor > .4});
    c.label("CO₂ in", () => mid(1).add(V(.75, .55, .35)), {cls:"dim", show:() => sunK > .5 && turgor > .4}); c.label("O₂ out", () => mid(3).add(V(.7, .75, -.3)), {cls:"hot", show:() => sunK > .5 && turgor > .4});
    c.onPick = k => { c.info(INFO[k]); c.hot(k); glowK = k; glowT = 1; };
    c.tour = [
      {t:"Roots · الجذور", en:"Roots anchor the plant in the soil and absorb water and minerals. Root hairs give them a huge surface.", ar:INFO.roots.ar, hot:"roots", run:async () => { tgS.set(true, true); tgW.set(true, true); seg.set("tap", true); await c.look({target:[0, -.5, 0], dist:5.4, theta:.45, phi:1.3}, 800); await c.wait(1800); }},
      {t:"Kinds of roots · أنواع الجذور", en:"A taproot is one large main root. Fibrous roots are many small roots. Prop roots grow above the ground and help hold the plant up.", ar:"الوتدي (<b class=t>taproot</b>) جذر واحد كبير، والليفي (<b class=t>fibrous</b>) جذور صغيرة كثيرة، والدعامي (<b class=t>prop roots</b>) يطلع فوق الأرض ويسند النبات.", run:async () => { await c.wait(1500); seg.set("fib", true); await c.wait(2200); seg.set("prop", true); await c.look({target:[0, 0, 0], dist:6, theta:.45, phi:1.3}, 600); await c.wait(2200); seg.set("tap", true); }},
      {t:"Stem and xylem · الساق والخشب", en:"Stems work like the plant's skeleton. Inside, the xylem carries water and minerals up to the leaves.", ar:"الساق (<b class=t>stem</b>) مثل هيكل النبات، وجوّاه الخشب (<b class=t>xylem</b>) ينقل الماء والأملاح لفوق.", hot:"xylem", run:async () => { glowK = "xylem"; glowT = 1; await c.look({target:[0, .8, 0], dist:9.6, theta:.45, phi:1.36}, 800); await c.wait(2400); }},
      {t:"Photosynthesis · البناء الضوئي", en:"Photosynthesis in the leaves uses light energy, water and carbon dioxide to make glucose and give off oxygen.", ar:INFO.leaf.ar, hot:"leaf", run:async () => { glowK = "leaf"; glowT = 1; await c.look({target:[.3, 2.1, 0], dist:5.2, theta:.45, phi:1.3}, 800); await c.wait(3000); }},
      {t:"Phloem · اللحاء", en:"The phloem carries the sugar made in the leaves to the rest of the plant.", ar:INFO.phloem.ar, hot:"phloem", run:async () => { glowK = "phloem"; glowT = 1; await c.look({target:[0, .8, 0], dist:9.6, theta:.45, phi:1.36}, 800); await c.wait(2600); }},
      {t:"Transpiration · النتح", en:"Transpiration: water vapor leaves through the stomata and pulls more water up the xylem, like sipping through a straw.", ar:INFO.stoma.ar, hot:"stoma", run:() => c.wait(3000)},
      {t:"No water · بدون ماء", en:"Without water, the plant wilts and photosynthesis stops.", ar:"بدون ماء النبات يذبل ويوقف البناء الضوئي (<b class=t>photosynthesis</b>).", run:async () => { tgW.set(false, true); await c.wait(4800); tgW.set(true, true); await c.wait(2400); }}
    ];
    const p = V(), a = V(), b = V(), fresh = new THREE.Color(0x3FA85A), dry = new THREE.Color(0xA7A04A);
    return {update(dt, t, real){
      sunK = lerp(sunK, sunOn ? 1 : 0, .06); turgor = clamp(turgor + (waterOn ? .5 : -.22) * dt, 0, 1);
      const live = sunK > .5 && turgor > .4, o = R[type], n = o.cv.length;
      LV.forEach((l, i) => { l.g.rotation.z = lerp(-.95, .32, turgor) + .03 * Math.sin(t * 1.3 + i); K.between(rays[i], sunP, mid(i), .012); });
      leafM.color.copy(dry).lerp(fresh, turgor); leafM.emissiveIntensity = (live ? .12 : 0) + (glowK === "leaf" ? glowT * .5 : 0);
      rayM.opacity = sunK * .5; sun.material.opacity = .15 + sunK * .85; sun.scale.setScalar(.6 + sunK * 1.4); core.material.color.setHex(sunK > .5 ? 0xFFD23F : 0x7A7FA8);
      glowT = Math.max(0, glowT - real * .35); xyM.emissiveIntensity = glowK === "xylem" ? glowT : 0; phM.emissiveIntensity = glowK === "phloem" ? glowT : 0;
      for (let i = 0; i < 96; i++){
        let on = false, s = 1, col = 0xffffff;
        if (i < 40){   /* water: soil → root → xylem → leaf → out as vapor */
          const L = i % 4, f = (t * .1 + (i * .37) % 1) % 1, cv = o.cv[i % n]; on = waterOn || turgor > .5; col = 0x4DA3FF;
          if (f < .06){ cv.getPoint(1, a); p.copy(a).add(b.set(Math.sin(i * 7) * .3, -.1, Math.cos(i * 5) * .3)).lerp(a, f / .06); }
          else if (f < .26){ const u = (f - .06) / .2; if (u < .8) cv.getPoint(1 - u / .8, p); else { cv.getPoint(0, a); p.copy(a).lerp(b.set(-.04, o.top, 0), (u - .8) / .2); } }
          else if (f < .66){ p.set(-.05, lerp(o.top, LV[L].h, (f - .26) / .4), 0); }
          else if (f < .82){ p.set(-.05, LV[L].h, 0).lerp(mid(L), (f - .66) / .16); }
          else { const u = (f - .82) / .18; p.copy(mid(L)).add(b.set(Math.sin(i + t) * .12 * u, u * .65, Math.cos(i * 3) * .12 * u)); col = 0xFFFFFF; s = 1 - u * .8; on = on && turgor > .4; }
          if (!waterOn && f < .3) on = false;
        } else if (i < 64){   /* sugar: leaf → phloem → down to the roots */
          const j = i - 40, L = j % 4, f = (t * .09 + (j * .29) % 1) % 1; on = live; col = 0xFFD23F;
          if (f < .18) p.copy(mid(L)).lerp(b.set(.05, LV[L].h, 0), f / .18);
          else if (f < .74) p.set(.05, lerp(LV[L].h, o.top, (f - .18) / .56), 0);
          else { const u = (f - .74) / .26; o.cv[j % n].getPoint(u * .6, p); s = 1 - u * .7; }
        } else {   /* carbon dioxide in (gray), oxygen out (blue-green) */
          const k = i - 64, L = k % 4, out = k >= 16, f = (t * .22 + (k * .23) % 1) % 1, dir = LV[L].s; on = live;
          a.copy(mid(L)); b.copy(a).add(V(dir * .75 * (out ? .9 : 1), out ? .8 : .55, out ? -.3 : .35));
          if (out){ p.copy(a).lerp(b, f); col = 0x7CF0FF; } else { p.copy(b).lerp(a, f); col = 0xB9C2CF; }
          s = .8;
        }
        if (on) dots.set(i, p, s, col); else dots.set(i, p.set(0, -99, 0), 0);
      }
      dots.done();
      status.textContent = turgor < .4 ? "🥀 The plant wilts: no water, so photosynthesis stops" : !sunOn ? "🌙 No light: water still goes up, but no sugar or oxygen is made" : "🌞 Light + water + CO₂ → sugar + oxygen (photosynthesis)";
      status.className = "note badge " + (turgor < .4 ? "bad" : "ok");
    }};
  }
});

/* ---------- the ear: sound from the pinna to the brain, and the canals that sense balance ---------- */
Lab.scene({
  id:"ear", les:5, icon:"👂", title:"Hearing and balance", ar:"الأذن: السمع والتوازن", topic:"l5-ear",
  cam:{target:[-.75, .15, 0], dist:9.8, theta:.22, phi:1.4}, floor:false,
  intro:{t:"How we hear · كيف نسمع؟",
    en:"Sound is vibrations. <b>Pinna</b> → <b>ear canal</b> → the <b>eardrum</b> vibrates → the <b>hammer, anvil and stirrup</b> make the vibrations stronger → the <b>cochlea</b> → the <b>auditory nerve</b> → brain.",
    ar:"الصوت اهتزازات. صيوان الأذن (<b class=t>pinna</b>) يجمعها، فتمشي في القناة السمعية (<b class=t>ear canal</b>) وتهزّ الطبلة (<b class=t>eardrum</b>)، والعظيمات الثلاث (<b class=t>hammer, anvil, stirrup</b>) تقوّي الاهتزاز (<b class=t>vibration</b>) وتوصّله للقوقعة (<b class=t>cochlea</b>)، وهناك تتحوّل لإشارة عصبية تروح للدماغ (<b class=t>brain</b>). اضغط «دقّ الجرس» وتابع الاهتزاز، وغيّر قوة الصوت."},
  build(c){
    const g = c.root, E = new THREE.Group(); g.add(E);
    const skin = K.flat(0xE8B894, {roughness:.55}), bone = K.bone(), cyl = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, .5, 0);
    const em = m => { m.emissive = new THREE.Color(0xFFD23F); m.emissiveIntensity = 0; return m; };
    /* outer ear */
    const pinna = new THREE.Group(); pinna.position.set(-2.35, 0, 0); E.add(pinna); c.pick(pinna, "pinna");
    const pm = em(skin.clone()), rimG = K.mesh(new THREE.TorusGeometry(.72, .17, 12, 36, 5.3), pm); rimG.rotation.set(0, Math.PI / 2, 0); rimG.scale.set(1, 1.2, 1); rimG.rotation.x = -.6;
    pinna.add(rimG, K.blob(pm, .02, -.92, 0, .13, .26, .24), K.blob(K.flat(0xD9A27E), .06, .05, 0, .09, .72, .58));
    const canalC = K.curve([[-2.3, 0, 0], [-1.8, .07, 0], [-1.3, -.04, 0], [-.92, 0, 0]]);
    const canal = K.mesh(K.tubeVar(canalC, 30, 14, .2), em(K.glass(0xF2C9A8, .36))); canal.renderOrder = 9; E.add(canal); c.pick(canal, "canal");
    /* middle ear: the eardrum and the three tiny bones */
    const drum = K.mesh(new THREE.CircleGeometry(.23, 28), em(new THREE.MeshStandardMaterial({color:0xF7E3C8, roughness:.4, side:THREE.DoubleSide}))); drum.rotation.y = Math.PI / 2; drum.position.set(-.9, 0, 0); E.add(drum); c.pick(drum, "drum");
    const bm = em(bone), oss = new THREE.Group(); E.add(oss); c.pick(oss, "oss");
    const hammer = new THREE.Group(); hammer.position.set(-.62, .3, 0); const hs = K.mesh(cyl, bm); K.between(hs, V(-.27, -.3, 0), V(0, 0, 0), .032); hammer.add(hs, K.blob(bm, 0, 0, 0, .075, .075, .075));
    const anvil = new THREE.Group(); anvil.position.set(-.48, .3, 0); const al = K.mesh(cyl, bm); K.between(al, V(0, -.02, 0), V(.2, -.26, 0), .028); anvil.add(al, K.blob(bm, 0, 0, 0, .095, .07, .07));
    const stir = new THREE.Group(); stir.position.set(-.2, .04, 0); stir.add(K.mesh(new THREE.TorusGeometry(.075, .02, 8, 18), bm), K.mesh(new THREE.BoxGeometry(.025, .17, .12), bm, .085, 0, 0));
    oss.add(hammer, anvil, stir);
    /* inner ear: the cochlea (a snail), the three balance canals, and the nerve */
    const CX = .5, CY = -.18, sp = []; for (let i = 0; i <= 60; i++){ const a = Math.PI + i / 60 * 2.6 * TAU, r = .54 * (1 - i / 60 * .82); sp.push(V(CX + r * Math.cos(a), CY + r * Math.sin(a), i / 60 * .14)); }
    const cochC = K.curve(sp), coch = K.mesh(K.tubeVar(cochC, 120, 12, t => lerp(.135, .05, t)), em(K.glass(0xC9A6E8, .6, {side:THREE.FrontSide}))); coch.renderOrder = 8; E.add(coch); c.pick(coch, "coch");
    const hair = K.dots(16, .032, K.glow(0xffffff)); E.add(hair);
    const canals = new THREE.Group(); canals.position.set(.34, .56, 0); E.add(canals); c.pick(canals, "bal");
    const cm = em(K.glass(0x9ED0E6, .7, {side:THREE.FrontSide})), ROT = [[0, 0, 0], [0, Math.PI / 2, 0], [Math.PI / 2, 0, 0]], OFF = [[0, .08, 0], [.12, .02, 0], [0, -.1, .1]];
    ROT.forEach((r, i) => { const m = K.mesh(new THREE.TorusGeometry(.3, .045, 10, 36), cm, OFF[i][0], OFF[i][1], OFF[i][2]); m.rotation.set(r[0], r[1], r[2]); m.renderOrder = 8; canals.add(m); });
    E.add(K.blob(cm, .28, .24, 0, .17, .15, .14));
    const fluid = K.dots(9, .028, K.glow(0x2F7DE1)); canals.add(fluid);
    const nerveC = K.curve([[.9, -.22, .05], [1.35, -.05, -.02], [1.95, .22, -.1]]), nerve = K.mesh(K.tubeVar(nerveC, 20, 10, .07), em(K.organ(0xF2D16B))); E.add(nerve); c.pick(nerve, "nerve");
    const brM = K.organ(0xE9A6B4, {emissive:0xFFFFFF, emissiveIntensity:0}), brain = new THREE.Group(); brain.add(K.blob(brM, 2.42, .52, -.3, .36, .34, .3), K.blob(brM, 2.42, .52, .12, .36, .34, .3)); g.add(brain); c.pick(brain, "brain");
    const sig = K.dots(4, .05, K.glow(0xffffff)); E.add(sig);
    /* a bell, and the sound waves that leave it */
    const bell = new THREE.Group(); bell.position.set(-4.0, .05, 0); g.add(bell);
    const gold = new THREE.MeshStandardMaterial({color:0xE8B23A, roughness:.3, metalness:.8, side:THREE.DoubleSide});
    bell.add(K.mesh(new THREE.ConeGeometry(.36, .5, 24, 1, true), gold, 0, .1, 0), K.mesh(new THREE.SphereGeometry(.09, 12, 10), gold, 0, -.17, 0), K.mesh(new THREE.SphereGeometry(.07, 12, 10), gold, 0, .38, 0));
    const waveM = K.glow(0xBFE9FF, {transparent:true, opacity:.6}), waves = [0, 1, 2, 3, 4, 5].map(() => { const w = K.mesh(new THREE.TorusGeometry(1, .03, 6, 40), waveM.clone()); w.rotation.y = Math.PI / 2; g.add(w); return w; });
    const STEPS = ["Pinna", "Ear canal", "Eardrum", "Hammer, anvil, stirrup", "Cochlea", "Auditory nerve", "Brain"], KEYS = ["pinna", "canal", "drum", "oss", "coch", "nerve", "brain"];
    const ol = document.createElement("ol"); ol.className = "steps"; ol.innerHTML = STEPS.map(s => "<li>" + s + "</li>").join(""); document.getElementById("ctl").appendChild(ol);
    const INFO = {
      pinna:{t:"1 · Pinna · صيوان الأذن", en:"The <b>pinna</b>, the part of the ear you can see, collects the sound.", ar:"الصيوان (<b class=t>pinna</b>)، الجزء اللي تشوفه من الأذن، يجمع الصوت ويدخّله."},
      canal:{t:"2 · Ear canal · القناة السمعية", en:"The sound travels down the <b>ear canal</b> to the eardrum.", ar:"الصوت يمشي في القناة السمعية (<b class=t>ear canal</b>) إلى أن يوصل الطبلة (<b class=t>eardrum</b>)."},
      drum:{t:"3 · Eardrum · طبلة الأذن", en:"Sound is vibrations: the <b>eardrum</b> vibrates when the sound reaches it.", ar:"الصوت اهتزازات، فلما يوصل الطبلة (<b class=t>eardrum</b>) تهتزّ مثل جلد الطبل."},
      oss:{t:"4 · Hammer, anvil, stirrup · العظيمات الثلاث", en:"Three tiny bones, the <b>hammer, anvil and stirrup</b>, pass the vibrations on and make them stronger.", ar:"ثلاث عظام صغيرة جدًّا: المطرقة (<b class=t>hammer</b>) والسندان (<b class=t>anvil</b>) والركاب (<b class=t>stirrup</b>). تنقل الاهتزاز (<b class=t>vibration</b>) وتقوّيه."},
      coch:{t:"5 · Cochlea · القوقعة", en:"In the <b>cochlea</b>, hair cells turn the vibrations into nerve signals. Very loud sounds can damage the hair cells.", ar:"القوقعة (<b class=t>cochlea</b>) تشبه الحلزون وفيها خلايا شعرية (<b class=t>hair cells</b>) تحوّل الاهتزاز (<b class=t>vibration</b>) لإشارات عصبية. والصوت العالي جدًّا يضرّ هذي الخلايا."},
      nerve:{t:"6 · Auditory nerve · العصب السمعي", en:"The <b>auditory nerve</b> carries the signals to the brain.", ar:"العصب السمعي (<b class=t>auditory nerve</b>) يوصّل الإشارات للدماغ (<b class=t>brain</b>)."},
      brain:{t:"7 · Brain · الدماغ", en:"The brain makes sense of the signals: now you <b>hear</b> the sound.", ar:"الدماغ (<b class=t>brain</b>) يفهم الإشارات، وهنا «تسمع» الصوت."},
      bal:{t:"Semicircular canals · القنوات الهلالية", en:"The <b>semicircular canals</b> in the inner ear sense head movement. With the eyes, the <b>cerebellum</b> keeps you balanced.", ar:"ثلاث قنوات هلالية (<b class=t>semicircular canals</b>) فيها سائل. لما يميل راسك يتحرك السائل فتحسّ بالحركة، والمخيخ (<b class=t>cerebellum</b>) مع العينين يحفظ توازنك."}
    };
    let loud = .5, cont = false, en = 0, bellT = -99, tilt = 0, fl = 0, step = -1, glowK = "", glowT = 0;
    const status = c.ui.note("", "badge ok");
    c.ui.buttons([{label:"🔔 Ring the bell", cls:"go", on:() => ring()}]);
    const sL = c.ui.slider({label:"Loudness", min:5, max:100, value:50, fmt:v => v < 30 ? "quiet" : v > 85 ? "too loud!" : v > 60 ? "loud" : "normal", on:v => { loud = v / 100; }});
    const tgC = c.ui.toggle({off_label:"🎵 Steady sound", on_label:"⏹ Stop the sound", value:false, on:v => { cont = v; if (v) step = 7; }});
    const sT = c.ui.slider({label:"Tilt the head (balance)", min:-30, max:30, value:0, fmt:v => Math.round(v) + "°", on:(v, q) => { tilt = v; if (!q && glowK !== "bal"){ c.info(INFO.bal); glowK = "bal"; glowT = 1; c.hot("bal"); } }});
    function ring(){ bellT = c.t; step = 0; c.sfx("ding"); glowK = ""; }
    const W = (x, y, z) => E.localToWorld(V(x, y, z));
    c.label("Pinna", () => W(-2.35, .95, 0), {pick:"pinna", dy:-14}); c.label("Ear canal", () => W(-1.6, -.3, 0), {pick:"canal", dy:16});
    c.label("Eardrum", () => W(-.9, -.32, 0), {pick:"drum", dy:16, dx:-10}); c.label("Hammer, anvil, stirrup", () => W(-.5, .45, 0), {pick:"oss", dy:-16, dx:-30});
    c.label("Cochlea", () => W(.5, -.8, 0), {pick:"coch", dy:14}); c.label("Semicircular canals", () => W(.36, 1.0, 0), {pick:"bal", dy:-12, dx:20});
    c.label("Auditory nerve", () => W(1.5, -.1, 0), {pick:"nerve", dy:22, dx:20}); c.label("Brain", V(2.42, 1.0, 0), {pick:"brain", dy:-10});
    c.onPick = k => { c.info(INFO[k]); c.hot(k); glowK = k; glowT = 1; };
    c.tour = [
      {t:"Sound · الصوت", en:"Sound is vibrations. The pinna collects them and they travel down the ear canal.", ar:"الصوت اهتزازات. الصيوان (<b class=t>pinna</b>) يجمعها وتمشي في القناة السمعية (<b class=t>ear canal</b>).", run:async () => { tgC.set(false, true); sT.set(0, true); sL.set(50, true); ring(); await c.wait(2600); }, min:1000},
      {t:"Eardrum and the three small bones · الطبلة والعظيمات", en:"The eardrum vibrates, and the hammer, anvil and stirrup pass the vibrations on and make them stronger.", ar:"الطبلة (<b class=t>eardrum</b>) تهتزّ، والمطرقة (<b class=t>hammer</b>) والسندان (<b class=t>anvil</b>) والركاب (<b class=t>stirrup</b>) ينقلون الاهتزاز (<b class=t>vibration</b>) ويقوّونه.", hot:"oss", run:async () => { tgC.set(true, true); await c.look({target:[-.5, .1, 0], dist:4.2, theta:.22, phi:1.4}, 800); await c.wait(3000); }},
      {t:"Cochlea and nerve · القوقعة والعصب", en:"In the cochlea, hair cells make nerve signals, and the auditory nerve carries them to the brain.", ar:"في القوقعة (<b class=t>cochlea</b>) الخلايا الشعرية (<b class=t>hair cells</b>) تصنع إشارات عصبية، والعصب السمعي (<b class=t>auditory nerve</b>) يوصّلها للدماغ (<b class=t>brain</b>).", hot:"coch", run:async () => { await c.look({target:[.8, 0, 0], dist:5, theta:.22, phi:1.4}, 800); await c.wait(3200); }},
      {t:"Loud sound · الصوت العالي", en:"Very loud sounds can damage the hair cells.", ar:"الصوت العالي جدًّا يضرّ الخلايا الشعرية (<b class=t>hair cells</b>)، فلا تعلّي السمّاعات.", run:async () => { await c.tween(1500, k => sL.set(lerp(50, 100, k), true)); await c.wait(2200); await c.tween(900, k => sL.set(lerp(100, 45, k), true)); tgC.set(false, true); }},
      {t:"Balance · التوازن", en:"The semicircular canals sense head movement. With the eyes, the cerebellum keeps you balanced.", ar:INFO.bal.ar, hot:"bal", run:async () => { await c.look({target:[.2, .4, 0], dist:5, theta:.22, phi:1.4}, 700); await c.tween(3600, k => sT.set(28 * Math.sin(k * TAU * 1.5), true), null); sT.set(0, true); await c.look({target:[-.75, .15, 0], dist:9.8, theta:.22, phi:1.4}, 800); }}
    ];
    const p = V(), DEL = [.55, .8, 1.25, 1.55, 1.95, 2.5, 3.1];
    const mats = {pinna:pm, canal:canal.material, drum:drum.material, oss:bm, coch:coch.material, nerve:nerve.material, bal:cm};
    return {update(dt, t, real){
      const since = t - bellT;
      en = cont ? 1 : clamp(1 - (since - 2.6) / 1.2, 0, 1) * (since >= 0 && since < 3.8 ? 1 : 0);
      /* the vibration reaches each part a little later than the one before it */
      const at = k => cont ? 1 : clamp((since - DEL[k]) / .25, 0, 1) * en, A = loud, vib = Math.sin(t * 46);
      if (!cont){ const s = DEL.filter(d => since >= d).length - 1; if (since >= 0 && since < 4.2 && s !== step && s >= 0){ step = s; c.info(INFO[KEYS[s]]); c.hot(KEYS[s]); c.sfx(s === 6 ? "tada" : "tap"); } if (since > 4.2 && step >= 0 && step < 7) step = 7; }
      [...ol.children].forEach((li, i) => { li.className = cont || step > i ? "done" : step === i ? "on" : ""; });
      waves.forEach((w, i) => { const f = (t * .55 + i / 6) % 1, on = cont ? 1 : (since >= 0 && since < 2.6 && f < since / 1.25 ? 1 : 0), r = f < .5 ? lerp(.2, .72, f / .5) : lerp(.72, .16, (f - .5) / .5);
        w.position.set(lerp(-3.7, -.98, f), 0, 0); w.scale.setScalar(r); w.material.opacity = on * (.25 + .65 * A) * (1 - Math.abs(f - .5) * .6); w.visible = on > 0; });
      bell.rotation.z = (cont || (since >= 0 && since < 1.2)) ? .25 * Math.sin(t * 22) * (cont ? 1 : 1 - since / 1.2) : 0;
      drum.position.x = -.9 + vib * .035 * A * at(2);
      hammer.rotation.z = vib * .22 * A * at(3); anvil.rotation.z = -vib * .26 * A * at(3); stir.position.x = -.2 + vib * .03 * A * at(3) * 1.4;
      const loudBad = A > .85 && at(4) > .3;
      for (let i = 0; i < 16; i++){ cochC.getPoint(.04 + i / 16 * .9, p); const k = at(4) * (.5 + .5 * Math.sin(t * 11 - i * .7)); hair.set(i, p, .5 + k * (.8 + A), loudBad ? (Math.sin(t * 30 + i) > 0 ? 0xFF3B3B : 0x7A1A1A) : k > .1 ? 0x7CF0FF : 0x8A7FB0); }
      hair.done();
      for (let i = 0; i < 4; i++){ const f = (t * .9 + i / 4) % 1; nerveC.getPoint(f, p); sig.set(i, p, at(5) > .1 ? 1 : 0, 0xFFF3B0); } sig.done();
      brM.emissiveIntensity = at(6) * (.25 + .35 * A) * (.6 + .4 * Math.sin(t * 9));
      /* balance: the fluid in the canals lags behind when the head tilts */
      E.rotation.z = lerp(E.rotation.z, rad(tilt), .15); fl = lerp(fl, rad(tilt), .04);
      for (let i = 0; i < 9; i++){ const ring = i % 3, a = Math.floor(i / 3) * TAU / 3 + (E.rotation.z - fl) * 4 - E.rotation.z, q = V(Math.cos(a) * .3, Math.sin(a) * .3, 0); q.applyEuler(new THREE.Euler(ROT[ring][0], ROT[ring][1], ROT[ring][2])); q.add(p.set(OFF[ring][0], OFF[ring][1], OFF[ring][2])); fluid.set(i, q, 1, 0x2F7DE1); }
      fluid.done();
      glowT = Math.max(0, glowT - real * .4);
      for (const k in mats) mats[k].emissiveIntensity = k === glowK ? glowT * .5 * (.6 + .4 * Math.sin(t * 8)) : 0;
      status.className = "note badge " + (loudBad ? "bad" : "ok");
      status.textContent = loudBad ? "⚠️ Too loud: it can damage the hair cells in the cochlea" : Math.abs(tilt) > 4 ? "🤸 The semicircular canals sense the head tilting" : en > .05 ? "🔊 The vibration travels from the pinna to the brain" : "Tap «Ring the bell» or play a steady sound";
    }};
  }
});
})();
