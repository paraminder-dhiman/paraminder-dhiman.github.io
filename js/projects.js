/* The project list.

   This is the only file to edit when you add, hide or reorder a project.
   The tile rail and the work list on the About page are both built from it.

   ORDER
   Projects are sorted automatically, in this order:
     1. group  · the order written in GROUP_ORDER below
     2. scale  · bigger first (3 = large, 2 = medium, 1 = small)
     3. year   · newest first
   So a new project lands in the right place by itself. You never move lines around.

   STATUS
     "live"     shown to everyone
     "draft"    the page exists, but it only shows in your local preview
     "planned"  no page yet; shows dimmed in your local preview only

   FIELDS
     id     the page's file name without .html, and the tile's file name in /tiles
     title  full name, used in the work list
     tile   short name under the tile
     meta   the line shown next to the title, separated with dots
     image  optional. A square picture in /tiles, shown when the tile is hovered
     line   optional. The line drawing's file name in /tiles, if it isn't id.svg
*/

const GROUP_ORDER = ["tech-art", "programming", "craft"];

const PROJECTS = [
  {
    id: "black-hole-shader",
    title: "Black hole shader",
    tile: "Black hole",
    meta: "Shader · Unreal Engine 5 · 2023",
    group: "tech-art",
    scale: 3,
    year: 2023,
    status: "planned",
  },
  {
    id: "blender-tools",
    title: "Blender tools",
    tile: "Blender tools",
    meta: "Tools · Blender, Python",
    group: "tech-art",
    scale: 2,
    year: 2026,
    status: "planned",
  },
  {
    id: "home-server",
    title: "Home server and automation",
    tile: "Home server",
    meta: "Infrastructure · Python · 2026",
    group: "programming",
    scale: 3,
    year: 2026,
    status: "planned",
  },
  {
    id: "video-editing",
    title: "Video editing",
    tile: "Editing",
    meta: "DaVinci Resolve · 5+ years",
    group: "craft",
    scale: 2,
    year: 2026,
    status: "planned",
  },
];
