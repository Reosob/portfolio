const CATEGORY_DIRECTORIES = {
  "2d": "2D",
  "3d": "3D",
  video: "Video"
};

function buildAssetPath(...segments) {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

function createProject({
  title,
  category,
  previewName = title,
  projectName = title,
  frameWidth = 360
}) {
  const categoryDirectory = CATEGORY_DIRECTORIES[category];

  return {
    title,
    category,
    preview: buildAssetPath("preview", categoryDirectory, `${previewName}.png`),
    url: buildAssetPath("projects", categoryDirectory, `${projectName}.html`),
    frameWidth
  };
}
const PROJECTS = [
  createProject({
    title: "Cars Smart Metres",
    category: "2d",
    projectName: "Car Smart Metres"
  }),
  createProject({
    title: "City Restoration",
    category: "2d"
  }),
  createProject({
    title: "Competition",
    category: "2d"
  }),
  createProject({
    title: "Pastry Maker",
    category: "2d"
  }),
  createProject({
    title: "Fogclear",
    category: "2d"
  }),
  createProject({
    title: "Mining Farm",
    category: "2d"
  }),
  createProject({
    title: "Shelf",
    category: "2d"
  }),
  createProject({
    title: "Slots",
    category: "2d"
  }),
  createProject({
    title: "Solitaire",
    category: "2d"
  }),
  createProject({
    title: "Sequence Path",
    category: "2d"
  }),
  // createProject({
  //   title: "Cafe",
  //   category: "3d"
  // }),
  createProject({
    title: "Emotional Battle",
    category: "3d"
  }),
  createProject({
    title: "Large Stack",
    category: "3d"
  }),
  createProject({
    title: "Office",
    category: "3d"
  }),
  createProject({
    title: "Rotary Pickaxes",
    category: "3d"
  }),
  createProject({
    title: "Sawres",
    category: "3d"
  }),
  createProject({
    title: "Speaking Man",
    category: "3d"
  }),
  createProject({
    title: "Topeasy",
    category: "3d"
  }),
  createProject({
    title: "Coins",
    category: "video"
  }),
  createProject({
    title: "Ferrying Paused",
    category: "video"
  })
];
