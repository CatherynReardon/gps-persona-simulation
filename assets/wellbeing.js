const WELLBEING_DATA_URL = "public/wellbeing_data.json";

const wellState = {
  data: null,
  profile: null,
  sceneFrame: null,
  sceneTick: 0,
  people: [],
};

const wellEls = {
  country: document.querySelector("#wellCountry"),
  dimension: document.querySelector("#wellDimension"),
  group: document.querySelector("#wellGroup"),
  scenario: document.querySelector("#wellScenario"),
  refresh: document.querySelector("#newWellProfile"),
  title: document.querySelector("#wellProfileTitle"),
  countryCount: document.querySelector("#wellCountryCount"),
  profileCount: document.querySelector("#wellProfileCount"),
  globalCount: document.querySelector("#wellGlobalCount"),
  avatar: document.querySelector("#wellAvatar"),
  personaName: document.querySelector("#wellPersonaName"),
  personaSub: document.querySelector("#wellPersonaSub"),
  narrative: document.querySelector("#wellNarrative"),
  wellScore: document.querySelector("#wellScore"),
  strainScore: document.querySelector("#strainScore"),
  purposeScore: document.querySelector("#purposeScore"),
  canvas: document.querySelector("#wellCanvas"),
  bars: document.querySelector("#wellBars"),
  scenarioTag: document.querySelector("#wellScenarioTag"),
  scenarioText: document.querySelector("#wellScenarioText"),
  comparison: document.querySelector("#wellComparison"),
  researchPrompts: document.querySelector("#wellResearchPrompts"),
};

const keyIndicators = [
  "thriving",
  "struggling",
  "suffering",
  "health_problems",
  "support",
  "calm",
  "peace",
  "balance",
  "purpose_family",
  "purpose_helping",
  "enjoy_work",
  "work_choices",
];

const scenarioCopy = {
  stress: {
    tag: "stress",
    title: "Stress and coping",
    drivers: ["struggling", "suffering", "health_problems", "calm", "support"],
    prompt: "This scenario asks how a group might experience pressure and what supports could help.",
  },
  support: {
    tag: "support",
    title: "Seeking support",
    drivers: ["support", "peace", "balance", "care_others"],
    prompt: "This scenario asks whether social support is visible enough to become a coping resource.",
  },
  purpose: {
    tag: "purpose",
    title: "Purpose and meaning",
    drivers: ["purpose_skill", "purpose_family", "purpose_helping", "peace"],
    prompt: "This scenario asks what source of purpose appears most salient for the selected group.",
  },
  work: {
    tag: "work",
    title: "Work-life design",
    drivers: ["enjoy_work", "work_improves_lives", "work_choices", "balance"],
    prompt: "This scenario asks whether work feels meaningful, flexible, and connected to life balance.",
  },
  intervention: {
    tag: "intervention",
    title: "Wellbeing intervention",
    drivers: ["thriving", "support", "calm", "balance", "health_problems"],
    prompt: "This scenario asks which intervention target looks most useful for this profile.",
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmtPct(value) {
  if (!Number.isFinite(value)) return "--";
  return `${Math.round(value * 100)}%`;
}

function fmtScore(value) {
  if (!Number.isFinite(value)) return "--";
  return Math.round(value * 100);
}

function indicatorLabel(key) {
  return wellState.data.indicators.find((indicator) => indicator.key === key)?.label ?? key;
}

function hashCode(text) {
  return [...String(text)].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function avatarSvg(profile, size = 128) {
  const seed = hashCode(`${profile.country}-${profile.dimension}-${profile.group}`);
  const palettes = [
    ["#315f9d", "#d9e8f6", "#f2c9a0", "#33251e"],
    ["#14785d", "#e0f1e9", "#c9875e", "#2d211b"],
    ["#b7791f", "#fff1cf", "#e0ad82", "#4a2f1e"],
    ["#ba4a42", "#fbe4e1", "#b8754b", "#2f2420"],
  ];
  const [accent, bg, skin, hair] = palettes[seed % palettes.length];
  const smile = (profile.scores.wellbeing ?? 0.5) > (profile.scores.strain ?? 0.25);
  const mouth = smile ? "M39 65 Q48 72 58 65" : "M40 66 Q48 63 56 66";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="${bg}"/>
      <circle cx="48" cy="88" r="32" fill="${accent}"/>
      <circle cx="48" cy="48" r="26" fill="${skin}"/>
      <path d="M24 41 Q30 17 51 18 Q72 20 73 43 Q60 35 47 37 Q34 40 24 41Z" fill="${hair}"/>
      <circle cx="38" cy="52" r="3" fill="#17211d"/>
      <circle cx="58" cy="52" r="3" fill="#17211d"/>
      <path d="${mouth}" fill="none" stroke="#7a3f35" stroke-width="3" stroke-linecap="round"/>
      <circle cx="27" cy="56" r="5" fill="${skin}"/>
      <circle cx="69" cy="56" r="5" fill="${skin}"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function populateSelect(select, values, selected) {
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  if (selected && values.includes(selected)) select.value = selected;
}

function profilesFor(country, dimension) {
  return wellState.data.countryProfiles.filter((profile) => profile.country === country && profile.dimension === dimension);
}

function updateGroups(keepGroup = true) {
  const current = keepGroup ? wellEls.group.value : "";
  const rows = profilesFor(wellEls.country.value, wellEls.dimension.value);
  populateSelect(wellEls.group, rows.map((row) => row.group), current);
}

function chooseProfile() {
  const rows = profilesFor(wellEls.country.value, wellEls.dimension.value);
  wellState.profile = rows.find((row) => row.group === wellEls.group.value) ?? rows[0] ?? wellState.data.countryProfiles[0];
}

function topPurpose(metrics) {
  const choices = [
    ["purpose_skill", "being good at daily life"],
    ["purpose_family", "caring for family and close friends"],
    ["purpose_helping", "helping people who need help"],
  ];
  return choices.sort((a, b) => (metrics[b[0]] ?? 0) - (metrics[a[0]] ?? 0))[0][1];
}

function renderNarrative(profile) {
  const m = profile.metrics;
  const thriving = fmtPct(m.thriving);
  const support = fmtPct(m.support);
  const calm = fmtPct(m.calm);
  const strain = fmtPct(profile.scores.strain);
  const purpose = topPurpose(m);
  return `This is a group-level wellbeing profile for ${profile.group} respondents in ${profile.country}. The profile shows ${thriving} thriving, ${support} reporting someone to count on, and ${calm} reporting calmness yesterday. Estimated strain is ${strain}. The most visible purpose theme is ${purpose}.`;
}

function renderBars(profile) {
  wellEls.bars.innerHTML = "";
  keyIndicators.forEach((key) => {
    const value = profile.metrics[key];
    const indicator = wellState.data.indicators.find((item) => item.key === key);
    const risk = indicator?.kind === "risk";
    const row = document.createElement("div");
    row.className = "trait-bar";
    row.innerHTML = `
      <b>${indicatorLabel(key)}</b>
      <div class="bar-track">
        <div class="bar-fill" style="left:0;width:${fmtPct(value)};background:${risk ? "var(--red)" : "var(--green)"}"></div>
      </div>
      <span class="trait-value">${fmtPct(value)}</span>
    `;
    wellEls.bars.appendChild(row);
  });
}

function renderScenario(profile) {
  const model = scenarioCopy[wellEls.scenario.value];
  wellEls.scenarioTag.textContent = model.tag;
  const rows = model.drivers.map((key) => {
    const value = profile.metrics[key];
    const label = indicatorLabel(key);
    return `<div class="reason-row"><b>${label}</b><p>${fmtPct(value)} of this group selected this response.</p></div>`;
  });

  let interpretation = "A useful intervention would start with the highest strain indicator and the strongest existing support.";
  if (model.tag === "purpose") interpretation = `The strongest purpose cue is ${topPurpose(profile.metrics)}, so student researchers can ask how purpose relates to peace, balance, or thriving.`;
  if (model.tag === "work") interpretation = "This scenario is best for comparing employment groups, income groups, or age groups around work meaning and perceived choices.";
  if (model.tag === "support") interpretation = "This scenario is best for asking whether social support buffers strain or health problems.";
  if (model.tag === "stress") interpretation = "This scenario is best for comparing strain against calmness, support, and peace.";

  wellEls.scenarioText.innerHTML = `
    <div class="reason-row"><b>Setup</b><p>${model.prompt}</p></div>
    ${rows.join("")}
    <div class="reason-row"><b>Research angle</b><p>${interpretation}</p></div>
  `;
}

function renderComparison(profile) {
  const rows = profilesFor(profile.country, profile.dimension).slice().sort((a, b) => (b.scores.wellbeing ?? 0) - (a.scores.wellbeing ?? 0));
  const high = rows.slice(0, 5);
  const strain = rows.slice().sort((a, b) => (b.scores.strain ?? 0) - (a.scores.strain ?? 0)).slice(0, 5);
  wellEls.comparison.innerHTML = [
    ["Highest wellbeing", high, "wellbeing"],
    ["Highest strain", strain, "strain"],
  ]
    .map(
      ([title, items, score]) => `
        <div class="comparison-group">
          <h4>${title}</h4>
          ${items.map((item) => `<div class="comparison-row"><span>${item.group}</span><span>${fmtScore(item.scores[score])}</span></div>`).join("")}
        </div>
      `,
    )
    .join("");
}

function renderResearchPrompts() {
  const prompts = [
    "How does thriving differ by age, gender, income, employment, or urban/rural group?",
    "Which groups show high support but also high strain?",
    "Is calmness more closely aligned with peace, balance, or social support?",
    "How do work meaning and work choices vary across employment groups?",
    "What ethical limits apply when interpreting country-level wellbeing patterns?",
  ];
  wellEls.researchPrompts.innerHTML = prompts.map((prompt) => `<div class="prompt-chip">${prompt}</div>`).join("");
}

function renderProfile() {
  const profile = wellState.profile;
  wellEls.title.textContent = `${profile.country} wellbeing profile`;
  wellEls.personaName.textContent = `${profile.group}`;
  wellEls.personaSub.textContent = `${profile.dimension} in ${profile.country}`;
  wellEls.avatar.innerHTML = `<img alt="" src="${avatarSvg(profile)}">`;
  wellEls.narrative.textContent = renderNarrative(profile);
  wellEls.wellScore.textContent = fmtScore(profile.scores.wellbeing);
  wellEls.strainScore.textContent = fmtScore(profile.scores.strain);
  wellEls.purposeScore.textContent = fmtScore(profile.scores.purpose);
  renderBars(profile);
  renderScenario(profile);
  renderComparison(profile);
  renderResearchPrompts();
  resetScene();
}

function resetScene() {
  const profile = wellState.profile;
  const count = 10;
  wellState.people = Array.from({ length: count }, (_, index) => ({
    x: 90 + index * 70 + Math.random() * 30,
    y: 260 + (index % 3) * 46,
    tx: 100 + Math.random() * 660,
    ty: 245 + Math.random() * 125,
    speed: 0.45 + Math.random() * 0.55,
    mood: index % 3 === 0 ? "support" : index % 3 === 1 ? "work" : "calm",
    profile,
  }));
}

function drawBackdrop(ctx, canvas) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f4faf7");
  gradient.addColorStop(1, "#e7eef8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#dbe9e2";
  ctx.fillRect(0, 320, canvas.width, 120);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(60, 95, 230, 135);
  ctx.fillRect(590, 110, 210, 120);
  ctx.fillStyle = "#315f9d";
  ctx.fillRect(60, 82, 230, 20);
  ctx.fillStyle = "#14785d";
  ctx.fillRect(590, 98, 210, 18);
  ctx.fillStyle = "#f3d39b";
  ctx.fillRect(360, 210, 145, 42);
  ctx.fillRect(380, 252, 12, 58);
  ctx.fillRect(472, 252, 12, 58);

  ctx.fillStyle = "rgba(20, 120, 93, 0.14)";
  [110, 735].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 285, 44, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPerson(ctx, person, idx) {
  const profile = person.profile;
  const [accent, skin, hair] = profile.scores.strain > 0.3 ? ["#ba4a42", "#d9a477", "#38251d"] : ["#14785d", "#e0ad82", "#2f241d"];
  const bob = Math.sin(wellState.sceneTick / 12 + idx) * 2;
  const x = person.x;
  const y = person.y + bob;
  ctx.fillStyle = "rgba(23, 33, 29, 0.14)";
  ctx.beginPath();
  ctx.ellipse(x, y + 45, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#26342f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 32);
  ctx.lineTo(x - 15, y + 54);
  ctx.moveTo(x + 8, y + 32);
  ctx.lineTo(x + 15, y + 54);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(x - 16, y + 4, 32, 35);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 13, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(x, y - 27, 20, 12, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.beginPath();
  ctx.arc(x - 6, y - 13, 2, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 13, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene() {
  const canvas = wellEls.canvas;
  const ctx = canvas.getContext("2d");
  wellState.sceneTick += 1;
  drawBackdrop(ctx, canvas);
  wellState.people.forEach((person) => {
    const dx = person.tx - person.x;
    const dy = person.ty - person.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      person.tx = 80 + Math.random() * 700;
      person.ty = 235 + Math.random() * 130;
    } else {
      person.x += (dx / dist) * person.speed;
      person.y += (dy / dist) * person.speed;
    }
  });
  wellState.people.slice().sort((a, b) => a.y - b.y).forEach((person, idx) => drawPerson(ctx, person, idx));

  const m = wellState.profile.metrics;
  const bubble = (m.support ?? 0) > 0.75 ? "I have someone to count on." : "Support may be harder to find.";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "#14785d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(24, 22, 310, 46, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.fillText(bubble, 42, 51);
  wellState.sceneFrame = requestAnimationFrame(drawScene);
}

async function init() {
  const response = await fetch(WELLBEING_DATA_URL);
  wellState.data = await response.json();
  populateSelect(wellEls.country, wellState.data.countries, "United States");
  populateSelect(wellEls.dimension, wellState.data.dimensions, "Age");
  updateGroups(false);
  wellEls.countryCount.textContent = wellState.data.source.countries.toLocaleString();
  wellEls.profileCount.textContent = wellState.data.source.countryProfiles.toLocaleString();
  wellEls.globalCount.textContent = wellState.data.source.globalProfiles.toLocaleString();
  chooseProfile();
  renderProfile();
  if (wellState.sceneFrame) cancelAnimationFrame(wellState.sceneFrame);
  wellState.sceneFrame = requestAnimationFrame(drawScene);

  wellEls.country.addEventListener("change", () => {
    updateGroups(false);
    chooseProfile();
    renderProfile();
  });
  wellEls.dimension.addEventListener("change", () => {
    updateGroups(false);
    chooseProfile();
    renderProfile();
  });
  wellEls.group.addEventListener("change", () => {
    chooseProfile();
    renderProfile();
  });
  wellEls.scenario.addEventListener("change", () => renderProfile());
  wellEls.refresh.addEventListener("click", () => renderProfile());
}

init().catch((error) => {
  console.error(error);
  wellEls.title.textContent = "Could not load wellbeing data";
});
