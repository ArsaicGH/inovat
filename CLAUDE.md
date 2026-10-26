# CLAUDE.md: standing rules for this project

Project: browser-based 3D virtual museum about the four Industrial Revolutions (Bảo tàng Cách mạng Công nghiệp). The full plan is in `PLAN.md`. Read it at the start of every session and continue from the status at its end.

## Who I am working with
- A school group of complete beginners in web development.
- We talk in **English**. The finished website is **bilingual: Vietnamese (default) and English**, chosen by the visitor.

## How to work with us
- Explain every unfamiliar term and every command **before** running it, in plain language.
- Work on **one milestone at a time** (see `PLAN.md`), unless I ask to group several. Do not build ahead. Stop at the end of each milestone (or group), say how to test it, and wait for my review.
- **Skeleton first:** finish the complete game, including all visual polish, the quiz, menus and performance, with placeholder prototypes and placeholder texts before any real content is added. Real content later only replaces placeholders.
- Visual goal: an impressive, stylised museum that still runs smoothly on ordinary laptops. When a visual idea costs too much performance, say so and offer a cheaper way to get the look.
- **Development priority (leader): how well the game runs on low-end computers, weighed against its visuals.** Aim for the best possible performance per visual quality: measure before and after every optimisation, remove wasted work first (no visible change), and only then offer visual trade-offs, limited to weak computers where possible. Never change mouse handling or the frame loop for speed without the leader testing it first.
- When the milestone's acceptance criteria are met, tick them in `PLAN.md` and update the status line at the end of that file.
- Keep code simple and readable. Prefer plain, reliable solutions over clever ones. Add short comments that explain *why*.
- If something fails, explain what the error message means before fixing it.

## Technical rules
- Stack: React, TypeScript, Vite, Three.js, React Three Fiber, drei, Zustand. Do not add other dependencies without asking first and explaining why.
- No backend, database, login, paid API, AI model or API key in the product. Everything runs in the visitor's browser.
- Keep lightweight 3D assets: models about 2 MB or less each, textures 1024 px or less, about 30 MB total.
- Cap the renderer pixel ratio at 1.5 on computers and 2 on phones and tablets (small but very sharp screens; leader's decision). Use at most one shadow-casting light.
- Folder layout is in `PLAN.md` section 3. Keep the 3D layer (`src/world/`), the interface (`src/ui/`) and the text (`src/content/`) separate.
- File names: lowercase, hyphens, no spaces, no Vietnamese diacritics.
- Read movement keys by physical key position (`event.code`), so Unikey and EVKey do not break controls.
- Every key the game uses is listed in the key list shown with Space (`ui.keyList` in `src/content/ui.ts`). When a key is added or changed, update that list in both languages, in tutorial order (and the tutorial, if the key is important).
- Touch devices (phones, tablets) use on-screen controls (`src/ui/TouchControls.tsx`) and touch wording (`src/content/ui-touch.ts`). Every text that mentions a key or the mouse has a touch version there; when such a text or a control changes, update its touch version too, in both languages.
- Run `npm run build` before every commit.

## Content rules
- All visible website text lives in `src/content/` in **both** Vietnamese (`vi`) and English (`en`), never hard-coded in components. Components read it with `useContent()`.
- **Parallel content:** every time any text is added or changed, write or update both languages in the same change. Never leave one language behind or fill it in later.
- Both languages must read naturally (written for a native reader, not word-for-word translation). Names that stay the same in both (INOVAT, key names) are fine.
- Placeholders are marked `[CẦN KIỂM TRA]` in Vietnamese and `[NEEDS CHECKING]` in English.
- **Never invent historical facts, dates, names or sources.** Every exhibit and quiz question needs a real source that I provided or that you looked up and cited. If unsure, write `[CẦN KIỂM TRA]` and tell me.
- Every image, 3D model, sound and font must be listed in `src/content/credits.ts` with author, licence, source and item name (in both languages). There is no separate credits screen: the intro hall's "Ghi công" board is filled from that file, so adding the entry is what credits the asset. Remind the leader of this when content development starts.

## Git rules
- Do not commit or push unless I ask. When I do, use a short descriptive message.
- Never commit `node_modules` or any secrets.
- The GitHub repository is public (Vercel's free plan does not allow teammates on private repos).
