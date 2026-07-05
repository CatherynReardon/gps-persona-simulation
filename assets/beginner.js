const DATA_URL = "public/gps_persona_data.json";

const traitLabels = {
  patience: "Time preference / delayed reward",
  risktaking: "Risk preference",
  trust: "Trust",
  altruism: "Altruism",
  posrecip: "Positive reciprocity",
  negrecip: "Negative reciprocity",
};

const scenarios = {
  investment: {
    label: "Risky investment",
    driver: "risktaking",
    positive: "accept the risky opportunity",
    negative: "choose the safer option",
    prompt: "A project has meaningful upside, but the outcome is uncertain.",
  },
  delay: {
    label: "Delayed reward",
    driver: "patience",
    positive: "wait for the larger future reward",
    negative: "take the smaller immediate reward",
    prompt: "The persona can receive a smaller reward now or wait for a larger reward later.",
  },
  trust: {
    label: "Trust game",
    driver: "trust",
    positive: "extend trust first",
    negative: "ask for safeguards before trusting",
    prompt: "A partner asks for cooperation before proving they will reciprocate.",
  },
  favor: {
    label: "Favor exchange",
    driver: "posrecip",
    positive: "return the favor generously",
    negative: "keep the exchange minimal",
    prompt: "Someone has helped the persona, creating a chance to reciprocate.",
  },
  donation: {
    label: "Donation appeal",
    driver: "altruism",
    positive: "give meaningful support",
    negative: "decline or give only a little",
    prompt: "A credible cause asks for support with no direct personal return.",
  },
  conflict: {
    label: "Conflict response",
    driver: "negrecip",
    positive: "punish unfair behavior",
    negative: "let the slight pass",
    prompt: "Someone behaves unfairly, and the persona can respond at a personal cost.",
  },
};

const state = {
  data: null,
  country: null,
  person: null,
};

const els = {
  country: document.querySelector("#beginnerCountry"),
  scenario: document.querySelector("#beginnerScenario"),
  newPersona: document.querySelector("#newBeginnerPersona"),
  avatar: document.querySelector("#beginnerAvatar"),
  title: document.querySelector("#personaCardTitle"),
  meta: document.querySelector("#beginnerPersonaMeta"),
  traitBars: document.querySelector("#beginnerTraitBars"),
  decision: document.querySelector("#beginnerDecision"),
  decisionWhy: document.querySelector("#beginnerDecisionWhy"),
  buildSubmission: document.querySelector("#buildSubmission"),
  copySubmission: document.querySelector("#copySubmission"),
  submissionDraft: document.querySelector("#submissionDraft"),
  responses: ["stepOne", "stepTwo", "stepThree", "stepFour", "stepFive"].map((id) => document.querySelector(`#${id}`)),
};

function format(value) {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

function cleanTrait(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function traitLevel(value) {
  if (value >= 0.65) return "high";
  if (value <= -0.65) return "low";
  return "near average";
}

function chooseCountry(isocode) {
  return state.data.countries.find((country) => country.isocode === isocode) ?? state.data.countries[0];
}

function samplePersona(country) {
  const sample = country.sample ?? [];
  const person = sample[Math.floor(Math.random() * sample.length)] ?? { age: country.demographics.ageMedian, gender: 0, region: "sample", traits: country.traits };
  return {
    ...person,
    age: Math.round(person.age ?? country.demographics.ageMedian ?? 35),
    gender: person.gender === 1 ? "female" : "male",
    traits: Object.fromEntries(
      state.data.traits.map(({ key }) => [key, cleanTrait(person.traits?.[key], country.traits?.[key] ?? 0)]),
    ),
  };
}

function strongestTrait(traits) {
  return Object.entries(traits).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
}

function decisionFor(person, scenarioKey) {
  const scenario = scenarios[scenarioKey];
  const driverValue = cleanTrait(person.traits[scenario.driver]);
  const choice = driverValue >= 0 ? scenario.positive : scenario.negative;
  return {
    scenario,
    driverValue,
    choice,
  };
}

function avatarMarkup(person, country) {
  const [trait, value] = strongestTrait(person.traits);
  const hue = value >= 0 ? 167 : 4;
  const initials = country.isocode;
  return `
    <svg viewBox="0 0 120 120" role="img" aria-label="Simulated persona avatar">
      <rect width="120" height="120" rx="18" fill="hsl(${hue}, 44%, 92%)"></rect>
      <circle cx="60" cy="44" r="24" fill="hsl(${hue}, 36%, 62%)"></circle>
      <path d="M24 108c5-26 20-40 36-40s31 14 36 40" fill="hsl(${hue}, 42%, 45%)"></path>
      <text x="60" y="101" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">${initials}</text>
      <title>${traitLabels[trait]} is ${traitLevel(value)}</title>
    </svg>
  `;
}

function renderTraitBars(person) {
  els.traitBars.innerHTML = state.data.traits
    .map(({ key }) => {
      const value = cleanTrait(person.traits[key]);
      const pct = Math.max(4, Math.min(100, ((value + 2.8) / 5.6) * 100));
      return `
        <div class="beginner-trait-row">
          <div>
            <b>${traitLabels[key] ?? key}</b>
            <span>${traitLevel(value)} (${format(value)} compared with global average 0.00)</span>
          </div>
          <div class="beginner-bar"><span style="width:${pct}%"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderPersona() {
  const country = state.country;
  const person = state.person;
  const scenarioKey = els.scenario.value;
  const result = decisionFor(person, scenarioKey);
  const [topTrait, topValue] = strongestTrait(person.traits);

  els.avatar.innerHTML = avatarMarkup(person, country);
  els.title.textContent = `${country.country} persona`;
  els.meta.textContent = `${person.age}-year-old ${person.gender} respondent from ${person.region ?? "the country sample"}. Strongest trait clue: ${traitLabels[topTrait]} is ${traitLevel(topValue)}.`;
  renderTraitBars(person);
  els.decision.textContent = `In this scenario, the persona is more likely to ${result.choice}.`;
  els.decisionWhy.textContent = `${result.scenario.prompt} The main data clue is ${traitLabels[result.scenario.driver].toLowerCase()}, which is ${traitLevel(result.driverValue)} for this simulated persona (${format(result.driverValue)}).`;
}

function generatePersona() {
  state.country = chooseCountry(els.country.value);
  state.person = samplePersona(state.country);
  renderPersona();
}

function buildSubmission() {
  const country = state.country?.country ?? "selected country";
  const scenario = scenarios[els.scenario.value]?.label ?? "selected scenario";
  const responses = els.responses.map((input) => input.value.trim() || "[write your response here]");
  els.submissionDraft.value = [
    "Psych Data Explorer Submission",
    "",
    `Persona context: ${country}`,
    `Scenario: ${scenario}`,
    "",
    `1. Pick one persona: ${responses[0]}`,
    `2. First prediction: ${responses[1]}`,
    `3. Strongest trait clue: ${responses[2]}`,
    `4. Test the prediction: ${responses[3]}`,
    `5. Research reflection: ${responses[4]}`,
    "",
    "Ethics note: This simulated persona is a learning tool based on survey patterns. It should not be used to stereotype real people or assume all people from a country think the same way.",
  ].join("\n");
}

async function copySubmission() {
  if (!els.submissionDraft.value.trim()) buildSubmission();
  try {
    await navigator.clipboard.writeText(els.submissionDraft.value);
    els.copySubmission.textContent = "Copied";
    window.setTimeout(() => {
      els.copySubmission.textContent = "Copy Response";
    }, 1400);
  } catch {
    els.submissionDraft.focus();
    els.submissionDraft.select();
  }
}

async function init() {
  const response = await fetch(DATA_URL);
  state.data = await response.json();
  els.country.innerHTML = state.data.countries
    .map((country) => `<option value="${country.isocode}">${country.country}</option>`)
    .join("");
  els.country.value = state.data.countries.some((country) => country.isocode === "USA") ? "USA" : state.data.countries[0].isocode;
  state.country = chooseCountry(els.country.value);
  state.person = samplePersona(state.country);
  renderPersona();

  els.country.addEventListener("change", generatePersona);
  els.scenario.addEventListener("change", renderPersona);
  els.newPersona.addEventListener("click", generatePersona);
  els.buildSubmission.addEventListener("click", buildSubmission);
  els.copySubmission.addEventListener("click", copySubmission);
}

init().catch(() => {
  els.title.textContent = "Could not load the GPS dataset";
  els.meta.textContent = "Try refreshing the page or opening the full simulation.";
});
