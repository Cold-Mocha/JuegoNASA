# Michinautas

A 2D web game for the **Build a Junior Astronaut Mission Trainer** challenge of the **NASA Space Apps Challenge 2026** (Temuco, Chile), made by a team of engineering students from Universidad de La Frontera.

Children aged 7 to 12 arrive at a base on the surface of the Moon as an animal crew member (the first one: an **astronaut michi**, a cat) and keep it running. They walk between rooms, do tasks and decide how to spend resources that are never enough for everything. **No decision is free**: that is how they learn the real trade-offs that astronauts and mission planners face.

> Status: playable from start to finish, in Spanish and English (November 15, 2026). Versión en español: [`README.md`](README.md).

## Datasets used

| Dataset | What it does in the game | Where you see it | Link |
|---|---|---|---|
| **NASA DONKI** (solar flares) and NASA / NOAA SWPC reports | Three real weeks of the Sun are the "weather" of the missions: each flare lands on its real day and time, and its GOES class sets how much radiation arrives | Station: each flare warning with its date, the source at the bottom of the HUD, the "with shield / outside" comparison. Final report. Science archive | [api.nasa.gov](https://api.nasa.gov/) · [NOAA SWPC](https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts) |
| **Zhang et al. 2020**, *Science Advances* (Chang’e 4) | Background radiation on the lunar surface: the bar goes up a little every day even with no flares | Radiation bar; archive card "Radiation on the lunar surface" | [doi:10.1126/sciadv.aaz1334](https://doi.org/10.1126/sciadv.aaz1334) |
| **NASA Moon Fact Sheet** | Lunar gravity for the jump (1.62 m/s²) and the 7-day light cycle (3 of daylight, 1 of dusk, 3 of night with no solar power) | The michi's jump; HUD clock; archive cards | [nssdc.gsfc.nasa.gov](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) |
| **Earth–Moon delay** (384,400 km / c) | The antenna and the solar forecast answer after 2.56 s, the real round trip of the signal | Communications room; archive card "Messages that take time" | [NASA: Communicating with Missions](https://www.nasa.gov/communicating-with-missions/) |
| **NASA OSDR** | Recommended reading only: no number in the game comes from it, and the card says so | Science archive | [osdr.nasa.gov](https://osdr.nasa.gov/bio/) |

The flares are a **historical archive, not live data**, and the game says so on screen. They have not yet been checked against the DONKI API (it did not respond in two attempts); the values come from public NASA and NOAA reports. Details in [`SOURCES.md`](SOURCES.md) (Spanish).

## How it answers the challenge

| What the challenge asks | How the game covers it |
|---|---|
| Manage an outpost on the Moon or Mars | The **Central Station**, a fictional base on the lunar surface. |
| Real trade-offs; no free option | Shielding against a flare uses energy, and with no energy it protects only half. At night the panels produce nothing and pedaling trades food for energy. Going outside gives science and adds radiation. The solar forecast costs energy and only arrives while the antenna is in good shape. |
| 2–3 core resources, not overwhelming | 5 bars (energy, oxygen, food, health and radiation); equipment only shows up in the HUD when it fails, and the tutorial teaches 3 controls. |
| Real NASA data, cited in the game | Real weeks of solar flares stored in the game and labeled as historical; the source is always at the bottom of the HUD and in each warning. |
| Replayable, learn from mistakes without punishment | Random dust storms and hull cracks, 3 missions and 3 difficulty levels. The report explains the real cause, and "Try again" goes straight back to the station. |
| Browser, no downloads or accounts | Static site; no sign-up and no data collection. Progress is saved only on the device. |
| Ages 7–12, simple language | Short texts, flare sizes in plain words ("huge (X9.0)"), a hint inside every minigame, icons as well as colors. |

## The three missions

| Mission | Real week of the Sun | Its own object |
|---|---|---|
| Moon garden (level 1) | December 2–8, 2019: solar minimum, no strong flares | Algae tank |
| Energy from the Sun (level 2) | May 8–14, 2024: 8 X-class flares, the storm that brought auroras to southern Chile | Test solar panel |
| Ice on the Moon (level 3) | September 29 – October 5, 2024: X7.1 and X9.0 flares | Ice drill |

Winning all three unlocks the final mission, "Home": turn, brake, re-enter and glide to the Mataveri runway on Rapa Nui, which NASA lengthened in 1987 as an emergency landing site for the space shuttle.

## Run it

```bash
cd juego
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + static build in dist/
npm run preview    # serves dist/ (http://localhost:4173)
```

Requires Node 20.19+ or 22.12+. Keyboard: WASD or arrows to walk, E to use a machine, Shift to dash, Space to jump, M for the map, Esc to pause. Mouse and touch also work.

## Stack

Phaser 4 + TypeScript (strict) + Vite. The simulation lives in `juego/src/sim/` as pure TypeScript with no engine code; menus and HUD are HTML/CSS over the canvas. Texts are in `juego/src/data/locales/` (Spanish and English) and are read through `t()` in `juego/src/core/i18n.ts`.

## What is simulated

The 0–100 resource scale and the game dose of each flare are simplifications; the dose grows with the logarithm of the real X-ray flux. The Central Station is fictional. Seven game days compress one full lunar day. No NASA logos or insignia are used: the game uses open NASA data and images, and NASA does not endorse this project.

## Known gaps

- The flare archive still has to be checked against DONKI once the API responds.
- The balance unit tests were written for the previous rules and need updating.
- Food, energy and shielding values are estimates that still need tuning with children.

More documents (in Spanish): [`GDD.md`](GDD.md) for the design, [`SOURCES.md`](SOURCES.md) for every source.
