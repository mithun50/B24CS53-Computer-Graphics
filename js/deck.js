/* ============================================================
   B24CS53 Computer Graphics : Professional Slide Engine
   Navigation, progress, overview, fullscreen, print, help,
   deep-linking, touch, and accessible controls.
   ============================================================ */
(function () {
  "use strict";

  function initDeck() {
    var deck = document.querySelector(".deck");
    if (!deck) return;

    var slides = Array.prototype.slice.call(deck.querySelectorAll(".slide"));
    if (!slides.length) return;

    var total = slides.length;
    var current = 0;

    var progress = document.querySelector(".progress");
    var counter = document.querySelector("[data-counter]");
    var prevBtn = document.querySelector("[data-prev]");
    var nextBtn = document.querySelector("[data-next]");
    var overview = document.querySelector(".overview");
    var ovGrid = document.querySelector(".ov-grid");
    var ovToggle = document.querySelector("[data-overview]");
    var ovClose = document.querySelector("[data-ov-close]");
    var fsBtn = document.querySelector("[data-fullscreen]");
    var helpBtn = document.querySelector("[data-help]");
    var help = document.querySelector(".help-overlay");
    var helpClose = document.querySelector("[data-help-close]");

    function clamp(n) { return Math.max(0, Math.min(total - 1, n)); }

    function render(direction) {
      slides.forEach(function (s, i) {
        s.classList.remove("active", "leaving-left", "leaving-right");
        if (i === current) s.classList.add("active");
      });
      if (progress) progress.style.width = ((current + 1) / total * 100) + "%";
      if (counter) counter.textContent = (current + 1) + " / " + total;
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current === total - 1;
      var activeEl = slides[current];
      if (activeEl) activeEl.scrollTop = 0;
      // sync overview highlight
      if (ovGrid) {
        var items = ovGrid.querySelectorAll(".ov-item");
        items.forEach(function (it, i) { it.classList.toggle("current", i === current); });
      }
      if (history.replaceState) history.replaceState(null, "", "#" + (current + 1));
      document.title = document.title.replace(/^\[\d+\/\d+\]\s*/, "");
    }

    function go(n) { var d = n > current ? 1 : -1; current = clamp(n); render(d); }
    function next() { if (current < total - 1) go(current + 1); }
    function prev() { if (current > 0) go(current - 1); }

    // Build overview thumbnails
    if (ovGrid) {
      slides.forEach(function (s, i) {
        var title = s.getAttribute("data-title");
        if (!title) {
          var h = s.querySelector("h1, h2");
          title = h ? h.textContent.trim() : "Slide " + (i + 1);
        }
        var item = document.createElement("button");
        item.className = "ov-item";
        item.type = "button";
        item.innerHTML = '<span class="ov-n">' + (i + 1) + '</span><span class="ov-t"></span>';
        item.querySelector(".ov-t").textContent = title;
        item.addEventListener("click", function () { go(i); closeOverview(); });
        ovGrid.appendChild(item);
      });
    }

    function openOverview() { if (overview) { overview.classList.add("open"); overview.setAttribute("aria-hidden", "false"); } }
    function closeOverview() { if (overview) { overview.classList.remove("open"); overview.setAttribute("aria-hidden", "true"); } }
    function toggleOverview() { if (!overview) return; overview.classList.contains("open") ? closeOverview() : openOverview(); }

    function openHelp() { if (help) help.classList.add("open"); }
    function closeHelp() { if (help) help.classList.remove("open"); }
    function toggleHelp() { if (!help) return; help.classList.contains("open") ? closeHelp() : openHelp(); }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
      } else {
        (document.exitFullscreen || function () {}).call(document);
      }
    }

    // Print / PDF: reveal all slides for printing, then restore
    function printDeck() {
      deck.classList.add("print-all");
      window.print();
      setTimeout(function () { deck.classList.remove("print-all"); }, 500);
    }

    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (ovToggle) ovToggle.addEventListener("click", toggleOverview);
    if (ovClose) ovClose.addEventListener("click", closeOverview);
    if (fsBtn) fsBtn.addEventListener("click", toggleFullscreen);
    if (helpBtn) helpBtn.addEventListener("click", toggleHelp);
    if (helpClose) helpClose.addEventListener("click", closeHelp);

    document.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      switch (e.key) {
        case "ArrowRight": case "PageDown": case " ": e.preventDefault(); next(); break;
        case "ArrowLeft": case "PageUp": e.preventDefault(); prev(); break;
        case "Home": e.preventDefault(); go(0); break;
        case "End": e.preventDefault(); go(total - 1); break;
        case "o": case "O": toggleOverview(); break;
        case "f": case "F": toggleFullscreen(); break;
        case "p": case "P": printDeck(); break;
        case "?": case "h": case "H": toggleHelp(); break;
        case "Escape": closeOverview(); closeHelp(); break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            var n = parseInt(e.key, 10);
            if (n === 0) go(total - 1); else if (n <= total) go(n - 1);
          }
      }
    });

    // Touch swipe
    var tx = 0, ty = 0;
    deck.addEventListener("touchstart", function (e) {
      tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
    }, { passive: true });
    deck.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    }, { passive: true });

    // Deep link via hash
    var start = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(start) && start >= 1 && start <= total) current = start - 1;
    window.addEventListener("hashchange", function () {
      var n = parseInt((location.hash || "").replace("#", ""), 10);
      if (!isNaN(n) && n >= 1 && n <= total && (n - 1) !== current) go(n - 1);
    });

    render(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeck);
  } else {
    initDeck();
  }
})();
