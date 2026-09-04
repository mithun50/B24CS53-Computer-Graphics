/* ============================================================
   B24CS53 Computer Graphics : Interactive Visuals Layer
   Lazy-loads anime.js and three.js from CDN and mounts
   demos into elements marked with [data-demo].
   Each demo starts only when its slide becomes active
   (IntersectionObserver on display) to save resources.
   ============================================================ */
(function () {
  "use strict";

  var CDN = {
    anime: "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js",
    three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
  };

  var loaded = {};
  function loadScript(url) {
    if (loaded[url]) return loaded[url];
    loaded[url] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = url; s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + url)); };
      document.head.appendChild(s);
    });
    return loaded[url];
  }

  // ---- Demo registry -------------------------------------------------
  var demos = {};

  /* Raster scan: animate the beam sweeping row by row (anime.js) */
  demos["raster-scan"] = function (el) {
    loadScript(CDN.anime).then(function () {
      el.innerHTML =
        '<svg viewBox="0 0 260 180" width="260">' +
        '<rect x="10" y="10" width="240" height="160" rx="8" fill="#161d3a" stroke="#2b3568"/>' +
        '<g id="rs-grid"></g>' +
        '<circle id="rs-beam" r="5" fill="var(--deck-accent,#5b8cff)"/></svg>';
      var grid = el.querySelector("#rs-grid");
      var rows = 6, cols = 12, cellW = 220 / cols, cellH = 150 / rows;
      var dots = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var cx = 20 + c * cellW + cellW / 2, cy = 20 + r * cellH + cellH / 2;
          var d = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          d.setAttribute("cx", cx); d.setAttribute("cy", cy);
          d.setAttribute("r", 3); d.setAttribute("fill", "#2b3568");
          grid.appendChild(d); dots.push({ node: d, cx: cx, cy: cy });
        }
      }
      var beam = el.querySelector("#rs-beam");
      var i = 0;
      function step() {
        var d = dots[i];
        window.anime({ targets: beam, cx: d.cx, cy: d.cy, duration: 90, easing: "linear",
          complete: function () { d.node.setAttribute("fill", "var(--deck-accent,#5b8cff)"); } });
        i++;
        if (i >= dots.length) {
          setTimeout(function () {
            dots.forEach(function (x) { x.node.setAttribute("fill", "#2b3568"); });
            i = 0; step();
          }, 900);
        } else { setTimeout(step, 95); }
      }
      step();
    }).catch(function () { fallback(el, "Raster scan animation"); });
  };

  /* Bresenham line: animate pixels lighting up along a line (anime.js) */
  demos["bresenham"] = function (el) {
    loadScript(CDN.anime).then(function () {
      var cols = 14, rows = 9, size = 16, pad = 6;
      var w = cols * size + pad * 2, h = rows * size + pad * 2;
      var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '">';
      // grid
      for (var y = 0; y < rows; y++)
        for (var x = 0; x < cols; x++)
          svg += '<rect x="' + (pad + x * size) + '" y="' + (pad + y * size) + '" width="' + (size - 2) + '" height="' + (size - 2) + '" rx="3" fill="#161d3a" stroke="#2b3568" class="bz" data-x="' + x + '" data-y="' + y + '"/>';
      svg += '</svg>';
      el.innerHTML = svg;
      // Bresenham from (0,0) to (13,8)
      var x0 = 0, y0 = 0, x1 = 13, y1 = 8;
      var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      var sx = 1, sy = 1, err = dx - dy, pts = [];
      var cx = x0, cy = y0;
      while (true) {
        pts.push([cx, cy]);
        if (cx === x1 && cy === y1) break;
        var e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
      }
      function light(k) {
        if (k >= pts.length) { setTimeout(function () {
          el.querySelectorAll(".bz").forEach(function (n) { n.setAttribute("fill", "#161d3a"); });
          setTimeout(function () { light(0); }, 500);
        }, 1200); return; }
        var p = pts[k];
        var cell = el.querySelector('.bz[data-x="' + p[0] + '"][data-y="' + p[1] + '"]');
        if (cell) { cell.setAttribute("fill", "var(--deck-accent,#ffcf5c)");
          window.anime({ targets: cell, scale: [1.4, 1], duration: 220, easing: "easeOutQuad" }); }
        setTimeout(function () { light(k + 1); }, 160);
      }
      light(0);
    }).catch(function () { fallback(el, "Bresenham pixel plot"); });
  };

  /* 2D transformation playground: a square you translate/rotate/scale (anime.js) */
  demos["transform-2d"] = function (el) {
    loadScript(CDN.anime).then(function () {
      el.innerHTML =
        '<svg viewBox="0 0 260 180" width="260">' +
        '<line x1="10" y1="90" x2="250" y2="90" stroke="#2b3568"/>' +
        '<line x1="130" y1="10" x2="130" y2="170" stroke="#2b3568"/>' +
        '<rect id="tf-sq" x="-25" y="-25" width="50" height="50" rx="4" ' +
        'fill="color-mix(in srgb,var(--deck-accent,#ffcf5c) 30%,transparent)" ' +
        'stroke="var(--deck-accent,#ffcf5c)" stroke-width="2" transform="translate(130,90)"/></svg>' +
        '<div class="demo-btns">' +
        '<button class="demo-b" data-a="translate">Translate</button>' +
        '<button class="demo-b" data-a="rotate">Rotate</button>' +
        '<button class="demo-b" data-a="scale">Scale</button>' +
        '<button class="demo-b" data-a="reset">Reset</button></div>';
      var sq = el.querySelector("#tf-sq");
      var st = { tx: 130, ty: 90, r: 0, s: 1 };
      function apply(dur) {
        window.anime({ targets: sq, duration: dur || 500, easing: "easeOutCubic",
          transform: "translate(" + st.tx + "," + st.ty + ") rotate(" + st.r + ") scale(" + st.s + ")" });
      }
      el.querySelectorAll(".demo-b").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-a");
          if (a === "translate") st.tx = st.tx > 130 ? 90 : 180;
          else if (a === "rotate") st.r += 45;
          else if (a === "scale") st.s = st.s > 1 ? 1 : 1.6;
          else { st = { tx: 130, ty: 90, r: 0, s: 1 }; }
          apply();
        });
      });
    }).catch(function () { fallback(el, "2D transform playground"); });
  };

  /* 3D transformation: a live rotating cube (three.js) */
  demos["cube-3d"] = function (el) {
    loadScript(CDN.three).then(function () {
      var THREE = window.THREE;
      var w = el.clientWidth || 320, h = 240;
      var scene = new THREE.Scene();
      var cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      cam.position.set(2.4, 1.8, 3.2); cam.lookAt(0, 0, 0);
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      el.innerHTML = ""; el.appendChild(renderer.domElement);
      var accent = getComputedStyle(el).getPropertyValue("--deck-accent").trim() || "#ffcf5c";
      var geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      var mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accent), metalness: 0.2, roughness: 0.5 });
      var cube = new THREE.Mesh(geo, mat); scene.add(cube);
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xffffff })); cube.add(edges);
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      var dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(3, 4, 5); scene.add(dl);
      var ax = new THREE.AxesHelper(2); scene.add(ax);
      var running = true;
      el._stop = function () { running = false; };
      el._start = function () { if (!running) { running = true; loop(); } };
      function loop() {
        if (!running) return;
        cube.rotation.x += 0.006; cube.rotation.y += 0.010;
        renderer.render(scene, cam);
        requestAnimationFrame(loop);
      }
      loop();
    }).catch(function () { fallback(el, "3D rotating cube (needs WebGL)"); });
  };

  /* Bouncing ball animation (anime.js) for Module 5 */
  demos["bounce"] = function (el) {
    loadScript(CDN.anime).then(function () {
      el.innerHTML =
        '<svg viewBox="0 0 300 160" width="300">' +
        '<line x1="10" y1="140" x2="290" y2="140" stroke="#2b3568" stroke-width="2"/>' +
        '<circle id="bl" cx="30" cy="30" r="14" fill="var(--deck-accent,#c98cff)"/></svg>';
      var ball = el.querySelector("#bl");
      window.anime({ targets: ball, cx: [30, 270], duration: 3000, direction: "alternate",
        loop: true, easing: "easeInOutSine" });
      window.anime({ targets: ball, cy: [30, 126], duration: 700, direction: "alternate",
        loop: true, easing: "easeInQuad" });
    }).catch(function () { fallback(el, "Bouncing ball animation"); });
  };

  /* Periodic sine motion (anime.js) for Module 5 */
  demos["sine"] = function (el) {
    loadScript(CDN.anime).then(function () {
      var w = 320, h = 150, mid = h / 2;
      var path = "M0," + mid;
      for (var x = 0; x <= w; x += 4) {
        var y = mid - Math.sin(x / 26) * 46;
        path += " L" + x + "," + y.toFixed(1);
      }
      el.innerHTML =
        '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '">' +
        '<line x1="0" y1="' + mid + '" x2="' + w + '" y2="' + mid + '" stroke="#2b3568"/>' +
        '<path d="' + path + '" fill="none" stroke="#2b3568" stroke-dasharray="3 3"/>' +
        '<circle id="dot" r="8" fill="var(--deck-accent,#c98cff)"/></svg>';
      var dot = el.querySelector("#dot");
      var t = 0;
      (function move() {
        t += 0.03;
        var x = ((t * 60) % w);
        var y = mid - Math.sin(x / 26) * 46;
        dot.setAttribute("cx", x); dot.setAttribute("cy", y);
        requestAnimationFrame(move);
      })();
    }).catch(function () { fallback(el, "Periodic sine motion"); });
  };

  /* LCD twist demo (anime.js) for Module 1 */
  demos["lcd"] = function (el) {
    loadScript(CDN.anime).then(function () {
      el.innerHTML =
        '<svg viewBox="0 0 260 130" width="260">' +
        '<rect x="10" y="20" width="240" height="90" rx="8" fill="#161d3a" stroke="#2b3568"/>' +
        '<g id="lcd-cells"></g></svg>' +
        '<div class="demo-btns"><button class="demo-b" data-v="on">Voltage ON</button>' +
        '<button class="demo-b" data-v="off">Voltage OFF</button></div>';
      var g = el.querySelector("#lcd-cells"), cells = [];
      for (var i = 0; i < 8; i++) {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        c.setAttribute("x", 25 + i * 28); c.setAttribute("y", 40);
        c.setAttribute("width", 20); c.setAttribute("height", 50); c.setAttribute("rx", 3);
        c.setAttribute("fill", "var(--deck-accent,#5b8cff)");
        g.appendChild(c); cells.push(c);
      }
      el.querySelectorAll(".demo-b").forEach(function (b) {
        b.addEventListener("click", function () {
          var on = b.getAttribute("data-v") === "on";
          window.anime({ targets: cells, opacity: on ? 0.12 : 1, delay: window.anime.stagger(60), duration: 400 });
        });
      });
    }).catch(function () { fallback(el, "LCD pixel switching"); });
  };

  /* Line primitive modes (anime.js) for Module 2 */
  demos["line-modes"] = function (el) {
    loadScript(CDN.anime).then(function () {
      var pts = [[30,110],[80,40],[130,95],[185,45],[235,100]];
      el.innerHTML =
        '<svg viewBox="0 0 270 150" width="270">' +
        '<g id="lm-lines" stroke="var(--deck-accent,#34e0c4)" stroke-width="2.5" fill="none"></g>' +
        '<g id="lm-verts"></g></svg>' +
        '<div class="demo-btns">' +
        '<button class="demo-b" data-m="lines">GL_LINES</button>' +
        '<button class="demo-b" data-m="strip">GL_LINE_STRIP</button>' +
        '<button class="demo-b" data-m="loop">GL_LINE_LOOP</button></div>';
      var vg = el.querySelector("#lm-verts");
      pts.forEach(function (p) {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 4);
        c.setAttribute("fill", "#e8ecff"); vg.appendChild(c);
      });
      var lg = el.querySelector("#lm-lines");
      function draw(mode) {
        lg.innerHTML = "";
        function seg(a, b) {
          var l = document.createElementNS("http://www.w3.org/2000/svg", "line");
          l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]);
          l.setAttribute("x2", a[0]); l.setAttribute("y2", a[1]); lg.appendChild(l);
          window.anime({ targets: l, x2: b[0], y2: b[1], duration: 350, easing: "easeOutQuad" });
        }
        if (mode === "lines") { seg(pts[0], pts[1]); seg(pts[2], pts[3]); }
        else if (mode === "strip") { for (var i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1]); }
        else { for (var j = 0; j < pts.length; j++) seg(pts[j], pts[(j + 1) % pts.length]); }
      }
      el.querySelectorAll(".demo-b").forEach(function (b) {
        b.addEventListener("click", function () { draw(b.getAttribute("data-m")); });
      });
      draw("strip");
    }).catch(function () { fallback(el, "OpenGL line primitive modes"); });
  };

  /* Rubber-band drawing (pointer events) for Module 4 */
  demos["rubber-band"] = function (el) {
    el.innerHTML =
      '<svg viewBox="0 0 300 180" width="300" style="touch-action:none;cursor:crosshair">' +
      '<rect x="0" y="0" width="300" height="180" rx="8" fill="#161d3a" stroke="#2b3568"/>' +
      '<rect id="rb" fill="color-mix(in srgb,var(--deck-accent,#ff8f6b) 25%,transparent)" ' +
      'stroke="var(--deck-accent,#ff8f6b)" stroke-width="2" stroke-dasharray="6 4" ' +
      'x="0" y="0" width="0" height="0"/></svg>' +
      '<div class="cap">Press and drag inside the box to rubber band a rectangle.</div>';
    var svg = el.querySelector("svg"), rb = el.querySelector("#rb");
    var drawing = false, sx = 0, sy = 0;
    function pt(e) {
      var r = svg.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return [cx * 300 / r.width, cy * 180 / r.height];
    }
    function down(e) { e.preventDefault(); var p = pt(e); drawing = true; sx = p[0]; sy = p[1];
      rb.setAttribute("x", sx); rb.setAttribute("y", sy); rb.setAttribute("width", 0); rb.setAttribute("height", 0); }
    function move(e) { if (!drawing) return; e.preventDefault(); var p = pt(e);
      rb.setAttribute("x", Math.min(sx, p[0])); rb.setAttribute("y", Math.min(sy, p[1]));
      rb.setAttribute("width", Math.abs(p[0] - sx)); rb.setAttribute("height", Math.abs(p[1] - sy)); }
    function up() { drawing = false; }
    svg.addEventListener("mousedown", down); svg.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    svg.addEventListener("touchstart", down); svg.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
  };

  function fallback(el, label) {
    el.innerHTML = '<div class="demo-fallback">Interactive demo: ' + label +
      '<br><small>Needs an internet connection to load the animation library.</small></div>';
  }

  // ---- Activation: run demo when its slide is shown ------------------
  function mountVisible() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-demo]"));
    nodes.forEach(function (el) {
      var slide = el.closest(".slide");
      var name = el.getAttribute("data-demo");
      var started = false;
      function maybeStart() {
        var active = slide ? slide.classList.contains("active") : true;
        if (active && !started && demos[name]) { started = true; demos[name](el); }
        else if (active && started && el._start) { el._start(); }
        else if (!active && started && el._stop) { el._stop(); }
      }
      // Poll for active class changes via MutationObserver on the slide
      if (slide && window.MutationObserver) {
        new MutationObserver(maybeStart).observe(slide, { attributes: true, attributeFilter: ["class"] });
      }
      maybeStart();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountVisible);
  } else { mountVisible(); }
})();
