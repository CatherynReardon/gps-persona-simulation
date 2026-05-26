# CreateAI at ASU Setup Guide

This project can be used with ASU CreateAI in two complementary ways:

1. **Static web app**: the interactive simulation itself, hosted through GitHub Pages or another static web host.
2. **CreateAI Builder assistant**: an ASU-facing course/research assistant that explains the simulation, guides role play, supports research protocols, and helps students interpret exported CSV results.

CreateAI Builder is best used as the guided AI layer around the simulation. The simulation is a browser app; the CreateAI assistant can link to it and use uploaded class materials to support students.

## Recommended Setup

### 1. Host the Simulation

Deploy the static site files:

- `index.html`
- `assets/`
- `public/`
- `.nojekyll`
- `README.md`

The easiest public option is GitHub Pages. After publishing, copy the live URL.

### 2. Create a CreateAI Builder Project

In CreateAI Builder:

1. Start a new project.
2. Choose a course helper, assignment helper, or blank assistant template.
3. Name it something like `GPS Persona Simulation Coach`.
4. Add the hosted simulation URL as the primary student link.
5. Upload the student guide Word file:
   - `outputs/GPS_Persona_Simulation_Student_Research_Guide.docx`
6. Optionally upload:
   - this setup guide
   - the assignment prompt
   - your syllabus module page
   - a research protocol handout

### 3. Suggested Assistant Instructions

Copy this into the CreateAI Builder instructions/system prompt area:

```text
You are the GPS Persona Simulation Coach for an ASU course activity.

Your job is to help students use the GPS Persona Simulation responsibly for role play and simple classroom research.

You should:
- Explain how to use Persona Mode, Global Interaction Field, Live Role-Play Scene, Classroom Mode, and Research Mode.
- Help students form evidence-based role-play decisions using the six GPS preference traits: patience, risk taking, positive reciprocity, negative reciprocity, altruism, and trust.
- Remind students that personas are simulated from survey data and do not represent every person from a country.
- Encourage students to distinguish individual personas from country-level averages.
- Help students create research questions, hypotheses, and short mini research reports.
- Help students interpret exported CSV results at a basic classroom level.
- Ask students to avoid names or sensitive personal information in research logs.
- Refuse to rank countries or cultures as better or worse.
- Redirect stereotyping language into careful, evidence-based interpretation.

When students ask what to do next, give short step-by-step instructions.
When students ask for research help, ask what condition, scenario, and outcome variable they are using.
When students ask for interpretation, emphasize limitations, uncertainty, and ethical use of data.
```

### 4. Knowledge Base Files to Upload

Upload these first:

- `outputs/GPS_Persona_Simulation_Student_Research_Guide.docx`
- `README.md`
- `CREATEAI_ASU_SETUP.md`

Do not upload the raw individual-level `.dta` files unless you have approval and a clear reason. The simulation already uses a prepared browser JSON file.

### 5. Suggested Student Launch Message

```text
Welcome. Open the simulation link first. Then return here if you need help choosing a persona, understanding traits, running Classroom Mode, using Research Mode, or writing your mini research report.

Remember: the personas are simulated from survey data. Use them to reason about behavior and data interpretation, not to stereotype countries or cultures.
```

### 6. Suggested Research Framing

Good classroom research question:

> Does showing country labels change how participants judge trust, cooperation, or fairness compared with showing trait profiles alone?

Suggested variables:

- Independent variable: information condition shown in Research Mode
- Dependent variables: participant choice, trust rating, confidence, reasoning note
- Qualitative coding: whether the reasoning note references country, traits, avatar, scenario, or observed behavior

### 7. Privacy and Ethics Notes

- Use anonymous participant IDs.
- Do not collect names or sensitive personal details.
- Treat the exported CSV as course/research data.
- Follow ASU and instructor guidance for human subjects research if findings will be published or presented beyond normal classroom use.
- Keep the focus on interpretation and model limits, not cultural ranking.

