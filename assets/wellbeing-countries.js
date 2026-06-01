const DATA_URL = "public/wellbeing_data.json";

const state = {
  data: null,
  profileA: null,
  profileB: null,
};

const els = {
  countryA: document.querySelector("#countryA"),
  countryB: document.querySelector("#countryB"),
  dimension: document.querySelector("#countryDimension"),
  group: document.querySelector("#countryGroup"),
  focus: document.querySelector("#countryFocus"),
  swap: document.querySelector("#swapCountries"),
  title: document.querySelector("#countryLabTitle"),
  countryCount: document.querySelector("#countryCount"),
  profileCount: document.querySelector("#profileCount"),
  sharedGroupLabel: document.querySelector("#sharedGroupLabel"),
  cardA: document.querySelector("#countryCardA"),
  cardB: document.querySelector("#countryCardB"),
  finding: document.querySelector("#countryFinding"),
  narrative: document.querySelector("#countryNarrative"),
  badges: document.querySelector("#countryGapBadges"),
  legend: document.querySelector("#countryLegend"),
  chart: document.querySelector("#countryChart"),
  questionTag: document.querySelector("#countryQuestionTag"),
  research: document.querySelector("#countryResearchBuilder"),
  context: document.querySelector("#countryContextQuestions"),
  report: document.querySelector("#countryReportText"),
  copy: document.querySelector("#copyCountryReport"),
};

const indicators = [
  { key: "thriving", label: "Thriving", polarity: "positive" },
  { key: "struggling", label: "Struggling", polarity: "risk" },
  { key: "suffering", label: "Suffering", polarity: "risk" },
  { key: "health_problems", label: "Health problems", polarity: "risk" },
  { key: "support", label: "Can count on help", polarity: "positive" },
  { key: "calm", label: "Calm yesterday", polarity: "positive" },
  { key: "peace", label: "At peace with life", polarity: "positive" },
  { key: "balance", label: "Life in balance", polarity: "positive" },
  { key: "purpose_skill", label: "Purpose: daily skill", polarity: "purpose" },
  { key: "purpose_family", label: "Purpose: family/friends", polarity: "purpose" },
  { key: "purpose_helping", label: "Purpose: helping others", polarity: "purpose" },
  { key: "enjoy_work", label: "Enjoys daily work", polarity: "work" },
  { key: "work_improves_lives", label: "Work improves others' lives", polarity: "work" },
  { key: "work_choices", label: "Many work choices", polarity: "work" },
];

const focusMap = {
  strain: ["struggling", "suffering", "health_problems", "calm", "peace", "support"],
  support: ["support", "thriving", "struggling", "peace", "balance"],
  purpose: ["purpose_skill", "purpose_family", "purpose_helping", "peace", "thriving"],
  work: ["enjoy_work", "work_improves_lives", "work_choices", "balance", "thriving"],
  balance: ["balance", "peace", "calm", "thriving", "struggling"],
};

const names = ["Amina", "Jonah", "Maya", "Theo", "Leila", "Mateo", "Nora", "Samir", "Elena", "Kai", "Priya", "Owen"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function score(value) {
  return Number.isFinite(value) ? Math.round(value * 100) : "--";
}

function hashCode(text) {
  return [...String(text)].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function populate(select, values, selected) {
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  if (selected && values.includes(selected)) select.value = selected;
}

function groupsForDimension(dimension) {
  const aGroups = state.data.countryProfiles
    .filter((p) => p.country === els.countryA.value && p.dimension === dimension)
    .map((p) => p.group);
  const bGroups = state.data.countryProfiles
    .filter((p) => p.country === els.countryB.value && p.dimension === dimension)
    .map((p) => p.group);
  return aGroups.filter((group) => bGroups.includes(group));
}

function findProfile(country) {
  return state.data.countryProfiles.find(
    (p) => p.country === country && p.dimension === els.dimension.value && p.group === els.group.value,
  );
}

function updateGroups() {
  const groups = groupsForDimension(els.dimension.value);
  populate(els.group, groups, els.group.value || groups[0]);
}

function chooseProfiles() {
  state.profileA = findProfile(els.countryA.value);
  state.profileB = findProfile(els.countryB.value);
}

function personaFor(profile, side) {
  const seed = hashCode(`${profile.country}-${profile.dimension}-${profile.group}-${side}`);
  return {
    name: names[seed % names.length],
    initials: names[seed % names.length].slice(0, 2).toUpperCase(),
  };
}

function wellbeingAdvantage(profile) {
  return (profile.scores.wellbeing ?? 0) - (profile.scores.strain ?? 0);
}

function topPurpose(profile) {
  return [
    ["purpose_skill", "daily skill"],
    ["purpose_family", "family and close friends"],
    ["purpose_helping", "helping others"],
  ].sort((a, b) => (profile.metrics[b[0]] ?? 0) - (profile.metrics[a[0]] ?? 0))[0][1];
}

function gapRows(keys = indicators.map((i) => i.key)) {
  return keys
    .map((key) => {
      const meta = indicators.find((item) => item.key === key);
      const a = state.profileA.metrics[key];
      const b = state.profileB.metrics[key];
      return { key, label: meta.label, polarity: meta.polarity, a, b, diff: (a ?? 0) - (b ?? 0) };
    })
    .filter((row) => Number.isFinite(row.a) && Number.isFinite(row.b))
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
}

function renderCountryCard(target, profile, label) {
  const isA = label === "Country A";
  const persona = personaFor(profile, isA ? "A" : "B");
  target.classList.toggle("group-a-shell", isA);
  target.classList.toggle("group-b-shell", !isA);
  target.innerHTML = `
    <span class="card-label ${isA ? "group-a-card" : "group-b-card"}">${label}</span>
    <div class="group-card-top">
      <div class="well-mini-avatar ${isA ? "group-a-card" : "group-b-card"}">${persona.initials}</div>
      <div>
        <h3>${persona.name}</h3>
        <p>Representative of ${profile.group} in ${profile.country}</p>
      </div>
    </div>
    <div class="score-grid">
      <div><span>Wellbeing</span><b>${score(profile.scores.wellbeing)}</b></div>
      <div><span>Strain</span><b>${score(profile.scores.strain)}</b></div>
      <div><span>Purpose</span><b>${score(profile.scores.purpose)}</b></div>
    </div>
    <p class="group-summary">${pct(profile.metrics.thriving)} thriving, ${pct(profile.metrics.support)} can count on help, and ${pct(profile.metrics.calm)} felt calm yesterday. Dominant purpose cue: ${topPurpose(profile)}.</p>
  `;
}

function renderFinding() {
  const better = wellbeingAdvantage(state.profileA) >= wellbeingAdvantage(state.profileB) ? state.profileA : state.profileB;
  const moreStrain = (state.profileA.scores.strain ?? 0) >= (state.profileB.scores.strain ?? 0) ? state.profileA : state.profileB;
  const gaps = gapRows(focusMap[els.focus.value]);
  const top = gaps[0];
  els.finding.textContent = `${better.country} shows the stronger wellbeing advantage`;
  els.narrative.textContent = `For ${els.group.value}, ${better.country} has the stronger wellbeing-minus-strain profile, while ${moreStrain.country} shows more strain. The largest focused gap is ${top.label}: ${pct(top.a)} in ${state.profileA.country} vs ${pct(top.b)} in ${state.profileB.country}.`;
  els.badges.innerHTML = gaps
    .slice(0, 4)
    .map((gap) => {
      const leader = gap.diff >= 0 ? state.profileA.country : state.profileB.country;
      const leaderClass = gap.diff >= 0 ? "group-a-gap" : "group-b-gap";
      const letter = gap.diff >= 0 ? "A" : "B";
      return `<span class="gap-badge ${leaderClass}">${gap.label}: Country ${letter} (${leader}) +${Math.abs(Math.round(gap.diff * 100))} pts</span>`;
    })
    .join("");
}

function renderChart() {
  const aPersona = personaFor(state.profileA, "A");
  const bPersona = personaFor(state.profileB, "B");
  els.legend.innerHTML = `
    <div class="legend-item"><span class="legend-swatch group-a"></span><b>Country A:</b> ${aPersona.name}, ${state.profileA.country}</div>
    <div class="legend-item"><span class="legend-swatch group-b"></span><b>Country B:</b> ${bPersona.name}, ${state.profileB.country}</div>
    <div class="legend-note">Color key: Country A is always blue and appears on the top bar. Country B is always green and appears on the bottom bar.</div>
  `;
  els.chart.innerHTML = gapRows(focusMap[els.focus.value])
    .map((row) => {
      const aWidth = clamp((row.a ?? 0) * 100, 1, 100);
      const bWidth = clamp((row.b ?? 0) * 100, 1, 100);
      return `
        <div class="compare-row">
          <div class="compare-label"><b>${row.label}</b><span>${Math.abs(Math.round(row.diff * 100))} pt gap</span></div>
          <div class="compare-bars">
            <div class="compare-bar a"><span style="width:${aWidth}%;background:var(--blue)"></span><b>A: ${pct(row.a)}</b></div>
            <div class="compare-bar b"><span style="width:${bWidth}%;background:var(--green)"></span><b>B: ${pct(row.b)}</b></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderResearch() {
  const top = gapRows(focusMap[els.focus.value])[0];
  els.questionTag.textContent = els.focus.value;
  els.research.innerHTML = `
    <div class="reason-row"><b>Question</b><p>How does ${els.group.value} wellbeing differ between ${state.profileA.country} and ${state.profileB.country}?</p></div>
    <div class="reason-row"><b>Hypothesis</b><p>${top.diff >= 0 ? state.profileA.country : state.profileB.country} will show higher ${top.label.toLowerCase()}, based on the observed ${Math.abs(Math.round(top.diff * 100))}-point gap.</p></div>
    <div class="reason-row"><b>Variables</b><p>Independent variable: country. Dependent variable: ${top.label.toLowerCase()} response rate for ${els.group.value}.</p></div>
    <div class="reason-row"><b>Limit</b><p>This is a descriptive group comparison. It does not explain why countries differ or prove causality.</p></div>
  `;
}

function renderContextQuestions() {
  const prompts = [
    "What cultural, economic, or policy context might help explain this difference?",
    "Which indicator should not be interpreted without more background information?",
    "Would the pattern remain if you changed age, income, or employment group?",
    "What additional variable would help test a stronger hypothesis?",
    "How can we discuss country differences without ranking cultures?",
  ];
  els.context.innerHTML = prompts.map((prompt) => `<div class="prompt-chip">${prompt}</div>`).join("");
}

function renderReport() {
  const aPersona = personaFor(state.profileA, "A");
  const bPersona = personaFor(state.profileB, "B");
  const top = gapRows(focusMap[els.focus.value])[0];
  els.report.value = `Research question: How does ${els.group.value} wellbeing differ between ${state.profileA.country} and ${state.profileB.country}?

Comparison: ${aPersona.name} represents ${els.group.value} in ${state.profileA.country}; ${bPersona.name} represents ${els.group.value} in ${state.profileB.country}.

Key finding: The largest focused gap is ${top.label}, with ${pct(top.a)} in ${state.profileA.country} and ${pct(top.b)} in ${state.profileB.country}.

Interpretation: The same demographic group shows different wellbeing patterns across countries. This may suggest context differences worth investigating, but it should not be treated as a causal explanation.

Limitation: The dataset reports group-level response rates. More context is needed before explaining why the countries differ.

Ethical note: Avoid ranking countries or cultures. Use the comparison to generate careful research questions.`;
}

function renderAll() {
  chooseProfiles();
  if (!state.profileA || !state.profileB) return;
  els.title.textContent = `${els.group.value}: ${state.profileA.country} vs ${state.profileB.country}`;
  els.sharedGroupLabel.textContent = els.group.value;
  renderCountryCard(els.cardA, state.profileA, "Country A");
  renderCountryCard(els.cardB, state.profileB, "Country B");
  renderFinding();
  renderChart();
  renderResearch();
  renderContextQuestions();
  renderReport();
}

async function init() {
  const response = await fetch(DATA_URL);
  state.data = await response.json();
  populate(els.countryA, state.data.countries, "United States");
  populate(els.countryB, state.data.countries, "Germany");
  populate(els.dimension, state.data.dimensions, "Age");
  updateGroups();
  els.countryCount.textContent = state.data.source.countries.toLocaleString();
  els.profileCount.textContent = state.data.source.countryProfiles.toLocaleString();
  renderAll();

  els.countryA.addEventListener("change", () => {
    updateGroups();
    renderAll();
  });
  els.countryB.addEventListener("change", () => {
    updateGroups();
    renderAll();
  });
  els.dimension.addEventListener("change", () => {
    updateGroups();
    renderAll();
  });
  els.group.addEventListener("change", renderAll);
  els.focus.addEventListener("change", renderAll);
  els.swap.addEventListener("click", () => {
    const current = els.countryA.value;
    els.countryA.value = els.countryB.value;
    els.countryB.value = current;
    updateGroups();
    renderAll();
  });
  els.copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.report.value);
    els.copy.textContent = "Copied";
    setTimeout(() => (els.copy.textContent = "Copy Text"), 1000);
  });
}

init().catch((error) => {
  console.error(error);
  els.title.textContent = "Could not load wellbeing data";
});
