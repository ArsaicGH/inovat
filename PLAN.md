# PLAN.md: Virtual 3D Museum of the Four Industrial Revolutions

Working language of the team and of Claude: **English**.
Languages of the finished website: **Vietnamese and English** (leader's decision). Every visible text (panels, quiz, buttons, signs, credits) exists in both; the visitor picks one with the Tiếng Việt / English switch on the start screen or in the pause menu, and Vietnamese is the default. Both versions must read naturally, not as word-for-word translations. **Content is developed in parallel:** every new or changed text is written in both languages in the same change, never one now and the other later.

Museum name: **INOVAT** (from "innovation"; decided by the group; renamed from the earlier "INNOVA"). The GitHub repository is `inovat`; the live site is `inovat-museum.vercel.app`. Descriptive subtitle (Vietnamese): **Bảo tàng Cách mạng Công nghiệp**.

Content draft: a private Google Doc kept by the project leader. The link is deliberately not stored here because this repository is public; the leader shares it each session.

---

## 0. Rules for whoever (or whatever) works on this project

1. The user is a complete beginner. Explain every unfamiliar term and every command **before** running it.
2. Work one milestone at a time. Do not build the whole museum at once. Wait for review after each milestone.
3. Never invent historical facts or sources. Every exhibit and quiz question must be traceable to a real source that the group provided or that was looked up and cited. Mark anything uncertain as `[CẦN KIỂM TRA]` (needs checking).
4. No backend, database, paid API, AI model or API key in the product. Everything runs in the visitor's browser.
5. File names: lowercase, hyphens, no spaces, no Vietnamese diacritics (e.g. `dong-co-01.glb`).
6. All website text lives in `src/content/`, never hard-coded inside 3D or UI components.
7. Run `npm run build` before every push.

---

## 1. Project vision

A browser-based 3D museum, playable by anyone with the URL, no installation.

Six rooms around a central rotunda (layout chosen by the leader, see section 3):

| # | Area | Vietnamese name |
|---|------|-----------------|
| 1 | Introduction hall (introduction, overview, our team, credits, sources, controls) | Sảnh giới thiệu |
| 2 | First Industrial Revolution | Phòng Cách mạng Công nghiệp lần thứ nhất (CMCN 1) |
| 3 | Second Industrial Revolution | Phòng CMCN 2 |
| 4 | Third Industrial Revolution | Phòng CMCN 3 |
| 5 | Fourth Industrial Revolution | Phòng CMCN 4 |
| 6 | Educational minigame (quiz) | Phòng trò chơi |

Core features: first-person walking (WASD + mouse), collision with walls, clickable exhibits with info panels, a map menu to jump between rooms, a distinct atmosphere per era, a multiple-choice quiz with feedback, scoring and results, desktop-browser support, smooth performance on ordinary student computers, and a public URL.

**Exhibits (leader's decision).** Each of the four era rooms shows exactly **4 inventions**, the most valuable of that revolution, one in each **corner**. Each corner has an observable prototype/demonstration (3D model on a pedestal) with a descriptive, informative text panel beside it. 4 rooms x 4 = 16 inventions.

**Introduction hall (leader's decision).** Sảnh giới thiệu is the first room and holds: a basic introduction to the museum, an overview of the four Industrial Revolutions and the route through the rooms, our team (members and roles), credits (images, models, tools) and sources (the reference list). Exact sections and wording come from the group's content document once it is polished; until then each section is a placeholder panel marked `[CẦN KIỂM TRA]`.

**Look and feel (leader's decision).** Each era room is designed and decorated after its revolution, from historical (CMCN 1) to futuristic (CMCN 4). The whole museum should feel like a real, impressive *museum*, not simple graphics, while staying smooth on ordinary laptops. Realistic target: a polished, stylised museum (rich lighting, materials and atmosphere), not photorealism.

**Order of work (leader's decision).** The complete game is built first with placeholder prototypes and texts (Phase C), then real content replaces the placeholders (Phase D). See section 4.

---

## 2. Technology stack

| Tool | Role | Essential? |
|------|------|-----------|
| Node.js (+ npm) | Runs the development tools; npm downloads packages | Yes |
| VS Code | Code editor | Yes |
| Git | Version history, teamwork | Yes |
| GitHub | Online home of the project (the repository) | Yes |
| Vite | Dev server and release builder | Yes |
| TypeScript | JavaScript with type labels; catches mistakes early | Yes |
| React | Builds the interface from reusable components | Yes |
| Three.js | The 3D engine (WebGL) | Yes |
| React Three Fiber (R3F) | Lets us write Three.js scenes as React components | Yes |
| drei | Ready-made R3F helpers (pointer lock, model loading, text) | Yes |
| Zustand | Tiny shared "state store" for the 3D world and the UI | Yes |
| Vercel | Free hosting from GitHub, gives the public URL | Yes |

Optional (only if a real need appears): GitHub Desktop, `@react-three/rapier` (physics, Plan B for collision), `r3f-perf`, `leva`, gltf-transform / gltf.report (model compression), Blender, Vitest, `@react-three/postprocessing`, audio, custom domain, analytics.

Not needed: backend, database, logins, AI APIs, API keys, MCP servers, plugins, paid assets.

Versions: install the Node.js version labelled **LTS** on nodejs.org on the day of setup. Let the Vite template and npm pick current compatible versions of the other packages. If a version-mismatch error mentions `three`, `@react-three/fiber` or `@react-three/drei`, check that all three are current and compatible.

---

## 3. Architecture

Two layers stacked in one web page, connected by a shared store:

- **Layer 1, 3D world (R3F):** rooms, walls, lights, exhibits, player.
- **Layer 2, HTML interface (React):** start screen, crosshair, prompts, info panels, map menu, quiz, results.
- **Shared state (Zustand):** current mode, current room, open exhibit, quiz score.
- **Content files:** Vietnamese and English text, quiz, sources, credits (both languages side by side).

**Modes.** The app is always in exactly one mode: `start`, `exploring`, `paused`, `reading`, `map`, `quiz`, `results`. Only in `exploring` is the mouse captured and movement allowed. Every action checks the mode first.

**Museum layout (leader's decision): a 12-sided rotunda hub.**

```
                 [Phòng trò chơi]          <- top flat side (end room, locked until CMCN 1-4 visited)
      [CMCN 2]                    [CMCN 3]
                 (  Sảnh trung tâm  )      <- 12-sided rotunda, 24 m across (leader's choice)
      [CMCN 1]                    [CMCN 4]
                 [Sảnh giới thiệu]         <- bottom flat side (start room)
```

- The central rotunda (Sảnh trung tâm) is a regular 12-sided polygon with flat sides facing the start and end rooms. Doors alternate with blank walls: 6 doors, 6 blank (decorated) walls, symmetrical.
- Doors: Sảnh giới thiệu (bottom), CMCN 1 (lower left), CMCN 2 (upper left), CMCN 3 (upper right), CMCN 4 (lower right), Phòng trò chơi (top). Visiting order: clockwise.
- Every room is behind a closed sliding door with its name on a sign above; doors open when you approach. Each room has a short entry passage, so no room is visible from the rotunda.
- The 4 era doors are grand portals (taller, framed, large sign); the start and end doors are plain (lower, small sign).
- The quiz room door stays locked until all four era rooms have been visited.
- Look (M6): a grand, luxurious Victorian dome hall (coffered dome with an oculus, 12 pillars, marble floor, chandelier, decorative blank walls) that sets the scene for the four rooms.
- M key / map button: jump to any room (the quiz room only once unlocked).

Every room is built from one reusable `<Room>` component with different size, colours and lights.

### Folder structure

```
bao-tang-cmcn/
├── public/
│   ├── models/ir1/ ... ir4/
│   ├── images/ir1/ ... ir4/
│   ├── textures/
│   └── fonts/              (font with full Vietnamese support)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── content/            (ALL visible text, Vietnamese and English)
│   │   ├── rooms.ts
│   │   ├── exhibits.ts
│   │   ├── quiz.ts
│   │   └── credits.ts
│   ├── world/              (3D layer)
│   │   ├── Museum.tsx
│   │   ├── Room.tsx
│   │   ├── rooms/          (IntroHall, Room1 ... Room4, QuizRoom)
│   │   ├── Exhibit.tsx
│   │   ├── Player.tsx
│   │   └── collision.ts
│   ├── ui/                 (HTML layer)
│   │   ├── StartScreen.tsx, Hud.tsx, InfoPanel.tsx
│   │   ├── MapMenu.tsx, Quiz.tsx, Results.tsx, LoadingScreen.tsx
│   └── state/useMuseumStore.ts
├── index.html              (set lang="vi")
├── package.json
├── README.md
├── PLAN.md                 (this file)
└── CLAUDE.md               (optional, short standing rules)
```

### Exhibit data shape (simplified)

```ts
{
  id: "ir1-exhibit-01",
  room: "ir1",
  title: "…",       // in both languages: { vi: "…", en: "…" }
  summary: "…",     // 1-2 sentences, shown on approach
  body: "…",        // full panel text
  image: "/images/ir1/exhibit-01.webp",
  position: [2, 1.5, -6],
  sources: [{ title: "…", author: "…", url: "…", accessed: "…" }], // at least one required
}
```

The `Exhibit` type requires at least one source, so the build fails if one is missing.

---

## 4. Milestones and acceptance criteria

Ordered by dependency and risk: foundations, then the riskiest 3D mechanics, then **the complete game with placeholders**, then real content, then release.

**Skeleton first (leader's decision).** The whole game, including all visual polish, the quiz, menus and performance work, is finished with **placeholder** prototypes and **placeholder** texts (marked `[CẦN KIỂM TRA]`) before any real content is added. Real content in Phase D only *replaces* placeholders; it should not require new features or redesign.

### Phase A: Foundations

**M0. Tools and accounts**
Install Node.js (LTS), Git, VS Code. Create GitHub accounts for everyone and one Vercel account for the owner.
- [x] `node -v`, `npm -v`, `git --version` print a version on every member's computer. (Decision: only the leader's computer for now.)
- [x] Everyone can sign in to GitHub and has access to the repository. (Decision: only the leader for now; leader has GitHub, VS Code and Vercel accounts. The repository is created in M1.)

**M1. "Hello, museum" live on the internet**
Create the Vite React + TypeScript project, push to GitHub, connect Vercel.
- [x] A page titled "Bảo tàng Cách mạng Công nghiệp" with correct diacritics opens at the public `.vercel.app` URL, on another computer and on the school network. (Page title is now "INOVAT - Bảo tàng Cách mạng Công nghiệp". Checked from the leader's computer only; another computer and the school network are NOT tested yet, by decision. Retest before M12.)
- [x] Editing the text and pushing updates the live site within minutes. (Tested: live in about 20 seconds.)
- [x] Every member can download the project and run it locally. (Leader only, by decision: `git clone https://github.com/ArsaicGH/inovat.git`, then `npm install`, then `npm run dev`.)

### Phase B: Core mechanics (riskiest part first)

**M2. First 3D scene**: a floor, one box, lights, a camera.
- [x] Scene fills the window; resizing does not stretch it. (Measured: canvas = window size at 600x900 and 1366x768.)
- [x] No red errors in the browser console (F12). (One harmless yellow warning from inside R3F: "THREE.Clock deprecated".)
- [x] FPS counter shows around 60 fps on a member's laptop. (59 fps in the leader's dev browser; leader to confirm in Chrome.)

**M3. Walking in one test room**: start screen, mouse capture on click, WASD and arrow keys, mouse look, wall collision, Esc to pause.
- [x] Cannot pass through any wall, including diagonally into corners. (Script test: straight, both corners, sliding, pillar corner, all pass.)
- [x] Camera cannot flip upside-down. (Up/down look is capped just short of 90°; tested with an extreme mouse movement.)
- [x] Walking speed is the same on fast and slow computers. (Distance = speed x frame time. Below 10 fps walking slows on purpose, so a stutter cannot jump through a wall.)
- [x] Esc shows a pause screen; "Tiếp tục" resumes. (Leader tested in Edge; mouse capture needs a normal browser tab, not an in-app preview.)
- [x] Movement works while Unikey or EVKey is running (read physical key positions). (Works in English mode. In Vietnamese mode Unikey swallows Telex keys before the browser sees them; the page detects this and shows a warning until 4 normal key presses arrive.)

**M4. Interacting with one exhibit**: crosshair, "Nhấn E để xem" prompt (left click as a backup), info panel, back to walking.
- [x] Prompt appears only when aiming at the exhibit within about 3 m. (Tested: all 22 spots reachable from 2.8 m, none from 3.5 m; walls block aiming.)
- [x] While the panel is open: cursor visible, WASD does nothing. (Tested: holding W for 1 s with the panel open moved the camera 0 m.)
- [x] Opening and closing the panel 20 times never leaves the app stuck. (Scripted 20/20 rounds pass, alternating E and Esc, with the "mouse capture refused" fallback; leader reviewed in Edge.)

**M5. Grey-box museum and map navigation**: the 12-sided rotunda and the six rooms as plain grey boxes, each behind a closed sliding door with a sign (grand era doors, plain start/end doors), the quiz door locked until CMCN 1-4 are visited; each era room has 4 exhibit slots (one per corner: pedestal + placeholder prototype + text panel beside it); the intro hall has wall-panel slots for its sections (introduction, overview, our team, credits, sources); a spawn point per room; current room name on screen; the map menu (M key).
- [x] Can walk from Sảnh giới thiệu to Phòng trò chơi with no gaps, stuck spots or flickering walls (z-fighting). (Rotunda layout: script walks every route, closed doors block, 72 wall blocks with 0 overlaps; leader walked it in Edge.)
- [x] Teleporting places you inside the chosen room, facing the exhibits. (Tested: CMCN 4 -> lands at its entrance, facing into the room; the two far corners are in view, the near two a head-turn away.)
- [x] The map highlights the current room. (Tested: "Sảnh ... Bạn đang ở đây" highlighted; room name on screen updates after teleport.)
- [x] Every corner slot of the four era rooms can be aimed at and opened (placeholder text). (Tested: all 22 spots, including the 5 hall panels and the quiz sign.)

**Decision point after M5:** if M3-M5 proved too hard or unstable, switch to the click-to-move version (Section 8). Content, panels, map and quiz are reused unchanged; only `Player.tsx` differs.

### Phase C: The complete game with placeholders (the "skeleton")

**M6. Visual identity and themed rooms**: a shared style guide (colours, fonts, panels, signs) and one distinct, impressive atmosphere per room, balanced with performance. Direction: the hall is a welcoming museum lobby; CMCN 1 historical (brick, wood, warm lamplight); CMCN 2 steel and early electric light; CMCN 3 beige computers and fluorescent light; CMCN 4 futuristic (white glass, screens, glow); the quiz room playful. Tools: textured materials, emissive (glowing) lights, an environment map for reflections, fog, bloom, 3D signs with a bundled font that supports Vietnamese, decoration props. Placeholder prototypes on every pedestal and placeholder text on every panel. (New packages or downloads are asked for first.)
- [x] All rooms use the same UI components and fonts (full Vietnamese support, e.g. Be Vietnam Pro). (Be Vietnam Pro bundled and used everywhere.)
- [x] Each room is recognisable at a glance from lighting, materials and decoration.
- [x] Doorways and signs make the route Sảnh -> CMCN 1 -> ... -> Phòng trò chơi obvious.
- [x] Still 30 fps or more at 1080p on the leader's laptop, with at most one shadow-casting light. (Leader reviewed it running smoothly; measured again in the M9 performance pass.)
- [x] The style guide is written in README.md.

**M7. Quiz room engine (Phòng trò chơi)**: questions from `quiz.ts`, multiple choice, immediate feedback with a short explanation, scoring, results screen, retry. Uses clearly fake placeholder questions until Phase D.
- [x] An answer locks once chosen; feedback is immediate. (Tested: a second click does not change the answer.)
- [x] Score is correct in three tests: all right, all wrong, mixed. (Test script: 8/8, 0/8, 4/8; scoring lives in `src/state/quiz-score.ts`.)
- [x] Results screen offers "Làm lại" and "Quay lại bảo tàng".

**M8. Game shell**: loading screen with progress, credits screen (reads `credits.ts`), the intro hall's placeholder panels (introduction, overview of the four revolutions, our team, credits, sources, controls), the "Vui lòng dùng máy tính" message for phones/tablets, final start/pause/map screens styled to match M6.
- [x] Loading screen shows progress and disappears when the museum is ready. (One gold bar on black; waits for the textures, the font and every part being prepared for the graphics card, so the start no longer stutters; then the title screen fades in. `LoadingScreen.tsx`.)
- [x] The credits screen lists every placeholder asset with author and licence. (The intro hall's "Ghi công" board is built from `credits.ts`, so it always lists every asset with its author and licence. A separate start-screen credits button was tried and removed by the leader: the hall board is the credits screen.)
- [x] Phone/tablet visitors see "Vui lòng dùng máy tính". (Done early: `device.ts` + `DeviceMessage.tsx`; the 3D museum is not loaded on phones and tablets.)
- [x] The intro hall has a readable placeholder panel for each section: introduction, overview, our team, credits, sources. (The controls are covered by the Space key list and the tutorial.)
- [x] Every screen and sign uses text from `src/content/`. (Checked: no visible text in components, both languages.)

**M8b. Sound effects and ambience** (added by the leader: the game has no audio yet). Short, light sound files (compressed `.ogg`/`.mp3`, a few hundred KB in total for effects; looping ambience about 1 MB or less per room), each listed in `credits.ts` with author and licence (prefer CC0, e.g. freesound.org or Kenney). Plain browser audio (Web Audio / `HTMLAudioElement`); a new library only if asked first.
- Interface: click/hover on buttons, panel open and close, map open/close and teleport, language switch, tutorial step completed.
- World: footsteps while walking (faster when sprinting, matching the floor where cheap: marble, wood, concrete, tiles), sliding doors opening/closing, a short "locked" sound at the quiz door, a soft chime when a new era room is visited.
- Ambience, quiet and looping, one per area: rotunda (large hall reverb, distant murmur), CMCN 1 (steam hiss, ticking clockwork), CMCN 2 (electric hum, factory rhythm), CMCN 3 (computer fans, keyboard clicks), CMCN 4 (soft synth drone), quiz room (light, playful); cross-fades when moving between areas.
- Quiz (with M7): correct / wrong answer, results fanfare.
- [x] A single sound on/off toggle right beside the language pill, both on the start screen and in the pause menu (matching each pill's style); remembered in the browser.
- [x] Settings in the pause menu: master volume, effects volume, ambience volume; remembered in the browser.
- [x] No sound plays before the visitor's first click (browsers block it), and nothing is loud or sudden; everything pauses with the game.
- [x] Every sound file is in `credits.ts`; the total audio download stays small enough for the loading budget (CLAUDE.md asset limits).

**M9. Performance and compatibility (skeleton)**: DONE for now (leader). Not a one-off pass: performance, compatibility and graphics quality stay an ongoing task until the final release (re-checked after each content milestone, see M11). Open items below carry over.
- [ ] Automatic quality: resolution/effects drop on slow computers so frames stay smooth.
- [ ] At 1080p: 30 fps or more (target 60) on the weakest computer available.
- [ ] Tested in Chrome, Edge, Firefox (and Safari if available).
- [ ] Movement jitter (from M3): CAUSE FOUND. Windows "dynamic refresh rate" laptops switch the screen between 60 and 120 Hz after mouse movement, so the browser delivers frames in a jumpy rhythm for a few seconds (leader confirmed: with Dynamic off, a flawless 120 fps). A web page cannot control the screen's refresh rate. Tried and REMOVED: a 60 fps frame cap with an auto mode and a "Khung hình" setting (on a switching screen it ran at a jerky 40-50 fps, and visitors would mistake the setting for a quality option). Kept: movement uses the real frame time. Still open: whether to show affected visitors a short hint (leader to decide). Dev-only tools: timing readout (`FrameTimingProbe.tsx`) and address-bar switches `?dpr=1`, `?aa=0`, `?shadows=0`.
- [ ] Low-end optimisation list (leader's priority, see CLAUDE.md). Done so far, no visible change: ambient occlusion no longer draws the scene twice more per frame for see-through objects, its internal full-screen copy and the effects chain's final copy are gone, and the canvas no longer multisamples (SMAA already smooths). Measured on the leader's Radeon 780M at a full 2622x1518 window: about 9-10 ms of graphics work per frame. Next, in order (one at a time, each tested by the leader):
  1. DONE: music streamed instead of fully unpacked at load. Measured: unpacking the six music tracks took about 650 MB of memory (the leader's laptop sound runs at 96 kHz) and 4 s of processor time while loading; now only the short sounds are unpacked (about 8 MB, 0.07 s). Same volumes, fades, menu fade-out and pause when the tab is hidden; the short central-hall loop stays unpacked so it repeats without a gap.
  2. DONE (not yet measured on screen): static room decoration joined into a few meshes per room, as the rotunda already was (MergeStatic); parts that move or change are marked keepSeparate (CMCN 4 hologram, fading hall sign, quiz screen, portal door). Before: 69 draw calls per frame in the intro hall.
  3. DONE: after a window resize (e.g. full screen after loading), a machine whose resolution had to be lowered keeps the same number of pixels (lower resolution for a bigger window, back up for a smaller one, never above the first choice); machines with room to spare are not touched.
  4. DONE: smaller first download. The drei helper library is no longer shipped (reflections made with three.js alone in StudioEnvironment, loading progress in load-progress.ts; drei only for the development FPS counter), and the 3D world is a separate file: the page's first script is 268 KB (86 KB compressed) instead of 1.66 MB, so the loading screen shows at once; the 3D file (1.34 MB) loads behind it.
  5. DONE: lowest quality level only (the weakest computers): FXAA edge smoothing instead of SMAA (about a third of the work) and a 512 px shadow picture instead of 1024 px.
  6. DONE (to be tested by the leader): graphics setting in the pause menu (leader's request): one slider with five levels (Very low, Low, Medium, High, Ultra) and an "Automatic" switch, remembered in the browser. Automatic = the level measured while loading (unchanged; it never picks Ultra, since the frame rate cannot show spare power above the screen's 60 Hz). Moving the slider turns automatic off. Every level keeps all lights, bloom, colours and vignette. Very low: 0.75x resolution, no ambient occlusion, 512 px shadows only redrawn when the key light moves, FXAA. Low: 0.85x, no ambient occlusion. Medium: full resolution, no ambient occlusion. High: as before this setting (half-resolution ambient occlusion). Ultra: full-resolution ambient occlusion with 4x the samples, 2048 px soft-edged shadows redrawn every frame, and the five museum spotlights cast shadows too (leader relaxed the one-shadow-light rule for Ultra only; the whole museum is drawn once off-screen again when these switch on or off, so rooms do not stall when first entered). Changing level may freeze the picture for a moment (the menu says so).
  - Tried and removed (made the camera worse for the leader): raw mouse input, a frame pacer, mouse-report filters, switching off the 3D library's click/hover system. Found: the leader's laptop drops frames even on an empty test page (laptop/browser setting, not the game; leader chose to ignore it).
- [ ] **Skeleton complete:** a classmate can start the game, visit every room, open every placeholder exhibit and finish the placeholder quiz unaided.

**M9b. Phones and tablets** (leader: the organisation uses many tablets, mostly iPads, some Android). Built for all touch devices for now, because the leader tests on a phone; once polished, only laptops and tablets will be allowed (phones get DeviceMessage again).
- [x] Touch input: joystick bottom-left (pushed all the way = sprint), drag anywhere else to look, tap an exhibit or quiz answer to open or choose it (aimed at the tapped point), buttons top-right for map, pause and "?" (controls list). Several fingers at once.
- [x] No mouse capture on touch: Start / Continue begin walking directly (and switch Android phones to full screen).
- [x] Touch wording for every key or mouse text, both languages (`ui-touch.ts`), including the tutorial (tap to begin, joystick, tap, buttons) and the controls list.
- [x] Note asking to turn the device sideways when held upright; smaller menus on short (landscape phone) screens.
- [x] Every sound also as .m4a for Safari (iPhones, iPads); each browser downloads only the format it plays.
- [x] Phone layout fixed after the leader's first test (start screen, tutorial cards, controls list), and every screen checked by measurement at 740x360, 948x460 and 1024x768 (no real overlaps or overflow). Touch devices may draw up to 2x (CLAUDE.md); on touch, ambient occlusion is dropped before any sharpness.
- [ ] Tested on the leader's phone (first test done: 60 fps on an Adreno 740 phone); then an iPad and an Android tablet. PAUSED here at the end of the session (leader); continue from this list. Test on a phone with `npx vite --host --port 5180` and the laptop's Wi-Fi address.
- [ ] Phone/tablet quality level tuned on real devices (the automatic quality check runs as on computers).
- [ ] Restrict to laptops and tablets (phones: message).

### Phase D: Real content (needs the group's content document)

**M10. Content pipeline and one real exhibit**
- [ ] Build fails if an exhibit has no source.
- [ ] The panel shows the text and its source.
- [ ] A second member verified the text against that source.
- [ ] The credits screen lists every image and model with its licence.
- [ ] **Reminder (leader's request): the credits live on the intro hall's "Ghi công" board.** Every new image, model, sound and font goes into `src/content/credits.ts` (author, licence, source, item name in both languages); the board fills itself from that file. Also write the team's own credits (who did what) for the "Nhóm thực hiện" board, and the reference list for "Nguồn tham khảo".

**M11. All real content**: the 16 inventions (4 per era room) with their prototype models and texts, the intro hall sections (introduction, overview, our team, credits, sources), and the real quiz questions, replacing every placeholder.
- [ ] No placeholder or `[CẦN KIỂM TRA]` left anywhere.
- [ ] Every question can be answered from an exhibit in the museum.
- [ ] Total download about 30 MB or less; no single model above about 2 MB; textures 1024 px or smaller unless justified.
- [ ] Every asset is in the credits (shown on the intro hall's "Ghi công" board); every text reviewed by two people.

### Phase E: Release

**M12. Final check and launch**
- [ ] Performance re-checked with the real assets (same targets as M9).
- [ ] A classmate who has never seen the project can start it, visit every room, read exhibits and finish the quiz unaided.
- [ ] No console errors; README finished; final URL shared.
- [ ] After release (optional, leader): rename the local project folder `INNOVA` to `INOVAT`. Players never see it. Before renaming, close sessions, VS Code and dev servers; afterwards copy Claude's memory folder from `.claude\projects\D--Personal-Coding-INNOVA\memory` to `...\D--Personal-Coding-INOVAT\memory`.

---

## 5. Local development and testing workflow

```
git pull                          # get teammates' latest changes
git switch -c ten-viec-dang-lam   # your own branch
npm run dev                       # Vite dev server, open http://localhost:5173
  ... edit, save, check the browser ...
npm run build                     # check for errors, build release version
npm run preview                   # try the release build locally
git add .
git commit -m "Mô tả thay đổi"
git push
```

Then open a **pull request** on GitHub. Vercel creates a preview URL. A teammate tests it, approves, and merges. Merging into `main` updates the live site.

Testing: manual checklists (the acceptance criteria above) before every merge; `npm run build` and `npm run lint`; FPS counter in development only; real devices including a school computer; optionally Vitest for the quiz scoring logic.

---

## 6. Deployment (GitHub + Vercel)

1. The project owner creates the GitHub repository and adds teammates as collaborators.
2. The owner signs up at vercel.com with "Continue with GitHub".
3. In Vercel: Add New, then Project, import the repo. Vite is detected automatically (build command `npm run build`, output folder `dist`). Click Deploy.
4. The site gets a URL like `bao-tang-cmcn.vercel.app`.
5. Every merge to `main` redeploys; every pull request gets a preview URL. To undo a bad release, revert the commit on GitHub.

**Important:** on Vercel's free Hobby plan, collaboration is not permitted for private repositories, and teammates' pushes may silently fail to deploy. **Use a public GitHub repository** (collaboration is free for public repos). The Hobby plan is for non-commercial personal use, which fits a school project. Never commit passwords or keys.

---

## 7. Anticipated problems

**Performance:** weak integrated graphics (use low-poly models, textures of 1024 px or less, instancing); lights and shadows are expensive (mostly ambient light plus a few lamps, glowing materials, at most one shadow-casting light); cap pixel ratio at 1.5; compress models; detect disabled hardware acceleration and show instructions.

**Compatibility:** mouse capture needs a click and Esc always releases it (treat Esc as "pause" with a clear "Nhấp để tiếp tục" overlay); embedding in other sites can block mouse capture (share the direct link); Vietnamese typing tools (Unikey, EVKey) can interfere with keys (read physical key positions, suggest English mode on the start screen); phones and tablets are unsupported at first; test 1366x768 to 1920x1080 and 125% zoom; bundle a font with full Vietnamese support (for example Be Vietnam Pro) and set `lang` to the chosen language (`vi` or `en`).

**Deployment:** capital letters in file names break on Vercel (follow the file-name rule); the release build is stricter than the dev server (always run `npm run build` first); GitHub rejects files over 100 MB (compress assets; never commit `node_modules`); everyone uses the same Node LTS version; press Ctrl+F5 after a deploy to bypass the cache; test the `vercel.app` URL on the school network during M1.

---

## 8. Trade-offs

| | A. Free-walk 3D | B. 3D, click-to-move | C. 2D exhibition |
|---|---|---|---|
| Movement | WASD + mouse | Click hotspots; camera glides | Scroll and click |
| Difficulty | Highest | Medium | Lowest |
| Phones/tablets | No | Yes | Yes |
| Accessibility | Hardest | Better | Best |

Plan: aim for A, keep B as a cheap fallback (only `Player.tsx` changes). Decide after M5.

---

## 9. Content integrity

- Every exhibit cites at least one reliable source (history textbook, teacher's materials, encyclopedias such as Britannica, major museum or university websites). Prefer Vietnamese-language sources where they exist.
- The author of an exhibit is never its only checker.
- The Fourth Industrial Revolution is a more recent concept with debated boundaries: describe it carefully, with sources.
- Assets: prefer CC0 sources (Kenney, Quaternius, Poly Haven). Check the licence of each item on Poly Pizza and Sketchfab. Use Wikimedia Commons for historical images and record each licence. Every item goes into `credits.ts`.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| Repository (repo) | The project folder plus its full Git history |
| Commit / push / pull | Save a snapshot / upload it to GitHub / download others' snapshots |
| Branch / pull request | Your own working copy / a request to merge it into the main version |
| Dependency / package | Code written by others that the project uses |
| Build / deploy | Pack the project for release / publish it to a public URL |
| Component | A reusable building block (e.g. `<InfoPanel>`) |
| FPS | Frames per second |
| glTF / .glb | Standard file format for web 3D models |
| Pointer lock | Browser feature that captures the mouse for camera control |
| Raycasting | Shooting an invisible line to see what the player is looking at |

### Key Vietnamese UI strings (draft; the group finalises them)

| English | Vietnamese |
|---|---|
| Industrial Revolution | Cách mạng Công nghiệp (CMCN) |
| Introduction hall | Sảnh giới thiệu |
| Quiz / minigame room | Phòng trò chơi |
| Press E to view | Nhấn E để xem |
| Resume | Tiếp tục |
| Click to continue | Nhấp để tiếp tục |
| Try again | Làm lại |
| Back to the museum | Quay lại bảo tàng |
| Please use a computer | Vui lòng dùng máy tính |
| Sources | Nguồn |
| Credits | Ghi công |

---

## 11. Open questions (answer before scheduling)

1. Deadline, number of members, hours per week per person.
2. Operating system of each member (Windows or macOS); can software be installed on those computers?
3. Teacher requirements: phone support? citation format? score leaderboard (would need a backend)?
4. Who owns the GitHub repository and the Vercel account?

---

## 12. Current status

- [x] Plan reviewed
- [x] M0: Tools and accounts (leader's computer only, by decision)
  - Windows 11: Node.js v24.22.1, npm 11.19.1, Git 2.55.0 installed with winget. Leader has GitHub, VS Code and Vercel.
- [x] M1: "Hello, museum" live on the internet
  - Repository (public): https://github.com/ArsaicGH/inovat
  - Live site: https://inovat-museum.vercel.app (every push to `main` redeploys)
- [x] M2: First 3D scene (reviewed and pushed)
  - Added three, @react-three/fiber, @react-three/drei, @types/three. Scene in `src/world/Museum.tsx`, title overlay in `src/ui/Hud.tsx`.
- [x] M3: Walking in one test room (reviewed by the leader; jitter investigation moved to M9, the performance pass)
  - Added zustand. Mode store `src/state/useMuseumStore.ts`; `Player.tsx`, `Room.tsx`, `collision.ts`, `pointer-lock.ts`; `StartScreen.tsx`, `PauseScreen.tsx`; text in `src/content/ui.ts`.
  - Controls (leader's decision): W A S D move; arrow keys / mouse / touchpad move the camera (arrow keys help touchpad users, whose touchpad is often disabled while typing). Sensitivity slider on start and pause screens, saved in the browser. Normal (not raw) mouse input, so each visitor's OS mouse/touchpad settings apply; fake mouse jumps (> 1/4 window) are ignored.
  - Unikey/EVKey in Vietnamese mode swallows Telex keys (a, s, d, w); no code can recover them. The page detects it and shows a warning asking to switch to English mode.
  - Smoothing: camera glides to the mouse target, walking accelerates/decelerates, frame time averaged. Shadows drawn once (static room); `powerPreference: 'high-performance'`.
- Plan restructured (leader's decision): skeleton first. Phase C (M6-M9) builds the complete, polished game with placeholders; Phase D (M10-M11) adds real content; M12 is launch. Old M6 (content pipeline) is now M10, old M8 (visual identity) is now M6, old M9/M10/M11 are now M11/M9/M12.
- [x] M4 + M5: exhibits and grey-box museum (rotunda layout; reviewed by the leader)
  - Floor plan `src/world/layout.ts`: 12-sided rotunda (24 m across, 8 m high, 12 pillars) with 6 doors alternating with 6 blank walls; each room behind a short passage (rooms 15 m from the centre so neighbours never overlap). Rotated rooms use rotated collision boxes (`collision.ts`).
  - Doors `Doors.tsx` + `door-state.ts`: sliding double doors open within 3 m; grand era portals (3.6 m, columns, big sign) vs plain start/end doors (3 m, small sign); signs painted with the system font (`Sign.tsx`). Quiz door locked until CMCN 1-4 are entered, with a "x/4" message nearby.
  - Only what can be seen is drawn (`MuseumPart` in `Museum.tsx`): about 20-30 draw calls instead of about 140.
  - Tested by script: all routes, closed doors block, 72 wall blocks with 0 overlaps, rooms never overlap, all 22 exhibits aimable (2.8 m yes, 3.5 m no), quiz lock and unlock, map teleports.
  - Movement stutter: caused by Windows dynamic refresh rate (see M9); frame-cap attempt removed (made it worse); hint decision open. Rotunda enlarged to 24 m across (leader's choice).
- [x] Decision point after M5: keep free walking (leader's decision). Stutter on Windows dynamic-refresh laptops accepted as a known limitation, no hint (leader's decision).
- [x] M4 + M5 committed and pushed (def3b51).
- [x] M6: Visual identity and themed rooms (reviewed by the leader)
  - Leader's notes (before M6): text boards are readable in 3D (`PanelBoard.tsx`, canvas texture) and E/click zooms them into the on-screen card with a smooth animation; prototypes much larger (plinth about 2.3 m wide, placeholder machines about 1.7 m tall in the room's accent colour, boards 1.4 x 1.9 m).
  - Approved additions: Be Vietnam Pro font (public/fonts, OFL), 7 CC0 texture sets from ambientCG (public/textures, colour + normal maps, about 12 MB), @react-three/postprocessing + postprocessing (bloom). All listed in `src/content/credits.ts`.
  - Step 1: style guide (README.md, `src/world/style.ts`) and the Victorian rotunda (`Rotunda.tsx`: marble floor with medallion and gold rings, plaster walls with wainscot and cornice, 12 columns, damask panels with wall lamps, coffered dome with oculus, chandelier), bloom + tone mapping, reflection map from Lightformers, chandelier light dimmed (not removed) when unseen. Dev switch `?fx=0` turns bloom off.
  - Leader's UI changes: boards show only "…" when text overflows; start screen = decorated INOVAT title + subtitle + start button, then "Bạn có muốn xem hướng dẫn điều khiển không?"; optional guided tutorial (`TutorialCard.tsx`, store `tutorial` + `canUse`): intro (all frozen, Space) -> look -> move (Unikey tip) -> interact -> map -> pause (settings live in the pause menu; "Hoàn tất" shown there). Tested step by step.
  - Step 2 done (approved by the leader): era-room themes in `room-themes.ts`, `SurfaceMaterial.tsx`, `RoomDecor.tsx`, two roaming room lights + room-tinted sky light (light count never changes).
  - Small fixes: black screen, then the title, then the starting room fades in (`worldReady` + `.world-cover`); full-screen (F11) tip on the first tutorial step; the map places the rooms on a circle around the rotunda.
  - Step 3 done: intro hall (wainscot with gold rail, crown moulding, red carpet, two small chandeliers, corner plants with collision, INOVAT sign on the back wall, "Sảnh trung tâm" sign above the door) and quiz room (quiz-show set: A/B/C/D answer tiles, question marks, show bulbs drawn as one instanced mesh, stage lights, name sign and floor medallion).
  - After review (not committed yet): an overview board on each era room's back wall under its name sign (`ir1-overview` ...; first tried in the middle of the room, rejected: it blocked the way); every board in the era rooms dressed like its room (`BOARD_THEMES` in `style.ts`: brass/parchment, steel/enamel, beige computer screen, floating hologram glass), with matching stands (`BoardStand.tsx`) and a matching on-screen enlargement; CMCN 1 gears moved beside the overview board; CMCN 3 desk now solid; room light hung lower and CMCN 3/4 ceilings dimmed (were blinding); a centrepiece in the middle of the rotunda (`Centrepiece.tsx`: marble pedestal, four turning rings in the era colours).
  - Progress saving: rooms visited, tutorial step and position are kept in sessionStorage (this tab only) about once a second; after a reload the title screen shows "Tiếp tục hành trình trước" under "Bắt đầu" to continue it. (Reloads came from the development server's live connection dropping while the tab was in the background, or from Edge putting the tab to sleep.)
  - Door lag fix: each part of the museum uploads its pictures and builds its drawing code (`compileAsync`) behind the title screen, instead of the first time its door opens (`prepareForDrawing` in `Museum.tsx`).
  - Shift to sprint (5.5 m/s instead of 3 m/s), taught in a new tutorial step right after W A S D (7 steps now). Fixed the flickering gold edges of the hall's red carpet (they shared the carpet's plane).
  - Before M7 (leader's list): huge decorated era numbers 1-4 above each overview board instead of the name signs (`EraNumeral.tsx`); English added (`src/content/*` hold `vi` and `en`, read with `useContent()`; Tiếng Việt / English pill on the start screen and in the pause menu, remembered in the browser); key list in tutorial order; phones and tablets get a "please use a computer" message (`device.ts`). E closes boards, the map key closes the map, Esc pauses; Space shows the key list (tutorial step 8).
  - Keys: the map moved from M to Q (easier to reach beside W A S D). Esc only pauses; a click continues (Continue, or anywhere around the pause menu), the same in a window and in full screen (leader's decision; Esc-to-continue via full screen "keyboard lock" was tried and dropped). Full screen (F11) is only recommended, in the tutorial's first tip. Map restyled in the title screen's gold-and-glass look; language pill at the bottom of the start screen and styled like the pause menu's settings.
- [x] M7: Quiz room engine (reviewed by the leader)
  - 8 clearly fake placeholder questions, 2 per revolution, in both languages with one shared answer key (`src/content/quiz.ts`); scoring in `src/state/quiz-score.ts`.
  - Leader's change: the quiz is played ON the Game Room's back wall (`QuizWall.tsx`), not in a pop-up. A big gold-framed screen shows the intro, the question or the results; four A-D answer tiles in the room's colours are aimed at with the crosshair and chosen with E or a click (up to 6 m away); after answering, the right tile glows green, a wrong choice red, a feedback line explains, and a gold button goes on ("Câu tiếp theo" / "Xem kết quả" / "Bắt đầu" / "Chơi lại"). The questions, tiles and buttons are shown on a giant wall-mounted screen (dark metal case, gold trim, purple backlight glow, power light) spanning almost the whole wall. The visitor keeps walking the whole time. The pedestal and its info board moved beside the left wall near the entrance; the "?" tiles moved towards the back. Multiple choice for now; more creative mini-games may come with the real content.
  - Quiz wall: after answering, E anywhere in the Game Room goes to the next question; the button reads "Câu tiếp theo  [E]".
- [x] M8: Game shell (reviewed by the leader)
  - Loading screen (one gold bar on black) that waits for everything before the title screen: textures, the font, then every part (rotunda, rooms, doors) prepared for the graphics card AFTER the font has arrived (signs and boards are repainted with it, so preparing earlier missed them and caused hitches on entering rooms), then one hidden drawing of the whole museum with every room shown (`WarmUp` in `Museum.tsx`), because the graphics card does some work only the first time each thing is really drawn (leader saw a strong hitch on first entering the rotunda from the hall); credits on the intro hall's board (from `credits.ts`); pause menu restyled in the gold-and-glass look (gold language pill, gold buttons); phone/tablet message done earlier.
  - Camera stutter in the rotunda: its ~300 separate decoration meshes (columns, rails, bulbs, cornice...) are now joined into one mesh per look (`MergeStatic.tsx`); same picture, far fewer drawing steps each frame. The centrepiece's turning rings stay separate.
  - Museum lighting (leader's request: dramatic, studio-like, not office light): much lower soft light, softer room lights, and five warm spotlights (no shadows; hall: one per board, era rooms: 4 inventions + overview board, rotunda: 4 portals + centrepiece) that move to the room you are in and light its exhibits (era rooms: the 4 inventions; hall: 4 boards; Game Room: the screen, the pedestal and its board; rotunda: the 4 grand era portals), with small black ceiling/wall lamps drawn where they hang (`spot-plan.ts`, `SpotFixtures.tsx`); a light vignette for a cinematic frame. Light count stays fixed (no hitches).
  - Camera jerks (leader: random up/down flicks at high fps): besides the huge fake jumps, Chrome/Edge sometimes send a single mouse event far bigger than the ones around it; such lone spikes are now ignored (`isMouseSpike` in `Player.tsx`), while real fast flicks still pass. Wall spotlights toned down (overview boards 40 %, hall boards 55 %).
  - No more popping lights (leader): the five spotlights and the room light go to the room you are in or, in the rotunda, to the room whose door is NEAREST, so a room is lit before its door opens and stays lit while you leave; changes fade (0.3 s out, 0.3 s in). The chandelier is always on. The rotunda is lit only by its chandelier (a painted 'glow' above the portals was tried and removed: it showed as a hard-edged box). Exhibit spotlights made stronger and crisper (clear pools of light in a dim room); wall boards keep the softer level the leader approved.
  - Lighting overhaul (leader: dim, cinematic, gallery-like, pronounced realistic shadows): the outdoor "sun" is gone. Each area has one big soft KEY spotlight from high above (`KEY_PLANS` in `spot-plan.ts`), the only shadow-casting light, which follows you between areas with a short fade; shadows are redrawn every frame (one spotlight over one area: cheap) so turning prototypes and the moving key stay right. Prototypes, plinths, columns, the centrepiece and plants cast shadows. Fill light much lower (soft light, sky light, room light at 55 %, chandelier 70); the five exhibit spotlights give the highlights (each invention and the Game Room pedestal lit from straight above, so the pool is centred); text boards slightly self-lit so they stay readable.
  - More natural look (leader: "still a bit fake"): ambient occlusion (N8AO, already part of @react-three/postprocessing; half resolution; dev switch `?ao=0`) darkens contact points and corners; AgX tone mapping (film-like) instead of ACES; weaker bloom; the room ceiling lamp removed (it made a fake bright spot on the ceiling), even sky fill instead; matt plinth tops; dimmer CMCN 3 ceiling panels.
  - Performance after the lighting work (leader: 70-80 fps fell to 30-40): automatic quality (`AdaptiveQuality` in `Museum.tsx`, for weaker laptops than the leader's Radeon 780M: below 50 fps it steps down one step every 2 s: resolution to 1x, ambient occlusion off, resolution 0.75x, shadows only redrawn when the key light moves; above 80 fps for a while the resolution rises again, up to 1.5; switched-off effects stay off for the visit), shadows redrawn every third frame, edge smoothing 2x instead of 4x, lighter ambient-occlusion sampling. (Started early from M9's "automatic quality".)
  - Exhibit spotlights narrowed (0.3 rad) with a very soft edge: no more hard bright ring on the floor around the plinth.
  - More contrast (leader: dramatic, cinematic, not forced): rotunda key light is now a focused beam from the dome onto the centrepiece (the hall around falls into shadow, lit by the chandelier at 32, wall lamps and fill); room key light is only a faint wash (12) while exhibit spotlights are stronger (120); fill and reflections lowered further.
- [x] M8b: Sound effects and ambience  <- DONE: sound on and committed. Era music: CMCN 1 Verdi's "Anvil Chorus" (replaced "Für Elise", which had no link to industry), CMCN 2 Joplin's "Maple Leaf Rag" (1906), CMCN 3 8-bit "Korobeiniki", CMCN 4 "Claimed by the Void" (now really applied: the file in the game had been a placeholder synthwave loop).
  - Leader chose recorded CC0 files (approved list): Kenney Interface Sounds, Impact Sounds, RPG Audio, Music Jingles; rubberduck "30 CC0 SFX loops"; bart "Steam boiler"; Fun Gi Development "Sci-fi ambience". FFmpeg installed (winget) to convert loops to small mono .ogg. 37 files, about 0.7 MB, in `public/sounds/`, all in `credits.ts`.
  - Engine `src/audio/sound.ts` (Web Audio: master, effects and ambience volumes; unlocked on the first click/key; stops while the tab is hidden) and `SoundDirector.tsx` (clicks, panels, map, teleport, tutorial steps, new-room chime, locked door, quiz right/wrong/next/results; ambience per area with 1.5 s cross-fades, faded down in menus). Footsteps per floor in `Player.tsx`, sliding-door sounds in `Doors.tsx`. Round sound toggle beside the language pill (start screen and pause menu); three volume sliders in the pause menu.
  - Leader's sound feedback: one volume slider under camera sensitivity (with the on/off button beside the language pill); footsteps are now two soft takes (left/right) at a calm walking pace (2 steps/s, sprint ~2.6); zooming into a board sounds like lifting a framed painting (cloth + soft wooden knock), the map like unfolding paper, other UI sounds pitched lower; the four era rooms play era music instead of room tone (CMCN 1 Beethoven Piano Concerto No. 1 rondo, Musopen, public domain, 2-min excerpt; CMCN 2 "Maple Leaf Rag", US Marine Band 1906, public domain; CMCN 3 "Keep your dream alive!" chiptune, CC0; CMCN 4 "Synthwave House Loop", CC0). All in `credits.ts`; sounds total about 3 MB.
  - Lighting rebalanced (leader: darker is not the goal, variety is): CMCN 2-4 and the rotunda brightened back somewhat, and each room gets a coloured light from its own lamps (amber lanterns, warm bulbs, cool fluorescent, cyan ring, pink show bulbs, warm chandeliers in the hall) through one roaming accent light (`accent` in `room-themes.ts`).
  - Not yet listened to by Claude (picked by name and measured loudness only): the leader should listen and say which sounds to swap. Safari's support for .ogg is to be checked in M9.
  - Latest: intro hall and central hall bright, grand and welcoming again (wide warm dome light, brighter chandelier and fill); the dim cinematic look is kept for the era rooms only. Sound work in progress at the pause: one volume slider (start screen above the language pill, and the pause menu), no sound toggle buttons; intro hall welcome sound = a generated binaural chord; tutorial step = a generated low bell; CMCN 1 "Für Elise" (public domain recording), CMCN 3 an 8-bit "Korobeiniki" generated in code, CMCN 4 "Claimed by the Void" (CC0, not yet converted).
  - Freezes of seconds (leader): caused by the automatic quality switching resolution up and down between light rooms and the heavy rotunda; each switch rebuilds the effect buffers (and the ambient-occlusion shaders), and the freeze itself counted as "slow", triggering more switches. Now it only steps DOWN, after two slow 4-second measurements in a row, at most once every 20 s, ignoring measurements that contain a frozen frame. Also: aiming only tests parts that are drawn, and the collision list is reused (no per-frame garbage).
  - Still a 20 s freeze while walking (leader, tutorial step 7): changing resolution or effects during play makes the ambient-occlusion effect rebuild its shaders, which Windows browsers can take many seconds to compile. Quality is now decided ONCE behind the loading screen (measure ~1.5 s of frames after the warm-up, estimate the frame rate per resolution, pick resolution / ambient occlusion / shadow redraws), and nothing changes during play. A console warning reports graphics driver resets (lost WebGL context), the other known cause of long freezes.
  - Performance (leader: 30-40 fps on a Radeon 780M at full quality): the quality is now measured in the ROTUNDA (the heaviest view; the camera visits it behind the loading screen and returns), with finer resolution steps (1.5 / 1.25 / 1 / 0.85, then 0.75) so the least possible is given up; ambient occlusion goes off only if even 1x cannot reach 60 fps. Edge smoothing is now SMAA (a cheap filter) instead of multisampling, for the same look at much less cost. The dev readout shows the chosen quality.
  - Rotunda tried at 18 m, then back to 24 m (leader: more immersive). To match it, the four era rooms are now 18 x 18 m with a 5.5 m ceiling (intro hall and Game Room stay 12 x 10 x 4.5); rooms start 17 m from the centre so neighbours never overlap. Room decorations (beams, bulbs, panels, lanterns, ring, gears) spread out with the room size; the era number sits 1.6 m below the ceiling. The blank walls' fabric panels size themselves from the wall.
  - Rotunda light: the wide light from the dome became a soft-edged spotlight on the centrepiece (the only shadow light there); the chandelier and even fill keep the hall welcoming.
  - Rotunda dome painted by era (leader's idea): the dome is one painted picture (`dome-painting.ts`, 36 x 7 coffers). The classical cream ribs and gold stay everywhere; the 60-degree section above each era door gets muted era colours (sepia/copper, enamel navy, screen green, slate teal), small gilded emblems in the coffers (cog, lightning bolt, pixel chequer, network hexagon) and one large gilded medallion straight above the door; gilded ribs mark the section edges; the sections above the Game Room and intro hall doors stay classical. Painted once, no cost per frame. (Picture 1728 x 512, a canvas, not a downloaded file.)
  - Rotunda richer (leader): columns in deep green polished marble with gilded bases, rings and capitals (they stood out too little against the cream walls); four large era sculptures hang on cables from the dome in front of the era doors, well above head height, turning slowly (`HangingSculptures.tsx`: brass cog, glowing light bulb, floppy disk, glowing polyhedron); grand three-tier chandelier (ornate gilded column, 50 candles in gold cups, crystal drops, arms, double rings).
  - Renamed INNOVA -> INOVAT everywhere in the game and the docs (leader). Later the GitHub repository was renamed to `inovat` too. Later also the Vercel address and the browser-storage keys (`inovat-...`; settings saved under the old keys reset once).
  - Rotunda: columns back to white marble (gold trim kept). The glowing oculus at the top of the dome is replaced by a painted cream-and-gold rosette (`paintCrown()` in `dome-painting.ts`); the chandelier lights the hall.
  - Game Room redesigned (leader): bright white-and-gold like the intro hall and rotunda (white marble floor, cream panelled walls with gold frames, white pilasters, sconces, gold crown moulding). The giant wall screen is gone: the quiz now sits on an ivory board in a gilded frame on gold posts, on a raised round platform under a strong spotlight in the middle of the room, with a red carpet from the door. The side board and pedestal were removed for now (its text stays in `exhibits.ts`). The back wall has a portal door (`PortalDoor.tsx`): a closed white-and-gold double door that swings open onto glowing light once the visitor gets at least half the answers right (`quizPassed`; not saved between visits). It leads nowhere yet.
  - CMCN 3 and CMCN 4 walls and ceilings textured (leader: they looked plain next to CMCN 1 and 2). Painted in code, no downloads (`painted-surfaces.ts`, also used as bump maps): CMCN 3 has beige woven vinyl wall panels with grooved joins and a suspended ceiling of speckled mineral-fibre tiles in a metal grid (an 80s/90s computer room); CMCN 4 has white composite wall panels with seams, faint circuit traces and perforation strips, and a white panel ceiling in a slim dark grid with cyan light slots.
  - Sound back on (leader): `AUDIO_ENABLED = true` in `src/features.ts`; the volume slider is back on the start and pause screens and the sound files in `public/sounds` are now committed (all credited in `credits.ts`; still to fine-tune in M8b).
  - Era music changed to atmospheric ambient tracks (leader picked them from options downloaded to the local, uncommitted `soundtracks/` folder; to be revisited later): CMCN 1 "Factory ambiance" (yd), CMCN 2 "Factorio Clone Music" (Pro Sensory; replaced "Elevator To Reactor" later, leader), CMCN 3 "Life in corrupted binary" (HaelDB), CMCN 4 "Claimed by the Void" (vitalezzz), all CC0 from OpenGameArt, level-matched.
  - Game Room music: "Prelude in F# Minor" by Kistol (CC0, OpenGameArt), calmer and grander than the old playful loop (other options in local `soundtracks/quiz-room/`). Intro hall: its constant binaural loop is removed; instead the leader's `starting.mp3` plays once when the start screen closes (after the tutorial question). The leader's clip is the opening of Vivaldi's "Spring" (Allegro), but from a commercial recording (TuneCore on YouTube), which is copyrighted; so the same opening was cut instead from a public-domain recording (The Modena Chamber Orchestra, Musopen, via Wikimedia Commons): 15 s to 32 s of the recording (leader's cut), fading in gradually over 4 s and out over 1 s.
- [x] M9: Performance and compatibility, marked done for now (leader), but continuous until release. Latest: graphics slider (Very low to Ultra) with an "Automatic" switch in the pause menu; at Ultra the museum spotlights cast shadows too. Leader: "not perfect" yet.
- **PAUSED (leader, end of session).** Remaining to-do list, in order: 1) soundtrack improvements; 2) mobile interface optimisation (M9b open items); 3) graphics controls (refine the levels and the freeze when switching); then the remaining milestones, especially Phase D (M10-M11, real content: remind the leader that every asset needs a `credits.ts` entry).
- Room order changed (leader): clockwise round the rotunda in visiting order, intro hall (south), CMCN 1, CMCN 2, CMCN 3 (north), CMCN 4, Game Room (south-east, next to the intro hall). Dome colours, hanging sculptures, lights and the map follow. The way round is shown on the map as a gold arrow along its ring (`MapRoute` in `MapMenu.tsx`; a floor arrow in the rotunda was tried and removed, leader). The Central Hall is greyed out on the map until the visitor has walked into it.
- Game Room (leader): the portal door's two spotlights at a third of their old strength (brighter, they competed with the lectern) and the whole room dimmer. Keys 1-4 choose answers A-D (small grey [1]-[4] under each answer; mentioned on the panel's start screen and in the key list). Open portal: light fills the whole doorway down to the floor (the wainscot and rails now stop at the door), with drifting light rays, golden motes floating into the room and light spilling onto the carpet. Walking into it will lead to the ending screen (Phase D).
