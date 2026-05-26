const DATA_URL = "public/gps_persona_data.json";

const state = {
  data: null,
  country: null,
  persona: null,
  overrides: {},
  globalPeople: [],
  interactions: [],
  scenePeople: [],
  sceneEvents: [],
  scenePaused: false,
  sceneFrame: null,
  sceneTick: 0,
  classroomRound: 0,
  missionIndex: 0,
  research: {
    participantId: "",
    condition: "not_started",
    trialIndex: 0,
    currentTrial: null,
    logs: [],
    startedAt: null,
  },
  history: [],
};

const missions = [
  {
    title: "Global Partnership Challenge",
    text: "Teams must form a cross-border partnership to solve a shared problem. Success depends on trust, reciprocity, and how much risk each persona will accept.",
  },
  {
    title: "Disaster Aid Allocation",
    text: "A crisis has struck one region. Personas decide whether to donate, coordinate aid, ask for safeguards, or prioritize local needs.",
  },
  {
    title: "Climate Negotiation",
    text: "Countries must agree on a costly long-term policy. Patience, trust, and fairness concerns shape whether personas cooperate or defect.",
  },
  {
    title: "Student Exchange Dilemma",
    text: "International students are assigned to a joint project with uneven workloads. Personas must decide how much to trust, help, reciprocate, or confront unfairness.",
  },
  {
    title: "Startup Investment Pitch",
    text: "A risky global venture needs backers from several countries. Personas weigh uncertain upside, delayed payoff, trust in partners, and possible betrayal.",
  },
];

const classroomRounds = [
  {
    title: "Round 1: Adopt the persona",
    instruction: "Each student group receives a role card. Name the persona, read the top traits, and decide how the persona talks, negotiates, and reacts under pressure.",
    prompts: [
      "What does this persona want from the mission?",
      "Which trait should shape their first decision?",
      "What would make this persona uncomfortable?",
    ],
  },
  {
    title: "Round 2: Make the first move",
    instruction: "Run a global interaction round. Groups role-play the feed entry that involves their persona or choose a related pair to perform.",
    prompts: [
      "What does your persona say first?",
      "Does the model predict trust, caution, or conflict?",
      "What evidence from the trait scores supports that move?",
    ],
  },
  {
    title: "Round 3: Add pressure",
    instruction: "Introduce a surprise complication: scarce resources, a broken promise, public scrutiny, or a tempting risky opportunity.",
    prompts: [
      "Which slider would change under this pressure?",
      "Would the persona cooperate, delay, retaliate, or ask for safeguards?",
      "Who becomes a better or worse partner now?",
    ],
  },
  {
    title: "Round 4: Negotiate",
    instruction: "Groups negotiate a final agreement while staying in character. They must cite at least two GPS traits before committing.",
    prompts: [
      "What concession can your persona make?",
      "What condition would your persona require?",
      "Which other persona do you trust most, and why?",
    ],
  },
  {
    title: "Round 5: Debrief the model",
    instruction: "Step out of character. Evaluate what the simulation captured well and where it could mislead.",
    prompts: [
      "Where did the data help you reason?",
      "Where could this become a stereotype?",
      "What extra information would you need about the person?",
    ],
  },
];

const reflectionPrompts = [
  "What did your persona do that you personally would not have done?",
  "Which trait most changed the outcome: trust, patience, risk taking, reciprocity, altruism, or negative reciprocity?",
  "How did country-level tendencies differ from individual role-play choices?",
  "What hidden context could reverse the model prediction?",
  "How should researchers or policymakers avoid stereotyping when using data like this?",
  "What new variable would make this simulation more realistic?",
];

const researchConditions = [
  {
    key: "full_information",
    label: "Full information",
    showCountry: true,
    showTraits: true,
    showBehavior: true,
  },
  {
    key: "country_visible",
    label: "Country visible",
    showCountry: true,
    showTraits: false,
    showBehavior: true,
  },
  {
    key: "country_hidden",
    label: "Country hidden",
    showCountry: false,
    showTraits: true,
    showBehavior: true,
  },
  {
    key: "trait_hidden",
    label: "Trait hidden",
    showCountry: true,
    showTraits: false,
    showBehavior: false,
  },
  {
    key: "behavior_only",
    label: "Behavior only",
    showCountry: false,
    showTraits: false,
    showBehavior: true,
  },
];

const trialScenarios = [
  {
    key: "trust_transfer",
    title: "Trust Transfer",
    text: "The participant decides whether to trust this persona with shared resources before receiving proof that they will reciprocate.",
    scenario: "trust",
  },
  {
    key: "aid_donation",
    title: "Aid Donation",
    text: "The participant decides whether this persona is likely to support a credible aid request with no direct personal return.",
    scenario: "donation",
  },
  {
    key: "risky_project",
    title: "Risky Project",
    text: "The participant decides whether this persona would join a high-upside project with uncertain results.",
    scenario: "investment",
  },
  {
    key: "delayed_reward",
    title: "Delayed Reward",
    text: "The participant decides whether this persona would wait for a larger future reward instead of taking less now.",
    scenario: "delay",
  },
  {
    key: "unfair_partner",
    title: "Unfair Partner",
    text: "The participant decides whether this persona would punish an unfair partner even if punishment has a cost.",
    scenario: "conflict",
  },
];

const debriefPrompts = [
  "Which information influenced you most: country, traits, avatar, observed behavior, or scenario?",
  "Did hiding country labels change how you judged the persona?",
  "Did trait data make you more careful or more confident?",
  "Where could this simulation lead to overgeneralization?",
  "What would you change before using this in a formal study?",
];

const scenarioModels = {
  investment: {
    tag: "investment",
    driver: "risktaking",
    positive: "Accepts calculated risk",
    negative: "Keeps the safer option",
    weights: { risktaking: 1.1, patience: 0.25, trust: 0.15, negrecip: -0.1 },
    prompt: "A new opportunity offers a meaningful upside, but the payoff is uncertain.",
  },
  delay: {
    tag: "delay",
    driver: "patience",
    positive: "Waits for the larger reward",
    negative: "Takes the immediate reward",
    weights: { patience: 1.15, risktaking: -0.2, trust: 0.1 },
    prompt: "The persona can receive a smaller payment now or wait for a larger one later.",
  },
  trust: {
    tag: "trust",
    driver: "trust",
    positive: "Extends trust first",
    negative: "Requires safeguards",
    weights: { trust: 1.2, posrecip: 0.25, negrecip: -0.25, risktaking: 0.15 },
    prompt: "A partner asks for cooperation before proving that they will reciprocate.",
  },
  favor: {
    tag: "favor",
    driver: "posrecip",
    positive: "Returns the favor generously",
    negative: "Keeps the exchange minimal",
    weights: { posrecip: 1.15, altruism: 0.35, trust: 0.15, negrecip: -0.1 },
    prompt: "Someone has gone out of their way to help, creating a chance to reciprocate.",
  },
  donation: {
    tag: "donation",
    driver: "altruism",
    positive: "Gives meaningfully",
    negative: "Declines or gives little",
    weights: { altruism: 1.2, posrecip: 0.2, patience: 0.1, trust: 0.15 },
    prompt: "A credible local cause asks for support with no direct personal return.",
  },
  conflict: {
    tag: "conflict",
    driver: "negrecip",
    positive: "Punishes unfair behavior",
    negative: "Lets the slight pass",
    weights: { negrecip: 1.1, trust: -0.25, patience: -0.15, altruism: -0.1 },
    prompt: "Another party behaves unfairly, and the persona can pay a cost to punish them.",
  },
};

const els = {
  countrySelect: document.querySelector("#countrySelect"),
  ageInput: document.querySelector("#ageInput"),
  genderSelect: document.querySelector("#genderSelect"),
  scenarioSelect: document.querySelector("#scenarioSelect"),
  cohortSize: document.querySelector("#cohortSize"),
  interactionMode: document.querySelector("#interactionMode"),
  sceneSetting: document.querySelector("#sceneSetting"),
  traitControls: document.querySelector("#traitControls"),
  resetTraits: document.querySelector("#resetTraits"),
  generatePersona: document.querySelector("#generatePersona"),
  runGlobalRound: document.querySelector("#runGlobalRound"),
  startClassroom: document.querySelector("#startClassroom"),
  startResearch: document.querySelector("#startResearch"),
  advanceRound: document.querySelector("#advanceRound"),
  newMission: document.querySelector("#newMission"),
  assignTeams: document.querySelector("#assignTeams"),
  clearHistory: document.querySelector("#clearHistory"),
  pauseScene: document.querySelector("#pauseScene"),
  resetScene: document.querySelector("#resetScene"),
  personaName: document.querySelector("#personaName"),
  countryCount: document.querySelector("#countryCount"),
  recordCount: document.querySelector("#recordCount"),
  sampleSize: document.querySelector("#sampleSize"),
  avatar: document.querySelector("#avatar"),
  personaTitle: document.querySelector("#personaTitle"),
  personaSubtitle: document.querySelector("#personaSubtitle"),
  personaNarrative: document.querySelector("#personaNarrative"),
  decisionLabel: document.querySelector("#decisionLabel"),
  probabilityFill: document.querySelector("#probabilityFill"),
  probabilityText: document.querySelector("#probabilityText"),
  radarCanvas: document.querySelector("#radarCanvas"),
  traitBars: document.querySelector("#traitBars"),
  scenarioText: document.querySelector("#scenarioText"),
  scenarioTag: document.querySelector("#scenarioTag"),
  countryIso: document.querySelector("#countryIso"),
  comparisonRows: document.querySelector("#comparisonRows"),
  globalCanvas: document.querySelector("#globalCanvas"),
  sceneCanvas: document.querySelector("#sceneCanvas"),
  interactionFeed: document.querySelector("#interactionFeed"),
  classroomSection: document.querySelector("#classroomSection"),
  missionTitle: document.querySelector("#missionTitle"),
  missionText: document.querySelector("#missionText"),
  roundTitle: document.querySelector("#roundTitle"),
  roundInstruction: document.querySelector("#roundInstruction"),
  roundPrompts: document.querySelector("#roundPrompts"),
  teamCards: document.querySelector("#teamCards"),
  roundHistory: document.querySelector("#roundHistory"),
  reflectionPrompts: document.querySelector("#reflectionPrompts"),
  researchSection: document.querySelector("#researchSection"),
  newParticipant: document.querySelector("#newParticipant"),
  exportResearch: document.querySelector("#exportResearch"),
  participantId: document.querySelector("#participantId"),
  studyQuestion: document.querySelector("#studyQuestion"),
  beginStudy: document.querySelector("#beginStudy"),
  conditionBadge: document.querySelector("#conditionBadge"),
  trialTitle: document.querySelector("#trialTitle"),
  trialScenario: document.querySelector("#trialScenario"),
  trialPersona: document.querySelector("#trialPersona"),
  choiceSelect: document.querySelector("#choiceSelect"),
  confidenceRange: document.querySelector("#confidenceRange"),
  trustRating: document.querySelector("#trustRating"),
  reasonText: document.querySelector("#reasonText"),
  recordTrial: document.querySelector("#recordTrial"),
  nextTrial: document.querySelector("#nextTrial"),
  trialCounter: document.querySelector("#trialCounter"),
  researchLog: document.querySelector("#researchLog"),
  debriefPrompts: document.querySelector("#debriefPrompts"),
};

const geo = {
  AFG: [66, 34], DZA: [2, 28], ARG: [-64, -34], AUS: [134, -25], AUT: [14, 47],
  BGD: [90, 24], BOL: [-64, -17], BIH: [18, 44], BWA: [24, -22], BRA: [-52, -10],
  KHM: [105, 13], CMR: [12, 6], CAN: [-106, 57], CHL: [-71, -30], CHN: [104, 35],
  COL: [-74, 4], CRI: [-84, 10], HRV: [16, 45], CZE: [15, 50], EGY: [30, 27],
  EST: [26, 59], FIN: [26, 64], FRA: [2, 46], GEO: [44, 42], DEU: [10, 51],
  GHA: [-1, 8], GRC: [22, 39], GTM: [-90, 15], HTI: [-72, 19], HUN: [20, 47],
  IND: [78, 22], IDN: [113, -2], IRN: [53, 32], IRQ: [44, 33], ISR: [35, 31],
  ITA: [12, 42], JPN: [138, 37], JOR: [36, 31], KAZ: [68, 48], KEN: [38, 1],
  LTU: [24, 56], MWI: [34, -13], MEX: [-102, 23], MDA: [29, 47], MAR: [-7, 32],
  NLD: [5, 52], NIC: [-85, 13], NGA: [8, 9], PAK: [70, 30], PER: [-75, -9],
  PHL: [122, 13], POL: [20, 52], PRT: [-8, 39], ROU: [25, 46], RUS: [90, 60],
  RWA: [30, -2], SAU: [45, 24], SRB: [21, 44], ZAF: [24, -29], KOR: [128, 36],
  ESP: [-4, 40], LKA: [81, 7], SUR: [-56, 4], SWE: [15, 62], CHE: [8, 47],
  TZA: [35, -6], THA: [101, 15], TUR: [35, 39], UGA: [32, 1], UKR: [31, 49],
  ARE: [54, 24], GBR: [-2, 54], USA: [-98, 39], VEN: [-66, 7], VNM: [108, 16],
  ZWE: [30, -19],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function format(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

function pct(value) {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function hashCode(text) {
  return [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function countryPoint(country, canvas) {
  const coord = geo[country.isocode];
  if (coord) {
    const [lon, lat] = coord;
    return {
      x: ((lon + 180) / 360) * canvas.width,
      y: ((85 - lat) / 170) * canvas.height,
    };
  }
  const hash = hashCode(country.isocode);
  return {
    x: ((hash % 1000) / 1000) * canvas.width,
    y: (((hash / 1000) % 1000) / 1000) * canvas.height,
  };
}

function countryColor(country) {
  const risk = country.traits.risktaking ?? 0;
  const trust = country.traits.trust ?? 0;
  if (trust > 0.35) return "#14785d";
  if (risk > 0.35) return "#315f9d";
  if ((country.traits.negrecip ?? 0) > 0.35) return "#ba4a42";
  return "#b7791f";
}

function avatarPalette(person) {
  const base = hashCode(`${person.isocode}-${person.gender}-${Math.round(person.age ?? 0)}`);
  const palettes = [
    ["#7c4f35", "#f0c7a5", "#315f9d", "#d9efe6"],
    ["#2e2a26", "#c9855c", "#14785d", "#e8f2ee"],
    ["#5a3825", "#8f5f3d", "#b7791f", "#f5ead4"],
    ["#1f2937", "#d5a178", "#ba4a42", "#f2e7e4"],
    ["#3f2d20", "#b8754b", "#0f766e", "#e0f0ec"],
    ["#2c221d", "#e2b78f", "#4f6f95", "#e7edf5"],
  ];
  return palettes[base % palettes.length];
}

function avatarSvg(person, size = 96) {
  const [hair, skin, accent, bg] = avatarPalette(person);
  const age = Number(person.age ?? 35);
  const gender = Number(person.gender ?? 0);
  const seed = hashCode(`${person.id ?? person.isocode}-${age}-${gender}`);
  const smile = seed % 3;
  const hairShape = seed % 4;
  const glasses = age > 48 || seed % 7 === 0;
  const mouth = smile === 0 ? "M38 64 Q48 70 58 64" : smile === 1 ? "M39 65 Q48 62 57 65" : "M40 65 L56 65";
  const hairPath = [
    "M25 39 Q31 16 52 20 Q70 22 72 42 Q57 34 42 39 Q34 41 25 39Z",
    "M27 42 Q30 20 48 18 Q68 18 72 39 Q61 32 50 34 Q36 36 27 42Z",
    "M24 43 Q28 18 50 17 Q76 20 73 48 Q63 33 47 37 Q34 40 24 43Z",
    "M27 37 Q37 18 58 23 Q72 28 70 45 Q56 37 43 38 Q35 38 27 37Z",
  ][hairShape];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bg}"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0.28"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#bg)"/>
      <circle cx="48" cy="89" r="31" fill="${accent}" opacity="0.95"/>
      <path d="M26 86 Q48 66 70 86Z" fill="#ffffff" opacity="0.24"/>
      <circle cx="48" cy="47" r="26" fill="${skin}"/>
      <path d="${hairPath}" fill="${hair}"/>
      <circle cx="38" cy="51" r="3" fill="#17211d"/>
      <circle cx="58" cy="51" r="3" fill="#17211d"/>
      ${glasses ? '<circle cx="38" cy="51" r="7" fill="none" stroke="#17211d" stroke-width="2"/><circle cx="58" cy="51" r="7" fill="none" stroke="#17211d" stroke-width="2"/><path d="M45 51 L51 51" stroke="#17211d" stroke-width="2"/>' : ""}
      <path d="${mouth}" fill="none" stroke="#7a3f35" stroke-width="3" stroke-linecap="round"/>
      <circle cx="27" cy="55" r="5" fill="${skin}"/>
      <circle cx="69" cy="55" r="5" fill="${skin}"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatarHtml(person, className = "") {
  return `<span class="avatar ${className}"><img alt="" src="${avatarSvg(person, 96)}"></span>`;
}

function traitValue(trait) {
  if (state.overrides[trait] !== undefined) return state.overrides[trait];
  if (state.persona?.traits?.[trait] !== null && state.persona?.traits?.[trait] !== undefined) {
    return state.persona.traits[trait];
  }
  return state.country.traits[trait] ?? 0;
}

function activeTraits() {
  return Object.fromEntries(state.data.traits.map(({ key }) => [key, traitValue(key)]));
}

function choosePersona() {
  const country = state.country;
  const gender = els.genderSelect.value;
  const targetAge = Number(els.ageInput.value);
  let pool = country.sample.slice();
  if (gender !== "sample") {
    const filtered = pool.filter((row) => String(row.gender) === gender);
    if (filtered.length > 8) pool = filtered;
  }
  pool.sort((a, b) => Math.abs((a.age ?? targetAge) - targetAge) - Math.abs((b.age ?? targetAge) - targetAge));
  const top = pool.slice(0, Math.min(30, pool.length));
  state.persona = top[Math.floor(Math.random() * top.length)] ?? {
    age: country.demographics.ageMedian,
    gender: null,
    region: null,
    traits: country.traits,
  };
  state.overrides = {};
}

function samplePersonFromCountry(country) {
  const sample = country.sample[Math.floor(Math.random() * country.sample.length)];
  return {
    id: `${country.isocode}-${Math.random().toString(16).slice(2)}`,
    country: country.country,
    isocode: country.isocode,
    age: sample?.age ?? country.demographics.ageMedian ?? 35,
    gender: sample?.gender ?? null,
    region: sample?.region ?? null,
    traits: sample?.traits ?? country.traits,
    countryTraits: country.traits,
  };
}

function createGlobalCohort() {
  const size = Number(els.cohortSize.value);
  const countries = state.data.countries.slice();
  const selected = state.country;
  const chosen = [selected];
  while (chosen.length < size && countries.length) {
    const idx = Math.floor(Math.random() * countries.length);
    const [candidate] = countries.splice(idx, 1);
    if (!chosen.some((country) => country.isocode === candidate.isocode)) chosen.push(candidate);
  }
  state.globalPeople = chosen.map(samplePersonFromCountry);
}

function pairScore(a, b, type) {
  if (type === "trust") {
    return sigmoid((a.traits.trust ?? 0) * 0.8 + (b.traits.posrecip ?? 0) * 0.5 - (a.traits.negrecip ?? 0) * 0.15);
  }
  if (type === "exchange") {
    return sigmoid((a.traits.posrecip ?? 0) * 0.55 + (b.traits.posrecip ?? 0) * 0.35 + (a.traits.altruism ?? 0) * 0.35);
  }
  if (type === "conflict") {
    return sigmoid((a.traits.negrecip ?? 0) * 0.75 + (b.traits.negrecip ?? 0) * 0.4 - (a.traits.patience ?? 0) * 0.25);
  }
  return sigmoid((a.traits.trust ?? 0) * 0.35 + (a.traits.posrecip ?? 0) * 0.25 + (a.traits.risktaking ?? 0) * 0.15 - (a.traits.negrecip ?? 0) * 0.15);
}

function interactionType() {
  const mode = els.interactionMode.value;
  if (mode !== "mixed") return mode;
  const types = ["trust", "exchange", "conflict"];
  return types[Math.floor(Math.random() * types.length)];
}

function runGlobalRound() {
  if (!state.globalPeople.length || state.globalPeople.length !== Number(els.cohortSize.value)) {
    createGlobalCohort();
  }
  const shuffled = state.globalPeople.slice().sort(() => Math.random() - 0.5);
  const interactions = [];
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    const type = interactionType();
    const score = pairScore(a, b, type);
    const cooperative = type === "conflict" ? score < 0.55 : score >= 0.5;
    const tone = type === "conflict" ? (cooperative ? "caution" : "conflict") : cooperative ? "cooperate" : "caution";
    interactions.push({ a, b, type, score, cooperative, tone });
  }
  state.interactions = interactions;
  drawGlobalField();
  renderInteractionFeed();
  resetScenePeople(false);
}

function sceneBounds() {
  const canvas = els.sceneCanvas;
  return { minX: 70, maxX: canvas.width - 70, minY: 220, maxY: canvas.height - 62 };
}

function resetScenePeople(reseed = true) {
  if (reseed || !state.globalPeople.length) createGlobalCohort();
  const bounds = sceneBounds();
  state.scenePeople = state.globalPeople.slice(0, Math.min(14, state.globalPeople.length)).map((person, index) => {
    const lane = index % 4;
    const x = bounds.minX + ((index * 83) % (bounds.maxX - bounds.minX));
    const y = bounds.minY + lane * 58 + Math.random() * 26;
    return {
      ...person,
      x,
      y,
      tx: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
      ty: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
      speed: 0.55 + Math.random() * 0.55,
      wait: Math.random() * 120,
      bubble: "",
      bubbleLife: 0,
      mood: "neutral",
    };
  });
  state.sceneEvents = [];
}

function sceneLine(type, cooperative) {
  if (type === "trust") return cooperative ? "I can take the first step." : "I need a safeguard first.";
  if (type === "exchange") return cooperative ? "I will return the favor." : "Let's keep this limited.";
  if (type === "conflict") return cooperative ? "I can let this pass." : "That felt unfair.";
  return cooperative ? "Let's work together." : "I am not sure yet.";
}

function triggerSceneEncounter(a, b) {
  const type = interactionType();
  const score = pairScore(a, b, type);
  const cooperative = type === "conflict" ? score < 0.55 : score >= 0.5;
  const tone = type === "conflict" ? (cooperative ? "caution" : "conflict") : cooperative ? "cooperate" : "caution";
  a.bubble = sceneLine(type, cooperative);
  b.bubble = cooperative ? "Agreed." : "Let's pause.";
  a.bubbleLife = 170;
  b.bubbleLife = 140;
  a.mood = tone;
  b.mood = tone;
  a.wait = 120;
  b.wait = 120;
  state.sceneEvents.unshift({ a, b, type, cooperative, tone, life: 180 });
  state.sceneEvents = state.sceneEvents.slice(0, 6);
}

function scoreScenario(traits, scenario) {
  const model = scenarioModels[scenario];
  const raw = Object.entries(model.weights).reduce((sum, [trait, weight]) => sum + (traits[trait] ?? 0) * weight, 0);
  return sigmoid(raw);
}

function traitPhrase(key, value) {
  const direction = value >= 0.3 ? "high" : value <= -0.3 ? "low" : "moderate";
  const phrases = {
    patience: {
      high: "comfortable waiting when the later payoff is worth it",
      moderate: "balanced between immediate and delayed rewards",
      low: "more drawn to near-term outcomes",
    },
    risktaking: {
      high: "open to uncertain upside",
      moderate: "selective about risk",
      low: "inclined toward safer options",
    },
    posrecip: {
      high: "strongly motivated to return kindness",
      moderate: "responsive to favors without overextending",
      low: "less moved by social obligation after help",
    },
    negrecip: {
      high: "ready to push back against unfairness",
      moderate: "situational about punishment",
      low: "less likely to retaliate after a slight",
    },
    altruism: {
      high: "willing to help without a direct return",
      moderate: "helpful when the case is concrete",
      low: "more cautious about giving resources away",
    },
    trust: {
      high: "comfortable assuming good intent",
      moderate: "trusting when context supports it",
      low: "likely to look for proof or safeguards first",
    },
  };
  return phrases[key][direction];
}

function renderControls() {
  els.traitControls.innerHTML = "";
  state.data.traits.forEach(({ key, label }) => {
    const value = traitValue(key);
    const wrap = document.createElement("div");
    wrap.className = "trait-control";
    wrap.innerHTML = `
      <header>
        <b>${label}</b>
        <span id="value-${key}">${format(value)}</span>
      </header>
      <input aria-label="${label}" data-trait="${key}" type="range" min="-2" max="2" step="0.01" value="${value}">
    `;
    els.traitControls.appendChild(wrap);
  });
}

function renderTraitBars(traits) {
  els.traitBars.innerHTML = "";
  state.data.traits.forEach(({ key, label }) => {
    const value = traits[key] ?? 0;
    const start = value < 0 ? 50 + (value / 4) * 100 : 50;
    const width = Math.abs(value / 4) * 100;
    const row = document.createElement("div");
    row.className = "trait-bar";
    row.innerHTML = `
      <b>${label}</b>
      <div class="bar-track">
        <div class="bar-fill" style="left:${clamp(start, 0, 100)}%;width:${clamp(width, 2, 50)}%;background:${value >= 0 ? "var(--green)" : "var(--red)"}"></div>
      </div>
      <span class="trait-value">${format(value)}</span>
    `;
    els.traitBars.appendChild(row);
  });
}

function drawRadar(traits) {
  const canvas = els.radarCanvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 6;
  const radius = Math.min(w, h) * 0.34;
  const keys = state.data.traits.map((trait) => trait.key);
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.font = "13px Inter, sans-serif";

  [0.25, 0.5, 0.75, 1].forEach((level) => {
    ctx.beginPath();
    keys.forEach((key, index) => {
      const angle = -Math.PI / 2 + (index / keys.length) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius * level;
      const y = cy + Math.sin(angle) * radius * level;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = "#d7e2dc";
    ctx.stroke();
  });

  keys.forEach((key, index) => {
    const angle = -Math.PI / 2 + (index / keys.length) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#edf2ef";
    ctx.stroke();
    const label = state.data.traits.find((trait) => trait.key === key).label;
    ctx.fillStyle = "#42524b";
    ctx.textAlign = Math.cos(angle) > 0.2 ? "left" : Math.cos(angle) < -0.2 ? "right" : "center";
    ctx.fillText(label, cx + Math.cos(angle) * (radius + 24), cy + Math.sin(angle) * (radius + 24));
  });

  ctx.beginPath();
  keys.forEach((key, index) => {
    const angle = -Math.PI / 2 + (index / keys.length) * Math.PI * 2;
    const scaled = clamp((traits[key] + 2) / 4, 0, 1);
    const x = cx + Math.cos(angle) * radius * scaled;
    const y = cy + Math.sin(angle) * radius * scaled;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(20, 120, 93, 0.22)";
  ctx.strokeStyle = "#14785d";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function renderScenario(traits) {
  const scenario = els.scenarioSelect.value;
  const model = scenarioModels[scenario];
  const probability = scoreScenario(traits, scenario);
  const decision = probability >= 0.5 ? model.positive : model.negative;
  els.scenarioTag.textContent = model.tag;
  els.decisionLabel.textContent = decision;
  els.probabilityFill.style.width = pct(probability);
  els.probabilityText.textContent = pct(probability);

  const strongest = Object.entries(model.weights)
    .map(([trait, weight]) => ({ trait, contribution: (traits[trait] ?? 0) * weight }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  els.scenarioText.innerHTML = `
    <div class="reason-row">
      <b>Setup</b>
      <p>${model.prompt}</p>
    </div>
    <div class="reason-row">
      <b>Readout</b>
      <p>The model estimates a ${pct(probability)} chance that this persona ${decision.toLowerCase()}.</p>
    </div>
    <div class="reason-row">
      <b>Drivers</b>
      <p>${strongest
        .map(({ trait, contribution }) => {
          const label = state.data.traits.find((item) => item.key === trait).label.toLowerCase();
          return `${label} ${contribution >= 0 ? "raises" : "lowers"} the score`;
        })
        .join("; ")}.</p>
    </div>
  `;
}

function renderComparison() {
  const scenario = scenarioModels[els.scenarioSelect.value];
  const driver = scenario.driver;
  const sorted = state.data.countries
    .map((country) => ({ country: country.country, value: country.traits[driver] }))
    .sort((a, b) => b.value - a.value);
  const groups = [
    ["Highest", sorted.slice(0, 5)],
    ["Lowest", sorted.slice(-5).reverse()],
  ];
  els.comparisonRows.innerHTML = groups
    .map(
      ([title, rows]) => `
        <div class="comparison-group">
          <h4>${title}</h4>
          ${rows.map((row) => `<div class="comparison-row"><span>${row.country}</span><span>${format(row.value)}</span></div>`).join("")}
        </div>
      `,
    )
    .join("");
}

function drawWorldBackdrop(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f6fbf8");
  gradient.addColorStop(0.55, "#e8f3ef");
  gradient.addColorStop(1, "#eef2f7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(49, 95, 157, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 60; x < canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 55; y < canvas.height; y += 55) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(20, 120, 93, 0.11)";
  [
    [210, 145, 145, 82],
    [310, 265, 85, 125],
    [485, 150, 92, 80],
    [535, 240, 80, 115],
    [665, 175, 170, 112],
    [745, 300, 92, 58],
  ].forEach(([x, y, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, -0.18, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(49, 95, 157, 0.08)";
  [[150, 75, 55], [808, 92, 70], [78, 330, 48], [610, 360, 60]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPerson(ctx, person, point, selected) {
  const radius = selected ? 17 : 13;
  const [hair, skin, accent, bg] = avatarPalette(person);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius + 6, 0, Math.PI * 2);
  ctx.fillStyle = selected ? "rgba(23, 33, 29, 0.14)" : "rgba(23, 33, 29, 0.08)";
  ctx.fill();

  const grad = ctx.createLinearGradient(point.x - radius, point.y - radius, point.x + radius, point.y + radius);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, accent);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = selected ? 3 : 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(point.x, point.y - 2, radius * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(point.x, point.y - radius * 0.34, radius * 0.5, radius * 0.28, 0, Math.PI, 0);
  ctx.fillStyle = hair;
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.beginPath();
  ctx.arc(point.x - radius * 0.18, point.y - 3, 1.4, 0, Math.PI * 2);
  ctx.arc(point.x + radius * 0.18, point.y - 3, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y + radius * 0.85, radius * 0.52, Math.PI, 0);
  ctx.fillStyle = accent;
  ctx.fill();
}

function drawGlobalField() {
  const canvas = els.globalCanvas;
  const ctx = canvas.getContext("2d");
  drawWorldBackdrop(ctx, canvas);
  const points = new Map();
  state.globalPeople.forEach((person, index) => {
    const country = state.data.countries.find((item) => item.isocode === person.isocode);
    const base = countryPoint(country, canvas);
    const angle = (index * 137.5 * Math.PI) / 180;
    points.set(person.id, {
      x: clamp(base.x + Math.cos(angle) * 14, 18, canvas.width - 18),
      y: clamp(base.y + Math.sin(angle) * 14, 18, canvas.height - 18),
    });
  });

  state.interactions.forEach((event) => {
    const a = points.get(event.a.id);
    const b = points.get(event.b.id);
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = event.tone === "conflict" ? "rgba(186, 74, 66, 0.58)" : event.tone === "caution" ? "rgba(183, 121, 31, 0.58)" : "rgba(20, 120, 93, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  state.globalPeople.forEach((person) => {
    drawPerson(ctx, person, points.get(person.id), person.isocode === state.country.isocode);
  });

  ctx.fillStyle = "#42524b";
  ctx.font = "12px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Each node is one simulated respondent sampled from a country dataset.", 18, canvas.height - 18);
}

function drawSceneBackdrop(ctx, canvas) {
  const setting = els.sceneSetting.value;
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, setting === "summit" ? "#eaf0f8" : "#e9f6f2");
  sky.addColorStop(0.5, "#f8fbf9");
  sky.addColorStop(1, setting === "market" ? "#f2eadb" : "#e4eee9");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = setting === "market" ? "#d9c8a8" : "#cfded6";
  ctx.fillRect(0, 390, canvas.width, 170);
  ctx.fillStyle = setting === "market" ? "#eadbbd" : "#edf4f0";
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(280, 385, 760, 385, canvas.width, 480);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  if (setting === "campus") drawCampus(ctx);
  if (setting === "market") drawMarket(ctx);
  if (setting === "summit") drawSummit(ctx);
  if (setting === "aid") drawAidHub(ctx);
}

function drawCampus(ctx) {
  ctx.fillStyle = "#dfe8e3";
  ctx.fillRect(80, 118, 265, 150);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(108, 148, 58, 78);
  ctx.fillRect(182, 148, 58, 78);
  ctx.fillRect(256, 148, 58, 78);
  ctx.fillStyle = "#315f9d";
  ctx.fillRect(74, 98, 278, 28);
  ctx.fillStyle = "#7aa890";
  [[780, 210, 42], [880, 162, 35], [940, 245, 46]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7c4f35";
    ctx.fillRect(x - 5, y + r - 5, 10, 58);
    ctx.fillStyle = "#7aa890";
  });
}

function drawMarket(ctx) {
  ["#ba4a42", "#14785d", "#315f9d"].forEach((color, i) => {
    const x = 95 + i * 250;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, 170);
    ctx.lineTo(x + 170, 170);
    ctx.lineTo(x + 145, 222);
    ctx.lineTo(x + 25, 222);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(x + 18, 222, 136, 80);
  });
  ctx.fillStyle = "#c69c6d";
  ctx.fillRect(790, 260, 190, 28);
  ctx.fillRect(810, 288, 14, 62);
  ctx.fillRect(946, 288, 14, 62);
}

function drawSummit(ctx) {
  ctx.fillStyle = "#dfe7ef";
  ctx.fillRect(185, 120, 730, 170);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(230, 158, 640, 92);
  ctx.fillStyle = "#315f9d";
  ctx.fillRect(185, 96, 730, 34);
  ctx.fillStyle = "#14785d";
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(250 + i * 92, 305, 48, 76);
  }
}

function drawAidHub(ctx) {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(115, 145, 260, 150);
  ctx.fillStyle = "#ba4a42";
  ctx.fillRect(225, 178, 38, 84);
  ctx.fillRect(202, 201, 84, 38);
  ctx.fillStyle = "#e2e8f0";
  [[700, 190], [810, 224], [910, 185]].forEach(([x, y]) => {
    ctx.fillRect(x, y, 86, 58);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(x + 8, y + 10, 70, 8);
    ctx.fillStyle = "#e2e8f0";
  });
}

function drawSpeech(ctx, text, x, y, tone) {
  if (!text) return;
  ctx.font = "bold 15px Inter, sans-serif";
  const width = Math.min(210, Math.max(92, ctx.measureText(text).width + 28));
  const height = 38;
  const bx = clamp(x - width / 2, 12, ctx.canvas.width - width - 12);
  const by = Math.max(18, y - 84);
  ctx.fillStyle = tone === "conflict" ? "rgba(255, 244, 242, 0.96)" : tone === "caution" ? "rgba(255, 250, 235, 0.96)" : "rgba(240, 253, 244, 0.96)";
  ctx.strokeStyle = tone === "conflict" ? "#ba4a42" : tone === "caution" ? "#b7791f" : "#14785d";
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, width, height, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + width / 2, by + height / 2 + 1);
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

function drawScenePerson(ctx, person) {
  const bob = Math.sin(state.sceneTick / 10 + person.x / 20) * 2;
  const x = person.x;
  const y = person.y + bob;
  const [hair, skin, accent, bg] = avatarPalette(person);

  ctx.fillStyle = "rgba(23, 33, 29, 0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y + 46, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#26342f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 34);
  ctx.lineTo(x - 16, y + 56);
  ctx.moveTo(x + 8, y + 34);
  ctx.lineTo(x + 16, y + 56);
  ctx.stroke();

  ctx.fillStyle = accent;
  roundRect(ctx, x - 18, y + 5, 36, 38, 12);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.fillRect(x - 12, y + 12, 24, 20);

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 12, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(x, y - 27, 22, 13, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.beginPath();
  ctx.arc(x - 7, y - 12, 2, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 12, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a3f35";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 4, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = countryColor({ isocode: person.isocode, traits: person.countryTraits });
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 20, y + 18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 8px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(person.isocode.slice(0, 2), x + 20, y + 18);
}

function updateScenePeople() {
  const bounds = sceneBounds();
  state.scenePeople.forEach((person) => {
    if (person.bubbleLife > 0) person.bubbleLife -= 1;
    if (person.wait > 0) {
      person.wait -= 1;
      return;
    }
    const dx = person.tx - person.x;
    const dy = person.ty - person.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      person.tx = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      person.ty = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      person.wait = Math.random() * 50;
    } else {
      person.x += (dx / dist) * person.speed;
      person.y += (dy / dist) * person.speed;
    }
  });

  if (state.sceneTick % 115 === 0 && state.scenePeople.length > 3) {
    const available = state.scenePeople.filter((person) => person.wait <= 0);
    if (available.length > 1) {
      const a = available[Math.floor(Math.random() * available.length)];
      const b = available.filter((person) => person.id !== a.id).sort((p, q) => {
        return Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y);
      })[0];
      if (b) {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        a.tx = mx - 28;
        b.tx = mx + 28;
        a.ty = my;
        b.ty = my;
        triggerSceneEncounter(a, b);
      }
    }
  }
}

function drawScene() {
  if (!els.sceneCanvas || !state.scenePeople.length) return;
  const canvas = els.sceneCanvas;
  const ctx = canvas.getContext("2d");
  if (!state.scenePaused) {
    state.sceneTick += 1;
    updateScenePeople();
  }

  drawSceneBackdrop(ctx, canvas);
  state.sceneEvents.forEach((event) => {
    event.life -= state.scenePaused ? 0 : 1;
    ctx.strokeStyle = event.tone === "conflict" ? "rgba(186, 74, 66, 0.5)" : event.tone === "caution" ? "rgba(183, 121, 31, 0.5)" : "rgba(20, 120, 93, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(event.a.x, event.a.y + 6);
    ctx.lineTo(event.b.x, event.b.y + 6);
    ctx.stroke();
  });
  state.sceneEvents = state.sceneEvents.filter((event) => event.life > 0);
  state.scenePeople.slice().sort((a, b) => a.y - b.y).forEach((person) => drawScenePerson(ctx, person));
  state.scenePeople.forEach((person) => {
    if (person.bubbleLife > 0) drawSpeech(ctx, person.bubble, person.x, person.y, person.mood);
  });
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, 18, 18, 265, 42, 10);
  ctx.fill();
  ctx.fillStyle = "#17211d";
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`Setting: ${els.sceneSetting.options[els.sceneSetting.selectedIndex].text}`, 34, 40);
  state.sceneFrame = requestAnimationFrame(drawScene);
}

function startSceneLoop() {
  if (!state.scenePeople.length) resetScenePeople(false);
  if (state.sceneFrame) cancelAnimationFrame(state.sceneFrame);
  state.sceneFrame = requestAnimationFrame(drawScene);
}

function interactionSentence(event) {
  const a = `${Math.round(event.a.age)} from ${event.a.country}`;
  const b = `${Math.round(event.b.age)} from ${event.b.country}`;
  const chance = pct(event.type === "conflict" ? 1 - event.score : event.score);
  if (event.type === "trust") {
    return event.cooperative
      ? `${a} extends initial trust toward ${b}; reciprocity cues make cooperation plausible (${chance}).`
      : `${a} hesitates with ${b}; the model expects safeguards before cooperation (${chance}).`;
  }
  if (event.type === "exchange") {
    return event.cooperative
      ? `${a} and ${b} sustain a favor exchange, with positive reciprocity carrying the interaction (${chance}).`
      : `${a} and ${b} keep the exchange narrow rather than building an ongoing obligation (${chance}).`;
  }
  return event.cooperative
    ? `${a} absorbs friction with ${b}; retaliation pressure stays contained (${chance}).`
    : `${a} escalates after unfair treatment from ${b}; negative reciprocity dominates (${chance}).`;
}

function renderInteractionFeed() {
  els.interactionFeed.innerHTML = state.interactions
    .map(
      (event) => `
        <article class="feed-item" data-tone="${event.tone}">
          <div class="feed-avatars">
            ${avatarHtml(event.a)}
            ${avatarHtml(event.b)}
          </div>
          <div>
            <b>${event.type[0].toUpperCase()}${event.type.slice(1)} encounter</b>
            <p>${interactionSentence(event)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function topTraitTags(person) {
  return Object.entries(person.traits ?? {})
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 2)
    .map(([key, value]) => {
      const label = state.data.traits.find((trait) => trait.key === key)?.label ?? key;
      return `${label}: ${format(value)}`;
    });
}

function renderTeamCards() {
  const people = state.globalPeople.slice(0, Math.min(8, state.globalPeople.length));
  els.teamCards.innerHTML = people
    .map((person, index) => {
      const age = Math.round(person.age ?? 35);
      const gender = person.gender === 1 ? "male" : person.gender === 2 ? "female" : "respondent";
      const tags = topTraitTags(person).map((tag) => `<span class="trait-tag">${tag}</span>`).join("");
      return `
        <article class="student-card">
          ${avatarHtml(person)}
          <div>
            <h5>Team ${index + 1}: ${person.country}</h5>
            <p>${age}-year-old ${gender}${person.region ? ` from ${person.region}` : ""}</p>
            <div class="trait-tags">${tags}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMission() {
  const mission = missions[state.missionIndex % missions.length];
  els.missionTitle.textContent = mission.title;
  els.missionText.textContent = mission.text;
}

function renderRoundGuide() {
  const round = classroomRounds[state.classroomRound % classroomRounds.length];
  els.roundTitle.textContent = round.title;
  els.roundInstruction.textContent = round.instruction;
  els.roundPrompts.innerHTML = round.prompts.map((prompt) => `<div class="prompt-chip">${prompt}</div>`).join("");
}

function renderHistory() {
  if (!state.history.length) {
    els.roundHistory.innerHTML = `<div class="prompt-chip">No rounds recorded yet. Click Advance Round to capture the current activity state.</div>`;
    return;
  }
  els.roundHistory.innerHTML = state.history
    .slice()
    .reverse()
    .map(
      (item) => `
        <article class="history-item">
          <b>${item.round}: ${item.mission}</b>
          <p>${item.summary}</p>
        </article>
      `,
    )
    .join("");
}

function renderReflectionPrompts() {
  els.reflectionPrompts.innerHTML = reflectionPrompts.map((prompt) => `<div class="prompt-chip">${prompt}</div>`).join("");
}

function renderClassroomMode() {
  renderMission();
  renderRoundGuide();
  renderTeamCards();
  renderHistory();
  renderReflectionPrompts();
}

function summarizeRound() {
  const cooperative = state.interactions.filter((event) => event.cooperative).length;
  const conflict = state.interactions.filter((event) => event.tone === "conflict").length;
  const caution = state.interactions.filter((event) => event.tone === "caution").length;
  return `${state.interactions.length} encounters: ${cooperative} cooperative, ${caution} cautious, ${conflict} conflict-heavy. Students should defend or challenge one outcome using trait evidence.`;
}

function advanceClassroomRound() {
  const round = classroomRounds[state.classroomRound % classroomRounds.length];
  const mission = missions[state.missionIndex % missions.length];
  state.history.push({
    round: round.title,
    mission: mission.title,
    summary: summarizeRound(),
  });
  state.classroomRound = (state.classroomRound + 1) % classroomRounds.length;
  runGlobalRound();
  renderClassroomMode();
}

function currentCondition() {
  return researchConditions.find((condition) => condition.key === state.research.condition) ?? researchConditions[0];
}

function randomCondition() {
  return researchConditions[Math.floor(Math.random() * researchConditions.length)];
}

function buildResearchTrial() {
  const country = state.data.countries[Math.floor(Math.random() * state.data.countries.length)];
  const person = samplePersonFromCountry(country);
  const trialScenario = trialScenarios[state.research.trialIndex % trialScenarios.length];
  const modelScore = scoreScenario(person.traits, trialScenario.scenario);
  return {
    trialNumber: state.research.trialIndex + 1,
    country: country.country,
    isocode: country.isocode,
    person,
    scenarioKey: trialScenario.key,
    scenarioName: trialScenario.title,
    scenarioText: trialScenario.text,
    scenarioModel: trialScenario.scenario,
    modelPrediction: modelScore >= 0.5 ? "positive" : "negative",
    modelProbability: modelScore,
    createdAt: new Date().toISOString(),
  };
}

function renderResearchTrial() {
  const trial = state.research.currentTrial;
  if (!trial) {
    els.conditionBadge.textContent = "not started";
    els.trialTitle.textContent = "Begin a study to generate Trial 1";
    els.trialScenario.textContent = "";
    els.trialPersona.innerHTML = `<span class="hidden-detail">No active trial.</span>`;
    return;
  }

  const condition = currentCondition();
  const person = trial.person;
  const age = Math.round(person.age ?? 35);
  const gender = person.gender === 1 ? "male" : person.gender === 2 ? "female" : "respondent";
  const countryLine = condition.showCountry ? `${trial.country} (${trial.isocode})` : "Country hidden";
  const traitLine = condition.showTraits
    ? topTraitTags(person).join(" | ")
    : "Trait profile hidden";
  const behaviorLine = condition.showBehavior
    ? `Model cue: ${trial.modelPrediction} tendency, ${pct(trial.modelProbability)} confidence`
    : "Observed behavior hidden";

  els.conditionBadge.textContent = condition.label;
  els.trialTitle.textContent = `Trial ${trial.trialNumber}: ${trial.scenarioName}`;
  els.trialScenario.textContent = trial.scenarioText;
  els.trialPersona.innerHTML = `
    <div class="trial-persona-inner">
      ${avatarHtml(person)}
      <div>
        <h5>${condition.showCountry ? trial.country : "Anonymous persona"}</h5>
        <p>${age}-year-old ${gender}</p>
        <p>${countryLine}</p>
        <p>${traitLine}</p>
        <p>${behaviorLine}</p>
      </div>
    </div>
  `;
}

function renderResearchLog() {
  const logs = state.research.logs;
  els.trialCounter.textContent = `${logs.length} trial${logs.length === 1 ? "" : "s"} recorded`;
  if (!logs.length) {
    els.researchLog.innerHTML = `<div class="prompt-chip">No responses recorded yet.</div>`;
    return;
  }
  els.researchLog.innerHTML = logs
    .slice()
    .reverse()
    .map(
      (log) => `
        <article class="log-item">
          <b>Trial ${log.trial_number}: ${log.scenario_name} (${log.condition})</b>
          <p>${log.choice || "No choice"} | trust ${log.trust_rating} | confidence ${log.confidence} | ${log.country_visible}</p>
        </article>
      `,
    )
    .join("");
}

function renderDebriefPrompts() {
  els.debriefPrompts.innerHTML = debriefPrompts.map((prompt) => `<div class="prompt-chip">${prompt}</div>`).join("");
}

function renderResearchMode() {
  renderResearchTrial();
  renderResearchLog();
  renderDebriefPrompts();
}

function beginResearchStudy() {
  const participantId = els.participantId.value.trim() || `anon-${Date.now().toString().slice(-6)}`;
  els.participantId.value = participantId;
  const condition = randomCondition();
  state.research = {
    participantId,
    condition: condition.key,
    trialIndex: 0,
    currentTrial: null,
    logs: state.research.logs,
    startedAt: new Date().toISOString(),
  };
  nextResearchTrial();
}

function nextResearchTrial() {
  if (state.research.condition === "not_started") beginResearchStudy();
  state.research.currentTrial = buildResearchTrial();
  els.choiceSelect.value = "";
  els.confidenceRange.value = 50;
  els.trustRating.value = 50;
  els.reasonText.value = "";
  renderResearchMode();
}

function recordResearchTrial() {
  const trial = state.research.currentTrial;
  if (!trial) return;
  const condition = currentCondition();
  const log = {
    participant_id: state.research.participantId,
    study_question: els.studyQuestion.value,
    condition: condition.key,
    condition_label: condition.label,
    trial_number: trial.trialNumber,
    scenario_key: trial.scenarioKey,
    scenario_name: trial.scenarioName,
    persona_country: trial.country,
    persona_isocode: trial.isocode,
    country_visible: condition.showCountry ? "visible" : "hidden",
    traits_visible: condition.showTraits ? "visible" : "hidden",
    behavior_visible: condition.showBehavior ? "visible" : "hidden",
    persona_age: Math.round(trial.person.age ?? 0),
    persona_gender: trial.person.gender ?? "",
    model_prediction: trial.modelPrediction,
    model_probability: trial.modelProbability.toFixed(3),
    choice: els.choiceSelect.value,
    confidence: els.confidenceRange.value,
    trust_rating: els.trustRating.value,
    reasoning_note: els.reasonText.value.trim().replace(/\s+/g, " "),
    recorded_at: new Date().toISOString(),
  };
  state.research.logs.push(log);
  state.research.trialIndex += 1;
  renderResearchLog();
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportResearchCsv() {
  const logs = state.research.logs;
  if (!logs.length) {
    renderResearchLog();
    return;
  }
  const headers = Object.keys(logs[0]);
  const csv = [headers.join(","), ...logs.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gps-research-${state.research.participantId || "export"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderPersona() {
  const traits = activeTraits();
  const country = state.country;
  const person = state.persona;
  const age = Number.isFinite(person?.age) ? Math.round(person.age) : Math.round(country.demographics.ageMedian ?? 35);
  const gender = person?.gender === 1 ? "male" : person?.gender === 2 ? "female" : "respondent";
  const location = person?.region ? `${person.region}, ${country.country}` : country.country;
  const ranked = Object.entries(traits).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const phraseOne = traitPhrase(ranked[0][0], ranked[0][1]);
  const phraseTwo = traitPhrase(ranked[1][0], ranked[1][1]);

  els.personaName.textContent = `${country.country} persona`;
  els.personaTitle.textContent = `${age}-year-old ${gender} respondent`;
  els.personaSubtitle.textContent = location;
  els.avatar.innerHTML = `<img alt="" src="${avatarSvg({ ...person, isocode: country.isocode }, 128)}">`;
  els.countryIso.textContent = country.isocode;
  els.sampleSize.textContent = country.n.toLocaleString();
  els.personaNarrative.textContent = `This simulated respondent is ${phraseOne} and ${phraseTwo}. The persona is anchored in an individual GPS record, then exposed through editable country-standardized preference scores.`;

  renderControls();
  renderTraitBars(traits);
  drawRadar(traits);
  renderScenario(traits);
  renderComparison();
  if (!state.globalPeople.length) {
    createGlobalCohort();
    runGlobalRound();
  } else {
    drawGlobalField();
    renderInteractionFeed();
  }
  if (!state.scenePeople.length) resetScenePeople(false);
  startSceneLoop();
  renderClassroomMode();
  renderResearchMode();
}

function selectCountry(isocode) {
  state.country = state.data.countries.find((country) => country.isocode === isocode) ?? state.data.countries[0];
  els.countrySelect.value = state.country.isocode;
  els.ageInput.value = Math.round(state.country.demographics.ageMedian ?? 35);
  choosePersona();
  renderPersona();
}

async function init() {
  const response = await fetch(DATA_URL);
  state.data = await response.json();
  state.data.countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.isocode;
    option.textContent = country.country;
    els.countrySelect.appendChild(option);
  });

  els.countryCount.textContent = state.data.source.countries.toLocaleString();
  els.recordCount.textContent = state.data.source.individualRecords.toLocaleString();
  selectCountry("USA");
  if (state.country.isocode !== "USA") selectCountry(state.data.countries[0].isocode);

  els.countrySelect.addEventListener("change", () => selectCountry(els.countrySelect.value));
  els.generatePersona.addEventListener("click", () => {
    choosePersona();
    renderPersona();
  });
  els.scenarioSelect.addEventListener("change", renderPersona);
  els.cohortSize.addEventListener("change", () => {
    createGlobalCohort();
    runGlobalRound();
    renderClassroomMode();
  });
  els.interactionMode.addEventListener("change", runGlobalRound);
  els.runGlobalRound.addEventListener("click", () => {
    runGlobalRound();
    renderClassroomMode();
  });
  els.sceneSetting.addEventListener("change", () => {
    resetScenePeople(false);
    startSceneLoop();
  });
  els.pauseScene.addEventListener("click", () => {
    state.scenePaused = !state.scenePaused;
    els.pauseScene.textContent = state.scenePaused ? "Resume" : "Pause";
  });
  els.resetScene.addEventListener("click", () => {
    resetScenePeople(false);
    state.scenePaused = false;
    els.pauseScene.textContent = "Pause";
    startSceneLoop();
  });
  els.startClassroom.addEventListener("click", () => {
    createGlobalCohort();
    runGlobalRound();
    resetScenePeople(false);
    startSceneLoop();
    renderClassroomMode();
    els.classroomSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.startResearch.addEventListener("click", () => {
    renderResearchMode();
    els.researchSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.advanceRound.addEventListener("click", advanceClassroomRound);
  els.newMission.addEventListener("click", () => {
    state.missionIndex = (state.missionIndex + 1) % missions.length;
    renderClassroomMode();
  });
  els.assignTeams.addEventListener("click", () => {
    createGlobalCohort();
    runGlobalRound();
    renderClassroomMode();
  });
  els.clearHistory.addEventListener("click", () => {
    state.history = [];
    renderHistory();
  });
  els.newParticipant.addEventListener("click", () => {
    els.participantId.value = `anon-${Date.now().toString().slice(-6)}`;
    state.research.condition = "not_started";
    state.research.trialIndex = 0;
    state.research.currentTrial = null;
    renderResearchMode();
  });
  els.beginStudy.addEventListener("click", beginResearchStudy);
  els.nextTrial.addEventListener("click", nextResearchTrial);
  els.recordTrial.addEventListener("click", recordResearchTrial);
  els.exportResearch.addEventListener("click", exportResearchCsv);
  els.ageInput.addEventListener("change", () => {
    choosePersona();
    renderPersona();
  });
  els.genderSelect.addEventListener("change", () => {
    choosePersona();
    renderPersona();
  });
  els.resetTraits.addEventListener("click", () => {
    state.overrides = {};
    renderPersona();
  });
  els.traitControls.addEventListener("input", (event) => {
    const trait = event.target?.dataset?.trait;
    if (!trait) return;
    state.overrides[trait] = Number(event.target.value);
    const output = document.querySelector(`#value-${trait}`);
    if (output) output.textContent = format(state.overrides[trait]);
    renderTraitBars(activeTraits());
    drawRadar(activeTraits());
    renderScenario(activeTraits());
  });
}

init().catch((error) => {
  console.error(error);
  els.personaName.textContent = "Could not load dataset";
  els.personaNarrative.textContent = "Start a local static server from this folder so the app can fetch public/gps_persona_data.json.";
});
