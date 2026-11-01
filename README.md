# CICFA · MONITOR

**Cultural Infrastructure Critical Failure Attack — a live world-monitor for the art project [CICFA](https://github.com/boris-maker/CICFA) (Deep Web Gallery).**

A pure-terminal surveillance console that *stages* the aesthetic, symbolic and
procedural logic of a cyber-attack on the world's cultural institutions. 2,707 art
institutions worldwide are targets; a roster of speculative-exploit "operations"
(BOYCOTTWARE™, META_RANSOM, MERCADO_CENTRAL, MANIFESTO.EXE…) launch simulated
strikes that stream across a minimal line-map / globe in real time, with a live
intercept feed and a fast raw signal buffer.

> **This is an artwork and a simulation.** It is *about* violence, not violent — it
> stages symbolic systems, not real-world harm, and performs **no** real network
> activity. Every event is synthetic theatre.

## Views
- **FLAT** — minimal thin-line world map (default).
- **GLOBE** — dark auto-rotating globe with orange geodesic activity-domes.
- **ARC / ONTOLOGY** — in progress.

## Run locally
```bash
pnpm install
pnpm dev        # http://localhost:5273
pnpm build      # typecheck + static build → dist/
```

## Stack
React + TypeScript + Vite, deck.gl (GlobeView / MapView, arcs, meshes), a
self-contained requestAnimationFrame simulation engine. Design system ported from
`vault/ASCII terminal Page2.html` — JetBrains Mono, pure black, crimson/white,
scanlines + glitch. Full brief in `DESIGN_SPEC.md`.

## Feeding real events
The simulation is the default source; `src/sim/connectors.ts` exposes a seam so
external agents can push events in (rendered identically, still no real traffic):
```js
CICFA.inject({ agentId: 'meta-ransom', vector: 'ransomware', targetId: 'malba' })
CICFA.attachWebSocketFeed('ws://localhost:8787')
```
