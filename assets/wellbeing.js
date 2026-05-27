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
  questionTag: document.querySelector("#questionTag"),
  researchBuilder: document.querySelector("#researchBuilder"),
  interventionIdeas: document.querySelector("#interventionIdeas"),
  miniReport: document.querySelector("#miniReportText"),
  copyReport: document.querySelector("#copyReport"),
  canvas: document.querySelector("#wellCanvas"),
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function score(value) {
  return Number.isFinite(value) ? Math.round(value * 100) : "--";
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

function renderGroupCard(target, profile, label) {
  target.innerHTML = `
    <span class="card-label">${label}</span>
    <div class="group-card-top">
      <div class="well-mini-avatar">${profile.group.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>${profile.group}</h3>
        <p>${profile.dimension} in ${profile.country}</p>
      </div>
    </div>
    <div class="score-grid">
      <div><span>Wellbeing</span><b>${score(profile.scores.wellbeing)}</b></div>
      <div><span>Strain</span><b>${score(profile.scores.strain)}</b></div>
      <div><span>Purpose</span><b>${score(profile.scores.purpose)}</b></div>
    </div>
    <p class="group-summary">${pct(profile.metrics.thriving)} thriving, ${pct(profile.metrics.support)} can count on help, ${pct(profile.metrics.calm)} felt calm yesterday. Dominant purpose cue: ${topPurpose(profile)}.</p>
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
      return `<span class="gap-badge">${gap.label}: ${leader} +${Math.abs(Math.round(gap.diff * 100))} pts</span>`;
    })
    .join("");
}

function renderChart() {
  const keys = focusMap[els.question.value];
  const rows = gapRows(keys);
  els.legend.innerHTML = `
    <div class="legend-item"><span class="legend-swatch group-a"></span><b>Group A:</b> ${state.profileA.group}</div>
    <div class="legend-item"><span class="legend-swatch group-b"></span><b>Group B:</b> ${state.profileB.group}</div>
    <div class="legend-note">Each indicator row shows Group A on the top bar and Group B on the bottom bar.</div>
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
            <div class="compare-bar a"><span style="width:${aWidth}%;background:var(--green)"></span><b>A: ${pct(row.a)}</b></div>
            <div class="compare-bar b"><span style="width:${bWidth}%;background:var(--blue)"></span><b>B: ${pct(row.b)}</b></div>
          </div>
        </div>
      `;
    })
    .join("");
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
  const gaps = gapRows(focusMap[els.question.value]);
  const top = gaps[0];
  els.miniReport.value = `Research question: ${els.researchBuilder.querySelector(".reason-row p")?.textContent ?? ""}

Comparison: ${a.group} vs ${b.group} in ${a.country} using the ${a.dimension} lens.

Key finding: The largest focused gap is ${top.label}, with ${pct(top.a)} for ${a.group} and ${pct(top.b)} for ${b.group}.

Interpretation: This suggests that wellbeing patterns differ across groups, especially around ${top.label.toLowerCase()}. The pattern should be interpreted as a group-level tendency, not an individual prediction.

Limitation: The dataset reports response rates by group. It does not explain causality or describe every person in the group.

Ethical note: Avoid ranking groups as better or worse. Use the data to ask careful questions and design supportive interventions.`;
}

function renderAll() {
  chooseProfiles();
  els.title.textContent = `${els.country.value}: ${els.dimension.value} comparison`;
  renderGroupCard(els.groupCardA, state.profileA, "Group A");
  renderGroupCard(els.groupCardB, state.profileB, "Group B");
  renderFinding();
  renderChart();
  renderResearchBuilder();
  renderInterventions();
  renderReport();
  resetScene();
}

function resetScene() {
  const a = state.profileA;
  const b = state.profileB;
  state.people = Array.from({ length: 12 }, (_, index) => {
    const profile = index % 2 === 0 ? a : b;
    const context = avatarContext(profile, index);
    return {
      profile,
      side: index % 2 === 0 ? "a" : "b",
      x: 80 + Math.random() * 600,
      y: 210 + Math.random() * 100,
      tx: 80 + Math.random() * 600,
      ty: 210 + Math.random() * 100,
      speed: 0.4 + Math.random() * 0.55,
      context,
      bubbleTimer: 40 + index * 28,
    };
  });
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

function drawBubble(ctx, person, x, y) {
  const show = person.bubbleTimer % 260 < 118;
  if (!show) return;
  const text = person.context.text;
  ctx.font = "bold 12px Inter, sans-serif";
  const width = clamp(ctx.measureText(text).width + 24, 110, 235);
  const bx = clamp(x - width / 2, 10, ctx.canvas.width - width - 10);
  const by = clamp(y - 82, 12, ctx.canvas.height - 100);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.strokeStyle = person.context.color;
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, width, 34, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + width / 2, by + 17);
}

function drawLegend(ctx) {
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, 18, 18, 250, 72, 10);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Scene key", 34, 39);
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("Blue = Group A, green = Group B", 34, 58);
  ctx.fillText("Ring size/darkness reflects strain", 34, 76);
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
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(295, 180, 165, 42);
  drawLegend(ctx);
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Group A: ${state.profileA.group}`, 72, 112);
  ctx.fillText(`Group B: ${state.profileB.group}`, 520, 124);

  state.people.forEach((person) => {
    person.bubbleTimer += 1;
    const dx = person.tx - person.x;
    const dy = person.ty - person.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 7) {
      person.tx = 65 + Math.random() * 635;
      person.ty = 205 + Math.random() * 105;
    } else {
      person.x += (dx / dist) * person.speed;
      person.y += (dy / dist) * person.speed;
    }
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
      ctx.arc(x, y - 13, 24 + strain * 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(23,33,29,0.14)";
      ctx.beginPath();
      ctx.ellipse(x, y + 42, 19, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(x - 14, y + 2, 28, 34);
      ctx.fillStyle = `rgba(255,255,255,${clamp(wellbeing, 0.35, 0.9)})`;
      ctx.fillRect(x - 9, y + 9, 18, 10);
      ctx.fillStyle = strain > 0.28 ? "#c9855c" : "#e0ad82";
      ctx.beginPath();
      ctx.arc(x, y - 13, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e211b";
      ctx.beginPath();
      ctx.ellipse(x, y - 26, 18, 10, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#17211d";
      ctx.beginPath();
      ctx.arc(x - 5, y - 13, 1.8, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 13, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = person.context.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 18, y + 8, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#17211d";
      ctx.font = "bold 7px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(person.context.label.slice(0, 2).toUpperCase(), x + 18, y + 8);
      ctx.fillStyle = "#17211d";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillText(person.side.toUpperCase(), x, y + 22);
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
