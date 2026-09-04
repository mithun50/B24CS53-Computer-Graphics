/* ============================================================
   B24CS53 Computer Graphics : Spotlight Focus
   Click a section (card, figure, demo, step, callout, stat,
   tile, comparison side) to lift it to the center of the
   screen while the whole deck blurs behind it. Click the
   backdrop or press Escape to close and restore it in place.
   ============================================================ */
(function () {
  "use strict";

  var FOCUSABLE = ".card, .figure, .demo, .step, .callout, .stat, .tile, .vs-split > .side";
  var backdrop, stage, hint, current = null, placeholder = null;

  function build() {
    backdrop = document.createElement("div");
    backdrop.className = "spotlight-backdrop";

    stage = document.createElement("div");
    stage.className = "spotlight-stage";

    hint = document.createElement("div");
    hint.className = "spotlight-hint";
    hint.textContent = "Click anywhere or press Esc to close";

    document.body.appendChild(backdrop);
    document.body.appendChild(stage);
    document.body.appendChild(hint);

    backdrop.addEventListener("click", close);
    stage.addEventListener("click", function (e) {
      // clicking the empty area of the stage (not the section) closes
      if (e.target === stage) close();
    });
  }

  function isInteractive(target) {
    return !!target.closest(
      "a, button, input, select, textarea, canvas, .demo-b, [data-demo] svg, [data-demo] canvas"
    );
  }

  function open(el) {
    if (current) close();

    // Remember where it lives so we can put it back exactly
    placeholder = document.createElement("div");
    placeholder.className = "spotlight-placeholder";
    placeholder.style.width = el.offsetWidth + "px";
    placeholder.style.height = el.offsetHeight + "px";
    el.parentNode.insertBefore(placeholder, el);

    stage.appendChild(el);
    current = el;

    // Carry the module accent colour onto the stage so the lifted
    // section keeps its themed border and highlights.
    var deck = document.querySelector(".deck");
    if (deck) {
      var accent = getComputedStyle(deck).getPropertyValue("--deck-accent");
      if (accent) stage.style.setProperty("--deck-accent", accent.trim());
    }

    document.body.classList.add("spot-blur");
    backdrop.classList.add("open");
    stage.classList.add("open");
    hint.classList.add("open");
    document.addEventListener("keydown", onKey, true);
  }

  function close() {
    if (!current) return;
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(current, placeholder);
      placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null; current = null;

    document.body.classList.remove("spot-blur");
    backdrop.classList.remove("open");
    stage.classList.remove("open");
    hint.classList.remove("open");
    document.removeEventListener("keydown", onKey, true);
  }

  function onKey(e) {
    if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); }
  }

  function onClick(e) {
    if (current) return; // already focused; backdrop/stage handle closing
    if (isInteractive(e.target)) return;
    var slide = e.target.closest(".slide.active");
    if (!slide) return;
    var el = e.target.closest(FOCUSABLE);
    if (!el || !slide.contains(el)) return;
    e.preventDefault();
    open(el);
  }

  function init() {
    build();
    document.addEventListener("click", onClick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
