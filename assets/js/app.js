const grid = document.getElementById("projectsGrid");
const filterButtons = document.querySelectorAll(".filter-button");
const modal = document.getElementById("modal");
const frame = document.getElementById("projectFrame");
const title = document.getElementById("viewerTitle");
const closeButton = document.querySelector(".close");
const viewer = document.querySelector(".phone-viewer");
const PHONE_FRAME = {
  width: 320,
  ratioWidth: 188.15,
  ratioHeight: 387.74
};

let activeFilter = "all";
let frameLoadId = 0;
let currentPhoneFrame = {
  width: PHONE_FRAME.width,
  height: PHONE_FRAME.width * PHONE_FRAME.ratioHeight / PHONE_FRAME.ratioWidth
};

function renderProjects() {
  const visibleProjects = PROJECTS.filter((project) => {
    return activeFilter === "all" || project.category === activeFilter;
  });

  grid.innerHTML = visibleProjects.map((project) => {
    const categoryLabel = project.category.toUpperCase();
    const frameWidth = project.frameWidth || PHONE_FRAME.width;

    return `
    <button
      class="project-card"
      type="button"
      data-title="${project.title}"
      data-src="${project.url}"
      data-frame-width="${frameWidth}"
    >
      <div class="thumb">
        <img src="${project.preview}" alt="${project.title}">
      </div>
      <div class="project-info">
        <h2 class="project-title">${project.title}</h2>
        <div class="project-meta">
          <span>${categoryLabel}</span>
          <span>Open</span>
        </div>
      </div>
    </button>
  `;
  }).join("");
}

function setActiveFilter(nextFilter) {
  activeFilter = nextFilter;

  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });

  renderProjects();
}

function updateViewerScale() {
  const gap = 32;
  const scale = Math.min(
    1,
    (window.innerWidth - gap) / currentPhoneFrame.width,
    (window.innerHeight - gap) / currentPhoneFrame.height
  );

  viewer.style.setProperty("--viewer-scale", Math.max(scale, 0.32).toString());
}

function setPhoneFrame(width) {
  currentPhoneFrame = {
    width,
    height: width * PHONE_FRAME.ratioHeight / PHONE_FRAME.ratioWidth
  };

  document.documentElement.style.setProperty("--phone-frame-width", `${currentPhoneFrame.width}px`);
}

function openProject(card) {
  frameLoadId += 1;
  const loadId = frameLoadId;
  const frameWidth = Number(card.dataset.frameWidth) || PHONE_FRAME.width;

  title.textContent = card.dataset.title;
  setPhoneFrame(frameWidth);
  frame.src = "about:blank";
  frame.removeAttribute("width");
  frame.removeAttribute("height");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  updateViewerScale();
  closeButton.focus();

  requestAnimationFrame(() => {
    if (loadId === frameLoadId) {
      frame.src = card.dataset.src;
    }
  });
}

function closeProject() {
  frameLoadId += 1;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  frame.src = "about:blank";
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveFilter(button.dataset.filter));
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".project-card");

  if (card) {
    openProject(card);
  }
});

closeButton.addEventListener("click", closeProject);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeProject();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeProject();
  }
});

window.addEventListener("resize", () => {
  if (modal.classList.contains("is-open")) {
    updateViewerScale();
  }
});

renderProjects();
