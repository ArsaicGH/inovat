# INOVAT - Bảo tàng Cách mạng Công nghiệp

A browser-based 3D virtual museum about the four Industrial Revolutions, made by a school group.
Visitors walk through a central rotunda into four era rooms (21 inventions, each with a 3D model,
a text board, a picture and its sources), then repair the Time Machine in the Game Room to open
the portal to the ending film. Bilingual: Vietnamese (default) and English.

Live site: https://inovat-museum.vercel.app - full plan and status: [PLAN.md](PLAN.md).

## Play

- **Computer:** WASD to walk (Shift to run), the mouse, touchpad or arrow keys to look, E or a
  click to open an exhibit, Q for the map, Space for the list of keys, Esc for the pause menu
  (settings).
- **Phone or tablet:** hold it sideways; a joystick to walk, drag to look, tap to open.
- The graphics level (pause menu, or the gear on the title screen) is chosen automatically at
  start-up; Low suits older laptops and phones.

## Run it locally

```
npm install
npm run dev      # opens at http://localhost:5173
npm run build    # check for errors before every commit
```

To try it on a phone on the same Wi-Fi: `npx vite --host --port 5180`, then open the laptop's
Wi-Fi address and port 5180 on the phone.

## Testing switches (address bar)

| Switch | What it does | Where |
|---|---|---|
| `?devmode` | Everything unlocked from the start (all rooms, the Game Room, the portal), the FPS counter and the timing readout | Live site (always on locally) |
| `?stats` | Only the timing readout: frame times, resolution, draw calls, triangles, graphics chip | Live site |
| `?touch` | The phone version on a computer (on-screen controls, touch wording) | Locally, or with `?devmode` |
| `?dpr=1`, `?aa=0`, `?shadows=0`, `?fx=0`, `?ao=0` | Turn off sharpness, edge smoothing, shadows, glow or ambient occlusion, to find what slows frames down | Locally, or with `?devmode` |

Switches combine with `&`, for example `?devmode&touch`.

## How it is built

- **Stack:** React, TypeScript, Vite, three.js with React Three Fiber and drei, Zustand for the
  game state, postprocessing for the glow, edge smoothing and ambient occlusion.
- **Folders:** `src/world/` the 3D museum, `src/ui/` the interface and the Time Machine game,
  `src/content/` every visible text in both languages, `public/` models, textures, pictures,
  sounds and fonts.
- **Assets:** models are glTF with meshopt geometry and KTX2 textures (each under 2 MB); about
  24 MB loads before the title screen, and each room's music streams when you enter it. Large
  files are cached by the browser for an hour (`vercel.json`).
- **Text on boards** is drawn as real text in a last step at the screen's full sharpness, so it
  stays crisp at every graphics level (`src/world/sharp-text.tsx`).

## Style guide

**Mood.** A grand, luxurious museum. The central rotunda is a Victorian dome hall that sets the
scene; each era room has its own atmosphere, from historical (CMCN 1) to futuristic (CMCN 4).
Glow comes from self-lit materials and a bloom effect, not from many real lights.

**Font.** Be Vietnam Pro (full Vietnamese support), bundled in `public/fonts`.
Weights: 700 titles, 600 summaries and buttons, 400 body text.

**Boards by era.** CMCN 1 brass and parchment; CMCN 2 white enamel with a navy border; CMCN 3 a
dark green screen with scan lines and a neon edge; CMCN 4 see-through cyan hologram glass. The
intro hall, rotunda and Game Room use cream paper in dark wood and gold.

**Interface.** Dark glass with thin gold borders and gold pill buttons that glow on hover; the
Time Machine window is ivory and gold.

**Performance rules.** Pixel ratio at most 1.5 on computers and 2 on phones; one shadow-casting
light (more only at Ultra); rooms behind closed doors are not drawn; textures 1024 px or smaller;
models about 2 MB or less.

## Credits

Every font, texture, picture, sound and model is listed with its author and licence in
[src/content/credits.ts](src/content/credits.ts); the intro hall's "Ghi công / Credits" board
shows them in the museum. The team is listed on the "Nhóm thực hiện / Our Team" board
([src/content/team.ts](src/content/team.ts)).
