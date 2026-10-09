# Portfolio

The source for my portfolio site. Plain HTML, CSS and a little JavaScript. No build step.

## What's where

| Path | What it is |
|---|---|
| `index.html` | The About page |
| `404.html` | Shown by GitHub Pages for a wrong address |
| `css/site.css` | All styling. Colours and sizes are at the top |
| `js/projects.js` | The project list. The only file to edit when adding a project |
| `js/site.js` | Builds the tile rail and the work list from that list |
| `tiles/` | One line drawing per tile, plus hover images later |
| `fonts/` | IBM Plex Sans, used under the SIL Open Font License |

## Preview privately

Open `index.html` in a browser. Nothing is online at this point.

In a local preview you also see projects marked `draft` or `planned`. Visitors to the live site only see projects marked `live`.

## Add a project

1. Copy an existing project page and rename it, for example `my-project.html`.
2. Set `<body data-page="my-project">` in that page so its tile is highlighted.
3. Add a line drawing at `tiles/my-project.svg`.
4. Add one entry to `js/projects.js` with the same `id`.

The order is worked out automatically: group first, then scale, then year.

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
