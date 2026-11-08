# Chart library comparison

Open `index.html` directly in a normal browser. It bundles all JavaScript and data and needs no CDN, API, database, or Next.js server. A local HTTP server can also serve this directory for the Codex preview.

Twelve charts: three matched chart sets using Observable Plot, visx, Vega-Lite, and Recharts. The library versions are pinned in package.json. Source is in charts.jsx; presentation is in style.css.

Data comes from ../ai-dilemmas/analysis/data/exp1_answers.csv and dilemmas.json. `python3 export.py` regenerates data.json. Outcome letters refer to stable labels, not shuffled questionnaire positions. Answered trials only, GLM excluded to match my_charts.ipynb. No database credentials are read. Human results are omitted because they require a live database query in the notebook.

The heatmap and dumbbell are adaptations of the notebook's choice-share calculations, not pixel reproductions of notebook figures. The four-option lifeboat follows its share calculation. The comparison is intentionally themed consistently rather than showing library defaults. visx uses SVG title tooltips; the other three use their tooltip implementations. Charts are not a benchmark of download or runtime performance.

To rebuild independently:

```sh
cd chart-comparison
npm install
npm run export
npm run build
python3 -m http.server 8765 --bind 127.0.0.1
```

This experiment has its own package.json; it does not add dependencies to the site application. The initial build can also resolve the temporary dependency installation at /tmp/chartbook-libraries/node_modules.
