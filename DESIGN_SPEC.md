# CICFA WORLD MONITOR — Redesign Spec (Round 2)

> Durable build brief. CICFA = **Cultural Infrastructure Critical Failure Attack**,
> an art project for Deep Web Gallery. The work *stages* the aesthetic, symbolic and
> procedural logic of cyber-attacks against cultural institutions — it is **about
> violence, not violent; symbolic systems, not real-world harm; fragility as an
> aesthetic condition.** Everything in this app is simulation/theatre. No real traffic.
> Program code **DWG-CICFA-01** · maintained by **@MarketDepravation**.

Source material: `vault/` (design + view refs), `ONBOARDING_V0.7.md` (voice, at
github.com/boris-maker/CICFA), reference build github.com/koala73/worldmonitor &
bilawalsidhu/gods-eye-view.

---

## 0. What the user asked for (round 2)

1. Adopt `vault/ASCII terminal Page2.html` as the **design template** (fonts, sizes, terminal layout).
2. **Remove** "SIM.BUILD" branding.
3. Rename **Agent Roster → "CYBER WEAPONS LAB"**; give agents stronger cyber-weapon codenames; add **Network Ontology / topology**.
4. Map must be **minimal, line-based** (thin coastlines); add the dark-globe + orange geodesic-dome look. Multiple map **views**.
5. **Terminal UI on top of the map**; big-screen = zoom map out, terminal overlaid. Multiple view modes.
6. Transport pause: **remove the word "HOLD"**, keep just the two pause bars.
7. Click an event/simulation → **map zooms & pans** to it and **explains** what's happening.
8. **Data: ~100× more.** All art institutions/galleries worldwide + deep Buenos Aires/Argentina scene (Caja Negra, Arteva, …). Currently <1%.
9. **Voice:** far more thought to naming, tags, tone — "voice of the institution," develop the narrative. It's an art piece.
10. Panels: a toggle between **floating** vs **boxed "squares with backgrounds"**; a **selector menu** to choose which info is displayed.

---

## 1. Design system (from `vault/ASCII terminal Page2.html`)

- **Font:** `JetBrains Mono` (100 / 400 / 700). `-webkit-font-smoothing: none` (crisp/aliased).
- **Type:** base **11px**, line-height **1.2**, **UPPERCASE**, letter-spacing 0.5px.
- **Palette (replace the old amber/cyan):**
  ```
  --bg: #000000;         --text-main: #ffffff;  --text-dim: #666666;  --text-mid: #999999;
  --crimson: #e60026;    --pink: #ffa6bd;       --magenta: #ff0066;   --darkred: #590000;
  ```
  Keep a thin set of signal hues for vectors but bias to crimson/magenta/white/grey on **pure black**.
- **Layout language:** full-viewport CSS grid, `1fr 2fr 1fr` cols, `auto 1fr auto` rows, gap 20px, pad 40px. Header spans all cols (sys-title left, meta right). Footer spans all (crimson label + "EXECUTING PAYLOAD…" + blinking block cursor).
- **Borders:** hairline 1px only. `bracket-left` = border-left darkred + pad-left 15px; `bracket-top` = border-top dim. No glow, no blur, no rounded corners.
- **Data columns:** streaming monospace rows (ADDR / LN / OPCODE / OPERANDS style), mask-fade at top, fill from bottom (`justify-content: flex-end`), cap N rows.
- **FX:** scanline overlay (`body::after`, 4px repeating, opacity ~0.3); occasional vertical glitch stripes (crimson/pink/magenta, `mix-blend: screen`, pulse) and horizontal 1px "tears" sweeping. Subtle. Block cursor blink 1s step-end.
- **Aesthetic:** 1960s mainframe assembly dump × deep-web ransom console. "SYS.OP.OVERRIDE // MALWARE_EXEC", "EXECUTING PAYLOAD…".

## 2. The four map / data **views** (view selector, top-level)

From `vault/` images:

1. **GLOBE** (`image 1`): near-black globe, thin white Natural-Earth coastlines + faint graticule, **orange/crimson geodesic hemisphere "domes"** sitting on the surface, **sized by activity** (base area = volume), thin AS-link arcs, small dots for minor nodes. Bottom overlay: big live counter + **time-series sparkline** + legend captions. Restrained, data-journalism.
2. **FLAT / MINIMAL** (current map, stripped down): thin-line coastlines only (no filled landmasses, no labels unless hovered), crimson arcs + packets. The Palantir view, minimalized.
3. **ARC FIELD / "ZOOM"** (`map zoom.jpg`): dramatic zoomed view — attack arcs become **white hairline béziers** bursting from a source cluster, targets marked with ✕ / + and **coded micro-labels** ("BIO_C 34%" → e.g. "MALBA · FRAGILITY 34%"), with **big editorial sans/mono institution names** as typographic anchors. Gallery-poster energy.
4. **NETWORK ONTOLOGY / TOPOLOGY** (`network topology.jpg`): non-geographic **force-directed node-link graph** of the CICFA network. Node types (with legend): **institution**, **operation** (agent/weapon), **vector**, **scene** (city/movement), **bounty**. Edges: *targets, employs, belongs-to, mirrors, cascades-into*. Labeled boxes, thin links, a dotted boundary, legend top-right. This is the "network ontology" the user wants — ties to the doc's ontology refs (Against Digital Ontology, Fractal Ontology).

Plus two **unreviewed vault refs to fold in:** `alternative view.jpg`, `alternative view 2.jpg`, `ui ideas.jpg` (review and extend views/panels accordingly).

### Chrome toggles
- **View selector** (GLOBE · FLAT · ARC · ONTOLOGY) — top bar segmented control.
- **Panel mode** toggle: `FLOAT` (hairline, transparent, terminal-on-top) ↔ `BOXED` (solid `#000` squares w/ borders, the grid layout).
- **Info selector menu:** choose which panels/data are shown (checklist) — composable dashboard.
- Terminal overlays **on top** of the map at all times; big-screen mode = map zoomed out, panels overlaid.

## 3. Voice & naming (from `ONBOARDING_V0.7.md`)

Reframe generic "cyber" terms into CICFA's **institutional-critique** language. The attack = *"take down the **symbolic architecture** of [INSTITUTION]."*

### Clearance / status chrome (use everywhere)
- PROGRAM CODE: **DWG-CICFA-01** · MAINTAINED BY **@MarketDepravation**
- CLEARANCE: **PUBLIC / RESTRICTED / INTERNAL / BLACK**
- STATUS: **DRAFT / ACTIVE / DORMANT / ARCHIVED / COMPROMISED**

### CYBER WEAPONS LAB — operations (rename agents)
Codenames drawn from the doc's draft labels + net.art lineage. Each is an instrument with a class:
| codename | class | what it stages |
|---|---|---|
| `BOYCOTTWARE™` | ransom/boycott | locks the institution's symbolic value |
| `META_RANSOM` | hijack | high-fidelity mirror; page lock; countdown to nothing |
| `MERCADO_CENTRAL` | darknet broker | trades institutional vulnerabilities (Art-as-a-Service) |
| `CODE_PASTA` | flood/spam | copypasta list flood of channels |
| `IRONIC_DDOS` | ddos | volumetric saturation, ironically |
| `MANIFESTO.EXE` | defacement | manifestos replace curatorial text |
| `PROVENANCE_WORM` | exfil | siphons provenance / donor lists / archives |
| `NULL_CURATOR` | intrusion | dissolves curatorial authority |
| `DEAD_DROP` | beacon/implant | conceptual implant, callbacks |
| `CASCADE_07` | recon/cascade | maps power flows; simulates cascade failure |

### Vectors (reframed)
RECONNAISSANCE (power-flow mapping) · SYMBOLIC BREACH · PROVENANCE EXFIL · META-RANSOM HIJACK · MANIFESTO INJECTION · IRONIC DDOS · CODE-PASTA FLOOD · CONCEPTUAL IMPLANT · DEAD-DROP BEACON · CURATORIAL CONTRADICTION · GOVERNANCE FAILURE · CASCADE FAILURE · MIRROR/CLONE · COUNTDOWN-TO-NOTHING.

### Outcomes (reframed)
`COMPROMISED` · `CONTAINED` · `DORMANT` · `ARCHIVED` · `SYMBOLIC ARCHITECTURE DOWN` · `BOUNTY OPEN`.

### Event-stream line (new voice)
`DWG-CICFA-01 ▚ META_RANSOM → symbolic architecture of {MALBA} ▚ page lock · countdown to nothing ▚ CLEARANCE:BLACK ▚ COMPROMISED`
On click → the institution's own curatorial text appears **scrambled/redacted**, a non-resolving countdown, a fake data-leak sample, a manifesto fragment (the "voice of the institution" dissolving).

### Threat telemetry (reframed tiles)
INSTITUTIONAL FRAGILITY INDEX · SYMBOLIC INTEGRITY · CONCEPTUAL EXPLOITS · BOUNTIES OPEN · CASCADE DEPTH · MANIFESTOS INJECTED · ARCHIVES SIPHONED (GB) · COUNTDOWNS RUNNING.

### Institution "voice" fields (new data)
Add to each institution: `blurb` (one-line), `tags`, `scene` (blue-chip / artist-run / biennial / underground / institutional), and at runtime a generated `manifesto`/`redacted curatorial line` + `fragility %`.

## 4. Interaction

- **Click event (feed / map / ticker)** → `flyTo` the target (zoom + pan, eased), pulse it, open a **dossier** that explains the exploit in CICFA voice (what the weapon does, the staged effect, clearance, bounty). Works across all views (globe rotates to it; ontology centers its node).
- Click institution node → dossier (fragility, history, primary aggressor, scene, scrambled curatorial text).
- Click operation → its targets light up; solo; "DEPLOY" (was Fire).
- Transport: **just `❚❚` / `▶`**, no "HOLD" word. Speed ×0.5–×5. Remove old amber styling.

## 5. Data expansion (research agent running in background)

Writes `src/data/institutions.expanded.json` — Wikidata bulk (museums + galleries w/ coords) + deep BA/Argentina + LatAm curation (Caja Negra, Arteva, Ruth Benzacar, Barro, MALBA, Moderno, PROA, arteBA, BIENALSUR, …). New schema adds `tags`, `blurb`, `scene`, `source`. Engine must load JSON, dedupe vs the seed, and keep rendering performantly at 1k–2k nodes (cluster at low zoom; cap active arcs).

## 6. Build plan (phased)

- **P1 — Design system swap:** new `global.css` tokens (black/crimson/JetBrains Mono/uppercase/hairline/scanlines/glitch). Grid chrome, header/footer, remove SIM.BUILD. Transport "HOLD" → bars only.
- **P2 — Voice pass:** new `vectors.ts`, `agents.ts` (operations), reframed event lines, telemetry tiles, clearance/status chrome, institution `blurb/tags/scene`.
- **P3 — Views:** `ViewManager` + selector. Build GLOBE (maplibre globe projection or three-globe w/ geodesic domes), FLAT (minimal), ARC-FIELD, ONTOLOGY (force graph, e.g. d3-force or custom). Panel FLOAT/BOXED toggle + info selector menu.
- **P4 — Interaction:** click→flyTo+dossier across views; scrambled curatorial text, countdowns, fake leak samples.
- **P5 — Data:** ingest `institutions.expanded.json`; clustering/perf; richer target surface.
- **P6 — Polish:** sparklines, ticker, glitch tuning; exhibition/kiosk mode; verify (tsc + build + Playwright capture, 0 console errors).

Keep verifying with `node scripts/shot.mjs` (Playwright, software WebGL) — in-env chrome-devtools-axi & harness preview are broken this session.
