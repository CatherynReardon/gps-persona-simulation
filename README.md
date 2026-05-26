# GPS Persona Simulation

Interactive classroom and research simulation built from the Global Preferences Survey country-level and individual-level datasets.

## What It Includes

- Persona generation from country and individual survey data
- Global interaction simulation
- Animated live role-play scene
- Classroom Mode with missions, role cards, rounds, and reflection prompts
- Research Mode with randomized information conditions and CSV export

## GitHub Pages

This app is static. It can be hosted directly on GitHub Pages.

Required files and folders:

- `index.html`
- `assets/`
- `public/`
- `.nojekyll`

The original `.dta` source files and scripts are not required for GitHub Pages unless you want to regenerate the JSON data.

## Local Preview

From this folder:

```powershell
python -m http.server 8787
```

Then open:

```text
http://localhost:8787/index.html
```
