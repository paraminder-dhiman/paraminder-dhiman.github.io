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
    line.src = "tiles/" + (item.line || item.id + ".svg");
    line.alt = "";
    box.appendChild(line);

    if (item.image) {
      var img = el("img", "tile-img");
      img.src = "tiles/" + item.image;
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
        })
      );
    });
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

  if (LINE_DRAW !== "off" && !reduceMotion && location.protocol !== "file:" && rail) {
    var firstVisit = true;
    try { firstVisit = !sessionStorage.getItem("lines-drawn"); sessionStorage.setItem("lines-drawn", "1"); } catch (e) {}
    var lineImgs = rail.querySelectorAll("img.tile-line");
    Array.prototype.forEach.call(lineImgs, function (img, n) {
      if (LINE_DRAW === "load" && !firstVisit) return;
      if (LINE_DRAW === "load") img.style.visibility = "hidden";   // no flash of finished lines before drawing
      inlineSvg(img).then(function (svg) {
        if (!svg) return;
        var tile = svg.closest(".tile");
        tile._lines = svg;
        if (LINE_DRAW === "load") {
          draw(svg, DRAW_TIME, 150 + n * 90);   // tiles start one after another
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

  // ----- A short contact line at the end of every page except Contact itself.
  var mainEl = document.querySelector("main");
  if (mainEl && currentPage !== "contact") {
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
