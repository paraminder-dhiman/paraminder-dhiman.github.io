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
    rail.appendChild(
      makeTile({ id: "about", tile: "About", href: "index.html", status: "live", image: "about.jpg" })
    );
    projects.forEach(function (p) {
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
    projects.forEach(function (p) {
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
