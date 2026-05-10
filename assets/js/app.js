const grid = document.getElementById("projectsGrid");
const filterButtons = document.querySelectorAll(".filter-button");
const modal = document.getElementById("modal");
const frame = document.getElementById("projectFrame");
const title = document.getElementById("viewerTitle");
const closeButton = document.querySelector(".close");
const viewer = document.querySelector(".phone-viewer");
const heroTitle = document.getElementById("heroTitle");
const heroLead = document.getElementById("heroLead");
const PHONE_FRAME = {
  width: 360,
  ratioWidth: 9,
  ratioHeight: 16
};
const backgroundCanvas = document.getElementById("gameBg");
const scoreBoard = document.getElementById("scoreBoard");
const ACTIVE_FILTER_STORAGE_KEY = "portfolio.activeFilter";

let activeFilter = "all";
let frameLoadId = 0;
let currentPhoneFrame = {
  width: PHONE_FRAME.width,
  height: PHONE_FRAME.width * PHONE_FRAME.ratioHeight / PHONE_FRAME.ratioWidth
};

function typeLine(element, delay = 75, startDelay = 120) {
  const text = element.dataset.text || element.textContent;

  element.textContent = "";
  element.classList.remove("is-waiting");
  element.classList.add("is-typing");

  return new Promise((resolve) => {
    [...text].forEach((letter, index) => {
      window.setTimeout(() => {
        element.textContent += letter;

        if (index === text.length - 1) {
          window.setTimeout(() => {
            element.classList.remove("is-typing");
            resolve();
          }, delay);
        }
      }, startDelay + index * delay);
    });
  });
}

async function initHeroTypewriter() {
  if (!heroTitle || !heroLead) {
    return;
  }

  const titleText = heroTitle.dataset.text || heroTitle.textContent;
  const leadText = heroLead.dataset.text || heroLead.textContent;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    heroTitle.textContent = titleText;
    heroLead.textContent = leadText;
    return;
  }

  heroLead.classList.add("is-waiting");

  await typeLine(heroTitle, 75, 120);
  await typeLine(heroLead, 45, 160);
}

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

function getSavedFilter() {
  try {
    return window.localStorage.getItem(ACTIVE_FILTER_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveActiveFilter(nextFilter) {
  try {
    window.localStorage.setItem(ACTIVE_FILTER_STORAGE_KEY, nextFilter);
  } catch (error) {
    // The filter still works when storage is unavailable.
  }
}

function initActiveFilter() {
  const savedFilter = getSavedFilter();
  const savedFilterExists = [...filterButtons].some((button) => button.dataset.filter === savedFilter);

  if (savedFilterExists) {
    setActiveFilter(savedFilter);
    return;
  }

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
  document.body.classList.add("playable-open");
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
  document.body.classList.remove("playable-open");
  frame.src = "about:blank";
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveFilter(button.dataset.filter);
    saveActiveFilter(button.dataset.filter);
  });
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

initHeroTypewriter();
initActiveFilter();

function initGameBackground() {
  if (!backgroundCanvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const ctx = backgroundCanvas.getContext("2d");
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    active: false
  };
  const stars = [];
  const pickups = [];
  const bullets = [];
  const explosions = [];
  const colors = {
    star: "#7fb5ff",
    cyan: "#48f7ff",
    pink: "#ff5bd8",
    gold: "#ffdf5a",
    green: "#76ff80"
  };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastShot = 0;
  let animationFrame = 0;
  let score = 0;

  function updateScore(points) {
    score += points;

    if (scoreBoard) {
      scoreBoard.textContent = `SCORE ${String(score).padStart(6, "0")}`;
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    backgroundCanvas.width = Math.floor(width * dpr);
    backgroundCanvas.height = Math.floor(height * dpr);
    backgroundCanvas.style.width = `${width}px`;
    backgroundCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars.length = 0;
    pickups.length = 0;

    for (let i = 0; i < Math.round(width * height / 15000); i += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.35 + Math.random() * 1.2,
        size: Math.random() > 0.82 ? 2 : 1,
        alpha: 0.28 + Math.random() * 0.72
      });
    }

    for (let i = 0; i < Math.max(10, Math.round(width / 120)); i += 1) {
      pickups.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: -0.25 + Math.random() * 0.5,
        vy: 0.2 + Math.random() * 0.55,
        size: 10 + Math.random() * 10,
        hitSize: 20,
        spin: Math.random() * Math.PI * 2,
        color: [colors.cyan, colors.pink, colors.gold, colors.green][i % 4]
      });
    }
  }

  function respawnPickup(pickup) {
    pickup.x = Math.random() * width;
    pickup.y = -30 - Math.random() * 160;
    pickup.vx = -0.25 + Math.random() * 0.5;
    pickup.vy = 0.2 + Math.random() * 0.55;
    pickup.size = 10 + Math.random() * 10;
    pickup.hitSize = pickup.size + 12;
    pickup.spin = Math.random() * Math.PI * 2;
  }

  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 14; i += 1) {
      const angle = Math.PI * 2 * (i / 14);
      const speed = 1.6 + Math.random() * 3.2;

      explosions.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 24 + Math.random() * 12,
        maxLife: 36,
        size: 2 + Math.random() * 5,
        color
      });
    }
  }

  function drawPixelDiamond(x, y, size, color, spin) {
    const pulse = Math.sin(spin) * 2;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y - size * 0.5 - pulse), Math.round(size), Math.round(size));
    ctx.clearRect(Math.round(x + size * 0.25), Math.round(y - size * 0.25 - pulse), Math.round(size * 0.5), Math.round(size * 0.5));
  }

  function drawShip(x, y) {
    ctx.fillStyle = colors.cyan;
    ctx.fillRect(x - 4, y - 13, 8, 8);
    ctx.fillRect(x - 8, y - 5, 16, 8);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(x - 12, y + 3, 8, 8);
    ctx.fillRect(x + 4, y + 3, 8, 8);
    ctx.fillStyle = colors.pink;
    ctx.fillRect(x - 2, y + 11, 4, 10);
  }

  function tick(time) {
    const isPlayableOpen = document.body.classList.contains("playable-open");

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 280);
    gradient.addColorStop(0, "rgba(72, 247, 255, 0.16)");
    gradient.addColorStop(1, "rgba(72, 247, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.035)";
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }

    stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > height) {
        star.y = -4;
        star.x = Math.random() * width;
      }

      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = colors.star;
      ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
    });
    ctx.globalAlpha = 1;

    pickups.forEach((pickup) => {
      const dx = pickup.x - pointer.x;
      const dy = pickup.y - pointer.y;
      const distance = Math.max(1, Math.hypot(dx, dy));

      if (!isPlayableOpen && distance < 150) {
        pickup.vx += dx / distance * 0.018;
        pickup.vy += dy / distance * 0.018;
      }

      pickup.x += pickup.vx;
      pickup.y += pickup.vy;
      pickup.spin += 0.06;

      if (pickup.y > height + 30 || pickup.x < -40 || pickup.x > width + 40) {
        respawnPickup(pickup);
      }

      drawPixelDiamond(pickup.x, pickup.y, pickup.size, pickup.color, pickup.spin);
    });

    if (!isPlayableOpen && pointer.active && time - lastShot > 190) {
      bullets.push({ x: pointer.x, y: pointer.y - 18, life: 80 });
      lastShot = time;
    }

    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const bullet = bullets[i];
      bullet.y -= 8;
      bullet.life -= 1;
      ctx.fillStyle = colors.gold;
      ctx.fillRect(Math.round(bullet.x - 2), Math.round(bullet.y), 4, 12);

      for (let j = pickups.length - 1; j >= 0; j -= 1) {
        const pickup = pickups[j];
        const hitX = Math.abs(bullet.x - pickup.x) < pickup.hitSize;
        const hitY = Math.abs(bullet.y - pickup.y) < pickup.hitSize;

        if (hitX && hitY) {
          spawnExplosion(pickup.x, pickup.y, pickup.color);
          respawnPickup(pickup);
          bullets.splice(i, 1);
          updateScore(100);
          break;
        }
      }

      if (bullet.life <= 0 || bullet.y < -20) {
        bullets.splice(i, 1);
      }
    }

    for (let i = explosions.length - 1; i >= 0; i -= 1) {
      const part = explosions[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 0.04;
      part.life -= 1;

      ctx.globalAlpha = Math.max(part.life / part.maxLife, 0);
      ctx.fillStyle = part.color;
      ctx.fillRect(Math.round(part.x), Math.round(part.y), part.size, part.size);

      if (part.life <= 0) {
        explosions.splice(i, 1);
      }
    }
    ctx.globalAlpha = 1;

    if (!isPlayableOpen) {
      drawShip(pointer.x, pointer.y);
    }

    animationFrame = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    if (document.body.classList.contains("playable-open")) {
      pointer.active = false;
      return;
    }

    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  resize();
  animationFrame = requestAnimationFrame(tick);
}

initGameBackground();
