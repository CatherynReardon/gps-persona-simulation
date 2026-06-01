const WELLBEING_DATA_URL = "public/wellbeing_data.json";

const state = {
  data: null,
  profileA: null,
  profileB: null,
  tick: 0,
  people: [],
  frame: null,
};

const els = {
  country: document.querySelector("#wellCountry"),
  dimension: document.querySelector("#wellDimension"),
  groupA: document.querySelector("#wellGroupA"),
  groupB: document.querySelector("#wellGroupB"),
  question: document.querySelector("#wellQuestion"),
  swap: document.querySelector("#swapGroups"),
  title: document.querySelector("#labTitle"),
  countryCount: document.querySelector("#wellCountryCount"),
  profileCount: document.querySelector("#wellProfileCount"),
  globalCount: document.querySelector("#wellGlobalCount"),
  groupCardA: document.querySelector("#groupCardA"),
  groupCardB: document.querySelector("#groupCardB"),
  coreFinding: document.querySelector("#coreFinding"),
  findingNarrative: document.querySelector("#findingNarrative"),
  gapBadges: document.querySelector("#gapBadges"),
  legend: document.querySelector("#comparisonLegend"),
  chart: document.querySelector("#comparisonChart"),
  dialogue: document.querySelector("#wellDialogue"),
  questionTag: document.querySelector("#questionTag"),
  researchBuilder: document.querySelector("#researchBuilder"),
  interventionIdeas: document.querySelector("#interventionIdeas"),
  miniReport: document.querySelector("#miniReportText"),
  copyReport: document.querySelector("#copyReport"),
  canvas: document.querySelector("#wellCanvas"),
  visualKey: document.querySelector("#wellVisualKey"),
};

const indicatorGroups = [
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

const personaNames = [
  "Amina",
  "Jonah",
  "Maya",
  "Theo",
  "Leila",
  "Mateo",
  "Nora",
  "Samir",
  "Elena",
  "Kai",
  "Priya",
  "Owen",
  "Zara",
  "Leo",
  "Mina",
  "Dante",
];

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
  return state.data.countryProfiles.filter((profile) => profile.country === country && profile.dimension === dimension);
}

function updateGroupOptions() {
  const rows = profilesFor(els.country.value, els.dimension.value);
  const groups = rows.map((row) => row.group);
  populateSelect(els.groupA, groups, els.groupA.value || groups[0]);
  populateSelect(els.groupB, groups, els.groupB.value || groups[1] || groups[0]);
  if (els.groupA.value === els.groupB.value && groups.length > 1) els.groupB.value = groups[1];
}

function chooseProfiles() {
  const rows = profilesFor(els.country.value, els.dimension.value);
  state.profileA = rows.find((row) => row.group === els.groupA.value) ?? rows[0];
  state.profileB = rows.find((row) => row.group === els.groupB.value) ?? rows[1] ?? rows[0];
}

function gapRows(keys = indicatorGroups.map((item) => item.key)) {
  return keys
    .map((key) => {
      const meta = indicatorGroups.find((item) => item.key === key);
      const a = state.profileA.metrics[key];
      const b = state.profileB.metrics[key];
      return { key, label: meta.label, polarity: meta.polarity, a, b, diff: (a ?? 0) - (b ?? 0) };
    })
    .filter((row) => Number.isFinite(row.a) && Number.isFinite(row.b))
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
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

function personaFor(profile, side) {
  const seed = hashCode(`${profile.country}-${profile.dimension}-${profile.group}-${side}`);
  const name = personaNames[seed % personaNames.length];
  const ageMatch = profile.dimension === "Age" ? profile.group.match(/\d+/) : null;
  const age = ageMatch ? Number(ageMatch[0]) + 3 : 34 + (seed % 24);
  const roleMap = {
    Age: `${profile.group} respondent`,
    Gender: `${profile.group.toLowerCase()} respondent`,
    "Employment Status": profile.group.toLowerCase(),
    "Per Capita Income Quintiles": `${profile.group.toLowerCase()} income group`,
    "Feelings About Household Income": profile.group.toLowerCase(),
    "Urban/Rural": profile.group.toLowerCase(),
  };
  const role = roleMap[profile.dimension] ?? profile.group;
  const need =
    (profile.scores.strain ?? 0) > 0.3
      ? "could use more support and stability"
      : "has useful wellbeing strengths to build from";
  const strength =
    (profile.metrics.support ?? 0) > 0.75
      ? "social support"
      : (profile.metrics.calm ?? 0) > 0.7
        ? "calm"
        : (profile.metrics.enjoy_work ?? 0) > 0.75
          ? "work meaning"
          : "purpose";
  return {
    name,
    age,
    role,
    need,
    strength,
    initials: name.slice(0, 2).toUpperCase(),
    seed,
  };
}

function avatarFor(persona, isA) {
  const colors = avatarPalette[persona.seed % avatarPalette.length];
  const hairShape =
    persona.seed % 2 === 0
      ? `<path d="M48 34c8-13 31-15 44-3 7 6 9 16 7 26-8-8-18-12-31-12-11 0-20 3-29 10-2-7 0-15 9-21Z" fill="${colors.hair}"/>`
      : `<path d="M43 49c1-19 14-31 33-31s33 13 35 32c-10-6-21-9-34-9-14 0-25 3-34 8Z" fill="${colors.hair}"/>`;
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

function renderGroupCard(target, profile, label) {
  const groupClass = label === "Group A" ? "group-a-card" : "group-b-card";
  const side = label === "Group A" ? "A" : "B";
  const isA = side === "A";
  const persona = personaFor(profile, side);
  target.classList.toggle("group-a-shell", label === "Group A");
  target.classList.toggle("group-b-shell", label === "Group B");
  target.innerHTML = `
    <span class="card-label ${groupClass}">${label}</span>
    <div class="group-card-top">
      <img class="persona-portrait ${groupClass}" src="${avatarFor(persona, isA)}" alt="${persona.name}, representative persona for ${profile.group} in ${profile.country}" />
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
    <p class="group-summary">${persona.name} is a ${persona.age}-year-old ${persona.role}. This persona represents group-level patterns: ${pct(profile.metrics.thriving)} thriving, ${pct(profile.metrics.support)} can count on help, and ${pct(profile.metrics.calm)} felt calm yesterday. Likely strength: ${persona.strength}; research need: ${persona.need}.</p>
  `;
}

function renderFinding() {
  const a = state.profileA;
  const b = state.profileB;
  const focus = els.question.value;
  const gaps = gapRows(focusMap[focus]);
  const top = gaps[0];
  const better = wellbeingAdvantage(a) >= wellbeingAdvantage(b) ? a : b;
  const moreStrain = (a.scores.strain ?? 0) >= (b.scores.strain ?? 0) ? a : b;

  els.coreFinding.textContent = `${better.group} shows the stronger wellbeing advantage`;
  els.findingNarrative.textContent = `${better.group} has a higher combined wellbeing-minus-strain score, while ${moreStrain.group} shows more estimated strain. The largest focused gap is ${top.label}: ${pct(top.a)} for ${a.group} vs ${pct(top.b)} for ${b.group}.`;
  els.gapBadges.innerHTML = gaps
    .slice(0, 4)
    .map((gap) => {
      const leader = gap.diff >= 0 ? a.group : b.group;
      const leaderClass = gap.diff >= 0 ? "group-a-gap" : "group-b-gap";
      const leaderLetter = gap.diff >= 0 ? "A" : "B";
      return `<span class="gap-badge ${leaderClass}">${gap.label}: Group ${leaderLetter} (${leader}) +${Math.abs(Math.round(gap.diff * 100))} pts</span>`;
    })
    .join("");
}

function renderChart() {
  const keys = focusMap[els.question.value];
  const rows = gapRows(keys);
  const personaA = personaFor(state.profileA, "A");
  const personaB = personaFor(state.profileB, "B");
  els.legend.innerHTML = `
    <div class="legend-item"><span class="legend-swatch group-a"></span><b>Group A:</b> ${personaA.name}, representing ${state.profileA.group}</div>
    <div class="legend-item"><span class="legend-swatch group-b"></span><b>Group B:</b> ${personaB.name}, representing ${state.profileB.group}</div>
    <div class="legend-note">Color key: Group A is always blue and appears on the top bar. Group B is always green and appears on the bottom bar.</div>
  `;
  els.chart.innerHTML = rows
    .map((row) => {
      const aWidth = clamp((row.a ?? 0) * 100, 1, 100);
      const bWidth = clamp((row.b ?? 0) * 100, 1, 100);
      return `
        <div class="compare-row">
          <div class="compare-label">
            <b>${row.label}</b>
            <span>${Math.abs(Math.round(row.diff * 100))} pt gap</span>
          </div>
          <div class="compare-bars">
            <div class="compare-bar a"><span style="width:${aWidth}%;background:var(--blue)"></span><b>A: ${pct(row.a)}</b></div>
            <div class="compare-bar b"><span style="width:${bWidth}%;background:var(--green)"></span><b>B: ${pct(row.b)}</b></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function focusPrompt() {
  return {
    strain: "stress, health, and coping",
    support: "support networks and social resources",
    purpose: "purpose and meaning",
    work: "work meaning and choices",
    balance: "calm, peace, and life balance",
  }[els.question.value];
}

function renderDialogue() {
  const personaA = personaFor(state.profileA, "A");
  const personaB = personaFor(state.profileB, "B");
  const top = gapRows(focusMap[els.question.value])[0];
  const aValue = pct(top.a);
  const bValue = pct(top.b);
  const leader = top.diff >= 0 ? personaA : personaB;
  const leaderProfile = top.diff >= 0 ? state.profileA : state.profileB;
  const otherProfile = top.diff >= 0 ? state.profileB : state.profileA;
  els.dialogue.innerHTML = `
    <div class="conversation-thread" aria-label="Data-based role play conversation between Group A and Group B personas">
      <div class="conversation-turn turn-a">
        <img src="${avatarFor(personaA, true)}" alt="${personaA.name}, Group A representative" />
        <div class="speech-bubble speech-a"><b>${personaA.name}</b><p>In my group, ${state.profileA.group}, the data show ${aValue} for ${top.label.toLowerCase()}. I would describe that as a group pattern, not as something true for every person like me.</p></div>
      </div>
      <div class="conversation-turn turn-b">
        <img src="${avatarFor(personaB, false)}" alt="${personaB.name}, Group B representative" />
        <div class="speech-bubble speech-b"><b>${personaB.name}</b><p>For my group, ${state.profileB.group}, the value is ${bValue}. The ${Math.abs(Math.round(top.diff * 100))}-point gap makes me wonder what context might explain the difference.</p></div>
      </div>
      <div class="conversation-turn turn-researcher">
        <div class="researcher-avatar">R</div>
        <div class="speech-bubble teacher-note"><b>Student researcher</b><p>${leader.name}'s group (${leaderProfile.group}) is higher on ${top.label.toLowerCase()} than ${otherProfile.group}. Ask a follow-up question about ${focusPrompt()}, then write one hypothesis and one limitation.</p></div>
      </div>
    </div>
  `;
}

function renderResearchBuilder() {
  const focus = els.question.value;
  const a = state.profileA;
  const b = state.profileB;
  const gaps = gapRows(focusMap[focus]);
  const top = gaps[0];
  const questionText = {
    strain: `How does ${a.dimension.toLowerCase()} relate to strain indicators in ${a.country}?`,
    support: `Does social support appear to buffer wellbeing differences between ${a.group} and ${b.group}?`,
    purpose: `How do sources of purpose differ between ${a.group} and ${b.group}?`,
    work: `How does work meaning vary between ${a.group} and ${b.group}?`,
    balance: `Which group reports stronger peace, calmness, and life balance?`,
  }[focus];
  const hypothesis = `Hypothesis: ${top.diff >= 0 ? a.group : b.group} will show higher ${top.label.toLowerCase()} than ${top.diff >= 0 ? b.group : a.group}, based on a ${Math.abs(Math.round(top.diff * 100))}-point observed gap.`;
  els.questionTag.textContent = focus;
  els.researchBuilder.innerHTML = `
    <div class="reason-row"><b>Question</b><p>${questionText}</p></div>
    <div class="reason-row"><b>Hypothesis</b><p>${hypothesis}</p></div>
    <div class="reason-row"><b>Variables</b><p>Independent variable: ${a.dimension.toLowerCase()} group. Dependent variable: ${top.label.toLowerCase()} response rate.</p></div>
    <div class="reason-row"><b>Limitation</b><p>These are group-level response rates, so they should not be used to describe every person in either group.</p></div>
  `;
}

function renderInterventions() {
  const a = state.profileA;
  const b = state.profileB;
  const allGaps = gapRows();
  const riskGaps = allGaps.filter((gap) => gap.polarity === "risk").slice(0, 2);
  const positiveGaps = allGaps.filter((gap) => gap.polarity !== "risk").slice(0, 2);
  const target = (a.scores.strain ?? 0) > (b.scores.strain ?? 0) ? a : b;
  els.interventionIdeas.innerHTML = `
    <div class="reason-row"><b>Target group</b><p>${target.group}, because this group shows higher estimated strain in the selected comparison.</p></div>
    <div class="reason-row"><b>Reduce strain</b><p>Focus on ${riskGaps.map((gap) => gap.label.toLowerCase()).join(" and ")} if these are high for the target group.</p></div>
    <div class="reason-row"><b>Build strengths</b><p>Use existing strengths such as ${positiveGaps.map((gap) => gap.label.toLowerCase()).join(" and ")} as intervention entry points.</p></div>
    <div class="reason-row"><b>Class activity</b><p>Ask students to design a one-week wellbeing intervention and predict which indicator should move first.</p></div>
  `;
}

function renderReport() {
  const a = state.profileA;
  const b = state.profileB;
  const personaA = personaFor(a, "A");
  const personaB = personaFor(b, "B");
  const gaps = gapRows(focusMap[els.question.value]);
  const top = gaps[0];
  els.miniReport.value = `Research question: ${els.researchBuilder.querySelector(".reason-row p")?.textContent ?? ""}

Comparison: ${personaA.name} represents ${a.group}; ${personaB.name} represents ${b.group} in ${a.country} using the ${a.dimension} lens.

Key finding: The largest focused gap is ${top.label}, with ${pct(top.a)} for ${personaA.name}'s group and ${pct(top.b)} for ${personaB.name}'s group.

Interpretation: This suggests that wellbeing patterns differ across groups, especially around ${top.label.toLowerCase()}. The pattern should be interpreted as a group-level tendency, not an individual prediction.

Limitation: The dataset reports response rates by group. It does not explain causality or describe every person in the group.

Ethical note: Avoid ranking groups as better or worse. Use the data to ask careful questions and design supportive interventions.`;
}

function renderVisualKey() {
  const top = gapRows(focusMap[els.question.value])[0];
  els.visualKey.innerHTML = `
    <h4>How to Read the Persona Visuals</h4>
    <table>
      <thead><tr><th>Visual cue</th><th>What it means</th><th>Data source</th></tr></thead>
      <tbody>
        <tr><td>Outer red halo</td><td>Larger or darker red halo means higher estimated strain.</td><td>Composite strain score</td></tr>
        <tr><td>Small badge ring</td><td>The colored ring around the small badge shows the active cue being discussed: support, calm, strain, purpose, or work.</td><td>Selected profile indicator</td></tr>
        <tr><td>Blue / green body</td><td>Blue is Group A; green is Group B.</td><td>Selected comparison groups</td></tr>
        <tr><td>White chest marker</td><td>Brighter marker means stronger wellbeing score.</td><td>Composite wellbeing score</td></tr>
        <tr><td>Center gap label</td><td>Shows the current largest focused gap: ${top.label}, ${pct(top.a)} vs ${pct(top.b)}.</td><td>Research focus selection</td></tr>
      </tbody>
    </table>
  `;
}

function renderAll() {
  chooseProfiles();
  els.title.textContent = `${els.country.value}: ${els.dimension.value} comparison`;
  renderGroupCard(els.groupCardA, state.profileA, "Group A");
  renderGroupCard(els.groupCardB, state.profileB, "Group B");
  renderFinding();
  renderChart();
  renderDialogue();
  renderResearchBuilder();
  renderInterventions();
  renderReport();
  renderVisualKey();
  resetScene();
}

function resetScene() {
  const a = state.profileA;
  const b = state.profileB;
  state.people = [
    {
      profile: a,
      side: "a",
      persona: personaFor(a, "A"),
      x: 210,
      y: 258,
      tx: 210,
      ty: 258,
      context: avatarContext(a, 0),
      bubbleTimer: 20,
    },
    {
      profile: b,
      side: "b",
      persona: personaFor(b, "B"),
      x: 550,
      y: 258,
      tx: 550,
      ty: 258,
      context: avatarContext(b, 2),
      bubbleTimer: 105,
    },
  ];
}

function avatarContext(profile, index) {
  const options = [
    {
      label: "Support",
      value: profile.metrics.support,
      text:
        (profile.metrics.support ?? 0) >= 0.75
          ? "I have someone to count on."
          : "Support may be harder to find.",
      color: "#14785d",
    },
    {
      label: "Calm",
      value: profile.metrics.calm,
      text:
        (profile.metrics.calm ?? 0) >= 0.7
          ? "Yesterday felt calm."
          : "Calm is less common here.",
      color: "#315f9d",
    },
    {
      label: "Strain",
      value: profile.scores.strain,
      text:
        (profile.scores.strain ?? 0) >= 0.28
          ? "Strain is part of this profile."
          : "Reported strain is lower.",
      color: "#ba4a42",
    },
    {
      label: "Purpose",
      value: profile.scores.purpose,
      text: `Purpose leans toward ${topPurpose(profile)}.`,
      color: "#b7791f",
    },
    {
      label: "Work",
      value: profile.metrics.enjoy_work,
      text:
        (profile.metrics.enjoy_work ?? 0) >= 0.75
          ? "Daily work is often enjoyed."
          : "Work meaning may vary.",
      color: "#0f766e",
    },
  ];
  return options[index % options.length];
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

function drawBubble(ctx, person, x, y) {
  const top = gapRows(focusMap[els.question.value])[0];
  const value = person.side === "a" ? top.a : top.b;
  const other = person.side === "a" ? state.profileB.group : state.profileA.group;
  const text =
    person.side === "a"
      ? `My group reports ${pct(value)} for ${top.label.toLowerCase()}. How does that compare with ${other}?`
      : `My group is ${pct(value)}. The gap helps us ask what context might matter.`;
  ctx.font = "bold 12px Inter, sans-serif";
  const width = 220;
  const lines = wrapCanvasText(ctx, text, width - 24).slice(0, 3);
  const height = 24 + lines.length * 15;
  const bx = clamp(x - width / 2, 10, ctx.canvas.width - width - 10);
  const by = clamp(y - 116, 12, ctx.canvas.height - height - 10);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.strokeStyle = person.context.color;
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, width, height, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, index) => ctx.fillText(line, bx + width / 2, by + 18 + index * 15));
}

function drawLegend(ctx) {
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, 18, 18, 276, 92, 10);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Scene key", 34, 39);
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("One representative persona per group", 34, 58);
  ctx.fillText("Outer red halo = estimated strain", 34, 76);
  ctx.fillText("Small badge ring = active discussion cue", 34, 94);
}

function drawScene() {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  state.tick += 1;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#f7fbf9");
  grad.addColorStop(1, "#e8eef8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9e8e1";
  ctx.fillRect(0, 250, canvas.width, 130);
  ctx.fillStyle = "rgba(49,95,157,0.12)";
  ctx.fillRect(52, 80, 210, 126);
  ctx.fillStyle = "rgba(20,120,93,0.12)";
  ctx.fillRect(500, 92, 205, 114);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, 300, 214, 160, 38, 10);
  ctx.fill();
  drawLegend(ctx);
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.textAlign = "left";
  const personaA = personaFor(state.profileA, "A");
  const personaB = personaFor(state.profileB, "B");
  ctx.fillText(`Group A: ${personaA.name} (${state.profileA.group})`, 72, 112);
  ctx.fillText(`Group B: ${personaB.name} (${state.profileB.group})`, 520, 124);
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.fillStyle = "#50615a";
  ctx.textAlign = "center";
  const top = gapRows(focusMap[els.question.value])[0];
  ctx.fillText(`${top.label}`, 380, 230);
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(`${pct(top.a)} vs ${pct(top.b)}`, 380, 245);

  state.people.forEach((person) => {
    person.bubbleTimer += 1;
    person.x = person.tx + Math.sin(state.tick / 42 + (person.side === "a" ? 0 : Math.PI)) * 10;
    person.y = person.ty + Math.cos(state.tick / 38 + (person.side === "a" ? 0 : Math.PI)) * 4;
  });
  state.people
    .slice()
    .sort((p, q) => p.y - q.y)
    .forEach((person, index) => {
      const profile = person.profile;
      const color = person.side === "a" ? "#315f9d" : "#14785d";
      const strain = profile.scores.strain ?? 0.2;
      const wellbeing = profile.scores.wellbeing ?? 0.6;
      const bob = Math.sin(state.tick / 12 + index) * 2;
      const x = person.x;
      const y = person.y + bob;
      ctx.fillStyle = `rgba(186,74,66,${clamp(strain, 0.1, 0.55)})`;
      ctx.beginPath();
      ctx.arc(x, y - 22, 36 + strain * 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(23,33,29,0.14)";
      ctx.beginPath();
      ctx.ellipse(x, y + 64, 32, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, x - 24, y + 8, 48, 56, 10);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${clamp(wellbeing, 0.35, 0.9)})`;
      roundRect(ctx, x - 15, y + 20, 30, 14, 5);
      ctx.fill();
      ctx.fillStyle = strain > 0.28 ? "#c9855c" : "#e0ad82";
      ctx.beginPath();
      ctx.arc(x, y - 22, 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e211b";
      ctx.beginPath();
      ctx.ellipse(x, y - 42, 28, 15, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#17211d";
      ctx.beginPath();
      ctx.arc(x - 8, y - 22, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 8, y - 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = person.context.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 30, y + 20, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#17211d";
      ctx.font = "bold 8px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(person.context.label.slice(0, 2).toUpperCase(), x + 30, y + 20);
      ctx.fillStyle = "#17211d";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(person.persona.initials, x, y + 45);
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText(person.persona.name, x, y + 82);
      drawBubble(ctx, person, x, y);
    });
  state.frame = requestAnimationFrame(drawScene);
}

async function init() {
  const response = await fetch(WELLBEING_DATA_URL);
  state.data = await response.json();
  populateSelect(els.country, state.data.countries, "United States");
  populateSelect(els.dimension, state.data.dimensions, "Age");
  updateGroupOptions();
  els.countryCount.textContent = state.data.source.countries.toLocaleString();
  els.profileCount.textContent = state.data.source.countryProfiles.toLocaleString();
  els.globalCount.textContent = state.data.source.globalProfiles.toLocaleString();
  renderAll();
  if (state.frame) cancelAnimationFrame(state.frame);
  state.frame = requestAnimationFrame(drawScene);

  els.country.addEventListener("change", () => {
    updateGroupOptions();
    renderAll();
  });
  els.dimension.addEventListener("change", () => {
    updateGroupOptions();
    renderAll();
  });
  els.groupA.addEventListener("change", renderAll);
  els.groupB.addEventListener("change", renderAll);
  els.question.addEventListener("change", renderAll);
  els.swap.addEventListener("click", () => {
    const current = els.groupA.value;
    els.groupA.value = els.groupB.value;
    els.groupB.value = current;
    renderAll();
  });
  els.copyReport.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.miniReport.value);
    els.copyReport.textContent = "Copied";
    setTimeout(() => (els.copyReport.textContent = "Copy Text"), 1000);
  });
}

init().catch((error) => {
  console.error(error);
  els.title.textContent = "Could not load wellbeing data";
});
