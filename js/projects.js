/* The project list.

   This is the only file to edit when you add, hide or reorder a project.
   The tile rail and the work list on the About page are both built from it.

   GROUPS
   The rail starts with the "Me" group (About and Contact), set in js/site.js.
   Projects follow in groups, in the order written in GROUP_ORDER below.
   Each group gets a heading in the tile rail and in the work list on the About page,
   taken from GROUP_NAMES. To add a group, add it to both lists.

   ORDER
   Inside a group, projects are sorted automatically, in this order:
     1. pin    · optional. Pinned projects come first, pin 1 before pin 2
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
     group  which group it sits in · one of the names in GROUP_ORDER
     image  optional. A square picture in /tiles, shown when the tile is hovered
     line   optional. The line drawing's file name in /tiles, if it isn't id.svg
     pin    optional. A number that puts the project ahead of the normal order
*/

const GROUP_ORDER = ["tech-art", "beyond"];
const GROUP_NAMES = {
  "tech-art": "Tech art",
  "beyond": "Beyond tech art",
};

const PROJECTS = [
  {
    id: "black-hole-shader",
    title: "Black hole shader",
    tile: "Black hole",
    meta: "Shader · Unreal Engine 5 · 2023",
    group: "tech-art",
    scale: 3,
    year: 2023,
    pin: 1,
    status: "planned",
  },
  {
    id: "unravel",
    title: "Unravel",
    tile: "Unravel",
    image: "unravel.jpg",
    meta: "Tool · Blender, Geometry Nodes, Python · 2026",
    group: "tech-art",
    scale: 3,
    year: 2026,
    status: "draft",
  },
  {
    id: "blender-tools",
    title: "Blender tools",
    tile: "Blender tools",
    image: "blender-tools.jpg",
    meta: "Tools · Blender, Python · 2026",
    group: "tech-art",
    scale: 2,
    year: 2026,
    status: "draft",
  },
  {
    id: "home-server",
    title: "Home server and automation",
    tile: "Home server",
    image: "home-server.jpg",
    meta: "Infrastructure · Docker, Python · 2026",
    group: "beyond",
    scale: 3,
    year: 2026,
    status: "draft",
  },
  {
    id: "behind-the-site",
    title: "Behind the site",
    tile: "Behind the site",
    image: "behind-the-site.jpg",
    meta: "Web · Blender, Python, HTML, CSS, JavaScript · 2026",
    group: "beyond",
    scale: 1,
    year: 2026,
    status: "draft",
  },
  {
    id: "video-editing",
    title: "Video editing",
    tile: "Editing",
    image: "video-editing.jpg",
    meta: "DaVinci Resolve · 5+ years",
    group: "beyond",
    scale: 2,
    year: 2026,
    status: "draft",
  },
];
