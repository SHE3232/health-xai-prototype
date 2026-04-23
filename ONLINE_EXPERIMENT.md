# Online Experiment Deployment

## Deploy

Use Netlify Drop:

1. Open `https://app.netlify.com/drop`
2. Upload the `dist-online-experiment` folder
3. Wait for the `*.netlify.app` URL

## Formal Experiment Entry

Use the group-specific entry links below for the real study:

- G1: `https://your-site.netlify.app/participant-entry.html?group=g1&condition=a`
- G2: `https://your-site.netlify.app/participant-entry.html?group=g2&condition=b`
- G3: `https://your-site.netlify.app/participant-entry.html?group=g3&condition=c`
- G4: `https://your-site.netlify.app/participant-entry.html?group=g4&condition=d`

Group sequences:

- G1: `A -> B -> C -> D`
- G2: `B -> C -> D -> A`
- G3: `C -> D -> A -> B`
- G4: `D -> A -> B -> C`

Formal flow:

- Pretest is completed once before Round 1
- A condition-specific post-test is completed after each round
- Final is completed once after all four conditions are finished

## Debug Single-Condition Mode

Only use this mode for debugging a single condition. Do not use it in the real experiment.

- A: `https://your-site.netlify.app/participant-entry.html?condition=a&next=none`
- B: `https://your-site.netlify.app/participant-entry.html?condition=b&next=none`
- C: `https://your-site.netlify.app/participant-entry.html?condition=c&next=none`
- D: `https://your-site.netlify.app/participant-entry.html?condition=d&next=none`

Behavior in this mode:

- Only one condition is shown
- That condition is treated as the last condition in the sequence
- The page does not represent the formal four-round experiment

## Included Pages

- `index.html`
- `participant-entry.html`
- `proto-a-start.html` to `proto-d-complete.html`
- `stimulus-a.html` to `stimulus-d.html`
- `styles.css`
- `prototype-scenarios.js`
- `input-controls.js`
- `scenario-view.js`
- `start-complete-routing.js`
