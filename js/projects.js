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
     image  optional. The render shown when the tile is hovered, named without its theme:
            "unravel.jpg" loads tiles/unravel-dark.jpg or tiles/unravel-light.jpg
     line   optional. The line drawing's name, if it isn't id.svg · also without its theme
            (the site loads id-dark.svg or id-light.svg)
     pin    optional. A number that puts the project ahead of the normal order
*/

const GROUP_ORDER = ["tech-art", "beyond"];
const GROUP_NAMES = {
  "tech-art": "Tech art",
  "beyond": "Beyond tech art",
};

const PROJECTS = [
  {
    id: "black-hole-studio",
    title: "Black Hole Studio",
    tile: "Black Hole · Blender",
    image: "black-hole-studio.jpg",
    meta: "Extension · Blender, Python, OSL · 2026",
    group: "tech-art",
    scale: 3,
    year: 2026,
    pin: 1,
    status: "live",
  },
  {
    id: "black-hole-shader",
    title: "Black Hole Shader",
    tile: "Black Hole · UE",
    image: "black-hole-shader.jpg",
    meta: "Shader · Unreal Engine 5, HLSL · 2023 · 2026",
    group: "tech-art",
    scale: 3,
    year: 2023,
    pin: 2,
    status: "live",
  },
  {
    id: "stylized-toon-shader",
    title: "Stylized Toon Shader",
    tile: "Toon Shader · UE",
    image: "stylized-toon-shader.jpg",
    meta: "Shader · Unreal Engine 5, HLSL · 2026",
    group: "tech-art",
    scale: 3,
    year: 2026,
    pin: 3,
    status: "draft",
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
    status: "live",
  },
  {
    id: "blender-tools",
    title: "Blender Tools",
    tile: "Blender Tools",
    image: "blender-tools.jpg",
    meta: "Tools · Blender, Python · 2026",
    group: "tech-art",
    scale: 2,
    year: 2026,
    status: "live",
  },
  {
    id: "home-server",
    title: "Home Server and Automation",
    tile: "Home Server",
    image: "home-server.jpg",
    meta: "Infrastructure · Docker, Python · 2026",
    group: "beyond",
    scale: 3,
    year: 2026,
    status: "live",
  },
  {
    id: "behind-the-site",
    title: "Behind the Site",
    tile: "Behind the Site",
    image: "behind-the-site.jpg",
    meta: "Web · Blender, Python, HTML, CSS, JavaScript · 2026",
    group: "beyond",
    scale: 1,
    year: 2026,
    status: "live",
  },
  {
    id: "video-editing",
    title: "Video Editing",
    tile: "Video Editing",
    image: "video-editing.jpg",
    meta: "DaVinci Resolve · 5+ years",
    group: "beyond",
    scale: 2,
    year: 2026,
    status: "live",
  },
];
