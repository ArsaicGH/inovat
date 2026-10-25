# PLAN.md: Virtual 3D Museum of the Four Industrial Revolutions

Working language of the team and of Claude: **English**.
Language of the finished website: **100% Vietnamese** (all visible text, panels, quiz, buttons, credits).

Museum name: **INNOVA** (from "innovation"; decided by the group). Descriptive subtitle (Vietnamese): **Bảo tàng Cách mạng Công nghiệp**.

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

Six areas, in a straight chronological line:

| # | Area | Vietnamese name |
|---|------|-----------------|
| 1 | Introduction hall (title, short intro, navigation, controls) | Sảnh giới thiệu |
| 2 | First Industrial Revolution | Phòng Cách mạng Công nghiệp lần thứ nhất (CMCN 1) |
| 3 | Second Industrial Revolution | Phòng CMCN 2 |
| 4 | Third Industrial Revolution | Phòng CMCN 3 |
| 5 | Fourth Industrial Revolution | Phòng CMCN 4 |
| 6 | Educational minigame (quiz) | Phòng trò chơi |

Core features: first-person walking (WASD + mouse), collision with walls, clickable exhibits with info panels, a map menu to jump between rooms, a distinct atmosphere per era, a multiple-choice quiz with feedback, scoring and results, desktop-browser support, smooth performance on ordinary student computers, and a public URL.

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
- **Content files:** Vietnamese text, quiz, sources, credits.

**Modes.** The app is always in exactly one mode: `start`, `exploring`, `paused`, `reading`, `map`, `quiz`, `results`. Only in `exploring` is the mouse captured and movement allowed. Every action checks the mode first.

**Museum layout.**

```
Sảnh giới thiệu -> CMCN 1 -> CMCN 2 -> CMCN 3 -> CMCN 4 -> Phòng trò chơi
      M key / map button: jump straight to any room
```

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
│   ├── content/            (ALL Vietnamese text)
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
  title: "…",       // Vietnamese
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

Ordered by dependency and risk: foundations, then the riskiest 3D mechanics, then content, then quality and release.

### Phase A: Foundations

**M0. Tools and accounts**
Install Node.js (LTS), Git, VS Code. Create GitHub accounts for everyone and one Vercel account for the owner.
- [x] `node -v`, `npm -v`, `git --version` print a version on every member's computer. (Decision: only the leader's computer for now.)
- [x] Everyone can sign in to GitHub and has access to the repository. (Decision: only the leader for now; leader has GitHub, VS Code and Vercel accounts. The repository is created in M1.)

**M1. "Hello, museum" live on the internet**
Create the Vite React + TypeScript project, push to GitHub, connect Vercel.
- [x] A page titled "Bảo tàng Cách mạng Công nghiệp" with correct diacritics opens at the public `.vercel.app` URL, on another computer and on the school network. (Page title is now "INNOVA – Bảo tàng Cách mạng Công nghiệp". Checked from the leader's computer only; another computer and the school network are NOT tested yet, by decision. Retest before M11.)
- [x] Editing the text and pushing updates the live site within minutes. (Tested: live in about 20 seconds.)
- [x] Every member can download the project and run it locally. (Leader only, by decision: `git clone https://github.com/ArsaicGH/innova.git`, then `npm install`, then `npm run dev`.)

### Phase B: Core 3D (riskiest part first)

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

**M4. Interacting with one exhibit**: crosshair, "Nhấn E để xem" prompt, info panel, back to walking.
- [ ] Prompt appears only when aiming at the exhibit within about 3 m.
- [ ] While the panel is open: cursor visible, WASD does nothing.
- [ ] Opening and closing the panel 20 times never leaves the app stuck.

**M5. Grey-box museum and map navigation**: all six rooms as plain grey boxes with doorways, a spawn point per room, the map menu.
- [ ] Can walk from Sảnh giới thiệu to Phòng trò chơi with no gaps, stuck spots or flickering walls (z-fighting).
- [ ] Teleporting places you inside the chosen room, facing the exhibits.
- [ ] The map highlights the current room.

**Decision point after M5:** if M3-M5 proved too hard or unstable, switch to the click-to-move version (Section 8). Content, panels, map and quiz are reused unchanged; only `Player.tsx` differs.

### Phase C: Content and features (parallelisable)

**M6. Content pipeline and one real exhibit**
- [ ] Build fails if an exhibit has no source.
- [ ] The panel shows the text and its source.
- [ ] A second member verified the text against that source.
- [ ] The credits screen lists every image and model with its licence.

**M7. Quiz room (Phòng trò chơi)**: questions from `quiz.ts`, multiple choice, immediate feedback with a short explanation, scoring, results screen, retry.
- [ ] An answer locks once chosen; feedback is immediate.
- [ ] Score is correct in three tests: all right, all wrong, mixed.
- [ ] Results screen offers "Làm lại" and "Quay lại bảo tàng".
- [ ] Every question can be answered from an exhibit in the museum.

**M8. Visual identity**: a shared style guide (colours, fonts, panels, signs) and one distinct atmosphere per era (the group decides the details; example directions: brick and warm lamplight, steel and early electric light, beige computers and fluorescent light, white glass and screens).
- [ ] All rooms use the same UI components and fonts.
- [ ] Each room is recognisable at a glance from lighting and materials.
- [ ] The style guide is written in README.md.

### Phase D: Quality and release

**M9. Real assets and full content** (suggested: 4-6 exhibits per room)
- [ ] Total download about 30 MB or less; no single model above about 2 MB; textures 1024 px or smaller unless justified.
- [ ] Every asset is in the credits; every text reviewed by two people.

**M10. Performance and compatibility pass**
- [ ] At 1080p: 30 fps or more (target 60) on the weakest computer available.
- [ ] Loading screen with progress.
- [ ] Tested in Chrome, Edge, Firefox (and Safari if available).
- [ ] Phone/tablet visitors see "Vui lòng dùng máy tính".
- [ ] Movement jitter investigated (from M3). Leader's laptop (AMD Radeon 780M, ~120 Hz): 3-10% of frames take exactly two refreshes (~16.7 ms), even with `?dpr=1&aa=0&shadows=0` and Edge energy saver off, so graphics load is not the cause. Next: measure main-thread blocking (long tasks) and our own per-frame work time; test other browsers/computers and Windows power modes. Dev-only tools: frame timing readout (`src/world/FrameTimingProbe.tsx`) and address-bar switches `?dpr=1`, `?aa=0`, `?shadows=0`.

**M11. Final polish and launch**
- [ ] A classmate who has never seen the project can start it, visit every room, read exhibits and finish the quiz unaided.
- [ ] No console errors; README finished; final URL shared.

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

**Compatibility:** mouse capture needs a click and Esc always releases it (treat Esc as "pause" with a clear "Nhấp để tiếp tục" overlay); embedding in other sites can block mouse capture (share the direct link); Vietnamese typing tools (Unikey, EVKey) can interfere with keys (read physical key positions, suggest English mode on the start screen); phones and tablets are unsupported at first; test 1366x768 to 1920x1080 and 125% zoom; bundle a font with full Vietnamese support (for example Be Vietnam Pro) and set `lang="vi"`.

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
  - Repository (public): https://github.com/ArsaicGH/innova
  - Live site: https://innova-museum.vercel.app (every push to `main` redeploys)
- [x] M2: First 3D scene (reviewed and pushed)
  - Added three, @react-three/fiber, @react-three/drei, @types/three. Scene in `src/world/Museum.tsx`, title overlay in `src/ui/Hud.tsx`.
- [x] M3: Walking in one test room (reviewed by the leader; jitter investigation moved to M10)
  - Added zustand. Mode store `src/state/useMuseumStore.ts`; `Player.tsx`, `Room.tsx`, `collision.ts`, `pointer-lock.ts`; `StartScreen.tsx`, `PauseScreen.tsx`; text in `src/content/ui.ts`.
  - Controls (leader's decision): W A S D move; arrow keys / mouse / touchpad move the camera (arrow keys help touchpad users, whose touchpad is often disabled while typing). Sensitivity slider on start and pause screens, saved in the browser. Normal (not raw) mouse input, so each visitor's OS mouse/touchpad settings apply; fake mouse jumps (> 1/4 window) are ignored.
  - Unikey/EVKey in Vietnamese mode swallows Telex keys (a, s, d, w); no code can recover them. The page detects it and shows a warning asking to switch to English mode.
  - Smoothing: camera glides to the mouse target, walking accelerates/decelerates, frame time averaged. Shadows drawn once (static room); `powerPreference: 'high-performance'`.
- [ ] M4: Interacting with one exhibit  <- next step
