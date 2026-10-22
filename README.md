# Paraminder Dhiman · portfolio

The source for my portfolio site, live at [paraminder-dhiman.github.io](https://paraminder-dhiman.github.io).

Plain HTML, CSS and a little JavaScript. No framework and no build step. How it's made, and why, is on the site's [Behind the site](https://paraminder-dhiman.github.io/behind-the-site.html) page.

## What's where

| Path | What it is |
|---|---|
| `index.html` | The About page |
| `contact.html` | The Contact page |
| `*.html` | One page per project |
| `404.html` | Shown by GitHub Pages for a wrong address |
| `css/site.css` | All styling · colours and sizes are at the top |
| `js/projects.js` | The project list · the only file to edit when adding a project |
| `js/site.js` | Builds the tile rail, the work list and the phone menu, and runs the line art motion |
| `tiles/` | Each tile's line art (`.svg`) and render (`.jpg`) |
| `images/` | Images for the project pages, one folder per page |
| `files/` | The resume PDF |
| `tools/tile-grid.html` | Builds the tile grid image on the Behind the site page · instructions inside |
| `fonts/` | IBM Plex Sans, used under the SIL Open Font License |

## Preview locally

Run a small local server from this folder, then open [localhost:8000](http://localhost:8000):

```
python -m http.server 8000
```

Opening `index.html` straight from disk also works, but the browser won't let the page read the SVG files, so the line art stays still.

A local preview also shows projects marked `draft` or `planned`. The live site only shows `live` ones.

## Add a project

1. Copy an existing project page and rename it, for example `my-project.html`.
2. Set `<body data-page="my-project">` in that page so its tile is highlighted.
3. Put the tile's line art and render in `tiles/` as `my-project.svg` and `my-project.jpg`.
4. Add one entry to `js/projects.js` with the same `id`.

The order is worked out automatically: group, then pinned projects, then size, then year. The notes at the top of `js/projects.js` explain each field.

## Save and publish

Save a version to the private repo:

```
git add .
git commit -m "Describe what changed"
git push
```

Publish to the live site, only when the preview looks right:

```
git push public main
```

## Credit

Design, direction and every tile by me. The code and the Blender tile pipeline were built with AI-assisted scripting.
