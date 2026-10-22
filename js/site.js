/* Builds the tile rail and the work list from js/projects.js.
   You should not need to edit this file to add a project. */

(function () {
  // Switch · true shows the render only while a tile is hovered, also on the current page's tile.
  // false keeps the current page's render showing all the time (the original behaviour).
  var RENDER_ON_HOVER_ONLY = true;
  if (RENDER_ON_HOVER_ONLY) document.documentElement.classList.add("hover-only");

  // A local preview is a file opened from disk or a server running on this computer.
  var isLocal =
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1", ""].indexOf(location.hostname) !== -1;

  // Light or dark. The page sets it on <html data-theme="..."> before it draws (see each page's <head>).
  // Images that come in two versions are named name-dark.jpg and name-light.jpg.
  var root = document.documentElement;
  function theme() { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  function themed(file) { return file.replace(/(-dark|-light)?(\.\w+)$/, "-" + theme() + "$2"); }

  // The page tells us which tile is "current" through <body data-page="...">.
  var currentPage = document.body.getAttribute("data-page") || "";

  function byOrder(a, b) {
    return (
      GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) ||
      (a.pin || Infinity) - (b.pin || Infinity) ||
      b.scale - a.scale ||
      b.year - a.year ||
      a.title.localeCompare(b.title)
    );
  }

  // Visitors see live projects only. You also see drafts and planned ones locally.
  var projects = PROJECTS.filter(function (p) {
    return p.status === "live" || isLocal;
  }).sort(byOrder);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function tag(status) {
    return status === "live" ? null : el("span", "tag", " · " + status);
  }

  function makeTile(item) {
    var planned = item.status === "planned";
    var tile = el(planned ? "span" : "a", "tile");
    if (!planned) tile.href = item.href;
    if (planned) tile.classList.add("is-planned");
    if (item.id === currentPage) tile.setAttribute("aria-current", "page");

    var box = el("span", "tile-box");
    // The line drawing. A plain image, so it also shows when the page is opened from disk.
    var line = el("img", "tile-line");
    line.src = "tiles/" + themed(item.line || item.id + ".svg");
    line.alt = "";
    box.appendChild(line);

    if (item.image) {
      var img = el("img", "tile-img");
      img.src = "tiles/" + themed(item.image);
      img.alt = "";
      img.loading = "lazy";
      box.appendChild(img);
    }

    var name = el("span", "tile-name", item.tile);
    var t = tag(item.status);
    if (t) name.appendChild(t);

    tile.appendChild(box);
    tile.appendChild(name);

    var li = el("li");
    if (item.wide) li.className = "is-wide";
    li.appendChild(tile);
    return li;
  }

  // ----- Tile rail: About first, then the projects in order.
  var rail = document.getElementById("tiles");
  if (rail) {
    // The "Me" group: About and Contact.
    rail.appendChild(el("li", "rail-group", "Me"));
    rail.appendChild(
      makeTile({ id: "about", tile: "About", href: "index.html", status: "live", image: "about.jpg" })
    );
    rail.appendChild(
      makeTile({ id: "contact", tile: "Contact", href: "contact.html", status: "live", image: "contact.jpg" })
    );
    var railGroup = null;
    projects.forEach(function (p) {
      if (p.group !== railGroup) {                   // a heading where a new group starts
        railGroup = p.group;
        rail.appendChild(el("li", "rail-group", GROUP_NAMES[p.group] || p.group));
      }
      rail.appendChild(
        makeTile({
          id: p.id,
          tile: p.tile,
          href: p.id + ".html",
          status: p.status,
          image: p.image,
          line: p.line,
          wide: !!p.pin,
        })
      );
    });
  }

  // ----- Wide tiles for the phone menu: pinned projects, and the last tile of a group that
  // would otherwise sit alone in its row. Desktop ignores this.
  if (rail) {
    var run = [];
    var closeRun = function () {
      var squares = run.filter(function (li) { return !li.classList.contains("is-wide"); });
      if (squares.length % 2) squares[squares.length - 1].classList.add("is-wide");
      run = [];
    };
    Array.prototype.forEach.call(rail.children, function (li) {
      if (li.classList.contains("rail-group")) closeRun(); else run.push(li);
    });
    closeRun();
  }

  // ----- Work list (only on pages that have one).
  var list = document.getElementById("work-list");
  if (list) {
    var listGroup = null;
    projects.forEach(function (p) {
      if (p.group !== listGroup) {
        listGroup = p.group;
        list.appendChild(el("li", "work-group", GROUP_NAMES[p.group] || p.group));
      }
      var planned = p.status === "planned";
      var row = el(planned ? "span" : "a", planned ? "row" : "");
      if (!planned) row.href = p.id + ".html";

      var title = el("span", "w-title", p.title);
      var t = tag(p.status);
      if (t) title.appendChild(t);

      row.appendChild(title);
      row.appendChild(el("span", "w-meta", p.meta));

      var li = el("li");
      li.appendChild(row);
      list.appendChild(li);
    });

    // Nothing to show yet: hide the whole section instead of an empty list.
    if (!projects.length) {
      var section = document.getElementById("work");
      if (section) section.hidden = true;
    }
  }

  // ----- Line art that draws itself in.
  // "load"  · the lines trace themselves once when the page first opens (once per visit, not on every page)
  // "hover" · the lines retrace each time a tile is hovered, then the render fades in
  // "off"   · no drawing
  // The browser can only animate the lines if it can read the SVG files, which works on the live site
  // and on a local server, but not when a page is opened straight from disk. Then the tiles stay still.
  var LINE_DRAW = "load";
  var DRAW_TIME = 900;      // milliseconds for one tile's lines to draw
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function inlineSvg(img) {
    return fetch(img.src).then(function (r) { return r.text(); }).then(function (text) {
      var holder = document.createElement("div");
      holder.innerHTML = text;
      var svg = holder.querySelector("svg");
      if (!svg) return null;
      svg.setAttribute("class", "tile-line");
      svg.setAttribute("aria-hidden", "true");
      img.parentNode.replaceChild(svg, img);
      return svg;
    });
  }

  // Set every line to "not drawn yet", then let the CSS transition draw it.
  function draw(svg, duration, startDelay) {
    startDelay = startDelay || 0;
    var shapes = svg.querySelectorAll("path, circle, line, polyline, polygon, rect, ellipse");
    Array.prototype.forEach.call(shapes, function (s, i) {
      var len = s.getTotalLength ? s.getTotalLength() : 0;
      if (!len) return;
      s.style.transition = "none";
      s.style.strokeDasharray = len + " " + (len + 8);
      s.style.strokeDashoffset = len + 4;
      s.getBoundingClientRect();                      // apply the starting state before animating
      var delay = startDelay + (i / shapes.length) * duration * 0.35;   // later lines start a little later
      s.style.transition = "stroke-dashoffset " + duration * 0.65 + "ms ease-out " + delay + "ms";
      s.style.strokeDashoffset = 0;
    });
  }

  // The reverse: each line pulls back to its start, last lines first.
  function undraw(svg, duration) {
    var shapes = svg.querySelectorAll("path, circle, line, polyline, polygon, rect, ellipse");
    var n = shapes.length;
    Array.prototype.forEach.call(shapes, function (s, i) {
      var len = s.getTotalLength ? s.getTotalLength() : 0;
      if (!len) return;
      s.style.transition = "none";
      s.style.strokeDasharray = len + " " + (len + 8);
      s.style.strokeDashoffset = 0;
      s.getBoundingClientRect();
      var delay = ((n - 1 - i) / n) * duration * 0.35;
      s.style.transition = "stroke-dashoffset " + duration * 0.65 + "ms ease-in " + delay + "ms";
      s.style.strokeDashoffset = len + 4;
    });
  }

  // On phones the rail lives in the menu, so there's nothing on screen to draw.
  var phone = window.matchMedia && window.matchMedia("(max-width: 760px)");
  if (LINE_DRAW !== "off" && !reduceMotion && location.protocol !== "file:" && rail && !(phone && phone.matches)) {
    // A reload (F5 or Ctrl+Shift+R) counts as a fresh visit, so the lines draw again.
    var firstVisit = true;
    var navEntry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    var reloaded = navEntry && navEntry.type === "reload";
    try { firstVisit = reloaded || !sessionStorage.getItem("lines-drawn"); sessionStorage.setItem("lines-drawn", "1"); } catch (e) {}
    var lineImgs = rail.querySelectorAll("img.tile-line");
    // Every page swaps the line art images for inline SVG, so hovering can move the lines.
    // Only the first page of a visit (or a reload) also plays the drawing in.
    var drawIn = LINE_DRAW === "load" && firstVisit;
    Array.prototype.forEach.call(lineImgs, function (img, n) {
      if (drawIn) img.style.visibility = "hidden";   // no flash of finished lines before drawing
      inlineSvg(img).then(function (svg) {
        if (!svg) return;
        var tile = svg.closest(".tile");
        tile._lines = svg;
        if (LINE_DRAW === "load") {
          if (drawIn) draw(svg, DRAW_TIME, 150 + n * 90);   // tiles start one after another
        } else {
          tile.classList.add("draws-on-hover");
          tile.addEventListener("mouseenter", function () { draw(svg, DRAW_TIME * 0.6); });
        }
      }).catch(function () { img.style.visibility = ""; });
    });
  }

  // ----- Hovering a tile: the lines pull back off the render as it fades in, and when the cursor
  // leaves, they draw themselves back over it while it fades out.
  // "lines" · that effect
  // "fade"  · the plain fade, no line movement
  var LEAVE_EFFECT = "lines";
  var LEAVE_TIME = 650;
  if (rail && LEAVE_EFFECT !== "fade" && !reduceMotion) {
    document.documentElement.classList.add("leave-" + LEAVE_EFFECT);
    Array.prototype.forEach.call(rail.querySelectorAll("a.tile"), function (tile) {
      if (!tile.querySelector(".tile-img")) return;
      var timer = null;
      tile.addEventListener("mouseleave", function () {
        tile.classList.remove("is-leaving");
        void tile.offsetWidth;
        tile.classList.remove("is-entering");
        tile.classList.add("is-leaving");
        if (LEAVE_EFFECT === "lines" && tile._lines) draw(tile._lines, 520);
        clearTimeout(timer);
        timer = setTimeout(function () { tile.classList.remove("is-leaving"); }, LEAVE_TIME);
      });
      tile.addEventListener("mouseenter", function () {
        clearTimeout(timer);
        tile.classList.remove("is-leaving");
        if (LEAVE_EFFECT === "lines" && tile._lines) {
          tile.classList.add("is-entering");                 // lines stay on top while they pull back
          undraw(tile._lines, 420);
          timer = setTimeout(function () { tile.classList.remove("is-entering"); }, 420);
        }
      });
    });
  }

  // ----- Light and dark switch, in the header.
  // One button that swaps to the other theme. A choice is remembered; until one is made, the site follows
  // the device. The swap is a single crossfade of the whole page, so everything changes at once.
  var themedImages = "img.tile-img, img.tile-line, img[data-themed]";
  function swapImages() {
    var waits = [];
    Array.prototype.forEach.call(document.querySelectorAll(themedImages), function (img) {
      var src = img.getAttribute("src");
      if (!src) return;
      var next = themed(src);
      if (next === src) return;
      img.setAttribute("src", next);
      if (img.decode) waits.push(img.decode().catch(function () {}));
    });
    return waits;
  }
  function setTheme(t, remember) {
    if (remember) { try { localStorage.setItem("theme", t); } catch (e) {} }
    if (t === theme()) return;
    function apply() {
      root.setAttribute("data-theme", t);
      var waits = swapImages();
      // wait (briefly) for the swapped images, so they're part of the new picture rather than popping in after
      return Promise.race([Promise.all(waits), new Promise(function (r) { setTimeout(r, 250); })]);
    }
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
    else apply();
  }
  // Images written into the page itself start as -dark; bring them in line with the theme.
  swapImages();
  // Fetch the other theme's images once the page has settled, so a swap never has to wait for them.
  window.addEventListener("load", function () {
    setTimeout(function () {
      var other = theme() === "light" ? "dark" : "light";
      Array.prototype.forEach.call(document.querySelectorAll(themedImages), function (img) {
        var src = img.getAttribute("src");
        if (src) new Image().src = src.replace(/-(dark|light)(\.\w+)$/, "-" + other + "$2");
      });
    }, 1500);
  });
  var updateLabel = function () {};
  var head = document.querySelector(".masthead");
  if (head) {
    var toggle = el("button", "theme-toggle");
    toggle.type = "button";
    toggle.innerHTML =
      '<svg class="icon-sun" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.8v2.2M10 16v2.2M1.8 10H4M16 10h2.2M4.2 4.2l1.6 1.6M14.2 14.2l1.6 1.6M4.2 15.8l1.6-1.6M14.2 5.8l1.6-1.6"/></svg>' +
      '<svg class="icon-moon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M15.8 12.6A6.6 6.6 0 0 1 7.4 4.2a6.6 6.6 0 1 0 8.4 8.4z"/></svg>';
    updateLabel = function (current) {
      var to = (current || theme()) === "light" ? "dark" : "light";
      toggle.setAttribute("aria-label", "Switch to " + to + " mode");
      toggle.title = "Switch to " + to + " mode";
    };
    updateLabel();
    toggle.addEventListener("click", function () {
      var next = theme() === "light" ? "dark" : "light";
      setTheme(next, true);
      updateLabel(next);
    });
    head.appendChild(toggle);
  }
  // Until a choice is made, follow the device if its setting changes while the page is open.
  var systemLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");
  if (systemLight && systemLight.addEventListener) {
    systemLight.addEventListener("change", function () {
      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (e) {}
      if (saved !== "light" && saved !== "dark") { var t = systemLight.matches ? "light" : "dark"; setTheme(t, false); updateLabel(t); }
    });
  }

  // ----- Phone menu.
  // On small screens the tile rail is hidden behind a Projects button at the top left. Opening it
  // shows the tiles full screen as renders: they turn in one after another, then flip over to their
  // line art, the way live tiles did on Windows Phone. The current page's tile keeps its render and
  // stays still. Larger screens never see any of this.
  var masthead = document.querySelector(".masthead");
  var railNav = rail ? rail.closest(".rail") : null;
  if (rail && railNav && masthead) {
    var button = el("button", "menu-button");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "tiles");
    var icon = el("span", "menu-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(el("i")); icon.appendChild(el("i")); icon.appendChild(el("i"));
    button.appendChild(icon);
    button.appendChild(el("span", "menu-label", "Projects"));
    masthead.insertBefore(button, masthead.firstChild);

    var head = el("div", "menu-head");
    head.appendChild(el("span", "menu-title", "Projects"));
    var closeButton = el("button", "menu-close");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close the menu");
    closeButton.innerHTML = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 4 L16 16 M16 4 L4 16" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
    head.appendChild(closeButton);
    railNav.insertBefore(head, railNav.firstChild);

    var items = rail.querySelectorAll(".tiles > li");
    Array.prototype.forEach.call(items, function (li, i) { li.style.setProperty("--i", i); });
    var flips = [];

    function openMenu() {
      root.classList.add("menu-open");
      button.setAttribute("aria-expanded", "true");
      railNav.scrollTop = 0;
      try { closeButton.focus({ preventScroll: true }); } catch (e) {}
      // Each tile flips to its line art a moment after it has turned in.
      var n = 0;
      Array.prototype.forEach.call(rail.querySelectorAll(".tiles > li:not(.rail-group)"), function (li) {
        var tile = li.querySelector(".tile");
        if (!tile || !tile.querySelector(".tile-img") || tile.hasAttribute("aria-current")) return;
        if (reduceMotion) { tile.classList.add("is-flipped"); return; }
        var delay = 650 + n++ * 90;
        flips.push(setTimeout(function () { tile.classList.add("is-flipped"); }, delay));
      });
    }

    function closeMenu() {
      root.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
      flips.forEach(clearTimeout);
      flips = [];
      Array.prototype.forEach.call(rail.querySelectorAll(".tile.is-flipped"), function (t) { t.classList.remove("is-flipped"); });
    }

    button.addEventListener("click", openMenu);
    closeButton.addEventListener("click", function () { closeMenu(); button.focus(); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && root.classList.contains("menu-open")) { closeMenu(); button.focus(); }
    });
    // Turning a phone sideways or widening the window past the phone layout closes the menu.
    if (phone && phone.addEventListener) {
      phone.addEventListener("change", function () { if (!phone.matches) closeMenu(); });
    }
    // Coming back to a page with the Back button shouldn't find the menu still open.
    window.addEventListener("pageshow", closeMenu);
  }

  // ----- The footer's little black hole.
  // Clicking the dot wakes it up. It swells and trembles, smoke swirls in, and the letters on
  // both sides fall in, nearest first, each curling round the rim as it disappears. The hole
  // fattens with every letter and throbs, then caves in to a tiny point, holds for a beat, and
  // bursts: a flash of the rim, two rings of light, smoke blown outward, and the letters thrown
  // back out in the order it took them, lobbed in small arcs, tumbling, landing in place.
  var egg = document.querySelector(".foot-note");
  if (egg) {
    var dot = egg.querySelector(".egg-dot");
    var letters = [];
    Array.prototype.forEach.call(egg.querySelectorAll(".egg-side"), function (side) {
      side.setAttribute("aria-label", side.textContent.replace(/\s+/g, " ").trim());
      var walker = document.createTreeWalker(side, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }   // spaces stay put
          Array.prototype.forEach.call(part, function (ch) {
            var span = el("span", "egg-ch", ch);
            span.setAttribute("aria-hidden", "true");
            frag.appendChild(span);
            letters.push(span);
          });
        });
        node.parentNode.replaceChild(frag, node);
      });
    });

    var PULL = 1700;      // letters falling in
    var HOLD = 700;       // the hole on its own, throbbing
    var COLLAPSE = 380;   // the full hole caving in to a point
    var STILL = 160;      // the tiny, trembling pause before the burst
    var SPREAD = 380;     // how close together the letters are thrown out
    var FLY = 950;        // how long one letter is in the air
    var TRAVEL = 700;     // how long one letter takes to fall in
    var GROW = 1.6;       // how much fatter the hole gets once it has swallowed everything
    var TINY = 0.45;      // how small the hole gets just before the burst
    var SHAKE = 0.45;     // pixels of tremble at full power

    // Two small canvases centred on the hole: smoke behind it, the ring of light in front.
    var FX_W = 240, FX_H = 150, ratio = window.devicePixelRatio || 1;
    function fxCanvas(cls) {
      var c = el("canvas", "egg-fx " + cls);
      c.width = FX_W * ratio; c.height = FX_H * ratio;
      c.style.width = FX_W + "px"; c.style.height = FX_H + "px";
      egg.appendChild(c);
      return c;
    }
    var smokeCanvas = fxCanvas("egg-smoke"), ringCanvas = fxCanvas("egg-ring");
    var sctx = smokeCanvas.getContext("2d"), rctx = ringCanvas.getContext("2d");

    function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
    function easeIn(t) { return t * t * t; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function smooth(t) { return t * t * (3 - 2 * t); }
    function mix(a, b, t) { return a + (b - a) * t; }
    function range(a, b) { return a + (b - a) * Math.random(); }

    // Smoke: soft teal and grey wisps on a tilted disk, spiralling inward.
    function newWisp(anywhere) {
      return { r: anywhere ? range(10, 62) : range(48, 64), a: range(0, 6.283), w: range(1.6, 3.2), size: range(5, 13), alpha: range(0.05, 0.13), teal: Math.random() < 0.6 };
    }
    function drawSmoke(wisps, power, holeR, dt, push) {
      var step = dt / 33.3;                                   // the same speed on any screen refresh rate
      var light = theme() === "light";
      sctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sctx.clearRect(0, 0, FX_W, FX_H);
      sctx.globalCompositeOperation = light ? "source-over" : "lighter";   // glowing light on dark, soft ink on light
      wisps.forEach(function (s, i) {
        s.a += s.w / 30 * (1 + 2.5 * power) * step;
        if (push > 0) s.r += push * 5 * step;                 // blown outward by the burst
        else s.r -= (0.25 + 0.9 * power) * (40 / (s.r + 8)) * step;
        if (s.r < holeR * 0.9) wisps[i] = s = newWisp(false);
        if (push > 0 && s.r > 110) s.alpha = 0;
        var px = FX_W / 2 + Math.cos(s.a) * s.r, py = FX_H / 2 + Math.sin(s.a) * s.r * 0.38;
        var alpha = s.alpha * power * clamp((s.r - holeR) / 6);
        var g = sctx.createRadialGradient(px, py, 0, px, py, s.size);
        var col = light ? (s.teal ? "20,91,99" : "90,104,110") : (s.teal ? "99,197,206" : "170,185,190");
        g.addColorStop(0, "rgba(" + col + "," + alpha + ")");
        g.addColorStop(1, "rgba(" + col + ",0)");
        sctx.fillStyle = g;
        sctx.beginPath(); sctx.arc(px, py, s.size, 0, 6.283); sctx.fill();
      });
    }

    // The hole itself: size, glow and a low, uneven tremble. Returns its radius in pixels.
    function drawHole(t, power, scale, shake) {
      var amount = SHAKE * (shake || 1);
      var shx = (Math.sin(t * 0.083) + 0.6 * Math.sin(t * 0.051 + 1.3)) / 1.6 * amount * power;
      var shy = (Math.sin(t * 0.071 + 2.1) + 0.6 * Math.sin(t * 0.047)) / 1.6 * amount * power;
      dot.style.transform = "translate(" + shx.toFixed(2) + "px," + shy.toFixed(2) + "px) scale(" + scale.toFixed(3) + ")";
      dot.style.boxShadow = "0 0 " + (5 + 4 * power) + "px " + (1 + power) + "px rgba(155,224,230," + (0.45 + 0.4 * power) + "), 0 0 " + (16 * power) + "px " + (5 * power) + "px rgba(99,197,206," + (0.45 * power) + ")";
      var e = egg.getBoundingClientRect(), d = dot.getBoundingClientRect();
      var x = d.left + d.width / 2 - e.left - FX_W / 2, y = d.top + d.height / 2 - e.top - FX_H / 2;
      smokeCanvas.style.left = ringCanvas.style.left = x + "px";
      smokeCanvas.style.top = ringCanvas.style.top = y + "px";
      return d.width / 2;
    }

    function place(u, x, y, extra, opacity) {
      u.span.style.transform = "translate(" + (x - u.hx).toFixed(1) + "px," + (y - u.hy).toFixed(1) + "px) " + extra;
      u.span.style.opacity = opacity;
    }
    // Stretched along its path toward the hole.
    function stretch(u, amount) {
      var deg = (Math.atan2(-u.hy, -u.hx) * 180 / Math.PI).toFixed(1);
      return "rotate(" + deg + "deg) scaleX(" + (1 + amount).toFixed(2) + ") scaleY(" + (1 - amount * 0.35).toFixed(2) + ") rotate(" + (-deg) + "deg) ";
    }

    var busy = false;
    dot.addEventListener("click", function () {
      if (busy) return;
      if (reduceMotion) { dot.classList.add("is-awake"); setTimeout(function () { dot.classList.remove("is-awake"); }, 900); return; }
      busy = true;

      var d = dot.getBoundingClientRect(), cx = d.left + d.width / 2, cy = d.top + d.height / 2;
      var units = letters.map(function (span) {
        var r = span.getBoundingClientRect();
        var hx = r.left + r.width / 2 - cx, hy = r.top + r.height / 2 - cy;
        return { span: span, hx: hx, hy: hy, dist: Math.hypot(hx, hy) };
      });
      var far = Math.max.apply(null, units.map(function (u) { return u.dist; }));
      units.forEach(function (u) {
        var k = u.dist / far;                             // 0 next to the hole, 1 at the far ends
        u.inAt = k * (PULL - TRAVEL);                     // nearest go in first
        u.outAt = k * SPREAD;                             // and are thrown out first
        u.curl = (u.hx < 0 ? 1 : -1) * range(0.6, 1.2);   // a short curl round the rim as it goes in
        u.arc = range(6, 18);                             // how high it's lobbed on the way out
        u.spin = (Math.random() < 0.5 ? -1 : 1) * range(160, 420);   // degrees it tumbles in the air
      });
      var wisps = [];
      for (var i = 0; i < 90; i++) wisps.push(newWisp(true));
      var holdEnd = PULL + HOLD, blast = holdEnd + COLLAPSE + STILL, total = blast + SPREAD + FLY + 250;
      egg.classList.add("is-swallowing");
      var start = null, last = null;

      function frame(now) {
        if (start === null) start = last = now;
        var t = now - start, dt = Math.min(50, now - last);
        last = now;
        var eaten = 0;

        units.forEach(function (u) {
          if (t < blast) {
            // Falling in: straight along the line, speeding up, then curling and shrinking into the hole.
            var pi = clamp((t - u.inAt) / TRAVEL), p = easeIn(pi);
            if (pi >= 1) eaten++;
            var r = mix(u.dist, 0, p), a = Math.atan2(u.hy, u.hx) + u.curl * Math.pow(p, 4);
            var size = Math.max(0.001, 1 - smooth(clamp((p - 0.55) / 0.45)));
            place(u, r * Math.cos(a), r * Math.sin(a) * mix(1, 0.6, p), stretch(u, Math.sin(Math.PI * pi) * 0.9) + "scale(" + size.toFixed(3) + ")", pi >= 1 ? 0 : 1);
          } else {
            // Thrown out: launched fast, lobbed in an arc, tumbling, overshooting home a touch, then landing.
            var q = clamp((t - blast - u.outAt) / FLY);
            if (q <= 0) { place(u, 0, 0, "scale(0.001)", 0); return; }
            var f = clamp(q / 0.72), e = q < 0.72 ? easeOut(f) * 1.1 : 1.1 - 0.1 * smooth((q - 0.72) / 0.28);
            var land = q > 0.72 ? Math.sin(Math.PI * clamp((q - 0.72) / 0.28)) : 0;   // a small squash on landing
            var grow = smooth(clamp(q / 0.25));
            place(u, u.hx * e, u.hy * e - u.arc * Math.sin(Math.PI * f),
              "rotate(" + (u.spin * (1 - easeOut(f))).toFixed(1) + "deg) scale(" + Math.max(0.001, grow * (1 + 0.15 * land)).toFixed(3) + "," + Math.max(0.001, grow * (1 - 0.2 * land)).toFixed(3) + ")", 1);
          }
        });

        // The hole: fattens as it eats, throbs, caves in to a point, then bursts back to its small self.
        var base = 1 + 0.6 * smooth(clamp(t / 500)) + GROW * (t < holdEnd ? eaten / units.length : 1);
        var scale, power, shake = 1, push = 0;
        if (t < holdEnd) {
          scale = base + (t > PULL ? 0.12 * Math.sin((t - PULL) / HOLD * Math.PI * 3) : 0);
          power = t < 600 ? smooth(t / 600) : 1;
        } else if (t < blast) {
          var b = easeIn(clamp((t - holdEnd) / COLLAPSE));
          scale = mix(base, TINY, b); power = mix(1, 0.35, b); shake = 1 + 2.5 * b;
        } else {
          var k = t - blast;
          var pop = k < 90 ? easeOut(k / 90) : 1;
          scale = mix(TINY, base + 0.5, pop) + (1 - (base + 0.5)) * easeOut(clamp((k - 90) / 1300));
          power = mix(0.35, 1.8, pop) * (1 - smooth(clamp((k - 90) / 1500)));
          shake = 1 + 5 * Math.max(0, 1 - k / 420);
          push = Math.max(0, 1 - k / 650);
        }
        var holeR = drawHole(t, Math.min(power, 1), scale, shake);
        // the burst brightens the rim for a moment, without growing the glow's reach
        var flash = Math.min(1, Math.max(0, power - 1));
        dot.style.borderColor = flash > 0 ? "rgb(" + Math.round(mix(99, 230, flash)) + "," + Math.round(mix(197, 250, flash)) + "," + Math.round(mix(206, 252, flash)) + ")" : "";
        drawSmoke(wisps, Math.min(1, power), holeR, dt, push);

        // Two quick rings of light from the burst.
        rctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        rctx.clearRect(0, 0, FX_W, FX_H);
        [0, 130].forEach(function (lag, j) {
          var rt = (t - blast - lag) / 450;
          if (rt <= 0 || rt >= 1) return;
          var rr = mix(holeR, j ? 95 : 75, easeOut(rt));
          rctx.strokeStyle = (theme() === "light" ? "rgba(20,91,99," : "rgba(155,224,230,") + ((j ? 0.45 : 0.85) * (1 - rt)).toFixed(3) + ")";
          rctx.lineWidth = mix(j ? 2 : 3.5, 0.4, rt);
          rctx.shadowColor = "rgba(99,197,206,0.9)"; rctx.shadowBlur = 10;
          rctx.beginPath(); rctx.ellipse(FX_W / 2, FX_H / 2, rr, rr * 0.45, 0, 0, 6.283); rctx.stroke();
        });

        if (t < total) { requestAnimationFrame(frame); return; }
        letters.forEach(function (span) { span.style.transform = span.style.opacity = ""; });
        dot.style.transform = dot.style.boxShadow = dot.style.borderColor = "";
        sctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
        rctx.clearRect(0, 0, ringCanvas.width, ringCanvas.height);
        egg.classList.remove("is-swallowing");
        busy = false;
      }
      requestAnimationFrame(frame);
    });
  }

  // ----- A short contact line at the end of every page except Contact itself.
  var mainEl = document.querySelector("main");
  if (mainEl && currentPage !== "contact" && currentPage !== "404") {
    var note = el("p", "contact-note");
    note.appendChild(document.createTextNode("Like my work? "));
    var go = el("a", null, "Get in touch");
    go.href = "contact.html";
    note.appendChild(go);
    mainEl.appendChild(note);
  }

  // ----- Keep the render showing on the tile that was just clicked.
  // Browsers only work out what's under the cursor after it moves, so a freshly loaded page
  // would show line art under a still cursor. We remember the click and show the render
  // until the cursor moves; from then on normal hovering takes over.
  var KEY = "tile-clicked";
  if (rail) {
    rail.addEventListener("click", function (event) {
      var tile = event.target.closest("a.tile");
      if (tile && event.detail > 0) {               // a mouse click, not the keyboard
        try { sessionStorage.setItem(KEY, tile.getAttribute("href")); } catch (e) {}
      }
    });
    var clicked = null;
    try { clicked = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
    var current = rail.querySelector(".tile[aria-current]");
    if (clicked && current && current.getAttribute("href") === clicked) {
      current.classList.add("is-hovered");
      var release = function () {
        current.classList.remove("is-hovered");
        document.removeEventListener("pointermove", release);
      };
      document.addEventListener("pointermove", release);
    }
  }

  // ----- Keyboard scrolling in the fixed frame.
  // On larger screens only the content area scrolls, so the arrow keys, Page Down and Space
  // need it focused. Focusing it quietly on load does that without moving anything.
  var content = document.querySelector("main");
  if (content) {
    content.setAttribute("tabindex", "-1");
    try { content.focus({ preventScroll: true }); } catch (e) {}
  }

  // ----- Video posters: click to play in place.
  // Opened from disk, YouTube refuses to play inside the page, so the link opens YouTube instead.
  var videoLinks = document.querySelectorAll("a[data-youtube]");
  Array.prototype.forEach.call(videoLinks, function (link) {
    var id = link.getAttribute("data-youtube");
    var poster = link.querySelector("img");

    // YouTube sends a tiny grey placeholder when the large poster doesn't exist. Fall back to the standard one.
    function checkPoster() {
      if (poster.naturalWidth > 0 && poster.naturalWidth <= 120) {
        poster.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
      }
    }
    if (poster) {
      if (poster.complete) checkPoster();
      poster.addEventListener("load", checkPoster);
    }

    if (location.protocol === "file:") return;

    link.addEventListener("click", function (event) {
      event.preventDefault();
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      frame.title = link.getAttribute("data-title") || "Video";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      link.parentNode.replaceChild(frame, link);
    });
  });
})();
