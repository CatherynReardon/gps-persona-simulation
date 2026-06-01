const DATA_URL = "public/wellbeing_data.json";

const state = {
  data: null,
  profileA: null,
  profileB: null,
  tick: 0,
  frame: null,
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
  dialogue: document.querySelector("#countryDialogue"),
  questionTag: document.querySelector("#countryQuestionTag"),
  research: document.querySelector("#countryResearchBuilder"),
  context: document.querySelector("#countryContextQuestions"),
  report: document.querySelector("#countryReportText"),
  copy: document.querySelector("#copyCountryReport"),
  canvas: document.querySelector("#countryCanvas"),
  visualKey: document.querySelector("#countryVisualKey"),
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

const avatarPalette = [
  { skin: "#b7794b", hair: "#1e1715", shirt: "#2f5f9d" },
  { skin: "#8f5f3f", hair: "#2c201a", shirt: "#3f7b65" },
  { skin: "#d7a06f", hair: "#3a2418", shirt: "#6a5aa8" },
  { skin: "#c8875e", hair: "#151515", shirt: "#bf6b45" },
  { skin: "#e0b184", hair: "#5b321f", shirt: "#457b9d" },
  { skin: "#9f6d4f", hair: "#211916", shirt: "#2a9d8f" },
];

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
    seed,
  };
}

function avatarFor(persona, isA) {
  const colors = avatarPalette[persona.seed % avatarPalette.length];
  const hairShape = persona.seed % 2 === 0
    ? '<path d="M48 34c8-13 31-15 44-3 7 6 9 16 7 26-8-8-18-12-31-12-11 0-20 3-29 10-2-7 0-15 9-21Z" fill="' + colors.hair + '"/>'
    : '<path d="M43 49c1-19 14-31 33-31s33 13 35 32c-10-6-21-9-34-9-14 0-25 3-34 8Z" fill="' + colors.hair + '"/>';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" role="img" aria-label="${persona.name} representative persona portrait">
      <rect width="150" height="150" rx="30" fill="${isA ? "#e9f0fb" : "#e5f2ec"}"/>
      <circle cx="75" cy="78" r="54" fill="${isA ? "#d8e5f7" : "#d6e9df"}"/>
      <path d="M31 139c6-27 23-42 44-42s38 15 44 42H31Z" fill="${colors.shirt}"/>
      <circle cx="75" cy="68" r="31" fill="${colors.skin}"/>
      ${hairShape}
      <circle cx="63" cy="70" r="3.3" fill="#231f20"/>
      <circle cx="87" cy="70" r="3.3" fill="#231f20"/>
      <path d="M64 86c7 6 16 6 23 0" fill="none" stroke="#5a3328" stroke-width="4" stroke-linecap="round"/>
      <circle cx="51" cy="78" r="7" fill="${colors.skin}"/>
      <circle cx="99" cy="78" r="7" fill="${colors.skin}"/>
      <rect x="52" y="112" width="46" height="12" rx="6" fill="#ffffff" opacity=".8"/>
      <text x="75" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="${isA ? "#2f5f9d" : "#3f7b65"}">${persona.initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
      <img class="persona-portrait ${isA ? "group-a-card" : "group-b-card"}" src="${avatarFor(persona, isA)}" alt="${persona.name}, representative persona for ${profile.group} in ${profile.country}" />
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

function focusPrompt() {
  return {
    strain: "stress, health, and coping",
    support: "support networks and social resources",
    purpose: "purpose and meaning",
    work: "work meaning and choices",
    balance: "calm, peace, and life balance",
  }[els.focus.value];
}

function renderDialogue() {
  const aPersona = personaFor(state.profileA, "A");
  const bPersona = personaFor(state.profileB, "B");
  const top = gapRows(focusMap[els.focus.value])[0];
  const leader = top.diff >= 0 ? aPersona.name : bPersona.name;
  const leaderCountry = top.diff >= 0 ? state.profileA.country : state.profileB.country;
  const aValue = pct(top.a);
  const bValue = pct(top.b);
  els.dialogue.innerHTML = `
    <div class="dialogue-stage" aria-label="Role play exchange between representative personas">
      <div class="dialogue-person group-a-dialogue">
        <img src="${avatarFor(aPersona, true)}" alt="${aPersona.name}, Country A representative" />
        <div>
          <b>${aPersona.name}</b>
          <span>${state.profileA.country}</span>
        </div>
      </div>
      <div class="dialogue-exchange">
        <div class="speech-bubble speech-a"><b>${aPersona.name}</b><p>In ${state.profileA.country}, my ${state.profileA.group} group reports ${aValue} for ${top.label.toLowerCase()}. I notice the chart compares my group with the same group in ${state.profileB.country}.</p></div>
        <div class="speech-bubble speech-b"><b>${bPersona.name}</b><p>In ${state.profileB.country}, my group reports ${bValue}. That creates a ${Math.abs(Math.round(top.diff * 100))}-point gap, so I would ask what social, economic, or cultural context might shape this pattern.</p></div>
        <div class="speech-bubble speech-a"><b>${aPersona.name}</b><p>I also want to compare strengths: ${pct(state.profileA.metrics.support)} in my country say they can count on help, and ${pct(state.profileA.metrics.calm)} felt calm yesterday.</p></div>
        <div class="speech-bubble speech-b"><b>${bPersona.name}</b><p>For my country, those values are ${pct(state.profileB.metrics.support)} for support and ${pct(state.profileB.metrics.calm)} for calm. We should use these numbers to form questions, not to rank countries.</p></div>
        <div class="speech-bubble teacher-note"><b>Student researcher prompt</b><p>${leader} in ${leaderCountry} has the higher value for ${top.label.toLowerCase()}. Role play a follow-up interview about ${focusPrompt()}, then write one hypothesis, one alternative explanation, and one limitation.</p></div>
      </div>
      <div class="dialogue-person group-b-dialogue">
        <img src="${avatarFor(bPersona, false)}" alt="${bPersona.name}, Country B representative" />
        <div>
          <b>${bPersona.name}</b>
          <span>${state.profileB.country}</span>
        </div>
      </div>
    </div>
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

function renderVisualKey() {
  els.visualKey.innerHTML = `
    <h4>How to Read the Persona Scene</h4>
    <table>
      <thead><tr><th>Visual cue</th><th>What it means</th><th>Data source</th></tr></thead>
      <tbody>
        <tr><td>Blue / green body</td><td>Blue is Country A; green is Country B.</td><td>Selected countries</td></tr>
        <tr><td>Red speech-bubble outline</td><td>This marks the persona whose country profile has higher estimated strain in the current comparison.</td><td>Composite strain score</td></tr>
        <tr><td>Conversation text</td><td>The dialogue rotates through the selected data, including the current gap, support, calm, and strain.</td><td>Selected research focus and profile indicators</td></tr>
      </tbody>
    </table>
  `;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = `${line} ${word}`.trim();
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawScenePersona(ctx, profile, persona, x, y, isA) {
  const color = isA ? "#315f9d" : "#14785d";
  const accent = isA ? "#e9f0fb" : "#e5f2ec";
  const strain = profile.scores.strain ?? 0.2;
  ctx.fillStyle = "rgba(23,33,29,0.14)";
  ctx.beginPath();
  ctx.ellipse(x, y + 68, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x - 25, y + 8, 50, 58, 10);
  ctx.fill();
  ctx.fillStyle = persona.seed % 3 === 0 ? "#c9855c" : persona.seed % 3 === 1 ? "#e0ad82" : "#a76f4d";
  ctx.beginPath();
  ctx.arc(x, y - 22, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = persona.seed % 2 === 0 ? "#2e211b" : "#151515";
  ctx.beginPath();
  ctx.ellipse(x, y - 43, 29, 16, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.beginPath();
  ctx.arc(x - 8, y - 22, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 22, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5a3328";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 11, 8, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText(persona.initials, x, y + 46);
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.fillText(persona.name, x, y + 86);
  ctx.fillStyle = accent;
  roundRect(ctx, x - 72, y + 92, 144, 34, 10);
  ctx.fill();
  ctx.fillStyle = "#263832";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText(profile.country, x, y + 106);
  ctx.font = "10px Inter, sans-serif";
  ctx.fillText(profile.group, x, y + 120);
}

function drawSpeechBubble(ctx, text, x, y, width, borderColor, highStrain = false) {
  ctx.font = "bold 11px Inter, sans-serif";
  const lines = wrapCanvasText(ctx, text, width - 24).slice(0, 4);
  const height = 22 + lines.length * 14;
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.strokeStyle = highStrain ? "#ba4a42" : borderColor;
  ctx.lineWidth = highStrain ? 4 : 2;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, index) => {
    ctx.fillText(line, x + width / 2, y + 16 + index * 14);
  });
}

function renderCountryScene() {
  if (!els.canvas) return;
  state.tick += 1;
  const ctx = els.canvas.getContext("2d");
  const canvas = els.canvas;
  const aPersona = personaFor(state.profileA, "A");
  const bPersona = personaFor(state.profileB, "B");
  const top = gapRows(focusMap[els.focus.value])[0];
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#f7fbf9");
  grad.addColorStop(1, "#e8eef8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9e8e1";
  ctx.fillRect(0, 248, canvas.width, 122);
  ctx.fillStyle = "rgba(49,95,157,0.12)";
  ctx.fillRect(50, 82, 220, 126);
  ctx.fillStyle = "rgba(20,120,93,0.12)";
  ctx.fillRect(490, 82, 220, 126);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, 18, 18, 286, 74, 10);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.textAlign = "left";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.fillText("Scene key", 34, 39);
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("One representative persona per country", 34, 58);
  ctx.fillText("Red comment outline = higher strain", 34, 76);
  ctx.textAlign = "center";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.fillStyle = "#17211d";
  ctx.fillText(`Country A: ${state.profileA.country}`, 160, 112);
  ctx.fillText(`Country B: ${state.profileB.country}`, 600, 112);
  const aHighStrain = (state.profileA.scores.strain ?? 0) > (state.profileB.scores.strain ?? 0);
  const bHighStrain = (state.profileB.scores.strain ?? 0) > (state.profileA.scores.strain ?? 0);
  const turn = Math.floor(state.tick / 150) % 3;
  const aLines = [
    `${aPersona.name}: My country reports ${pct(top.a)} for ${top.label.toLowerCase()}.`,
    `${aPersona.name}: Support is ${pct(state.profileA.metrics.support)} and calm is ${pct(state.profileA.metrics.calm)}.`,
    aHighStrain
      ? `${aPersona.name}: My profile shows more strain, so I need context.`
      : `${aPersona.name}: My profile shows less strain, so what helps here?`,
  ];
  const bLines = [
    `${bPersona.name}: Mine is ${pct(top.b)}. What explains the gap?`,
    `${bPersona.name}: Support is ${pct(state.profileB.metrics.support)} and calm is ${pct(state.profileB.metrics.calm)}.`,
    bHighStrain
      ? `${bPersona.name}: My profile shows more strain, so I need context.`
      : `${bPersona.name}: My profile shows less strain, so what helps here?`,
  ];
  drawSpeechBubble(
    ctx,
    aLines[turn],
    44,
    120,
    214,
    "#315f9d",
    aHighStrain,
  );
  drawSpeechBubble(
    ctx,
    bLines[turn],
    502,
    120,
    214,
    "#14785d",
    bHighStrain,
  );
  drawScenePersona(ctx, state.profileA, aPersona, 190, 236, true);
  drawScenePersona(ctx, state.profileB, bPersona, 570, 236, false);
  state.frame = requestAnimationFrame(renderCountryScene);
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
  renderDialogue();
  renderResearch();
  renderContextQuestions();
  renderReport();
  if (state.frame) cancelAnimationFrame(state.frame);
  renderCountryScene();
  renderVisualKey();
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
